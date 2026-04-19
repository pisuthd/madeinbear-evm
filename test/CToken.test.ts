import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { CToken, MockERC20 } from "../typechain-types";
import {
  expectERC20BalancesChange,
  expectFHERC20BalancesChange,
  prepExpectERC20BalancesChange,
  prepExpectFHERC20BalancesChange,
  ticksToIndicated,
  increaseTime,
} from "./utils";

describe("CToken - Confidential Token Wrapper", function () {
  const deployContracts = async () => {
    const [owner] = await ethers.getSigners();

    // Deploy underlying ERC20 token
    const tokenFactory = await ethers.getContractFactory("MockERC20");
    const underlying = (await tokenFactory.deploy("USD Coin", "USDC", 0, await owner.getAddress())) as MockERC20;
    await underlying.waitForDeployment();

    // Set correct decimals for USDC (6 decimals)
    await underlying.setDecimals(6);

    // Deploy CToken (confidential wrapper)
    const cTokenFactory = await ethers.getContractFactory("CToken");
    const cToken = (await cTokenFactory.deploy(underlying)) as CToken;
    await cToken.waitForDeployment();

    return { underlying, cToken };
  };

  async function setupFixture() {
    const [owner, bob, alice, eve] = await ethers.getSigners();
    const { underlying, cToken } = await deployContracts();

    const ownerClient = await hre.cofhe.createClientWithBatteries(owner);
    const bobClient = await hre.cofhe.createClientWithBatteries(bob);
    const aliceClient = await hre.cofhe.createClientWithBatteries(alice);
    const eveClient = await hre.cofhe.createClientWithBatteries(eve);

    return { ownerClient, bobClient, aliceClient, eveClient, owner, bob, alice, eve, underlying, cToken };
  }

  // USDC has 6 decimals → rate = 1, confidential decimals = 6
  const conversionRate = 1n;

  describe("initialization", function () {
    it("should be constructed correctly", async function () {
      const { underlying, cToken } = await setupFixture();

      expect(await cToken.name()).to.equal("FHERC20 Wrapped USD Coin");
      expect(await cToken.symbol()).to.equal("eUSDC");
      expect(await cToken.decimals()).to.equal(6);
      expect(await cToken.erc20()).to.equal(underlying.target);
      expect(await cToken.isFherc20()).to.equal(true);
    });

    it("should handle different token decimals correctly", async function () {
      const [owner] = await ethers.getSigners();

      // Deploy WBTC with 8 decimals (conversionRate = 100)
      const tokenFactory = await ethers.getContractFactory("MockERC20");
      const wbtc = (await tokenFactory.deploy("Wrapped BTC", "WBTC", 0, await owner.getAddress())) as MockERC20;
      await wbtc.waitForDeployment();
      await wbtc.setDecimals(8);

      const cTokenFactory = await ethers.getContractFactory("CToken");
      const cWBTC = (await cTokenFactory.deploy(wbtc)) as CToken;
      await cWBTC.waitForDeployment();

      expect(await cWBTC.name()).to.equal("FHERC20 Wrapped Wrapped BTC");
      expect(await cWBTC.decimals()).to.equal(6);
    });

    it("should revert if underlying token is not ERC20", async function () {
      const { cToken } = await setupFixture();

      const cTokenFactory = await ethers.getContractFactory("CToken");
      await expect(cTokenFactory.deploy(cToken)).to.be.revertedWithCustomError(cToken, "FHERC20InvalidErc20");
    });
  });

  describe("shield (ERC20 → FHERC20)", function () {
    it("should shield tokens successfully", async function () {
      const { cToken, bob, underlying } = await setupFixture();

      const mintValue = ethers.parseUnits("1000", 6);
      const shieldValue = ethers.parseUnits("100", 6);
      const confidentialValue = shieldValue / conversionRate;

      await underlying.mint(bob.address, mintValue);
      await underlying.connect(bob).approve(cToken.target, mintValue);

      await prepExpectERC20BalancesChange(underlying, bob.address);
      await prepExpectFHERC20BalancesChange(cToken, bob.address);

      await expect(cToken.connect(bob).shield(bob.address, shieldValue)).to.emit(cToken, "Transfer");

      await expectERC20BalancesChange(underlying, bob.address, -1n * shieldValue);
      await expectFHERC20BalancesChange(
        cToken,
        bob.address,
        await ticksToIndicated(cToken, 5001n),
        confidentialValue,
      );

      await hre.cofhe.mocks.expectPlaintext(await cToken.confidentialTotalSupply(), confidentialValue);
    });

    it("should shield to a different recipient", async function () {
      const { cToken, bob, alice, underlying } = await setupFixture();

      const shieldValue = ethers.parseUnits("100", 6);
      const confidentialValue = shieldValue / conversionRate;

      await underlying.mint(bob.address, shieldValue);
      await underlying.connect(bob).approve(cToken.target, shieldValue);

      await prepExpectFHERC20BalancesChange(cToken, alice.address);

      await cToken.connect(bob).shield(alice.address, shieldValue);

      await expectFHERC20BalancesChange(
        cToken,
        alice.address,
        await ticksToIndicated(cToken, 5001n),
        confidentialValue,
      );
    });

    it("should shield cumulatively", async function () {
      const { cToken, bob, underlying } = await setupFixture();

      const shieldValue = ethers.parseUnits("100", 6);
      const confidentialValue = shieldValue / conversionRate;

      await underlying.mint(bob.address, ethers.parseUnits("1000", 6));
      await underlying.connect(bob).approve(cToken.target, ethers.parseUnits("1000", 6));

      await cToken.connect(bob).shield(bob.address, shieldValue);

      await prepExpectERC20BalancesChange(underlying, bob.address);
      await prepExpectFHERC20BalancesChange(cToken, bob.address);

      await cToken.connect(bob).shield(bob.address, shieldValue);

      await expectERC20BalancesChange(underlying, bob.address, -1n * shieldValue);
      await expectFHERC20BalancesChange(
        cToken,
        bob.address,
        await ticksToIndicated(cToken, 1n),
        confidentialValue,
      );

      await hre.cofhe.mocks.expectPlaintext(await cToken.confidentialTotalSupply(), confidentialValue * 2n);
    });

    it("should truncate amount to nearest rate multiple for high decimals", async function () {
      const [owner] = await ethers.getSigners();

      const tokenFactory = await ethers.getContractFactory("MockERC20");
      const wbtc = (await tokenFactory.deploy("Wrapped BTC", "WBTC", 0, await owner.getAddress())) as MockERC20;
      await wbtc.waitForDeployment();
      await wbtc.setDecimals(8);

      const cTokenFactory = await ethers.getContractFactory("CToken");
      const cWBTC = (await cTokenFactory.deploy(wbtc)) as CToken;
      await cWBTC.waitForDeployment();

      const [bob] = await ethers.getSigners();

      const shieldValue = BigInt(1e8) + 50n;
      const alignedValue = BigInt(1e8);
      const confidentialValue = alignedValue / 100n;

      await wbtc.mint(bob.address, shieldValue);
      await wbtc.connect(bob).approve(cWBTC.target, shieldValue);

      await prepExpectERC20BalancesChange(wbtc, bob.address);
      await prepExpectFHERC20BalancesChange(cWBTC, bob.address);

      await cWBTC.connect(bob).shield(bob.address, shieldValue);

      await expectERC20BalancesChange(wbtc, bob.address, -1n * alignedValue);
      await expectFHERC20BalancesChange(
        cWBTC,
        bob.address,
        await ticksToIndicated(cWBTC, 5001n),
        confidentialValue,
      );
    });

    it("should fail if user doesn't have enough tokens", async function () {
      const { cToken, underlying, bob } = await setupFixture();

      const shieldAmount = ethers.parseUnits("1000", 6);

      await underlying.connect(bob).approve(cToken.target, shieldAmount);

      await expect(cToken.connect(bob).shield(bob.address, shieldAmount)).to.be.revertedWithCustomError(
        underlying,
        "ERC20InsufficientBalance",
      );
    });

    it("should fail if not approved", async function () {
      const { cToken, underlying, bob } = await setupFixture();

      const mintAmount = ethers.parseUnits("1000", 6);
      const shieldAmount = ethers.parseUnits("500", 6);

      await underlying.mint(bob.address, mintAmount);

      await expect(cToken.connect(bob).shield(bob.address, shieldAmount)).to.be.revertedWithCustomError(
        underlying,
        "ERC20InsufficientAllowance",
      );
    });
  });

  describe("unshield & claimUnshielded (FHERC20 → ERC20)", function () {
    async function setupShieldedFixture() {
      const fixture = await setupFixture();
      const { cToken, bob, underlying } = fixture;

      const mintValue = ethers.parseUnits("1000", 6);
      await underlying.mint(bob.address, mintValue);
      await underlying.connect(bob).approve(cToken.target, mintValue);
      await cToken.connect(bob).shield(bob.address, mintValue);

      return fixture;
    }

    it("should complete unshield and claim flow", async function () {
      const { cToken, bob, alice, underlying, bobClient } = await setupShieldedFixture();

      const unshieldConfidentialValue = ethers.parseUnits("100", 6);
      const unshieldERC20Value = unshieldConfidentialValue * conversionRate;

      await prepExpectFHERC20BalancesChange(cToken, bob.address);

      const tx = await cToken.connect(bob).unshield(alice.address, unshieldConfidentialValue);

      await expect(tx).to.emit(cToken, "Transfer");
      await expectFHERC20BalancesChange(
        cToken,
        bob.address,
        -1n * (await ticksToIndicated(cToken, 1n)),
        -1n * unshieldConfidentialValue,
      );

      // Get the claim ID from getUserClaims
      const aliceClaims = await cToken.getUserClaims(alice.address);
      expect(aliceClaims.length).to.equal(1);
      const unshieldRequestId = aliceClaims[0].ctHash;

      // Verify claim was created via getClaim
      const pendingClaim = await cToken.getClaim(unshieldRequestId);
      expect(pendingClaim.to).to.equal(alice.address);
      expect(pendingClaim.claimed).to.equal(false);
      expect(pendingClaim.decrypted).to.equal(false);

      // Time travel past decryption delay
      await increaseTime(11);

      const decryption = await bobClient.decryptForTx(unshieldRequestId).withoutPermit().execute();

      await prepExpectERC20BalancesChange(underlying, alice.address);

      await expect(
        cToken.connect(bob).claimUnshielded(unshieldRequestId, decryption.decryptedValue, decryption.signature),
      ).to.emit(cToken, "ClaimedUnshieldedERC20");

      await expectERC20BalancesChange(underlying, alice.address, unshieldERC20Value);

      // Claim is marked as claimed and removed from user's pending claims
      const claimedClaim = await cToken.getClaim(unshieldRequestId);
      expect(claimedClaim.claimed).to.equal(true);
      expect(claimedClaim.decrypted).to.equal(true);
      expect(claimedClaim.decryptedAmount).to.equal(unshieldConfidentialValue);

      const aliceClaimsAfter = await cToken.getUserClaims(alice.address);
      expect(aliceClaimsAfter.length).to.equal(0);
    });

    it("should support batch claim", async function () {
      const { cToken, bob, alice, underlying, bobClient } = await setupShieldedFixture();

      const unshieldAmount1 = ethers.parseUnits("50", 6);
      const unshieldAmount2 = ethers.parseUnits("30", 6);

      // Create first unshield
      await cToken.connect(bob).unshield(alice.address, unshieldAmount1);
      const pending1 = await cToken.getUserClaims(alice.address);
      const requestId1 = pending1[pending1.length - 1].ctHash;

      // Create second unshield
      await cToken.connect(bob).unshield(alice.address, unshieldAmount2);
      const pending2 = await cToken.getUserClaims(alice.address);
      const requestId2 = pending2[pending2.length - 1].ctHash;

      // Alice should have 2 pending claims
      const pendingClaims = await cToken.getUserClaims(alice.address);
      expect(pendingClaims.length).to.equal(2);

      await increaseTime(11);

      const dec1 = await bobClient.decryptForTx(requestId1).withoutPermit().execute();
      const dec2 = await bobClient.decryptForTx(requestId2).withoutPermit().execute();

      await prepExpectERC20BalancesChange(underlying, alice.address);

      await cToken
        .connect(bob)
        .claimUnshieldedBatch(
          [requestId1, requestId2],
          [dec1.decryptedValue, dec2.decryptedValue],
          [dec1.signature, dec2.signature],
        );

      const totalERC20Value = (unshieldAmount1 + unshieldAmount2) * conversionRate;
      await expectERC20BalancesChange(underlying, alice.address, totalERC20Value);

      // All claims cleared
      const claimsAfter = await cToken.getUserClaims(alice.address);
      expect(claimsAfter.length).to.equal(0);
    });
  });


  describe("claimUnshielded reverts", function () {
    it("should revert when claiming already claimed request", async function () {
      const { cToken, bob, alice, underlying, bobClient } = await setupFixture();

      const mintValue = ethers.parseUnits("1000", 6);
      await underlying.mint(bob.address, mintValue);
      await underlying.connect(bob).approve(cToken.target, mintValue);
      await cToken.connect(bob).shield(bob.address, mintValue);

      await cToken.connect(bob).unshield(alice.address, ethers.parseUnits("100", 6));
      const pending = await cToken.getUserClaims(alice.address);
      const requestId = pending[0].ctHash;

      await increaseTime(11);

      const decryption = await bobClient.decryptForTx(requestId).withoutPermit().execute();

      // First claim succeeds
      await cToken.connect(bob).claimUnshielded(requestId, decryption.decryptedValue, decryption.signature);

      // Second claim reverts
      await expect(
        cToken.connect(bob).claimUnshielded(requestId, decryption.decryptedValue, decryption.signature),
      ).to.be.revertedWithCustomError(cToken, "AlreadyClaimed");
    });

    it("should revert when batch array lengths mismatch", async function () {
      const { cToken } = await setupFixture();

      const dummyHash = ethers.ZeroHash;

      await expect(
        cToken.claimUnshieldedBatch([dummyHash, dummyHash], [1n], [new Uint8Array(0), new Uint8Array(0)]),
      ).to.be.revertedWithCustomError(cToken, "LengthMismatch");

      await expect(
        cToken.claimUnshieldedBatch([dummyHash, dummyHash], [1n, 2n], [new Uint8Array(0)]),
      ).to.be.revertedWithCustomError(cToken, "LengthMismatch");
    });
  });

  describe("Indicated Balances", function () {
    it("should reset indicated balance", async function () {
      const { cToken, underlying, bob } = await setupFixture();

      const shieldAmount = ethers.parseUnits("100", 6);
      await underlying.mint(bob.address, shieldAmount);
      await underlying.connect(bob).approve(cToken.target, shieldAmount);
      await cToken.connect(bob).shield(bob.address, shieldAmount);

      const balanceBefore = await cToken.balanceOf(bob.address);
      expect(balanceBefore).to.be.gt(0);

      await cToken.connect(bob).resetIndicatedBalance();
      const balanceAfter = await cToken.balanceOf(bob.address);
      expect(balanceAfter).to.equal(0);
    });

    it("should show that balanceOf is an indicator", async function () {
      const { cToken } = await setupFixture();

      expect(await cToken.balanceOfIsIndicator()).to.equal(true);
    });

    it("should return correct indicator tick size", async function () {
      const { cToken, underlying } = await setupFixture();

      const decimals = await underlying.decimals();
      const expectedTick = decimals <= 4 ? 1n : 10n ** BigInt(Number(decimals) - 4);
      expect(await cToken.indicatorTick()).to.equal(expectedTick);
    });
  });
});