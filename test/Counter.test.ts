import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { CofheClient, Encryptable, FheTypes } from '@cofhe/sdk';

describe('Counter', () => {
  let cofheClient: CofheClient;

  before(async () => {
    const [signer] = await hre.ethers.getSigners();
    cofheClient = await hre.cofhe.createClientWithBatteries(signer);
  });

  it('increments the counter', async () => {
    const Factory = await hre.ethers.getContractFactory('Counter');
    const counter = await Factory.deploy();

    // Get initial count (should be 0)
    const ctHash = await counter.count();
    const balance = await cofheClient
      .decryptForView(ctHash, FheTypes.Uint32)
      .execute();

    expect(balance).to.equal(0n);

    // Increment the counter
    await (await counter.increment()).wait();

    // Get updated count (should be 1)
    const ctHash2 = await counter.count();
    const balance2 = await cofheClient
      .decryptForView(ctHash2, FheTypes.Uint32)
      .execute();

    expect(balance2).to.equal(1n);
  });

  it('decrements the counter', async () => {
    const Factory = await hre.ethers.getContractFactory('Counter');
    const counter = await Factory.deploy();

    // Increment twice
    await (await counter.increment()).wait();
    await (await counter.increment()).wait();

    // Check count is 2
    const ctHash = await counter.count();
    const balance = await cofheClient
      .decryptForView(ctHash, FheTypes.Uint32)
      .execute();

    expect(balance).to.equal(2n);

    // Decrement
    await (await counter.decrement()).wait();

    // Check count is 1
    const ctHash2 = await counter.count();
    const balance2 = await cofheClient
      .decryptForView(ctHash2, FheTypes.Uint32)
      .execute();

    expect(balance2).to.equal(1n);
  });

  it('resets the counter with encrypted value', async () => {
    const Factory = await hre.ethers.getContractFactory('Counter');
    const counter = await Factory.deploy();

    // Encrypt and reset to 5
    const [encrypted] = await cofheClient
      .encryptInputs([Encryptable.uint32(5n)])
      .execute();
    await (await counter.reset(encrypted)).wait();

    // Verify count is 5
    const ctHash = await counter.count();
    const balance = await cofheClient
      .decryptForView(ctHash, FheTypes.Uint32)
      .execute();

    expect(balance).to.equal(5n);
  });

  it('publishes a decrypt result on-chain', async () => {
    const Factory = await hre.ethers.getContractFactory('Counter');
    const counter = await Factory.deploy();

    // Increment the counter
    await (await counter.increment()).wait();

    // Allow public decryption
    await (await counter.allow_counter_publicly()).wait();

    // Decrypt for on-chain verification
    const ctHash = await counter.count();
    const { decryptedValue, signature } = await cofheClient
      .decryptForTx(ctHash)
      .withPermit()
      .execute();

    // Publish on-chain with Threshold Network proof
    await (await counter.reveal_counter(Number(decryptedValue), signature)).wait();

    // Verify the published result
    const publishedValue = await counter.get_counter_value();
    expect(publishedValue).to.equal(1n);
  });
});