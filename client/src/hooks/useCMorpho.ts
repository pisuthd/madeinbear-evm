import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { DEPLOYMENTS } from '../constants/deployments';

const SECONDS_PER_YEAR = 365n * 24n * 60n * 60n;
const WAD = 10n ** 18n;

const CMORPHO_ABI = [
  {
    name: 'market',
    type: 'function',
    inputs: [{ name: 'id', type: 'bytes32' }],
    outputs: [
      { name: 'totalSupplyAssets', type: 'uint128' },
      { name: 'totalSupplyShares', type: 'uint128' },
      { name: 'totalBorrowAssets', type: 'uint128' },
      { name: 'totalBorrowShares', type: 'uint128' },
      { name: 'lastUpdate', type: 'uint128' },
      { name: 'fee', type: 'uint128' },
    ],
    stateMutability: 'view',
  },
  {
    name: 'idToMarketParams',
    type: 'function',
    inputs: [{ name: 'id', type: 'bytes32' }],
    outputs: [
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' },
      { name: 'oracle', type: 'address' },
      { name: 'irm', type: 'address' },
      { name: 'lltv', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;

const IRM_ABI = [
  {
    name: 'borrowRateView',
    type: 'function',
    inputs: [
      { name: 'marketParams', type: 'tuple(address,address,address,address,uint256)' },
      { name: 'market', type: 'tuple(uint128,uint128,uint128,uint128,uint128,uint128)' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export interface MarketData {
  totalSupplyAssets: bigint;
  totalSupplyShares: bigint;
  totalBorrowAssets: bigint;
  totalBorrowShares: bigint;
  lastUpdate: bigint;
  fee: bigint;
}

export interface MarketInfo {
  id: string;
  loanToken: `0x${string}`;
  collateralToken: `0x${string}`;
  oracle: `0x${string}`;
  irm: `0x${string}`;
  lltv: bigint;
}

export interface MarketWithData {
  marketInfo: MarketInfo;
  marketData: MarketData;
  supplyAPY: number;
  borrowAPY: number;
  utilization: number;
}

// Hook to get market data from CMorpho
export function useCMorphoMarket(marketId: `0x${string}` | undefined) {
  const chainId = 11155111;
  const cMorphoAddress = DEPLOYMENTS[chainId]?.cMorpho as `0x${string}` | undefined;

  return useReadContract({
    address: cMorphoAddress,
    abi: CMORPHO_ABI,
    functionName: 'market',
    args: marketId ? [marketId] : undefined,
    query: { enabled: !!marketId && !!cMorphoAddress },
  });
}

// Hook to get market params
export function useMarketParams(marketId: `0x${string}` | undefined) {
  const chainId = 11155111;
  const cMorphoAddress = DEPLOYMENTS[chainId]?.cMorpho as `0x${string}` | undefined;

  return useReadContract({
    address: cMorphoAddress,
    abi: CMORPHO_ABI,
    functionName: 'idToMarketParams',
    args: marketId ? [marketId] : undefined,
    query: { enabled: !!marketId && !!cMorphoAddress },
  });
}

// Hook to get borrow rate from IRM
export function useBorrowRate(irmAddress: `0x${string}` | undefined, marketParams: MarketInfo | undefined, marketData: MarketData | undefined) {
  return useReadContract({
    address: irmAddress,
    abi: IRM_ABI,
    functionName: 'borrowRateView',
    args: marketParams && marketData ? [
      [marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv],
      [marketData.totalSupplyAssets, marketData.totalSupplyShares, marketData.totalBorrowAssets, marketData.totalBorrowShares, marketData.lastUpdate, marketData.fee]
    ] : undefined,
    query: { enabled: !!irmAddress && !!marketParams && !!marketData },
  });
}

// Calculate APY from borrow rate per second
export function calculateAPY(borrowRatePerSecond: bigint | undefined): number {
  if (!borrowRatePerSecond || borrowRatePerSecond === 0n) return 0;
  try {
    // APY = (1 + rate)^seconds_per_year - 1
    const ratePerYear = Number(borrowRatePerSecond) * Number(SECONDS_PER_YEAR) / Number(WAD);
    const apy = ratePerYear * 100; // Convert to percentage
    return Math.max(0, apy);
  } catch {
    return 0;
  }
}

// Calculate supply APY
export function calculateSupplyAPY(borrowAPY: number, utilization: number, fee: bigint = 0n): number {
  // Supply APY = Borrow APY × Utilization × (1 - fee)
  const feeMultiplier = 1 - (Number(fee) / 1e18);
  return borrowAPY * utilization * feeMultiplier;
}

// Calculate utilization
export function calculateUtilization(marketData: MarketData): number {
  if (!marketData.totalSupplyAssets || marketData.totalSupplyAssets === 0n) return 0;
  const utilization = (Number(marketData.totalBorrowAssets) / Number(marketData.totalSupplyAssets)) * 100;
  return Math.min(100, Math.max(0, utilization));
}

// Hook to get token decimals
export function useTokenDecimals(tokenAddress: `0x${string}` | undefined) {
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'decimals',
    query: { enabled: !!tokenAddress },
  });
}