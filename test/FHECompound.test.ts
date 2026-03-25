import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat"; 

describe("FHE Compound Protocol", function () {
  async function deployCompoundFixture() {
    const [owner, user1, user2, liquidator] = await hre.ethers.getSigners();

    // Deploy mock tokens
    const MockERC20Factory = await hre.ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 0, await owner.getAddress());
    const wbtc = await MockERC20Factory.deploy("Wrapped BTC", "WBTC", 0, await owner.getAddress());

    // Deploy oracle (requires admin address)
    const OracleFactory = await hre.ethers.getContractFactory("PriceOracle");
    const oracle = await OracleFactory.deploy(await owner.getAddress());

    // Deploy comptroller FIRST (temp with owner as trusted relayer)
    const ComptrollerFactory = await hre.ethers.getContractFactory("Comptroller");
    const comptroller = await ComptrollerFactory.deploy(
      await oracle.getAddress(),
      await owner.getAddress() // temporary
    );

    // Deploy trusted relayer
    const TrustedRelayerFactory = await hre.ethers.getContractFactory("TrustedRelayer");
    const trustedRelayer = await TrustedRelayerFactory.deploy(
      await comptroller.getAddress(),
      await oracle.getAddress()
    );

    // Update comptroller with real trusted relayer
    await comptroller.setTrustedRelayer(await trustedRelayer.getAddress());

    // Deploy cTokens
    const CTokenFactory = await hre.ethers.getContractFactory("CToken");
    const cUSDC = await CTokenFactory.deploy(
      await usdc.getAddress(),
      await comptroller.getAddress(),
      await oracle.getAddress(),
      await trustedRelayer.getAddress()
    );
    const cWBTC = await CTokenFactory.deploy(
      await wbtc.getAddress(),
      await comptroller.getAddress(),
      await oracle.getAddress(),
      await trustedRelayer.getAddress()
    );

    // Set prices in oracle (both underlying tokens and cTokens)
    await oracle.setPrice(await usdc.getAddress(), 1000000000000000000n);
    await oracle.setPrice(await wbtc.getAddress(), 50000000000000000000000n);
    // Also set prices for cToken addresses (needed by TrustedRelayer)
    await oracle.setPrice(await cUSDC.getAddress(), 1000000000000000000n);
    await oracle.setPrice(await cWBTC.getAddress(), 50000000000000000000000n);

    // Authorize cTokens to call trusted relayer
    await trustedRelayer.authorizeCaller(await cUSDC.getAddress());
    await trustedRelayer.authorizeCaller(await cWBTC.getAddress());

    // Register markets
    await comptroller.supportMarket(await cUSDC.getAddress());
    await comptroller.supportMarket(await cWBTC.getAddress());

    // Mint tokens to users
    const SUPPLY_AMOUNT = 10000000000n; // 10,000 USDC (6 decimals)
    await usdc.mint(user1.address, SUPPLY_AMOUNT * 2n);
    await usdc.mint(user2.address, SUPPLY_AMOUNT * 2n);
    await wbtc.mint(user1.address, 100000000n); // 1 BTC (8 decimals)
    await wbtc.mint(user2.address, 100000000n); // 1 BTC (8 decimals)

    // Approve cTokens
    await usdc.connect(user1).approve(await cUSDC.getAddress(), hre.ethers.MaxUint256);
    await usdc.connect(user2).approve(await cUSDC.getAddress(), hre.ethers.MaxUint256);
    await wbtc.connect(user1).approve(await cWBTC.getAddress(), hre.ethers.MaxUint256);
    await wbtc.connect(user2).approve(await cWBTC.getAddress(), hre.ethers.MaxUint256);

    return {
      usdc,
      wbtc,
      comptroller,
      oracle,
      trustedRelayer,
      cUSDC,
      cWBTC,
      owner,
      user1,
      user2,
      liquidator,
      SUPPLY_AMOUNT,
    };
  }

  describe("Deployment", function () {
    beforeEach(function () {
      if (!hre.cofhe.isPermittedEnvironment("MOCK")) this.skip();
    });

    it("Should deploy all contracts correctly", async function () {
      const { usdc, wbtc, comptroller, cUSDC, cWBTC } = await loadFixture(deployCompoundFixture);
      expect(await usdc.name()).to.equal("USD Coin");
      expect(await wbtc.name()).to.equal("Wrapped BTC");
      expect(await comptroller.isMarket(await cUSDC.getAddress())).to.be.true;
      expect(await comptroller.isMarket(await cWBTC.getAddress())).to.be.true;
    });

    it("Should set correct collateral factors", async function () {
      const { comptroller, cUSDC, cWBTC } = await loadFixture(deployCompoundFixture);
      const usdcFactor = await comptroller.getCollateralFactor(await cUSDC.getAddress());
      const wbtcFactor = await comptroller.getCollateralFactor(await cWBTC.getAddress());
      // Both should be set to 0.8e18 (80%) by default
      expect(usdcFactor).to.equal(800000000000000000n);
      expect(wbtcFactor).to.equal(800000000000000000n);
    });
  });

  describe("Supply Operations", function () {
    beforeEach(function () {
      if (!hre.cofhe.isPermittedEnvironment("MOCK")) this.skip();
    });

    it("Should allow user to supply tokens", async function () {
      const { cUSDC, user1, SUPPLY_AMOUNT } = await loadFixture(deployCompoundFixture);
      const tx = await cUSDC.connect(user1).supply(SUPPLY_AMOUNT);
      await expect(tx).to.emit(cUSDC, "Supply");

      const cTokenBalance = await cUSDC.balanceOf(user1.address);
      expect(cTokenBalance).to.equal(SUPPLY_AMOUNT);

      const totalUnderlying = await cUSDC.totalUnderlying();
      expect(totalUnderlying).to.equal(SUPPLY_AMOUNT);
    });

    it("Should revert when supplying 0", async function () {
      const { cUSDC, user1 } = await loadFixture(deployCompoundFixture);
      await expect(cUSDC.connect(user1).supply(0)).to.be.revertedWithCustomError(cUSDC, "InvalidAmount");
    });
  });

  describe("Borrow Operations", function () {
    beforeEach(function () {
      if (!hre.cofhe.isPermittedEnvironment("MOCK")) this.skip();
    });

    it("Should allow user to borrow tokens", async function () {
      const { cUSDC, user1, SUPPLY_AMOUNT } = await loadFixture(deployCompoundFixture);
      await cUSDC.connect(user1).supply(SUPPLY_AMOUNT);

      const BORROW_AMOUNT = SUPPLY_AMOUNT / 2n;
      const tx = await cUSDC.connect(user1).borrow(BORROW_AMOUNT);
      await expect(tx).to.emit(cUSDC, "Borrow");

      const totalBorrows = await cUSDC.totalBorrows();
      expect(totalBorrows).to.equal(BORROW_AMOUNT);
    });

    it("Should revert when borrowing 0", async function () {
      const { cUSDC, user1, SUPPLY_AMOUNT } = await loadFixture(deployCompoundFixture);
      await cUSDC.connect(user1).supply(SUPPLY_AMOUNT);

      await expect(cUSDC.connect(user1).borrow(0)).to.be.revertedWithCustomError(cUSDC, "InvalidAmount");
    });
  });

  describe("Repay Operations", function () {
    beforeEach(function () {
      if (!hre.cofhe.isPermittedEnvironment("MOCK")) this.skip();
    });

    it("Should allow user to repay borrow", async function () {
      const { cUSDC, user1, SUPPLY_AMOUNT } = await loadFixture(deployCompoundFixture);
      await cUSDC.connect(user1).supply(SUPPLY_AMOUNT);

      const BORROW_AMOUNT = SUPPLY_AMOUNT / 2n;
      await cUSDC.connect(user1).borrow(BORROW_AMOUNT);

      const repayAmount = BORROW_AMOUNT / 2n;
      const tx = await cUSDC.connect(user1).repay(repayAmount);
      await expect(tx).to.emit(cUSDC, "Repay");

      const totalBorrows = await cUSDC.totalBorrows();
      expect(totalBorrows).to.be.gt(0);
    });
  });

  describe("Price Oracle", function () {
    beforeEach(function () {
      if (!hre.cofhe.isPermittedEnvironment("MOCK")) this.skip();
    });

    it("Should return correct price for tokens", async function () {
      const { oracle, usdc, wbtc } = await loadFixture(deployCompoundFixture);
      const usdcPrice = await oracle.getPrice(await usdc.getAddress());
      const wbtcPrice = await oracle.getPrice(await wbtc.getAddress());
      expect(usdcPrice).to.equal(1000000000000000000n);
      expect(wbtcPrice).to.equal(50000000000000000000000n);
    });
  });

  describe("Market Operations", function () {
    beforeEach(function () {
      if (!hre.cofhe.isPermittedEnvironment("MOCK")) this.skip();
    });

    it("Should allow owner to support new market", async function () {
      const { comptroller, usdc, oracle, trustedRelayer } = await loadFixture(deployCompoundFixture);
      const marketCount = await comptroller.getMarketCount();
      const initialCount = await marketCount;

      const CTokenFactory = await hre.ethers.getContractFactory("CToken");
      const newCToken = await CTokenFactory.deploy(
        await usdc.getAddress(),
        await comptroller.getAddress(),
        await oracle.getAddress(),
        await trustedRelayer.getAddress()
      );

      await comptroller.supportMarket(await newCToken.getAddress());

      const finalCount = await comptroller.getMarketCount();
      expect(finalCount).to.equal(initialCount + 1n);
    });
  });

  describe("Access Control", function () {
    beforeEach(function () {
      if (!hre.cofhe.isPermittedEnvironment("MOCK")) this.skip();
    });

    it("Should only allow owner to support markets", async function () {
      const { comptroller, cUSDC, user1 } = await loadFixture(deployCompoundFixture);
      await expect(
        comptroller.connect(user1).supportMarket(await cUSDC.getAddress())
      ).to.be.revertedWithCustomError(comptroller, "OwnableUnauthorizedAccount");
    });

    it("Should only allow owner to set oracle", async function () {
      const { cUSDC, oracle, user1 } = await loadFixture(deployCompoundFixture);
      await expect(
        cUSDC.connect(user1).setOracle(await oracle.getAddress())
      ).to.be.revertedWithCustomError(cUSDC, "OwnableUnauthorizedAccount");
    });
  });
});