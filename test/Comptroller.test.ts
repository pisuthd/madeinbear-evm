import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Comptroller } from "../typechain-types";

describe("Comptroller", function () {
  let comptroller: Comptroller;
  let owner: SignerWithAddress;
  let user: SignerWithAddress;

  beforeEach(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy comptroller (minimal version, no oracle needed)
    const Comptroller = await ethers.getContractFactory("Comptroller");
    comptroller = await Comptroller.deploy();
    await comptroller.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(comptroller.target).to.not.equal(ethers.ZeroAddress);
    });

    it("Should have no markets initially", async function () {
      expect(await comptroller.getMarketCount()).to.equal(0);
    });

    it("Should return empty array for getAllMarkets", async function () {
      expect(await comptroller.getAllMarkets()).to.deep.equal([]);
    });

    it("Should return empty array for getMarketList", async function () {
      expect(await comptroller.getMarketList()).to.deep.equal([]);
    });
  });

  describe("Market Management", function () {
    it("Should allow owner to add a market", async function () {
      // Use a mock address for testing
      const mockMarket = owner.address;
      
      await expect(comptroller._supportMarket(mockMarket))
        .to.emit(comptroller, "MarketSupported")
        .withArgs(mockMarket);

      expect(await comptroller.isMarket(mockMarket)).to.be.true;
      expect(await comptroller.getMarketCount()).to.equal(1);
    });

    it("Should fail to add the same market twice", async function () {
      const mockMarket = owner.address;
      await comptroller._supportMarket(mockMarket);
      await expect(comptroller._supportMarket(mockMarket)).to.be.reverted;
    });

    it("Should fail to add market with zero address", async function () {
      await expect(comptroller._supportMarket(ethers.ZeroAddress)).to.be.reverted;
    });

    it("Should fail when non-owner tries to add market", async function () {
      await expect(comptroller.connect(user)._supportMarket(owner.address)).to.be.reverted;
    });

    it("Should get market by index", async function () {
      const mockMarket = owner.address;
      await comptroller._supportMarket(mockMarket);
      const market = await comptroller.getMarket(0);
      expect(market).to.equal(mockMarket);
    });

    it("Should fail to get market with invalid index", async function () {
      await expect(comptroller.getMarket(0)).to.be.revertedWith("Invalid market index");
    });
  });

  describe("View Functions", function () {
    it("Should return all markets correctly", async function () {
      const mockMarket = owner.address;
      await comptroller._supportMarket(mockMarket);
      
      const markets = await comptroller.getAllMarkets();
      expect(markets.length).to.equal(1);
      expect(markets[0]).to.equal(mockMarket);
    });

    it("Should get market list correctly", async function () {
      const mockMarket = owner.address;
      await comptroller._supportMarket(mockMarket);
      
      const marketList = await comptroller.getMarketList();
      expect(marketList.length).to.equal(1);
      expect(marketList[0]).to.equal(mockMarket);
    });

    it("Should handle multiple markets", async function () {
      const mockMarket1 = owner.address;
      const mockMarket2 = user.address;
      
      await comptroller._supportMarket(mockMarket1);
      await comptroller._supportMarket(mockMarket2);
      
      expect(await comptroller.getMarketCount()).to.equal(2);
      
      const markets = await comptroller.getAllMarkets();
      expect(markets.length).to.equal(2);
      expect(markets[0]).to.equal(mockMarket1);
      expect(markets[1]).to.equal(mockMarket2);
    });
  });
});
