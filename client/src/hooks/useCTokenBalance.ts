import { useEffect, useState, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { FheTypes } from '@cofhe/sdk';
import { isCofheError } from '@cofhe/sdk';
import { useCoFHE } from '../context/CoFHEContext'; 
import { DEPLOYMENTS } from '../constants/deployments';

// ABI for confidentialBalanceOf function (euint64 returns bytes32)
const confidentialBalanceOfAbi = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "confidentialBalanceOf",
    outputs: [{ internalType: "euint64", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function" as const,
  },
] as const;

export function useCTokenBalance(cTokenAddress: `0x${string}`) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { client: cofheClient, connected } = useCoFHE();
  const [balance, setBalance] = useState<bigint>(0n);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBalance = useCallback(async () => {
    if (!address || !publicClient || !cofheClient || !connected) {
      setBalance(0n);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get encrypted balance hash from contract
      const ctHash = await publicClient.readContract({
        address: cTokenAddress,
        abi: confidentialBalanceOfAbi,
        functionName: 'confidentialBalanceOf',
        args: [address] as [`0x${string}`],
      }) as `0x${string}`;

      // Skip if it's a zero hash (no balance)
      if (ctHash === '0x' + '0'.repeat(64)) {
        setBalance(0n);
        return;
      }

      // Create permit and decrypt
      const permit = await cofheClient.permits.getOrCreateSelfPermit();
      const decrypted = await cofheClient
        .decryptForView(ctHash, FheTypes.Uint64)
        .withPermit(permit)
        .execute();

      setBalance(decrypted);
    } catch (err) {
      if (isCofheError(err)) {
        console.error(err.code, err.message);
      }
      setError(err instanceof Error ? err : new Error('Failed to fetch balance'));
      setBalance(0n);
    } finally {
      setLoading(false);
    }
  }, [address, publicClient, cofheClient, connected, cTokenAddress]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return { balance, loading, error, refresh };
}

// Hook for multiple token balances
export function useCTokenBalances() {
  const cUSDTBalance = useCTokenBalance(DEPLOYMENTS[11155111]?.cUSDT as `0x${string}`);
  const cETHBalance = useCTokenBalance(DEPLOYMENTS[11155111]?.cETH as `0x${string}`);

  return {
    cUSDT: cUSDTBalance.balance,
    cETH: cETHBalance.balance,
    loading: cUSDTBalance.loading || cETHBalance.loading,
    error: cUSDTBalance.error || cETHBalance.error,
    refresh: () => {
      cUSDTBalance.refresh();
      cETHBalance.refresh();
    },
  };
}
