import { useCallback, useState } from 'react';
import { useWriteContract, useReadContract, usePublicClient } from 'wagmi';
import { CTokenABI } from '../abis/CToken';
import { erc20Abi } from 'viem';
import { DEPLOYMENTS, MARKET_METADATA } from '../constants/deployments';
import { addBalance, subtractBalance } from '../utils/confidentialBalances';

/**
 * Calculate the conversion rate for a CToken
 * Confidential tokens have max 6 decimals, so if underlying has more, we need a rate
 */
function calculateConversionRate(cTokenAddress: `0x${string}`): bigint {
  const market = MARKET_METADATA[cTokenAddress as keyof typeof MARKET_METADATA];
  if (!market) return 1n;

  const underlyingDecimals = market.decimals;
  const maxConfidentialDecimals = 6;

  if (underlyingDecimals > maxConfidentialDecimals) {
    return BigInt(10 ** (underlyingDecimals - maxConfidentialDecimals));
  }

  return 1n;
}
 

interface CTokenHookState {
  loading: boolean;
  error: Error | null;
}

export interface Claim {
  ctHash: `0x${string}`;
  requestedAmount: bigint;
  decryptedAmount: bigint;
  decrypted: boolean;
  to: `0x${string}`;
  claimed: boolean;
  token?: string; // Added to identify which token this claim belongs to
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

      // Get the underlying ERC-20 token address
      const erc20Address = await publicClient.readContract({
        address: cTokenAddress,
        abi: CTokenABI,
        functionName: 'erc20',
      }) as `0x${string}`;

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

        // add 3s delay
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Shield the tokens (contract expects ERC20 amount)
      const shieldHash = await writeContractAsync({
        address: cTokenAddress,
        abi: CTokenABI,
        functionName: 'shield',
        args: [userAddress, amount],
      });

      await publicClient.waitForTransactionReceipt({ hash: shieldHash });

      // Update local balance tracking with CONFIDENTIAL amount (not ERC20 amount)
      // For WETH/USDT (18 decimals), confidential = ERC20 / 10^12
      const confidentialAmount = amount / BigInt(10 ** 12);
      addBalance(userAddress, cTokenAddress, confidentialAmount);

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
    userAddress: `0x${string}`,
    erc20Amount?: bigint
  ) => {
    setState({ loading: true, error: null });

    try {
      if (!userAddress) {
        throw new Error('User address required');
      }

      if (!publicClient) {
        throw new Error('Public client not available');
      }

      console.log("unwrap...", userAddress, amount, erc20Amount)

      // Unshield the tokens
      const unshieldHash = await writeContractAsync({
        address: cTokenAddress,
        abi: CTokenABI,
        functionName: 'unshield',
        args: [userAddress, amount],
      });

      await publicClient.waitForTransactionReceipt({ hash: unshieldHash });

      // Update local balance tracking
      // If erc20Amount is provided, convert it to confidential amount for precise subtraction
      // For WETH/USDT (18 decimals), confidential = ERC20 / 10^12
      // Otherwise, subtract the confidential amount directly
      const amountToSubtract = erc20Amount
        ? erc20Amount / BigInt(10 ** 12)
        : amount;

      subtractBalance(userAddress, cTokenAddress, amountToSubtract);

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

  /**
   * Batch claim multiple unwrapped tokens
   */
  const claimBatch = useCallback(async (
    cTokenAddress: `0x${string}`,
    ctHashes: `0x${string}`[],
    decryptedAmounts: bigint[],
    decryptionSignatures: `0x${string}`[]
  ) => {
    setState({ loading: true, error: null });

    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      const claimHash = await writeContractAsync({
        address: cTokenAddress,
        abi: CTokenABI,
        functionName: 'claimUnshieldedBatch',
        args: [ctHashes, decryptedAmounts, decryptionSignatures],
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
    claimBatch,
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

  const { data: wethClaims, error: wethError } = useReadContract({
    address: deployment?.cWETH as `0x${string}`,
    abi: CTokenABI,
    functionName: 'getUserClaims',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!deployment?.cWETH,
      refetchInterval: 5000,
    },
  }) as { data: Claim[] | undefined; error: Error | null };

  const { data: usdtClaims, error: usdtError } = useReadContract({
    address: deployment?.cUSDT as `0x${string}`,
    abi: CTokenABI,
    functionName: 'getUserClaims',
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress && !!deployment?.cUSDT,
      refetchInterval: 5000,
    },
  }) as { data: Claim[] | undefined; error: Error | null };

  // Log for debugging
  if (wethError) console.error('WETH claims error:', wethError);
  if (usdtError) console.error('USDT claims error:', usdtError);
  console.log('Claims data:', { wethClaims, usdtClaims });

  const allClaims = [
    ...(wethClaims?.map(c => ({ ...c, token: 'cWETH' })) || []),
    ...(usdtClaims?.map(c => ({ ...c, token: 'cUSDT' })) || []),
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
      refetchInterval: 3000, // Poll every 3 seconds to catch approval updates
    },
  }) as { data: bigint | undefined };

  return { allowance };
}
