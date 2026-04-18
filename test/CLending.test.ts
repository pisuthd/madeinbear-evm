import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { CMorpho, CToken, MockERC20, JumpRateIrm, PriceOracle } from "../typechain-types";

const { AbiCoder } = ethers;

// Price constants (USD, scaled by 1e18)
const ETH_USD = 3000n * 10n ** 18n; // 1 ETH = $3000
const USDT_USD = 10n ** 18n; // 1 USDT = $1

/// LLTV values (WAD scale)
const ETH_LLTV = 750000000000000000n; // 75% = 0.75 * 10^18

// TODO: set mock token to 6 decimals 

describe("CMorpho - Confidential Lending E2E", function () {
  // ============ Types ============

  type Deployed = {
    owner: any;
    supplier: any;
    borrower: any;
    other: any;
    usdt: MockERC20;
    eth: MockERC20;
    cUSDT: CToken;
    cETH: CToken;
    ethIrm: JumpRateIrm;
    ethOracle: PriceOracle;
    cMorpho: CMorpho;
    ownerClient: any;
    supplierClient: any;
    borrowerClient: any;
  };

  // ============ Deployment ============

  async function deployContracts(): Promise<Deployed> {
    const [owner, supplier, borrower, other] = await ethers.getSigners();

    // 1. Deploy MockERC20 tokens
    const tokenFactory = await ethers.getContractFactory("MockERC20");
    const usdt = (await tokenFactory.deploy("Mock USDT", "USDT", 0, await owner.getAddress())) as MockERC20;
    await usdt.waitForDeployment();

    const eth = (await tokenFactory.deploy("Mock ETH", "ETH", 0, await owner.getAddress())) as MockERC20;
    await eth.waitForDeployment();

    // Set all to 6 decimals)
    await usdt.setDecimals(6);
    await eth.setDecimals(6);

    // 2. Deploy CToken wrappers (FHERC20WrappedERC20)
    const cTokenFactory = await ethers.getContractFactory("CToken");
    const cUSDT = (await cTokenFactory.deploy(usdt)) as CToken;
    await cUSDT.waitForDeployment();

    const cETH = (await cTokenFactory.deploy(eth)) as CToken;
    await cETH.waitForDeployment();

    // 3. Deploy Interest Rate Model
    const irmFactory = await ethers.getContractFactory("JumpRateIrm");
    const ethIrm = (await irmFactory.deploy(
      2n * 10n ** 16n, // baseRatePerYear: 2%
      2n * 10n ** 17n, // multiplierPerYear: 20%
      3n * 10n ** 18n, // jumpMultiplierPerYear: 300%
      7n * 10n ** 17n, // kink: 70%
    )) as JumpRateIrm;
    await ethIrm.waitForDeployment();

    // 4. Deploy PriceOracle
    const oracleFactory = await ethers.getContractFactory("PriceOracle");
    const ethOracle = (await oracleFactory.deploy(
      usdt.target,
      eth.target,
      ETH_USD,
      USDT_USD,
      6,
      6,
    )) as PriceOracle;
    await ethOracle.waitForDeployment();

    // 5. Deploy CMorpho
    const cMorphoFactory = await ethers.getContractFactory("CMorpho");
    const cMorpho = (await cMorphoFactory.deploy(owner.address)) as CMorpho;
    await cMorpho.waitForDeployment();

    // 6. Create FHE clients
    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const supplierClient = await hre.cofhe.createClientWithBatteries(supplier);
    const borrowerClient = await hre.cofhe.createClientWithBatteries(borrower);

    return {
      owner, supplier, borrower, other,
      usdt, eth, cUSDT, cETH,
      ethIrm, ethOracle, cMorpho,
      ownerClient, supplierClient, borrowerClient,
    };
  }

  // ============ Setup Helpers ============

  /** Enable IRM + LLTV + whitelist oracle + createMarket */
  async function setupMarket(d: Deployed) {
    const { owner, cMorpho, ethIrm, ethOracle, cUSDT, cETH } = d;

    await cMorpho.connect(owner).enableIrm(ethIrm.target);
    await cMorpho.connect(owner).enableLltv(ETH_LLTV);
    await ethOracle.addToWhitelist(owner.address);

    const marketParams = {
      loanToken: cUSDT.target,
      collateralToken: cETH.target,
      oracle: ethOracle.target,
      irm: ethIrm.target,
      lltv: ETH_LLTV,
    };

    await cMorpho.connect(owner).createMarket(marketParams);

    // Must match Solidity: keccak256(abi.encode(marketParams)) — each field is 32 bytes
    const marketId = ethers.keccak256(
      AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "address", "address", "uint256"],
        [marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv],
      ),
    );

    return { marketParams, marketId };
  }

  /** Mint ERC20 → approve CToken → shield → set CMorpho as operator */
  async function shieldAndSetOperator(
    user: any,
    token: MockERC20,
    cToken: CToken,
    cMorpho: CMorpho,
    amount: bigint,
  ) {
    await token.mint(user.address, amount);
    await token.connect(user).approve(cToken.target, amount);
    await cToken.connect(user).shield(user.address, amount);
    const operatorUntil = (await ethers.provider.getBlock("latest"))!.timestamp + 3600;
    await cToken.connect(user).setOperator(cMorpho.target, operatorUntil);
  }

  // ============ Deployment Tests ============

  describe("Deployment", function () {
    it("should deploy all contracts correctly", async function () {
      const d = await deployContracts();

      expect(d.usdt.target).to.not.equal(ethers.ZeroAddress);
      expect(d.eth.target).to.not.equal(ethers.ZeroAddress);
      expect(d.cUSDT.target).to.not.equal(ethers.ZeroAddress);
      expect(d.cETH.target).to.not.equal(ethers.ZeroAddress);
      expect(d.ethIrm.target).to.not.equal(ethers.ZeroAddress);
      expect(d.ethOracle.target).to.not.equal(ethers.ZeroAddress);
      expect(d.cMorpho.target).to.not.equal(ethers.ZeroAddress);
    });

    it("should have correct owner on CMorpho", async function () {
      const d = await deployContracts();
      expect(await d.cMorpho.owner()).to.equal(d.owner.address);
    });

    it("should revert if owner is zero address", async function () {
      const cMorphoFactory = await ethers.getContractFactory("CMorpho");
      await expect(cMorphoFactory.deploy(ethers.ZeroAddress)).to.be.revertedWith("zero address");
    });
  });

  // ============ Market Creation Tests ============

  describe("Market Creation", function () {
    it("should create market and emit CreateMarket event", async function () {
      const d = await deployContracts();

      await d.cMorpho.connect(d.owner).enableIrm(d.ethIrm.target);
      await d.cMorpho.connect(d.owner).enableLltv(ETH_LLTV);
      await d.ethOracle.addToWhitelist(d.owner.address);

      const marketParams = {
        loanToken: d.cUSDT.target,
        collateralToken: d.cETH.target,
        oracle: d.ethOracle.target,
        irm: d.ethIrm.target,
        lltv: ETH_LLTV,
      };

      const tx = await d.cMorpho.connect(d.owner).createMarket(marketParams);
      await expect(tx).to.emit(d.cMorpho, "CreateMarket");
    });

    it("should revert if IRM not enabled", async function () {
      const d = await deployContracts();
      await d.cMorpho.connect(d.owner).enableLltv(ETH_LLTV);

      const marketParams = {
        loanToken: d.cUSDT.target,
        collateralToken: d.cETH.target,
        oracle: d.ethOracle.target,
        irm: d.ethIrm.target,
        lltv: ETH_LLTV,
      };

      await expect(
        d.cMorpho.connect(d.owner).createMarket(marketParams),
      ).to.be.revertedWith("IRM not enabled");
    });

    it("should revert if LLTV not enabled", async function () {
      const d = await deployContracts();
      await d.cMorpho.connect(d.owner).enableIrm(d.ethIrm.target);

      const marketParams = {
        loanToken: d.cUSDT.target,
        collateralToken: d.cETH.target,
        oracle: d.ethOracle.target,
        irm: d.ethIrm.target,
        lltv: ETH_LLTV,
      };

      await expect(
        d.cMorpho.connect(d.owner).createMarket(marketParams),
      ).to.be.revertedWith("LLTV not enabled");
    });

    it("should return correct oracle price", async function () {
      const d = await deployContracts();
      // price = collateralUSD * 10^(loanDecimals + 36 - collateralDecimals) / loanUSD
      // = 3000e18 * 10^36 / 1e18 = 3000e36
      const price = await d.ethOracle.price();
      expect(price).to.equal(3000n * 10n ** 36n);
    });
  });

  // ============ Supply Tests ============

  describe("Supply", function () {
    it("should supply assets and update market totals", async function () {
      const d = await deployContracts();
      const { marketParams, marketId } = await setupMarket(d);

      // Shield + set operator
      const supplyAmount = ethers.parseUnits("1000", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, supplyAmount);

      // Supply to CMorpho
      const tx = await d.cMorpho.connect(d.supplier).supply(
        marketParams,
        supplyAmount,
        0,
        d.supplier.address,
        "0x",
      );

      await expect(tx).to.emit(d.cMorpho, "Supply");

      // Check plaintext market totals
      const marketData = await d.cMorpho.market(marketId); 
      expect(marketData.totalSupplyAssets).to.equal(supplyAmount);
      expect(marketData.totalSupplyShares).to.equal(supplyAmount * 10n ** 6n);
    });

    it("should update encrypted supplyShares position", async function () {
      const d = await deployContracts();
      const { marketParams, marketId } = await setupMarket(d);

      const supplyAmount = ethers.parseUnits("1000", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, supplyAmount);

      await d.cMorpho.connect(d.supplier).supply(
        marketParams, supplyAmount, 0, d.supplier.address, "0x",
      );

      // Check encrypted position via expectPlaintext
      const pos = await d.cMorpho.position(marketId, d.supplier.address);
      // supplyShares should equal supplyAmount (1:1 at first supply)
      await hre.cofhe.mocks.expectPlaintext(pos.supplyShares, supplyAmount * 10n ** 6n);
    });

    it("should accumulate multiple supplies", async function () {
      const d = await deployContracts();
      const { marketParams, marketId } = await setupMarket(d);

      const totalAmount = ethers.parseUnits("1000", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, totalAmount);

      // First supply: 600
      const first = ethers.parseUnits("600", 6);
      await d.cMorpho.connect(d.supplier).supply(
        marketParams, first, 0, d.supplier.address, "0x",
      );

      // Second supply: 400
      const second = ethers.parseUnits("400", 6);
      await d.cMorpho.connect(d.supplier).supply(
        marketParams, second, 0, d.supplier.address, "0x",
      );

      // Total supply should be 1000
      const marketData = await d.cMorpho.market(marketId);
      expect(marketData.totalSupplyAssets).to.equal(totalAmount);

      // Encrypted position should be 1000
      const pos = await d.cMorpho.position(marketId, d.supplier.address);
      await hre.cofhe.mocks.expectPlaintext(pos.supplyShares, totalAmount * 10n ** 6n);
    });

    it("should revert on zero address onBehalf", async function () {
      const d = await deployContracts();
      const { marketParams } = await setupMarket(d);

      const supplyAmount = ethers.parseUnits("100", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, supplyAmount);

      await expect(
        d.cMorpho.connect(d.supplier).supply(
          marketParams, supplyAmount, 0, ethers.ZeroAddress, "0x",
        ),
      ).to.be.revertedWith("zero address");
    });

    it("should revert if both assets and shares are zero", async function () {
      const d = await deployContracts();
      const { marketParams } = await setupMarket(d);

      await expect(
        d.cMorpho.connect(d.supplier).supply(
          marketParams, 0, 0, d.supplier.address, "0x",
        ),
      ).to.be.revertedWith("inconsistent input");
    });
  });

  // ============ Withdraw Tests ============

  describe("Withdraw", function () {
    it("should withdraw supplied assets", async function () {
      const d = await deployContracts();
      const { marketParams, marketId } = await setupMarket(d);

      // Supply first
      const supplyAmount = ethers.parseUnits("1000", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, supplyAmount);
      await d.cMorpho.connect(d.supplier).supply(
        marketParams, supplyAmount, 0, d.supplier.address, "0x",
      );

      // Withdraw half
      const withdrawAmount = ethers.parseUnits("500", 6);
      const tx = await d.cMorpho.connect(d.supplier).withdraw(
        marketParams,
        withdrawAmount,
        0,
        d.supplier.address, // onBehalf
        d.supplier.address, // receiver
      );

      await expect(tx).to.emit(d.cMorpho, "Withdraw");

      // Market totals should decrease
      const marketData = await d.cMorpho.market(marketId);
      expect(marketData.totalSupplyAssets).to.equal(supplyAmount - withdrawAmount);
      expect(marketData.totalSupplyShares).to.equal((supplyAmount - withdrawAmount) * 10n ** 6n );

      // Encrypted position should be 500
      const pos = await d.cMorpho.position(marketId, d.supplier.address);
      await hre.cofhe.mocks.expectPlaintext(pos.supplyShares, withdrawAmount * 10n ** 6n);
    });

    it("should revert if unauthorized", async function () {
      const d = await deployContracts();
      const { marketParams } = await setupMarket(d);

      const supplyAmount = ethers.parseUnits("1000", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, supplyAmount);
      await d.cMorpho.connect(d.supplier).supply(
        marketParams, supplyAmount, 0, d.supplier.address, "0x",
      );

      // Other user tries to withdraw from supplier's position
      const withdrawAmount = ethers.parseUnits("100", 6);
      await expect(
        d.cMorpho.connect(d.other).withdraw(
          marketParams, withdrawAmount, 0, d.supplier.address, d.other.address,
        ),
      ).to.be.revertedWith("unauthorized");
    });
  });

  // ============ Collateral Tests ============

  describe("Supply Collateral", function () {
    it("should supply collateral and update encrypted position", async function () {
      const d = await deployContracts();
      const { marketParams, marketId } = await setupMarket(d);

      const collateralAmount = ethers.parseUnits("1", 6); // 1 ETH
      await shieldAndSetOperator(d.borrower, d.eth, d.cETH, d.cMorpho, collateralAmount);

      const beforeHash = await d.cETH.confidentialBalanceOf(d.borrower.address);

      await hre.cofhe.mocks.expectPlaintext(beforeHash, ethers.parseUnits("1", 6))

      const tx = await d.cMorpho.connect(d.borrower).supplyCollateral(
        marketParams,
        collateralAmount,
        d.borrower.address,
        "0x",
      );

      await expect(tx).to.emit(d.cMorpho, "SupplyCollateral");

      const afterHash = await d.cETH.confidentialBalanceOf(d.borrower.address);

      await hre.cofhe.mocks.expectPlaintext(afterHash, 0n)

      // Check encrypted collateral position
      const pos = await d.cMorpho.position(marketId, d.borrower.address);
      await hre.cofhe.mocks.expectPlaintext(pos.collateral, collateralAmount);
    });

    it("should revert on zero assets", async function () {
      const d = await deployContracts();
      const { marketParams } = await setupMarket(d);

      await expect(
        d.cMorpho.connect(d.borrower).supplyCollateral(
          marketParams, 0, d.borrower.address, "0x",
        ),
      ).to.be.revertedWith("zero assets");
    });
  });

  describe("Withdraw Collateral", function () {
    it("should withdraw collateral", async function () {
      const d = await deployContracts();
      const { marketParams, marketId } = await setupMarket(d);

      // Supply collateral first
      const collateralAmount = ethers.parseUnits("2", 6);
      await shieldAndSetOperator(d.borrower, d.eth, d.cETH, d.cMorpho, collateralAmount);
      await d.cMorpho.connect(d.borrower).supplyCollateral(
        marketParams, collateralAmount, d.borrower.address, "0x",
      );

      // Withdraw half
      const withdrawAmount = ethers.parseUnits("1", 6);
      const tx = await d.cMorpho.connect(d.borrower).withdrawCollateral(
        marketParams,
        withdrawAmount,
        d.borrower.address, // onBehalf
        d.borrower.address, // receiver
      );

      await expect(tx).to.emit(d.cMorpho, "WithdrawCollateral");

      // Encrypted collateral should be 1 ETH remaining
      const pos = await d.cMorpho.position(marketId, d.borrower.address);
      await hre.cofhe.mocks.expectPlaintext(pos.collateral, withdrawAmount);
      // Then should be 1 ETH on the wallet
      const balanceHash = await d.cETH.confidentialBalanceOf(d.borrower.address);
      await hre.cofhe.mocks.expectPlaintext(balanceHash, ethers.parseUnits("1", 6))
    });

    it("should revert if unauthorized", async function () {
      const d = await deployContracts();
      const { marketParams } = await setupMarket(d);

      const collateralAmount = ethers.parseUnits("1", 6);
      await shieldAndSetOperator(d.borrower, d.eth, d.cETH, d.cMorpho, collateralAmount);
      await d.cMorpho.connect(d.borrower).supplyCollateral(
        marketParams, collateralAmount, d.borrower.address, "0x",
      );

      // Other user tries to withdraw borrower's collateral
      await expect(
        d.cMorpho.connect(d.other).withdrawCollateral(
          marketParams, collateralAmount, d.borrower.address, d.other.address,
        ),
      ).to.be.revertedWith("unauthorized");
    });
  });

  // ============ Borrow Tests ============

  describe("Borrow", function () {
    it("should borrow against collateral", async function () {
      const d = await deployContracts();
      const { marketParams, marketId } = await setupMarket(d);

      // Supplier provides liquidity
      const supplyAmount = ethers.parseUnits("10000", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, supplyAmount);
      await d.cMorpho.connect(d.supplier).supply(
        marketParams, supplyAmount, 0, d.supplier.address, "0x",
      );

      // Borrower supplies ETH collateral
      const collateralAmount = ethers.parseUnits("2", 6); // 2 ETH = $6000
      await shieldAndSetOperator(d.borrower, d.eth, d.cETH, d.cMorpho, collateralAmount);
      await d.cMorpho.connect(d.borrower).supplyCollateral(
        marketParams, collateralAmount, d.borrower.address, "0x",
      );

      // Borrow USDT: max = 2 ETH * $3000 * 75% = $4500
      const borrowAmount = ethers.parseUnits("2000", 6); // $2000 < $4500 max
      const tx = await d.cMorpho.connect(d.borrower).borrow(
        marketParams,
        borrowAmount,
        0,
        d.borrower.address, // onBehalf
        d.borrower.address, // receiver
      );

      await expect(tx).to.emit(d.cMorpho, "Borrow");

      // Check plaintext market borrow totals
      const marketData = await d.cMorpho.market(marketId);
      expect(marketData.totalBorrowAssets).to.equal(borrowAmount);

      // Check encrypted borrowShares
      const pos = await d.cMorpho.position(marketId, d.borrower.address); 
      // const borrowShares = await hre.cofhe.mocks.getPlaintext(pos.borrowShares);  
      await hre.cofhe.mocks.expectPlaintext(pos.borrowShares, 2000n * (10n ** 12n));

      // Check borrower encrypted balance
      const balanceHash = await d.cUSDT.confidentialBalanceOf(d.borrower.address); 
      await hre.cofhe.mocks.expectPlaintext(balanceHash, ethers.parseUnits("2000", 6)) 
    });

    it("should revert if insufficient liquidity", async function () {
      const d = await deployContracts();
      const { marketParams } = await setupMarket(d);

      // Small supply
      const supplyAmount = ethers.parseUnits("100", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, supplyAmount);
      await d.cMorpho.connect(d.supplier).supply(
        marketParams, supplyAmount, 0, d.supplier.address, "0x",
      );

      // Borrower has lots of collateral
      const collateralAmount = ethers.parseUnits("100", 6);
      await shieldAndSetOperator(d.borrower, d.eth, d.cETH, d.cMorpho, collateralAmount);
      await d.cMorpho.connect(d.borrower).supplyCollateral(
        marketParams, collateralAmount, d.borrower.address, "0x",
      );

      // Try to borrow more than available liquidity
      const borrowAmount = ethers.parseUnits("200", 6); // > 100 supplied
      await expect(
        d.cMorpho.connect(d.borrower).borrow(
          marketParams, borrowAmount, 0, d.borrower.address, d.borrower.address,
        ),
      ).to.be.revertedWith("insufficient liquidity");
    });

    it("should revert if unauthorized", async function () {
      const d = await deployContracts();
      const { marketParams } = await setupMarket(d);

      // Supply liquidity
      const supplyAmount = ethers.parseUnits("10000", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, supplyAmount);
      await d.cMorpho.connect(d.supplier).supply(
        marketParams, supplyAmount, 0, d.supplier.address, "0x",
      );

      // Other tries to borrow on behalf of borrower
      const borrowAmount = ethers.parseUnits("100", 6);
      await expect(
        d.cMorpho.connect(d.other).borrow(
          marketParams, borrowAmount, 0, d.borrower.address, d.other.address,
        ),
      ).to.be.revertedWith("unauthorized");
    });
  });

  // ============ Repay Tests ============

  describe("Repay", function () {
    it("should repay borrowed assets", async function () {
      const d = await deployContracts();
      const { marketParams, marketId } = await setupMarket(d);

      // Supply liquidity
      const supplyAmount = ethers.parseUnits("10000", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, supplyAmount);
      await d.cMorpho.connect(d.supplier).supply(
        marketParams, supplyAmount, 0, d.supplier.address, "0x",
      );

      // Borrower: collateral + borrow
      const collateralAmount = ethers.parseUnits("2", 6);
      await shieldAndSetOperator(d.borrower, d.eth, d.cETH, d.cMorpho, collateralAmount);
      await d.cMorpho.connect(d.borrower).supplyCollateral(
        marketParams, collateralAmount, d.borrower.address, "0x",
      );

      const borrowAmount = ethers.parseUnits("1000", 6);
      await d.cMorpho.connect(d.borrower).borrow(
        marketParams, borrowAmount, 0, d.borrower.address, d.borrower.address,
      );

      // Repay: borrower needs cUSDT (shield + set operator)
      await shieldAndSetOperator(d.borrower, d.usdt, d.cUSDT, d.cMorpho, borrowAmount);

      const tx = await d.cMorpho.connect(d.borrower).repay(
        marketParams,
        borrowAmount,
        0,
        d.borrower.address, // onBehalf
        "0x",
      );

      await expect(tx).to.emit(d.cMorpho, "Repay");
    });
  });

  // ============ Full Flow Test ============

  describe("Full Flow", function () {
    it("should complete supply → supplyCollateral → borrow → repay → withdrawCollateral → withdraw", async function () {
      const d = await deployContracts();
      const { marketParams, marketId } = await setupMarket(d);

      // 1. Supplier: supply liquidity
      const supplyAmount = ethers.parseUnits("10000", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, supplyAmount);
      await d.cMorpho.connect(d.supplier).supply(
        marketParams, supplyAmount, 0, d.supplier.address, "0x",
      );

      let marketData = await d.cMorpho.market(marketId);
      expect(marketData.totalSupplyAssets).to.equal(supplyAmount);

      // 2. Borrower: supply ETH collateral
      const collateralAmount = ethers.parseUnits("5", 6); // 5 ETH = $15000
      await shieldAndSetOperator(d.borrower, d.eth, d.cETH, d.cMorpho, collateralAmount);
      await d.cMorpho.connect(d.borrower).supplyCollateral(
        marketParams, collateralAmount, d.borrower.address, "0x",
      );

      let borrowerPos = await d.cMorpho.position(marketId, d.borrower.address);
      await hre.cofhe.mocks.expectPlaintext(borrowerPos.collateral, collateralAmount);

      // 3. Borrower: borrow USDT (max = 5 * $3000 * 75% = $11250)
      const borrowAmount = ethers.parseUnits("3000", 6);
      await d.cMorpho.connect(d.borrower).borrow(
        marketParams, borrowAmount, 0, d.borrower.address, d.borrower.address,
      );

      marketData = await d.cMorpho.market(marketId);
      expect(marketData.totalBorrowAssets).to.equal(borrowAmount);

      borrowerPos = await d.cMorpho.position(marketId, d.borrower.address);
      await hre.cofhe.mocks.expectPlaintext(borrowerPos.borrowShares, borrowAmount * (10n**6n));

      const borrowerBalanceHash = await d.cUSDT.confidentialBalanceOf(d.borrower.address); 
      await hre.cofhe.mocks.expectPlaintext(borrowerBalanceHash, ethers.parseUnits("3000", 6)) 

      // 4. Borrower: repay full borrow
      await shieldAndSetOperator(d.borrower, d.usdt, d.cUSDT, d.cMorpho, borrowAmount);
      await d.cMorpho.connect(d.borrower).repay(
        marketParams, borrowAmount, 0, d.borrower.address, "0x",
      );
  
      // 5. Borrower: withdraw collateral
      await d.cMorpho.connect(d.borrower).withdrawCollateral(
        marketParams, collateralAmount, d.borrower.address, d.borrower.address,
      );

      borrowerPos = await d.cMorpho.position(marketId, d.borrower.address);
      await hre.cofhe.mocks.expectPlaintext(borrowerPos.collateral, 0n);

      const borrowerBalanceHash2 = await d.cETH.confidentialBalanceOf(d.borrower.address); 
      await hre.cofhe.mocks.expectPlaintext(borrowerBalanceHash2, ethers.parseUnits("5", 6)) 

      // 6. Supplier: withdraw supply
      await d.cMorpho.connect(d.supplier).withdraw(
        marketParams, supplyAmount, 0, d.supplier.address, d.supplier.address,
      );

      const supplierBalanceHash = await d.cUSDT.confidentialBalanceOf(d.supplier.address); 
      const xxxx = await hre.cofhe.mocks.getPlaintext(supplierBalanceHash);
      await hre.cofhe.mocks.expectPlaintext(supplierBalanceHash, ethers.parseUnits("10000", 6)) 
    });
  });

  // ============ Interest Accrual Tests ============

  describe("Interest Accrual", function () {
    it("should accrue interest over time", async function () {
      const d = await deployContracts();
      const { marketParams, marketId } = await setupMarket(d);

      // Supply liquidity
      const supplyAmount = ethers.parseUnits("10000", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, supplyAmount);
      await d.cMorpho.connect(d.supplier).supply(
        marketParams, supplyAmount, 0, d.supplier.address, "0x",
      );

      // Borrower: collateral + borrow
      const collateralAmount = ethers.parseUnits("5", 6);
      await shieldAndSetOperator(d.borrower, d.eth, d.cETH, d.cMorpho, collateralAmount);
      await d.cMorpho.connect(d.borrower).supplyCollateral(
        marketParams, collateralAmount, d.borrower.address, "0x",
      );

      const borrowAmount = ethers.parseUnits("3000", 6);
      await d.cMorpho.connect(d.borrower).borrow(
        marketParams, borrowAmount, 0, d.borrower.address, d.borrower.address,
      );

      // Advance time by 1 year
      await ethers.provider.send("evm_increaseTime", [365 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine", []);

      // Accrue interest
      const tx = await d.cMorpho.accrueInterest(marketParams);
      await expect(tx).to.emit(d.cMorpho, "AccrueInterest");

      // After interest accrual, totalSupplyAssets should have grown
      const marketData = await d.cMorpho.market(marketId);
      expect(marketData.totalSupplyAssets).to.be.gt(supplyAmount);
      expect(marketData.totalBorrowAssets).to.be.gt(borrowAmount);
    });

    it("should return borrow rate from IRM", async function () {
      const d = await deployContracts();

      const borrowRate = await d.ethIrm.borrowRateView(
        {
          loanToken: d.cUSDT.target,
          collateralToken: d.cETH.target,
          oracle: d.ethOracle.target,
          irm: d.ethIrm.target,
          lltv: ETH_LLTV,
        },
        {
          totalSupplyAssets: 10000000n,
          totalSupplyShares: 10000000n,
          totalBorrowAssets: 5000000n,
          totalBorrowShares: 5000000n,
          lastUpdate: 0n,
          fee: 0n,
        },
      );

      expect(borrowRate).to.be.gt(0n);
      console.log("Borrow rate (per second):", borrowRate.toString());
    });
  });

  // ============ Authorization Tests ============

  describe("Authorization", function () {
    it("should allow authorized user to withdraw on behalf", async function () {
      const d = await deployContracts();
      const { marketParams, marketId } = await setupMarket(d);

      // Supplier supplies
      const supplyAmount = ethers.parseUnits("1000", 6);
      await shieldAndSetOperator(d.supplier, d.usdt, d.cUSDT, d.cMorpho, supplyAmount);
      await d.cMorpho.connect(d.supplier).supply(
        marketParams, supplyAmount, 0, d.supplier.address, "0x",
      );

      // Supplier authorizes other
      await d.cMorpho.connect(d.supplier).setAuthorization(d.other.address, true);
      expect(await d.cMorpho.isAuthorized(d.supplier.address, d.other.address)).to.equal(true);

      // Other can now withdraw on behalf of supplier
      const withdrawAmount = ethers.parseUnits("500", 6);
      const tx = await d.cMorpho.connect(d.other).withdraw(
        marketParams, withdrawAmount, 0,
        d.supplier.address, // onBehalf
        d.supplier.address, // receiver
      );
      await expect(tx).to.emit(d.cMorpho, "Withdraw");

      // Market totals should decrease
      const marketData = await d.cMorpho.market(marketId);
      expect(marketData.totalSupplyAssets).to.equal(supplyAmount - withdrawAmount);
    });

    it("should revoke authorization", async function () {
      const d = await deployContracts();

      await d.cMorpho.connect(d.supplier).setAuthorization(d.other.address, true);
      expect(await d.cMorpho.isAuthorized(d.supplier.address, d.other.address)).to.equal(true);

      await d.cMorpho.connect(d.supplier).setAuthorization(d.other.address, false);
      expect(await d.cMorpho.isAuthorized(d.supplier.address, d.other.address)).to.equal(false);
    });

    it("should emit SetAuthorization event", async function () {
      const d = await deployContracts();
      const tx = await d.cMorpho.connect(d.supplier).setAuthorization(d.other.address, true);
      await expect(tx).to.emit(d.cMorpho, "SetAuthorization");
    });
  });

  // ============ Owner Functions Tests ============

  describe("Owner Functions", function () {
    it("should allow owner to set new owner", async function () {
      const d = await deployContracts();
      await d.cMorpho.connect(d.owner).setOwner(d.other.address);
      expect(await d.cMorpho.owner()).to.equal(d.other.address);
    });

    it("should revert if non-owner tries to set owner", async function () {
      const d = await deployContracts();
      await expect(
        d.cMorpho.connect(d.other).setOwner(d.other.address),
      ).to.be.revertedWith("not owner");
    });

    it("should set liquidator", async function () {
      const d = await deployContracts();
      await d.cMorpho.connect(d.owner).setLiquidator(d.other.address);
      expect(await d.cMorpho.liquidator()).to.equal(d.other.address);
    });
  });

  // ============ Edge Cases ============

  describe("Edge Cases", function () {
    it("should revert supply to non-existent market", async function () {
      const d = await deployContracts();
      // Don't call setupMarket — no market exists
      const fakeMarketParams = {
        loanToken: d.cUSDT.target,
        collateralToken: d.cETH.target,
        oracle: d.ethOracle.target,
        irm: d.ethIrm.target,
        lltv: ETH_LLTV,
      };

      await expect(
        d.cMorpho.connect(d.supplier).supply(
          fakeMarketParams, ethers.parseUnits("100", 6), 0, d.supplier.address, "0x",
        ),
      ).to.be.revertedWith("market not created");
    });

    it("should revert borrow to zero address receiver", async function () {
      const d = await deployContracts();
      const { marketParams } = await setupMarket(d);

      await expect(
        d.cMorpho.connect(d.borrower).borrow(
          marketParams, ethers.parseUnits("100", 6), 0, d.borrower.address, ethers.ZeroAddress,
        ),
      ).to.be.revertedWith("zero address");
    });

    it("should revert supplyCollateral with zero address onBehalf", async function () {
      const d = await deployContracts();
      const { marketParams } = await setupMarket(d);

      await expect(
        d.cMorpho.connect(d.borrower).supplyCollateral(
          marketParams, ethers.parseUnits("1", 6), ethers.ZeroAddress, "0x",
        ),
      ).to.be.revertedWith("zero address");
    });
  });
});
