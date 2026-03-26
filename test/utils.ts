import { expect } from "chai";
import { ERC20, FHERC20 } from "../typechain-types";
import hre, { ethers } from "hardhat";

// ============================================================================
// TICKS AND INDICATED VALUES
// ============================================================================

/**
 * Convert ticks to indicated balance amount
 * Formula: ticks * indicatorTick
 */
export const ticksToIndicated = async (token: FHERC20, ticks: bigint): Promise<bigint> => {
  const tick = await token.indicatorTick();
  return ticks * BigInt(tick);
};

// ============================================================================
// BALANCE TRACKING STORAGE
// ============================================================================

const erc20Balances = new Map<string, bigint>();
const indicatedBalances = new Map<string, bigint>();
const encBalances = new Map<string, bigint>();

// ============================================================================
// ERC20 BALANCE HELPERS
// ============================================================================

/**
 * Prepare to track ERC20 balance changes
 * Stores the current balance for later comparison
 */
export const prepExpectERC20BalancesChange = async (token: ERC20, account: string) => {
  erc20Balances.set(account, await token.balanceOf(account));
};

/**
 * Expect ERC20 balance to change by a specific amount
 * Compares current balance with previously stored balance
 */
export const expectERC20BalancesChange = async (
  token: ERC20,
  account: string,
  expectedChange: bigint,
) => {
  const symbol = await token.symbol();
  const currBal = await token.balanceOf(account);
  const prevBal = erc20Balances.get(account)!;
  const delta = currBal - prevBal;
  expect(delta).to.equal(
    expectedChange,
    `${symbol} (ERC20) balance change for ${account} is incorrect. Expected: ${expectedChange}, received: ${delta}`,
  );
};

// ============================================================================
// FHERC20 BALANCE HELPERS
// ============================================================================

/**
 * Prepare to track FHERC20 balance changes (both indicated and encrypted)
 * Stores current indicated balance and decrypted encrypted balance
 */
export const prepExpectFHERC20BalancesChange = async (token: FHERC20, account: string) => {
  indicatedBalances.set(account, await token.balanceOf(account));
  const encBalanceHash = await token.confidentialBalanceOf(account);
  const encBalance = await hre.cofhe.mocks.getPlaintext(encBalanceHash);
  encBalances.set(account, encBalance);
};

/**
 * Expect FHERC20 balances to change by specific amounts
 * Checks both indicated (public) and encrypted (confidential) balance changes
 */
export const expectFHERC20BalancesChange = async (
  token: FHERC20,
  account: string,
  expectedIndicatedChange: bigint,
  expectedEncChange: bigint,
) => {
  const symbol = await token.symbol();

  // Check indicated balance change
  const currIndicated = await token.balanceOf(account);
  const prevIndicated = indicatedBalances.get(account)!;
  const indicatedChange = currIndicated - prevIndicated;
  expect(indicatedChange).to.equal(
    expectedIndicatedChange,
    `${symbol} (FHERC20) indicated balance change for ${account} is incorrect. Expected: ${expectedIndicatedChange}, received: ${indicatedChange}`,
  );

  // Check encrypted balance change
  const currEncBalanceHash = await token.confidentialBalanceOf(account);
  const currEncBalance = await hre.cofhe.mocks.getPlaintext(currEncBalanceHash);
  const prevEncBalance = encBalances.get(account)!;
  const encChange = currEncBalance - prevEncBalance;
  expect(encChange).to.equal(
    expectedEncChange,
    `${symbol} (FHERC20) encrypted balance change for ${account} is incorrect. Expected: ${expectedEncChange}, received: ${encChange}`,
  );
};

// ============================================================================
// TIME HELPERS
// ============================================================================

/**
 * Fast-forward time by specified seconds
 * Useful for testing time-delayed operations like unshield claims
 */
export const increaseTime = async (seconds: number) => {
  await hre.network.provider.send("evm_increaseTime", [seconds]);
  await hre.network.provider.send("evm_mine");
};

// ============================================================================
// LOGGING HELPERS
// ============================================================================

/**
 * Log the current state (useful for debugging)
 */
export const logState = (state: string) => {
  console.log("Encrypt State - ", state);
};

export const nullLogState = () => null;