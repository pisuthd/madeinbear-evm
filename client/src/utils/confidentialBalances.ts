/**
 * LocalStorage utility for tracking confidential token balances
 * This avoids confusion from indicator balances by storing off-chain balances
 */

const STORAGE_KEY_PREFIX = 'confidential_balances_';

interface BalanceEntry {
  amount: string; // Stored as string to avoid precision issues
  lastUpdated: number;
}

interface BalanceStore {
  [cTokenAddress: string]: BalanceEntry;
}

/**
 * Get all stored balances for a user
 */
export function getAllBalances(address: string): BalanceStore {
  if (typeof window === 'undefined') return {};
  
  const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
  const stored = localStorage.getItem(key);
  
  if (!stored) return {};
  
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Get balance for a specific CToken
 */
export function getBalance(address: string, cTokenAddress: string): bigint {
  const balances = getAllBalances(address);
  const entry = balances[cTokenAddress.toLowerCase()];
  
  if (!entry) return 0n;
  
  return BigInt(entry.amount);
}

/**
 * Set balance for a specific CToken
 */
export function setBalance(address: string, cTokenAddress: string, amount: bigint): void {
  if (typeof window === 'undefined') return;
  
  const balances = getAllBalances(address);
  
  balances[cTokenAddress.toLowerCase()] = {
    amount: amount.toString(),
    lastUpdated: Date.now(),
  };
  
  const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify(balances));
}

/**
 * Add to existing balance
 */
export function addBalance(address: string, cTokenAddress: string, amount: bigint): void {
  const current = getBalance(address, cTokenAddress);
  setBalance(address, cTokenAddress, current + amount);
}

/**
 * Subtract from existing balance
 * Returns true if successful, false if insufficient balance
 */
export function subtractBalance(address: string, cTokenAddress: string, amount: bigint): boolean {
  const current = getBalance(address, cTokenAddress);
  
  if (current < amount) {
    return false;
  }
  
  setBalance(address, cTokenAddress, current - amount);
  return true;
}

/**
 * Clear all balances for a user
 */
export function clearBalances(address: string): void {
  if (typeof window === 'undefined') return;
  
  const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
  localStorage.removeItem(key);
}

/**
 * Clear balance for a specific CToken
 */
export function clearBalance(address: string, cTokenAddress: string): void {
  if (typeof window === 'undefined') return;
  
  const balances = getAllBalances(address);
  delete balances[cTokenAddress.toLowerCase()];
  
  const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
  localStorage.setItem(key, JSON.stringify(balances));
}

/**
 * Clear ALL balances for a user (useful for fixing old data format)
 */
export function clearAllBalances(address: string): void {
  if (typeof window === 'undefined') return;
  
  const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
  localStorage.removeItem(key);
}
