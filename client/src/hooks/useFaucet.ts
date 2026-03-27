import { useCallback, useState } from 'react';
import { useWriteContract, usePublicClient } from 'wagmi';

// Minimal ABI for minting mock tokens
const MOCK_ERC20_ABI = [
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
      // If no recipient provided, we can't mint - wallet address should be passed
      if (!recipientAddress) {
        throw new Error('Recipient address required');
      }

      if (!publicClient) {
        throw new Error('Public client not available');
      }

      // Submit transaction
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: MOCK_ERC20_ABI,
        functionName: 'mint',
        args: [recipientAddress, amount],
      });

      // Wait for transaction to be included in a block
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

// Convenience hooks for specific tokens
export function useWETHFaucet() {
  const { mintTokens, loading, error } = useFaucet();
  
  const mintWETH = useCallback(async (
    recipientAddress: `0x${string}`,
    amount: bigint = BigInt(10) * BigInt(10 ** 18) // Default 10 WETH
  ) => {
    return mintTokens(
      '0x4C143F18881a1D75c3458df023802f129a590Dc3' as `0x${string}`,
      amount,
      recipientAddress
    );
  }, [mintTokens]);

  return { mintWETH, loading, error };
}

export function useUSDTFaucet() {
  const { mintTokens, loading, error } = useFaucet();
  
  const mintUSDT = useCallback(async (
    recipientAddress: `0x${string}`,
    amount: bigint = BigInt(10000) * BigInt(10 ** 18) // Default 10,000 USDT
  ) => {
    return mintTokens(
      '0x1e94972F3EEc3848297e9c9ad84a4f8aB7AC55EE' as `0x${string}`,
      amount,
      recipientAddress
    );
  }, [mintTokens]);

  return { mintUSDT, loading, error };
}