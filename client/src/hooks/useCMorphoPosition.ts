import { useCallback, useState, useEffect } from 'react';
import { usePublicClient, useAccount } from 'wagmi';
import { DEPLOYMENTS } from '../constants/deployments';
import { calculateMarketId, getUSDTMarketParams } from './useCMorphoActions';
import { useCoFHE } from '../context/CoFHEContext';
import { FheTypes } from '@cofhe/sdk';

// CMorpho position ABI - returns encrypted values
const CMORPHO_POSITION_ABI = [
  {
    name: 'position',
    type: 'function',
    inputs: [
      { name: 'id', type: 'bytes32' },
      { name: 'user', type: 'address' },
    ],
    outputs: [
      { name: 'supplyShares', type: 'uint256' },
      { name: 'borrowShares', type: 'uint256' },
      { name: 'collateral', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
] as const;

export interface UserPosition {
  supplyShares: bigint;
  borrowShares: bigint;
  collateral: bigint;
}

// Convert shares to assets (for USDT - 6 decimals)
export function sharesToAssets(shares: bigint, decimals: number = 6): bigint {
  return shares / BigInt(10 ** decimals);
}

// Convert assets to shares (for USDT - 6 decimals)
export function assetsToShares(assets: bigint, decimals: number = 6): bigint {
  return assets * BigInt(10 ** decimals);
}

/**
 * Hook to get user's supply position for USDT market
 * Properly decrypts the encrypted position from CMorpho
 */
export function useUserSupplyPosition() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { connected, client: cofheClient } = useCoFHE();
  const [supplyAssets, setSupplyAssets] = useState<bigint>(0n);
  const [supplyShares, setSupplyShares] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPosition = useCallback(async () => {
    if (!address || !publicClient || !cofheClient || !connected) {
      setSupplyAssets(0n);
      setSupplyShares(0n);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const marketParams = getUSDTMarketParams();
      if (!marketParams) {
        throw new Error('Market not configured');
      }

      // Get market ID
      const marketId = calculateMarketId(marketParams);

      // Get encrypted position from CMorpho
      const positionResult = await publicClient.readContract({
        address: DEPLOYMENTS[11155111]?.cMorpho as `0x${string}`,
        abi: CMORPHO_POSITION_ABI,
        functionName: 'position',
        args: [marketId, address],
      }) as readonly [bigint, bigint, bigint];

      console.log('Position encrypted result:', positionResult);

      // Decrypt the supplyShares (first element)
      const permit = await cofheClient.permits.getOrCreateSelfPermit();
      const decryptedSupplyShares = await cofheClient
        .decryptForView(positionResult[0], FheTypes.Uint128)
        .withPermit(permit)
        .execute();

      console.log('Decrypted supplyShares:', decryptedSupplyShares);

      setSupplyShares(decryptedSupplyShares);
      // Convert shares to assets (divide by 10^6 for USDT 6 decimals)
      setSupplyAssets(sharesToAssets(decryptedSupplyShares, 6));
    } catch (err) {
      console.error('Failed to fetch position:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch position'));
      setSupplyAssets(0n);
      setSupplyShares(0n);
    } finally {
      setLoading(false);
    }
  }, [address, publicClient, cofheClient, connected]);

  useEffect(() => {
    if (address && connected) {
      fetchPosition();
    }
  }, [address, connected, fetchPosition]);

  // Refresh key to trigger re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Add refreshKey to dependencies
  useEffect(() => {
    if (address && connected) {
      fetchPosition();
    }
  }, [address, connected, fetchPosition, refreshKey]);

  return { supplyShares, supplyAssets, loading, error, refetch };
}

/**
 * Hook to get user's collateral/borrow position for ETH market
 * Properly decrypts the encrypted position from CMorpho
 */
export function useUserCollateralPosition() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { connected, client: cofheClient } = useCoFHE();
  const [collateral, setCollateral] = useState<bigint>(0n);
  const [borrowAssets, setBorrowAssets] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPosition = useCallback(async () => {
    if (!address || !publicClient || !cofheClient || !connected) {
      setCollateral(0n);
      setBorrowAssets(0n);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const marketParams = getUSDTMarketParams();
      if (!marketParams) {
        throw new Error('Market not configured');
      }

      // Get market ID
      const marketId = calculateMarketId(marketParams);

      // Get encrypted position from CMorpho
      const positionResult = await publicClient.readContract({
        address: DEPLOYMENTS[11155111]?.cMorpho as `0x${string}`,
        abi: CMORPHO_POSITION_ABI,
        functionName: 'position',
        args: [marketId, address],
      }) as readonly [bigint, bigint, bigint];

      console.log('Position encrypted result:', positionResult);

      // Decrypt collateral (third element) - stored as uint128 but displayed as 6 decimals
      const permit = await cofheClient.permits.getOrCreateSelfPermit();
     
      const decryptedCollateral = await cofheClient
        .decryptForView(positionResult[2], FheTypes.Uint128)
        .withPermit(permit)
        .execute()

      console.log('Decrypted collateral:', decryptedCollateral);

      const decryptedBorrowShares = await cofheClient
        .decryptForView(positionResult[1], FheTypes.Uint128)
        .withPermit(permit)
        .execute()

      console.log('Decrypted borrowShares:', decryptedBorrowShares);

      setCollateral(decryptedCollateral);
      setBorrowAssets(sharesToAssets(decryptedBorrowShares, 6));
    } catch (err) {
      console.error('Failed to fetch position:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch position'));
      setCollateral(0n);
      setBorrowAssets(0n);
    } finally {
      setLoading(false);
    }
  }, [address, publicClient, cofheClient, connected]);

  useEffect(() => {
    if (address && connected) {
      fetchPosition();
    }
  }, [address, connected, fetchPosition]);

  return { collateral, borrowAssets, loading, error, refetch: fetchPosition };
}