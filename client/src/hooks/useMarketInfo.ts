import { useMemo } from 'react';
import { useReadContract } from 'wagmi';
import { encodeAbiParameters, keccak256 } from 'viem';
import { DEPLOYMENTS } from '../constants/deployments';

const SECONDS_PER_YEAR = 365n * 24n * 60n * 60n;
const WAD = 10n ** 18n;
const LTV = 750000000000000000n; // 75% in WAD

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
      { name: 'marketParams', type: 'tuple', components: [
        { type: 'address' },
        { type: 'address' },
        { type: 'address' },
        { type: 'address' },
        { type: 'uint256' },
      ]},
      { name: 'market', type: 'tuple', components: [
        { type: 'uint128' },
        { type: 'uint128' },
        { type: 'uint128' },
        { type: 'uint128' },
        { type: 'uint128' },
        { type: 'uint128' },
      ]},
    ],
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

export interface MarketInfo {
  marketData: {
    totalSupplyAssets: bigint;
    totalSupplyShares: bigint;
    totalBorrowAssets: bigint;
    totalBorrowShares: bigint;
    lastUpdate: bigint;
    fee: bigint;
  } | undefined;
  marketParams: {
    loanToken: `0x${string}`;
    collateralToken: `0x${string}`;
    oracle: `0x${string}`;
    irm: `0x${string}`;
    lltv: bigint;
  } | undefined;
  borrowRate: bigint | undefined;
  borrowAPY: number;
  supplyAPY: number;
  utilization: number;
  lltvPercent: number;
  loading: boolean;
}

/**
 * Calculate market ID from deployment addresses
 */
function calculateMarketId(
  loanToken: `0x${string}`,
  collateralToken: `0x${string}`,
  oracle: `0x${string}`,
  irm: `0x${string}`,
  lltv: bigint
): `0x${string}` {
  const encoded = encodeAbiParameters(
    [
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' },
      { name: 'oracle', type: 'address' },
      { name: 'irm', type: 'address' },
      { name: 'lltv', type: 'uint256' },
    ],
    [loanToken, collateralToken, oracle, irm, lltv]
  );
  return keccak256(encoded);
}

/**
 * Unified hook that fetches market data and calculates all derived values
 * (borrow rate, APY, utilization, etc.)
 */
export function useMarketInfo(): MarketInfo {
  const chainId = 11155111;
  const deployment = DEPLOYMENTS[chainId];
  const cMorphoAddress = deployment?.cMorpho as `0x${string}` | undefined;
  
  // Get market params from deployment
  const loanToken = deployment?.cUSDT as `0x${string}` | undefined;
  const collateralToken = deployment?.cETH as `0x${string}` | undefined;
  const oracle = deployment?.Oracle as `0x${string}` | undefined;
  const irm = deployment?.IRM as `0x${string}` | undefined;
  
  // Calculate market ID from deployment addresses
  const marketId = useMemo(() => {
    if (!loanToken || !collateralToken || !oracle || !irm) return undefined;
    return calculateMarketId(loanToken, collateralToken, oracle, irm, LTV);
  }, [loanToken, collateralToken, oracle, irm]);

   
  // Fetch market data
  const { data: rawMarketData, isLoading: marketLoading } = useReadContract({
    address: cMorphoAddress,
    abi: CMORPHO_ABI,
    functionName: 'market',
    args: marketId ? [marketId] : undefined,
    query: { enabled: !!marketId && !!cMorphoAddress },
  });

  console.log("rawMarketData:", rawMarketData)

  // Fetch market params
  const { data: rawMarketParams } = useReadContract({
    address: cMorphoAddress,
    abi: CMORPHO_ABI,
    functionName: 'idToMarketParams',
    args: marketId ? [marketId] : undefined,
    query: { enabled: !!marketId && !!cMorphoAddress },
  });

  console.log("rawMarketParams:", rawMarketParams)

  // Get IRM address from market params
  const irmAddress = rawMarketParams?.[3] as `0x${string}` | undefined;

  // Fetch borrow rate
  const { data: rawBorrowRate } = useReadContract({
    address: irmAddress,
    abi: IRM_ABI,
    functionName: 'borrowRateView',
    args: rawMarketParams && rawMarketData ? [
      [rawMarketParams[0], rawMarketParams[1], rawMarketParams[2], rawMarketParams[3], rawMarketParams[4]],
      [rawMarketData[0], rawMarketData[1], rawMarketData[2], rawMarketData[3], rawMarketData[4], rawMarketData[5]]
    ] : undefined,
    query: { enabled: !!irmAddress && !!rawMarketParams && !!rawMarketData },
  });

  console.log("rawBorrowRate:", rawBorrowRate); 

  // Parse market data
  const marketData = useMemo(() => {
    if (!rawMarketData) return undefined;
    return {
      totalSupplyAssets: rawMarketData[0],
      totalSupplyShares: rawMarketData[1],
      totalBorrowAssets: rawMarketData[2],
      totalBorrowShares: rawMarketData[3],
      lastUpdate: rawMarketData[4],
      fee: rawMarketData[5],
    };
  }, [rawMarketData]);

  // Parse market params
  const marketParams = useMemo(() => {
    if (!rawMarketParams) return undefined;
    return {
      loanToken: rawMarketParams[0] as `0x${string}`,
      collateralToken: rawMarketParams[1] as `0x${string}`,
      oracle: rawMarketParams[2] as `0x${string}`,
      irm: rawMarketParams[3] as `0x${string}`,
      lltv: rawMarketParams[4] as bigint,
    };
  }, [rawMarketParams]);

  // Calculate borrow rate
  const borrowRate = useMemo(() => {
    return rawBorrowRate as bigint | undefined;
  }, [rawBorrowRate]);

  // Calculate borrow APY
  // borrowRate is in WAD per second (e.g., 317097919 = 0.000000000317097919 WAD/sec)
  // APY = (borrowRate * 31536000) / 10^18 * 100 = percentage
  const borrowAPY = useMemo(() => {
    if (!borrowRate || borrowRate === 0n) return 0;
    try {
      const ratePerYear = Number(borrowRate) * Number(SECONDS_PER_YEAR) / Number(WAD);
      const apy = ratePerYear * 100;
      console.log("borrowAPY calculation:", { borrowRate, ratePerYear, apy });
      return apy;
    } catch {
      return 0;
    }
  }, [borrowRate]);

  // Calculate utilization
  const utilization = useMemo(() => {
    if (!marketData || !marketData.totalSupplyAssets || marketData.totalSupplyAssets === 0n) return 0;
    try {
      const util = (Number(marketData.totalBorrowAssets) / Number(marketData.totalSupplyAssets)) * 100;
      return Math.min(100, Math.max(0, util));
    } catch {
      return 0;
    }
  }, [marketData]);

  // Calculate supply APY
  const supplyAPY = useMemo(() => {
    // Supply APY = Borrow APY × Utilization × (1 - fee)
    if (!marketData) return 0;
    const feeMultiplier = 1 - (Number(marketData.fee) / 1e18);
    return borrowAPY * (utilization / 100) * feeMultiplier;
  }, [borrowAPY, utilization, marketData]);

  // Calculate LTV percentage
  const lltvPercent = useMemo(() => {
    if (!marketParams || !marketParams.lltv) return 75; // Default 75%
    try {
      return Number(marketParams.lltv) / 1e16;
    } catch {
      return 75;
    }
  }, [marketParams]);

  return {
    marketData,
    marketParams,
    borrowRate,
    borrowAPY,
    supplyAPY,
    utilization,
    lltvPercent,
    loading: marketLoading
  };
}