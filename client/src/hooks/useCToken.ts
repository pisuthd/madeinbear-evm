import { useCallback, useState } from 'react';
import { useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { CTokenABI } from '../abis/CToken';
import { erc20Abi } from 'viem';
import { DEPLOYMENTS } from '../constants/deployments';

interface CTokenHookState {
  loading: boolean;
  error: Error | null;
}

export interface Claim {
  to: `0x${string}`;
  ctHash: `0x${string}`;
  requestedAmount: bigint;
  decryptedAmount: bigint;
  claimed: boolean;
  token?: string;
}

export function useCToken() {
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [state, setState] = useState<CTokenHookState>({ loading: false, error: null });

  /**
   * Wrap (shield) ERC-20 tokens to confidential tokens
   * Automatically handles ERC-20 approval before shielding
   */
  const wrap = useCallback(async (
    cTokenAddress: `0x${string}`,
    amount: bigint,
    userAddress: `0x${string}`
  ) => {
    setState({ loading: true, error: null });

    try {
      if (!userAddress) {
        throw new Error('User address required');
      }

      if (!publicClient) {
        throw new Error('Public client not available');
      }
 
      const erc20Address = cTokenAddress === "0x1B86F12280F4241312DE4bd80cE2e8A5B5D06A9F" ? "0xAbda7A80cDc18bB577DeA3c102F35a75DBD37591" : "0x423df22BeD1528b84427A31BB0dfeDE760392e76"

      // Check allowance
      const allowance = await publicClient.readContract({
        address: erc20Address,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [userAddress, cTokenAddress],
      }) as bigint;
 

      // Approve if necessary
      if (allowance < amount) {
        const approveHash = await writeContractAsync({
          address: erc20Address,
          abi: erc20Abi,
          functionName: 'approve',
          args: [cTokenAddress, amount],
        });

        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // Wait for approval to be processed
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Shield the tokens (contract expects ERC20 amount)
      const shieldHash = await writeContractAsync({
        address: cTokenAddress,
        abi: CTokenABI,
        functionName: 'shield',
        args: [userAddress, amount],
      });

      await publicClient.waitForTransactionReceipt({ hash: shieldHash });

      // Wait for approval to be processed
      await new Promise(resolve => setTimeout(resolve, 3000));

      setState({ loading: false, error: null });
      return shieldHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to wrap tokens');
      setState({ loading: false, error });
      throw error;
    }
  }, [writeContractAsync, publicClient]);

  /**
   * Unwrap (unshield) confidential tokens to ERC-20 tokens
   * Creates a pending claim that must be claimed after decryption
   * @param cTokenAddress - The CToken contract address
   * @param amount - The confidential amount to unshield
   * @param userAddress - The user's wallet address
   * @param erc20Amount - Optional: exact ERC20 amount to subtract from localStorage for precision
   */
  const unwrap = useCallback(async (
    cTokenAddress: `0x${string}`,
    amount: bigint,
    userAddress: `0x${string}`
  ) => {
    setState({ loading: true, error: null });

    try {
      if (!userAddress) {
        throw new Error('User address required');
      }

      if (!publicClient) {
        throw new Error('Public client not available');
      }
 
      const unshieldHash = await writeContractAsync({
        address: cTokenAddress,
        abi: CTokenABI,
        functionName: 'unshield',
        args: [userAddress, userAddress, amount],
      });

      await publicClient.waitForTransactionReceipt({ hash: unshieldHash });

      // Wait for approval to be processed
      await new Promise(resolve => setTimeout(resolve, 3000));

      setState({ loading: false, error: null });
      return unshieldHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to unwrap tokens');
      setState({ loading: false, error });
      throw error;
    }
  }, [writeContractAsync, publicClient]);

  /**
   * Claim unwrapped tokens after decryption
   */
  const claim = useCallback(async (
    cTokenAddress: `0x${string}`,
    ctHash: `0x${string}`,
    decryptedAmount: bigint,
    decryptionSignature: `0x${string}`
  ) => {
    setState({ loading: true, error: null });

    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const claimHash = await writeContractAsync({
        address: cTokenAddress,
        abi: CTokenABI,
        functionName: 'claimUnshielded',
        args: [ctHash, decryptedAmount, decryptionSignature],
        gas: 15_000_000n,
      });

      await publicClient.waitForTransactionReceipt({ hash: claimHash });

      setState({ loading: false, error: null });
      return claimHash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to claim tokens');
      setState({ loading: false, error });
      throw error;
    }
  }, [writeContractAsync, publicClient]);
 
  return {
    wrap,
    unwrap,
    claim, 
    loading: state.loading,
    error: state.error,
  };
}

/**
 * Hook to fetch pending claims for a user
 */
export function usePendingClaims(userAddress?: `0x${string}`) {
  const chainId = 11155111; // Sepolia
  const deployment = DEPLOYMENTS[chainId];

  const { data: cUSDTClaims, error: cUSDTError } = useReadContract({
    address: deployment?.cUSDT as `0x${string}`,
    abi: CTokenABI,
    functionName: 'getUserClaims',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!deployment?.cUSDT,
      refetchInterval: 5000,
    },
  }) as { data: Claim[] | undefined; error: Error | null };

  const { data: cETHClaims, error: cETHError } = useReadContract({
    address: deployment?.cETH as `0x${string}`,
    abi: CTokenABI,
    functionName: 'getUserClaims',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!deployment?.cETH,
      refetchInterval: 5000,
    },
  }) as { data: Claim[] | undefined; error: Error | null };

  if (cUSDTError) console.error('cUSDT claims error:', cUSDTError);
  if (cETHError) console.error('cETH claims error:', cETHError);

  const allClaims = [
    ...(cUSDTClaims?.map(c => ({ ...c, token: 'cUSDT' })) || []),
    ...(cETHClaims?.map(c => ({ ...c, token: 'cETH' })) || []),
  ];

  // Filter out claimed claims
  const pendingClaims = allClaims.filter(c => !c.claimed);

  return { pendingClaims, allClaims };
}

/**
 * Hook to check if user has approved a CToken to spend their ERC-20 tokens
 */
export function useAllowance(
  erc20Address: `0x${string}`,
  cTokenAddress: `0x${string}`,
  userAddress?: `0x${string}`
) {
  const { data: allowance } = useReadContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: userAddress ? [userAddress, cTokenAddress] : undefined,
    query: {
      enabled: !!userAddress,
      refetchInterval: 3000,
    },
  }) as { data: bigint | undefined };

  return { allowance };
}
