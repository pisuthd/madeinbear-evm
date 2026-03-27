import { expect } from "chai";
import hre, { userConfig } from "hardhat";
import { CofheClient, Encryptable, FheTypes } from '@cofhe/sdk';

describe("CCToken - Confidential Compound Token", function () {
  let ownerClient: CofheClient;
  let user1Client: CofheClient;
  let user2Client: CofheClient;

  before(async () => {
    const [signer, user1, user2] = await hre.ethers.getSigners();
    ownerClient = await hre.cofhe.createClientWithBatteries(signer);
    user1Client = await hre.cofhe.createClientWithBatteries(user1);
    user2Client = await hre.cofhe.createClientWithBatteries(user2);
  });

  async function deployCCTokenFixture() {
    const [owner, user1, user2] = await hre.ethers.getSigners();

    // Deploy mock PriceOracle
    const PriceOracleFactory = await hre.ethers.getContractFactory("PriceOracle");
    const oracle = await PriceOracleFactory.deploy();

    // Deploy mock Comptroller
    const ComptrollerFactory = await hre.ethers.getContractFactory("Comptroller");
    const comptroller = await ComptrollerFactory.deploy();

    // Deploy mock ERC20 token (this will serve as "cToken" for testing)
    const MockERC20Factory = await hre.ethers.getContractFactory("MockERC20");
    const underlying = await MockERC20Factory.deploy("Confidential Token", "cTOKEN", 18, await owner.getAddress());

    // Deploy ConfidentialCCToken
    const CCTokenFactory = await hre.ethers.getContractFactory("ConfidentialCCToken");
    const ccToken = await CCTokenFactory.deploy(
      await underlying.getAddress(),
      await comptroller.getAddress(),
      await oracle.getAddress()
    );

    return {
      underlying,
      comptroller,
      oracle,
      ccToken,
      owner,
      user1,
      user2,
    };
  }

  describe("Deployment", function () {
    it("Should deploy CCToken with correct parameters", async function () {
      const { ccToken, underlying, comptroller, oracle } = await deployCCTokenFixture();

      expect(await ccToken.underlying()).to.equal(await underlying.getAddress());
      expect(await ccToken.SUPPLY_RATE_VALUE()).to.equal(300n); // 3%
      expect(await ccToken.BORROW_RATE_VALUE()).to.equal(500n); // 5%
      expect(await ccToken.COLLATERAL_FACTOR_VALUE()).to.equal(8000n); // 0.8 with SCALE 10000
    });
  });

  describe("Supply Operations", function () {
    it("Should allow user to supply cToken (1:1)", async function () {
      const { ccToken, user1 } = await deployCCTokenFixture();

      // Supply 1000 cToken (encrypted)
      const supplyAmount = 1000n;
      const [encrypted] = await user1Client
        .encryptInputs([Encryptable.uint64(supplyAmount)])
        .execute();

      await (await ccToken.connect(user1).supply(encrypted)).wait();
      
      // Verify supply was successful by checking balance
      const ctHash = await ccToken.connect(user1).getCCTokenBalance();
      const balance = await user1Client
        .decryptForView(ctHash, FheTypes.Uint64)
        .execute();

      expect(balance).to.equal(supplyAmount); // 1:1 exchange
    });

    it("Should update user's ccToken balance after supply", async function () {
      const { ccToken, user1 } = await deployCCTokenFixture();

      const supplyAmount = 1000n;
      const [encrypted] = await user1Client
        .encryptInputs([Encryptable.uint64(supplyAmount)])
        .execute();

      await (await ccToken.connect(user1).supply(encrypted)).wait();

      // Get user's ccToken balance and decrypt
      const ctHash = await ccToken.connect(user1).getCCTokenBalance();
      const balance = await user1Client
        .decryptForView(ctHash, FheTypes.Uint64)
        .execute();
      
      expect(balance).to.equal(supplyAmount); // 1:1 exchange
    });

    it("Should allow multiple supplies", async function () {
      const { ccToken, user1 } = await deployCCTokenFixture();

      // First supply
      const amount1 = 1000n;
      const [encrypted1] = await user1Client
        .encryptInputs([Encryptable.uint64(amount1)])
        .execute();
      await (await ccToken.connect(user1).supply(encrypted1)).wait();

      // Second supply
      const amount2 = 500n;
      const [encrypted2] = await user1Client
        .encryptInputs([Encryptable.uint64(amount2)])
        .execute();
      await (await ccToken.connect(user1).supply(encrypted2)).wait();

      // Check balance
      const ctHash = await ccToken.connect(user1).getCCTokenBalance();
      const balance = await user1Client
        .decryptForView(ctHash, FheTypes.Uint64)
        .execute();
      
      expect(balance).to.equal(amount1 + amount2); // 1:1 exchange
    });
  });

  describe("Borrow Operations", function () {
    it("Should allow user to borrow against collateral", async function () {
      const { ccToken, user1 } = await deployCCTokenFixture();

      // Supply 1000 cToken
      const supplyAmount = 1000n;
      const [encryptedSupply] = await user1Client
        .encryptInputs([Encryptable.uint64(supplyAmount)])
        .execute();
      await (await ccToken.connect(user1).supply(encryptedSupply)).wait();

      // Borrow 500 cToken (within 80% collateral factor: 1000 * 0.8 = 800 max)
      const borrowAmount = 500n;
      const [encryptedBorrow] = await user1Client
        .encryptInputs([Encryptable.uint64(borrowAmount)])
        .execute();
      await (await ccToken.connect(user1).borrow(encryptedBorrow)).wait();
      
      // Verify borrowed amount
      const ctHash = await ccToken.connect(user1).getBorrowed();
      const borrowed = await user1Client
        .decryptForView(ctHash, FheTypes.Uint64)
        .execute();
      
      expect(borrowed).to.equal(borrowAmount);
    });

    it("Should track borrowed amount correctly", async function () {
      const { ccToken, user1 } = await deployCCTokenFixture();

      // Supply 1000 cToken
      const supplyAmount = 1000n;
      const [encryptedSupply] = await user1Client
        .encryptInputs([Encryptable.uint64(supplyAmount)])
        .execute();
      await (await ccToken.connect(user1).supply(encryptedSupply)).wait();

      // Borrow 500 cToken
      const borrowAmount = 500n;
      const [encryptedBorrow] = await user1Client
        .encryptInputs([Encryptable.uint64(borrowAmount)])
        .execute();
      await (await ccToken.connect(user1).borrow(encryptedBorrow)).wait();

      // Check borrowed balance
      const ctHash = await ccToken.connect(user1).getBorrowed();
      const borrowed = await user1Client
        .decryptForView(ctHash, FheTypes.Uint64)
        .execute();
      
      expect(borrowed).to.equal(borrowAmount);
    });
  });

  describe("Repay Operations", function () {
    it("Should allow user to repay borrowed amount", async function () {
      const { ccToken, user1 } = await deployCCTokenFixture();

      // Supply and borrow
      const [encryptedSupply] = await user1Client
        .encryptInputs([Encryptable.uint64(1000n)])
        .execute();
      await (await ccToken.connect(user1).supply(encryptedSupply)).wait();

      const [encryptedBorrow] = await user1Client
        .encryptInputs([Encryptable.uint64(500n)])
        .execute();
      await (await ccToken.connect(user1).borrow(encryptedBorrow)).wait();

      // Repay 200 cToken
      const repayAmount = 200n;
      const [encryptedRepay] = await user1Client
        .encryptInputs([Encryptable.uint64(repayAmount)])
        .execute();
      await (await ccToken.connect(user1).repay(encryptedRepay)).wait();

      // Check remaining borrowed amount
      const ctHash = await ccToken.connect(user1).getBorrowed();
      const borrowed = await user1Client
        .decryptForView(ctHash, FheTypes.Uint64)
        .execute();
      
      expect(borrowed).to.equal(500n - repayAmount);
    });
  });

  describe("Withdraw Operations", function () {
    it("Should allow user to withdraw supplied amount", async function () {
      const { ccToken, user1 } = await deployCCTokenFixture();

      // Supply 1000 cToken
      const [encryptedSupply] = await user1Client
        .encryptInputs([Encryptable.uint64(1000n)])
        .execute();
      await (await ccToken.connect(user1).supply(encryptedSupply)).wait();

      // Withdraw 200 ccToken (1:1)
      const withdrawAmount = 200n;
      const [encryptedWithdraw] = await user1Client
        .encryptInputs([Encryptable.uint64(withdrawAmount)])
        .execute();
      
      const result = await ccToken.connect(user1).withdraw(encryptedWithdraw);
      await result.wait();

      // Check remaining balance (1000 - 200 = 800)
      const ctHash = await ccToken.connect(user1).getCCTokenBalance();
      const balance = await user1Client
        .decryptForView(ctHash, FheTypes.Uint64)
        .execute();
      
      expect(balance).to.equal(800n); // 1:1 exchange
    });
  });

  describe("Multiple Users", function () {
    it("Should track balances for multiple users independently", async function () {
      const { ccToken, user1, user2 } = await deployCCTokenFixture();

      // User1 supplies
      const [encrypted1] = await user1Client
        .encryptInputs([Encryptable.uint64(1000n)])
        .execute();
      await (await ccToken.connect(user1).supply(encrypted1)).wait();

      // User2 supplies
      const [encrypted2] = await user2Client
        .encryptInputs([Encryptable.uint64(500n)])
        .execute();
      await (await ccToken.connect(user2).supply(encrypted2)).wait();

      // Check balances
      const ctHash1 = await ccToken.connect(user1).getCCTokenBalance();
      const balance1 = await user1Client
        .decryptForView(ctHash1, FheTypes.Uint64)
        .execute();

      const ctHash2 = await ccToken.connect(user2).getCCTokenBalance();
      const balance2 = await user2Client
        .decryptForView(ctHash2, FheTypes.Uint64)
        .execute();

      expect(balance1).to.equal(1000n); // 1:1 exchange
      expect(balance2).to.equal(500n); // 1:1 exchange
    });
  });
});