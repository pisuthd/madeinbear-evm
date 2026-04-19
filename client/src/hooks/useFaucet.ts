import { useCallback, useState } from 'react';
import { useWriteContract, usePublicClient, useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { DEPLOYMENTS, getMockTokenMetadata } from '../constants/deployments';

// Minimal ABI for minting mock tokens
const MINT_ABI = [
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: []
  }
] as const;

interface FaucetHookState {
  loading: boolean;
  error: Error | null;
}

export function useFaucet() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [state, setState] = useState<FaucetHookState>({ loading: false, error: null });

  const mintTokens = useCallback(async (
    tokenAddress: `0x${string}`,
    amount: bigint,
    recipientAddress?: `0x${string}`
  ) => {
    setState({ loading: true, error: null });

    try {
      if (!recipientAddress) {
        throw new Error('Recipient address required');
      }

      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: MINT_ABI,
        functionName: 'mint',
        args: [recipientAddress, amount],
      });

      await publicClient.waitForTransactionReceipt({ hash });

      setState({ loading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to mint tokens');
      setState({ loading: false, error });
      throw error;
    }
  }, [writeContractAsync, publicClient]);

  return { mintTokens, loading: state.loading, error: state.error };
}

// Hook for a specific mock token
export function useMockTokenFaucet(tokenAddress: `0x${string}`, address?: `0x${string}`) {
  const { mintTokens, loading, error } = useFaucet();
  const tokenMeta = getMockTokenMetadata(tokenAddress);
  
  // Read current balance - use address if provided, otherwise balance will be 0
  const { data: balance, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const mint = useCallback(async (recipientAddress: `0x${string}`) => {
    if (!tokenMeta) throw new Error('Token not found');
    await mintTokens(tokenAddress, tokenMeta.mintAmount, recipientAddress);
    // Refetch balance after successful mint
    await refetch();
  }, [mintTokens, tokenAddress, tokenMeta, refetch]);

  return { 
    mint, 
    loading, 
    error,
    balance: balance ?? 0n,
    decimals: tokenMeta?.decimals ?? 6,
    symbol: tokenMeta?.symbol ?? '???',
    name: tokenMeta?.name ?? 'Unknown',
    icon: tokenMeta?.icon ?? '',
    mintAmount: tokenMeta?.mintAmount ?? 0n,
    refetch,
  };
}

// Hook for all mock tokens
export function useAllMockTokens(address?: `0x${string}`) {
  const deployment = DEPLOYMENTS[11155111];
  
  const tokenAddresses = [
    deployment.MockUSDT as `0x${string}`,
    deployment.MockETH as `0x${string}`,
  ];

  return tokenAddresses.map((tokenAddress) => {
    const tokenMeta = getMockTokenMetadata(tokenAddress);
    const { 
      mint, 
      loading, 
      error,
      balance,
      decimals,
      symbol,
      name,
      icon,
      refetch,
    } = useMockTokenFaucet(tokenAddress, address);
    
    return {
      address: tokenAddress,
      mint,
      mintLoading: loading,
      mintError: error,
      balance,
      decimals,
      symbol,
      name,
      icon,
      mintAmount: tokenMeta?.mintAmount ?? 0n,
      refetch,
    };
  });
}