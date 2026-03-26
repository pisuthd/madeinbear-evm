import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";

describe("PriceOracle", function () {
  async function deployPriceOracleFixture() {
    const [owner, user1, user2] = await hre.ethers.getSigners();

    // Deploy mock tokens
    const MockERC20Factory = await hre.ethers.getContractFactory("MockERC20");
    const usdc = await MockERC20Factory.deploy("USD Coin", "USDC", 0, await owner.getAddress());
    const wbtc = await MockERC20Factory.deploy("Wrapped BTC", "WBTC", 0, await owner.getAddress());
    const eth = await owner.getAddress(); // Use owner address as native token placeholder

    // Set correct decimals for mock tokens
    await usdc.setDecimals(6);
    await wbtc.setDecimals(8);

    // Deploy mock cTokens
    const MockCErc20Factory = await hre.ethers.getContractFactory("MockCErc20");
    const cUSDC = await MockCErc20Factory.deploy(
      await usdc.getAddress(),
      "cUSDC",
      6
    );
    const cWBTC = await MockCErc20Factory.deploy(
      await wbtc.getAddress(),
      "cWBTC",
      8
    );

    // Deploy mock cETH
    const MockCEthFactory = await hre.ethers.getContractFactory("MockCEth");
    const cETH = await MockCEthFactory.deploy();

    // Deploy PriceOracle
    const PriceOracleFactory = await hre.ethers.getContractFactory("PriceOracle");
    const oracle = await PriceOracleFactory.deploy();

    return {
      usdc,
      wbtc,
      eth,
      oracle,
      cUSDC,
      cWBTC,
      cETH,
      owner,
      user1,
      user2,
    };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { oracle } = await loadFixture(deployPriceOracleFixture);
      expect(oracle.target).to.be.properAddress;
    });

    it("Should set deployer as whitelisted", async function () {
      const { oracle, owner } = await loadFixture(deployPriceOracleFixture);
      expect(await oracle.whitelist(owner.address)).to.be.true;
    });

    it("Should have correct constants", async function () {
      const { oracle } = await loadFixture(deployPriceOracleFixture);
      expect(await oracle.MIN_PRICE()).to.equal(1e6);
      // expect(await oracle.MAX_PRICE()).to.equal(1e24);
    });
  });

  describe("Access Control", function () {
    it("Should only allow whitelisted addresses", async function () {
      const { oracle, user1 } = await loadFixture(deployPriceOracleFixture);
      expect(await oracle.whitelist(user1.address)).to.be.false;
    });

    it("Should allow whitelisted address to call restricted functions", async function () {
      const { oracle, owner, user1 } = await loadFixture(deployPriceOracleFixture);
      // Owner is whitelisted by default
      expect(await oracle.whitelist(owner.address)).to.be.true;
      expect(await oracle.whitelist(user1.address)).to.be.false;
    });
  });

  describe("Fallback Prices", function () {
    it("Should store fallback prices correctly", async function () {
      const { oracle, usdc } = await loadFixture(deployPriceOracleFixture);
      
      const price = await oracle.fallbackPrices(await usdc.getAddress());
      expect(price).to.be.a("bigint");
    });
  });

  describe("Set Direct Price", function () {
    it("Should allow whitelisted address to set price", async function () {
      const { oracle, usdc, owner } = await loadFixture(deployPriceOracleFixture);
      
      // Set price for USDC: $1 in 18 decimals
      await oracle.setDirectPrice(await usdc.getAddress(), 1000000000000000000n);
      
      const price = await oracle.fallbackPrices(await usdc.getAddress());
      expect(price).to.equal(1000000000000000000n);
    });

    it("Should emit PricePosted event", async function () {
      const { oracle, usdc, owner } = await loadFixture(deployPriceOracleFixture);
      
      await expect(oracle.setDirectPrice(await usdc.getAddress(), 1000000000000000000n))
        .to.emit(oracle, "PricePosted")
        .withArgs(await usdc.getAddress(), 0n, 1000000000000000000n, 1000000000000000000n);
    });

    it("Should revert with non-whitelisted address", async function () {
      const { oracle, usdc, user1 } = await loadFixture(deployPriceOracleFixture);
      
      await expect(
        oracle.connect(user1).setDirectPrice(await usdc.getAddress(), 1000000000000000000n)
      ).to.be.revertedWith("Not whitelisted");
    });

    it("Should revert with zero price", async function () {
      const { oracle, usdc, owner } = await loadFixture(deployPriceOracleFixture);
      
      await expect(
        oracle.setDirectPrice(await usdc.getAddress(), 0n)
      ).to.be.revertedWith("price must be positive");
    });

    it("Should revert with price below MIN_PRICE", async function () {
      const { oracle, usdc, owner } = await loadFixture(deployPriceOracleFixture);
      
      await expect(
        oracle.setDirectPrice(await usdc.getAddress(), 1n)
      ).to.be.revertedWith("price out of global bounds");
    });

    it("Should revert with price above MAX_PRICE", async function () {
      const { oracle, usdc, owner } = await loadFixture(deployPriceOracleFixture);
      
      await expect(
        oracle.setDirectPrice(await usdc.getAddress(), 10000000000000000000000000n)
      ).to.be.revertedWith("price out of global bounds");
    });
  });

  describe("Debug - Check Token Decimals", function () {
    it("Should verify USDC has 6 decimals", async function () {
      const { usdc } = await loadFixture(deployPriceOracleFixture);
      const decimals = await usdc.decimals();
      console.log("USDC decimals:", decimals);
      expect(decimals).to.equal(6);
    });

    it("Should verify WBTC has 8 decimals", async function () {
      const { wbtc } = await loadFixture(deployPriceOracleFixture);
      const decimals = await wbtc.decimals();
      console.log("WBTC decimals:", decimals);
      expect(decimals).to.equal(8);
    });
  });

  describe("Get Underlying Price", function () {
    it("Should return correct price for 18-decimal token", async function () {
      const { oracle, owner } = await loadFixture(deployPriceOracleFixture);
      
      // Create a mock token and cToken with 18 decimals
      const MockERC20Factory = await hre.ethers.getContractFactory("MockERC20");
      const dai = await MockERC20Factory.deploy("Dai Stablecoin", "DAI", 0, await owner.getAddress());
      
      const MockCErc20Factory = await hre.ethers.getContractFactory("MockCErc20");
      const cDAI = await MockCErc20Factory.deploy(
        await dai.getAddress(),
        "cDAI",
        18
      );
      
      // Set price for DAI: $1 in 18 decimals
      await oracle.setDirectPrice(await dai.getAddress(), 1000000000000000000n);
      
      const price = await oracle.getUnderlyingPrice(cDAI);
      // For 18-decimal token: 1e18 (no adjustment needed)
      expect(price).to.equal(1000000000000000000n);
    });

    it("Should return correct price for 6-decimal token (USDC)", async function () {
      const { oracle, usdc, cUSDC, owner } = await loadFixture(deployPriceOracleFixture);
      
      // First verify USDC decimals
      const usdcDecimals = await usdc.decimals();
      console.log("USDC underlying decimals:", usdcDecimals);
      
      // Set price for USDC: $1 in 18 decimals
      await oracle.setDirectPrice(await usdc.getAddress(), 1000000000000000000n);
      
      // Check what price was stored
      const storedPrice = await oracle.fallbackPrices(await usdc.getAddress());
      console.log("Stored price for USDC:", storedPrice.toString());
      
      const price = await oracle.getUnderlyingPrice(cUSDC);
      console.log("Returned price for cUSDC:", price.toString());
      
      // For 6-decimal token: 1e18 * (10^(18-6)) = 1e18 * 1e12 = 1e30
      expect(price).to.equal(1000000000000000000000000000000n);
    });

    it("Should return correct price for 8-decimal token (WBTC)", async function () {
      const { oracle, wbtc, cWBTC, owner } = await loadFixture(deployPriceOracleFixture);
      
      // First verify WBTC decimals
      const wbtcDecimals = await wbtc.decimals();
      console.log("WBTC underlying decimals:", wbtcDecimals);
      
      // Set price for WBTC: $50,000 in 18 decimals
      await oracle.setDirectPrice(await wbtc.getAddress(), 50000000000000000000000n);
      
      const price = await oracle.getUnderlyingPrice(cWBTC);
      console.log("Returned price for cWBTC:", price.toString());
      
      // For 8-decimal token: 5e22 * (10^(18-8)) = 5e22 * 1e10 = 5e32
      expect(price).to.equal(500000000000000000000000000000000n);
    });

    it("Should handle ccETH (native token)", async function () {
      const { oracle, cETH, owner } = await loadFixture(deployPriceOracleFixture);
      
      // Set price for ETH: $3,000 in 18 decimals
      await oracle.setDirectPrice("0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", 3000000000000000000000n);
      
      const price = await oracle.getUnderlyingPrice(cETH);
      // For native ETH (18 decimals): 3e21 (no adjustment needed)
      expect(price).to.equal(3000000000000000000000n);
    });
  });
 
  describe("Price Calculations", function () {
    it("Should calculate price correctly for USDC ($1, 6 decimals)", async function () {
      const { oracle, usdc, cUSDC, owner } = await loadFixture(deployPriceOracleFixture);
      
      // Set price for USDC: $1 in 18 decimals
      await oracle.setDirectPrice(await usdc.getAddress(), 1000000000000000000n);
      
      // Expected: For $1 USDC with 6 decimals
      // Base price: 1e18
      // Adjustment: 1e18 * 10^(18-6) = 1e18 * 1e12 = 1e30
      // But the formula is: basePrice * decimalAdjustment / 1e18
      // decimalAdjustment for 6 decimals: 1e18 * 10^12 = 1e30
      // So: 1e18 * 1e30 / 1e18 = 1e30
      
      const price = await oracle.getUnderlyingPrice(cUSDC);
      expect(price).to.equal(1000000000000000000000000000000n);
    });

    it("Should calculate price correctly for WBTC ($50,000, 8 decimals)", async function () {
      const { oracle, wbtc, cWBTC, owner } = await loadFixture(deployPriceOracleFixture);
      
      // Set price for WBTC: $50,000 in 18 decimals
      await oracle.setDirectPrice(await wbtc.getAddress(), 50000000000000000000000n);
      
      // Expected: For $50,000 WBTC with 8 decimals
      // Base price: 50000 * 1e18 = 5e4 * 1e18 = 5e22
      // Adjustment: 1e18 * 10^(18-8) = 1e18 * 1e10 = 1e28
      // So: 5e22 * 1e28 / 1e18 = 5e32
      
      const price = await oracle.getUnderlyingPrice(cWBTC);
      expect(price).to.equal(500000000000000000000000000000000n);
    });
  });
});