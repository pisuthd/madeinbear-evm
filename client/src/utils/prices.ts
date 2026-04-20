// Hardcoded price constants 
export const PRICES = {
  ETH: 3000, // 1 ETH = $3000 USD
  USDT: 1,   // 1 USDT = $1 USD
};
 
export const LTV = 0.75;
 
export function tokenToUSD(amount: bigint, token: 'ETH' | 'USDT'): number {
  const price = PRICES[token]; 
  const value = Number(amount) / 1e6;
  return value * price;
}

// Format USD value with $ symbol
export function formatUSD(amount: bigint, token: 'ETH' | 'USDT'): string {
  const usdValue = tokenToUSD(amount, token);
  return `$${usdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Calculate max borrow from collateral
export function calculateMaxBorrow(collateralAmount: bigint): bigint { 
  const maxBorrow = (collateralAmount * BigInt(3000 * 75)) / 100n;
  return maxBorrow;
}