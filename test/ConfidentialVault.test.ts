import hre from 'hardhat';
import { CofheClient, Encryptable, FheTypes } from '@cofhe/sdk';
import { expect } from 'chai';

describe('ConfidentialVault', () => {
  let cofheClient: CofheClient;

  before(async () => {
    const [signer] = await hre.ethers.getSigners();
    cofheClient = await hre.cofhe.createClientWithBatteries(signer);
  });

  it('deposits and reads an encrypted balance', async () => {
    const Factory = await hre.ethers.getContractFactory('ConfidentialVault');
    const vault = await Factory.deploy();

    // Encrypt and deposit
    const [encrypted] = await cofheClient
      .encryptInputs([Encryptable.uint64(100n)])
      .execute();
    await (await vault.deposit(encrypted)).wait();

    // Decrypt and verify
    const ctHash = await vault.getBalance();
    const balance = await cofheClient
      .decryptForView(ctHash, FheTypes.Uint64)
      .execute();

    expect(balance).to.equal(100n);
  });

  it('publishes a decrypt result on-chain', async () => {
    const Factory = await hre.ethers.getContractFactory('ConfidentialVault');
    const vault = await Factory.deploy();

    // Encrypt and deposit
    const [encrypted] = await cofheClient
      .encryptInputs([Encryptable.uint64(42n)])
      .execute();
    await (await vault.deposit(encrypted)).wait();

    // Decrypt for on-chain verification
    const ctHash = await vault.getBalance();
    const { decryptedValue, signature } = await cofheClient
      .decryptForTx(ctHash)
      .withPermit()
      .execute();

    // Publish on-chain with Threshold Network proof
    await (await vault.publishBalance(ctHash, decryptedValue, signature)).wait();
  });
});