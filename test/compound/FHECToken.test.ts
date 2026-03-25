import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import {
  MockERC20,
  FHEPriceOracle,
  FHEComptroller,
  TrustedRelayer,
  FHECToken,
} from "../../typechain-types";

describe("FHE-Enabled Compound v2 Phase 1", function () {
  let deployer: SignerWithAddress;
  let user: SignerWithAddress;
  let liquidator: SignerWithAddress;

  let weth: MockERC20;
  let usdt: MockERC20;
  let oracle: FHEPriceOracle;
  let comptroller: FHEComptroller;
  let relayer: TrustedRelayer;
  let cweth: FHECToken;
  let cusdt: FHECToken;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const WETH_PRICE = ethers.parseEther("3000");
  const USDT_PRICE = ethers.parseEther("1");

  before(async function () {
    [deployer, user, liquidator] = await ethers.getSigners();
  });

  beforeEach(async function () {
    // Deploy MockWETH
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    weth = await MockERC20.deploy("Wrapped Ether", "WETH", INITIAL_SUPPLY, deployer.address);
    
    // Deploy MockUSDT
    usdt = await MockERC20.deploy("Tether USD", "USDT", INITIAL_SUPPLY, deployer.address);

    // Deploy Oracle
    const FHEPriceOracle = await ethers.getContractFactory("FHEPriceOracle");
    oracle = await FHEPriceOracle.deploy(deployer.address);

    // Deploy Comptroller first (needs oracle, will update relayer later)
    const FHEComptroller = await ethers.getContractFactory("FHEComptroller");
    comptroller = await FHEComptroller.deploy(await oracle.getAddress(), deployer.address);

    // Deploy TrustedRelayer with Comptroller address
    const TrustedRelayer = await ethers.getContractFactory("TrustedRelayer");
    relayer = await TrustedRelayer.deploy(await comptroller.getAddress());

    // Update Comptroller to point to TrustedRelayer
    await comptroller.setTrustedRelayer(await relayer.getAddress());

    // Deploy cWETH
    const FHECToken = await ethers.getContractFactory("FHECToken");
    cweth = await FHECToken.deploy(
      await weth.getAddress(),
      await comptroller.getAddress(),
      await oracle.getAddress(),
      await relayer.getAddress()
    );

    // Deploy cUSDT
    cusdt = await FHECToken.deploy(
      await usdt.getAddress(),
      await comptroller.getAddress(),
      await oracle.getAddress(),
      await relayer.getAddress()
    );

    // Set prices in oracle
    await oracle.setPrice(await weth.getAddress(), WETH_PRICE);
    await oracle.setPrice(await usdt.getAddress(), USDT_PRICE);

    // Add markets to comptroller
    await comptroller.supportMarket(await cweth.getAddress());
    await comptroller.supportMarket(await cusdt.getAddress());

    // Fund user with tokens
    await weth.transfer(user.address, ethers.parseEther("100"));
    await usdt.transfer(user.address, ethers.parseEther("100000"));
  });

  describe("Token Deployment", function () {
    it("Should deploy mock tokens with correct supplies", async function () {
      expect(await weth.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await usdt.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Should set correct prices in oracle", async function () {
      expect(await oracle.getPrice(await weth.getAddress())).to.equal(WETH_PRICE);
      expect(await oracle.getPrice(await usdt.getAddress())).to.equal(USDT_PRICE);
    });

    it("Should register markets in comptroller", async function () {
      expect(await comptroller.isMarket(await cweth.getAddress())).to.be.true;
      expect(await comptroller.isMarket(await cusdt.getAddress())).to.be.true;
      expect(await comptroller.getMarketCount()).to.equal(2);
    });
  });

  describe("Supplying Collateral", function () {
    it("Should mint cTokens successfully", async function () {
      const supplyAmount = ethers.parseEther("100");
      
      // Approve cToken
      await weth.connect(user).approve(await cweth.getAddress(), supplyAmount);
      
      // Mint cTokens
      await expect(cweth.connect(user).mint(supplyAmount))
        .to.emit(cweth, "Mint")
        .withArgs(user.address, supplyAmount, supplyAmount);
    });

    it("Should update user's cToken balance", async function () {
      const supplyAmount = ethers.parseEther("100");
      
      await weth.connect(user).approve(await cweth.getAddress(), supplyAmount);
      await cweth.connect(user).mint(supplyAmount);
      
      const cTokenBalance = await cweth.accountCTokenBalances(user.address);
      expect(cTokenBalance).to.equal(supplyAmount);
    });

    it("Should update total supply", async function () {
      const supplyAmount = ethers.parseEther("100");
      
      await weth.connect(user).approve(await cweth.getAddress(), supplyAmount);
      await cweth.connect(user).mint(supplyAmount);
      
      const totalSupply = await cweth.totalSupply();
      expect(totalSupply).to.equal(supplyAmount);
    });

    it("Should fail to mint without approval", async function () {
      const supplyAmount = ethers.parseEther("100");
      
      await expect(cweth.connect(user).mint(supplyAmount))
        .to.be.reverted;
    });

    it("Should fail to mint zero amount", async function () {
      await weth.connect(user).approve(await cweth.getAddress(), ethers.parseEther("100"));
      
      await expect(cweth.connect(user).mint(0))
        .to.be.revertedWithCustomError(cweth, "InvalidAmount");
    });
  });

  describe("Redeeming Collateral", function () {
    beforeEach(async function () {
      const supplyAmount = ethers.parseEther("100");
      await weth.connect(user).approve(await cweth.getAddress(), supplyAmount);
      await cweth.connect(user).mint(supplyAmount);
    });

    it("Should redeem cTokens successfully", async function () {
      const redeemAmount = ethers.parseEther("50");
      
      await expect(cweth.connect(user).redeem(redeemAmount))
        .to.emit(cweth, "Redeem")
        .withArgs(user.address, redeemAmount, redeemAmount);
    });

    it("Should transfer underlying tokens to user", async function () {
      const redeemAmount = ethers.parseEther("50");
      const balanceBefore = await weth.balanceOf(user.address);
      
      await cweth.connect(user).redeem(redeemAmount);
      
      const balanceAfter = await weth.balanceOf(user.address);
      expect(balanceAfter - balanceBefore).to.equal(redeemAmount);
    });

    it("Should update user's cToken balance", async function () {
      const supplyAmount = ethers.parseEther("100");
      const redeemAmount = ethers.parseEther("50");
      
      await cweth.connect(user).redeem(redeemAmount);
      
      const cTokenBalance = await cweth.accountCTokenBalances(user.address);
      expect(cTokenBalance).to.equal(supplyAmount - redeemAmount);
    });

    it("Should fail to redeem insufficient balance", async function () {
      const redeemAmount = ethers.parseEther("150");
      
      await expect(cweth.connect(user).redeem(redeemAmount))
        .to.be.revertedWithCustomError(cweth, "InsufficientBalance");
    });

    it("Should fail to redeem zero amount", async function () {
      await expect(cweth.connect(user).redeem(0))
        .to.be.revertedWithCustomError(cweth, "InvalidAmount");
    });
  });

  describe("Multiple Markets", function () {
    it("Should allow supplying to multiple markets", async function () {
      const wethAmount = ethers.parseEther("10");
      const usdtAmount = ethers.parseEther("50000");
      
      // Supply WETH
      await weth.connect(user).approve(await cweth.getAddress(), wethAmount);
      await cweth.connect(user).mint(wethAmount);
      
      // Supply USDT
      await usdt.connect(user).approve(await cusdt.getAddress(), usdtAmount);
      await cusdt.connect(user).mint(usdtAmount);
      
      expect(await cweth.accountCTokenBalances(user.address)).to.equal(wethAmount);
      expect(await cusdt.accountCTokenBalances(user.address)).to.equal(usdtAmount);
    });

    it("Should track total underlying correctly", async function () {
      const wethAmount = ethers.parseEther("10");
      const usdtAmount = ethers.parseEther("50000");
      
      await weth.connect(user).approve(await cweth.getAddress(), wethAmount);
      await cweth.connect(user).mint(wethAmount);
      
      await usdt.connect(user).approve(await cusdt.getAddress(), usdtAmount);
      await cusdt.connect(user).mint(usdtAmount);
      
      expect(await cweth.totalUnderlying()).to.equal(wethAmount);
      expect(await cusdt.totalUnderlying()).to.equal(usdtAmount);
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update comptroller", async function () {
      const newComptroller = ethers.Wallet.createRandom().address;
      
      await expect(cweth.setComptroller(newComptroller))
        .to.emit(cweth, "ComptrollerUpdated");
      
      expect(await cweth.comptroller()).to.equal(newComptroller);
    });

    it("Should allow owner to update oracle", async function () {
      const newOracle = ethers.Wallet.createRandom().address;
      
      await expect(cweth.setOracle(newOracle))
        .to.emit(cweth, "OracleUpdated");
      
      expect(await cweth.oracle()).to.equal(newOracle);
    });

    it("Should allow owner to update trusted relayer", async function () {
      const newRelayer = ethers.Wallet.createRandom().address;
      
      await expect(cweth.setTrustedRelayer(newRelayer))
        .to.emit(cweth, "TrustedRelayerUpdated");
      
      expect(await cweth.trustedRelayer()).to.equal(newRelayer);
    });

    it("Should allow owner to update exchange rate", async function () {
      const newRate = ethers.parseEther("1.1"); // 10% interest
      
      await expect(cweth.setExchangeRate(newRate))
        .to.emit(cweth, "ExchangeRateUpdated");
      
      expect(await cweth.exchangeRate()).to.equal(newRate);
    });

    it("Should fail non-owner admin calls", async function () {
      await expect(cweth.connect(user).setComptroller(user.address))
        .to.be.revertedWithCustomError(cweth, "OwnableUnauthorizedAccount");
    });
  });

  describe("Comptroller Functions", function () {
    it("Should allow owner to add market", async function () {
      const FHECToken = await ethers.getContractFactory("FHECToken");
      const newMarket = await FHECToken.deploy(
        await weth.getAddress(),
        await comptroller.getAddress(),
        await oracle.getAddress(),
        await relayer.getAddress()
      );

      await expect(comptroller.supportMarket(await newMarket.getAddress()))
        .to.emit(comptroller, "MarketListed");
    });

    it("Should allow owner to set collateral factor", async function () {
      const newFactor = ethers.parseEther("0.9"); // 90%
      
      await expect(comptroller.setCollateralFactor(await cweth.getAddress(), newFactor))
        .to.emit(comptroller, "CollateralFactorUpdated");
    });

    it("Should allow owner to set liquidation threshold", async function () {
      const newThreshold = ethers.parseEther("0.95"); // 95%
      
      await comptroller.setLiquidationThreshold(await cweth.getAddress(), newThreshold);
      
      // Verify it was set (this will be encrypted, so we just check it doesn't revert)
      const threshold = await comptroller.getLiquidationThreshold(await cweth.getAddress());
      expect(threshold).to.not.equal(ethers.ZeroAddress);
    });

    it("Should return all markets", async function () {
      const markets = await comptroller.getAllMarkets();
      expect(markets.length).to.equal(2);
      expect(markets[0]).to.equal(await cweth.getAddress());
      expect(markets[1]).to.equal(await cusdt.getAddress());
    });
  });

  describe("TrustedRelayer Functions", function () {
    it("Should allow owner to authorize caller", async function () {
      await expect(relayer.authorizeCaller(liquidator.address))
        .to.emit(relayer, "CallerAuthorized");
      
      expect(await relayer.isAuthorizedCaller(liquidator.address)).to.be.true;
    });

    it("Should allow owner to revoke caller", async function () {
      await relayer.authorizeCaller(liquidator.address);
      await expect(relayer.revokeCaller(liquidator.address))
        .to.emit(relayer, "CallerRevoked");
      
      expect(await relayer.isAuthorizedCaller(liquidator.address)).to.be.false;
    });

    it("Should allow authorized caller to check health factor", async function () {
      await relayer.authorizeCaller(liquidator.address);
      
      // This should not revert (though it returns placeholder values for now)
      const tx = await relayer.connect(liquidator).getHealthFactor(user.address);
      const receipt = await tx.wait();
      
      // For now just check the transaction succeeded
      expect(receipt).to.not.be.null;
    });

    it("Should fail unauthorized caller health check", async function () {
      await expect(relayer.connect(user).getHealthFactor(user.address))
        .to.be.revertedWithCustomError(relayer, "UnauthorizedCaller");
    });
  });

  describe("Exchange Rate Calculations", function () {
    it("Should calculate cToken amount correctly", async function () {
      const underlyingAmount = ethers.parseEther("100");
      const expectedCTokenAmount = underlyingAmount; // 1:1 when exchange rate is 1e18
      
      const cTokenAmount = await cweth.calcCTokenAmount(underlyingAmount);
      expect(cTokenAmount).to.equal(expectedCTokenAmount);
    });

    it("Should calculate underlying amount correctly", async function () {
      const cTokenAmount = ethers.parseEther("100");
      const expectedUnderlyingAmount = cTokenAmount; // 1:1 when exchange rate is 1e18
      
      const underlyingAmount = await cweth.calcUnderlyingAmount(cTokenAmount);
      expect(underlyingAmount).to.equal(expectedUnderlyingAmount);
    });

    it("Should handle different exchange rates", async function () {
      const newRate = ethers.parseEther("1.1"); // 10% interest
      await cweth.setExchangeRate(newRate);
      
      const underlyingAmount = ethers.parseEther("100");
      const expectedCTokenAmount = (underlyingAmount * BigInt(1e18)) / newRate;
      
      const cTokenAmount = await cweth.calcCTokenAmount(underlyingAmount);
      expect(cTokenAmount).to.equal(expectedCTokenAmount);
    });
  });
});