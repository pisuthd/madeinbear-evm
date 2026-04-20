import { useCallback, useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { useCoFHE } from '../context/CoFHEContext';
import { DEPLOYMENTS } from '../constants/deployments';
import { encodeAbiParameters, keccak256 } from 'viem';

// CMORPHO ABI - includes both read and write functions
const CMORPHO_ABI = [
  // Read functions
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
  // Write functions
  {
    name: 'supply',
    type: 'function',
    inputs: [
      { name: 'marketParams', type: 'tuple' as const, components: [
        { name: 'loanToken', type: 'address' },
        { name: 'collateralToken', type: 'address' },
        { name: 'oracle', type: 'address' },
        { name: 'irm', type: 'address' },
        { name: 'lltv', type: 'uint256' },
      ]},
      { name: 'assets', type: 'uint256' },
      { name: 'shares', type: 'uint256' },
      { name: 'onBehalf', type: 'address' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'uint256' }, { name: '', type: 'uint256' }],
    stateMutability: 'nonpayable' as const,
  },
  {
    name: 'withdraw',
    type: 'function',
    inputs: [
      { name: 'marketParams', type: 'tuple' as const, components: [
        { name: 'loanToken', type: 'address' },
        { name: 'collateralToken', type: 'address' },
        { name: 'oracle', type: 'address' },
        { name: 'irm', type: 'address' },
        { name: 'lltv', type: 'uint256' },
      ]},
      { name: 'assets', type: 'uint256' },
      { name: 'shares', type: 'uint256' },
      { name: 'onBehalf', type: 'address' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }, { name: '', type: 'uint256' }],
    stateMutability: 'nonpayable' as const,
  },
  {
    name: 'borrow',
    type: 'function',
    inputs: [
      { name: 'marketParams', type: 'tuple' as const, components: [
        { name: 'loanToken', type: 'address' },
        { name: 'collateralToken', type: 'address' },
        { name: 'oracle', type: 'address' },
        { name: 'irm', type: 'address' },
        { name: 'lltv', type: 'uint256' },
      ]},
      { name: 'assets', type: 'uint256' },
      { name: 'shares', type: 'uint256' },
      { name: 'onBehalf', type: 'address' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }, { name: '', type: 'uint256' }],
    stateMutability: 'nonpayable' as const,
  },
  {
    name: 'repay',
    type: 'function',
    inputs: [
      { name: 'marketParams', type: 'tuple' as const, components: [
        { name: 'loanToken', type: 'address' },
        { name: 'collateralToken', type: 'address' },
        { name: 'oracle', type: 'address' },
        { name: 'irm', type: 'address' },
        { name: 'lltv', type: 'uint256' },
      ]},
      { name: 'assets', type: 'uint256' },
      { name: 'shares', type: 'uint256' },
      { name: 'onBehalf', type: 'address' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [{ name: '', type: 'uint256' }, { name: '', type: 'uint256' }],
    stateMutability: 'nonpayable' as const,
  },
  {
    name: 'supplyCollateral',
    type: 'function',
    inputs: [
      { name: 'marketParams', type: 'tuple' as const, components: [
        { name: 'loanToken', type: 'address' },
        { name: 'collateralToken', type: 'address' },
        { name: 'oracle', type: 'address' },
        { name: 'irm', type: 'address' },
        { name: 'lltv', type: 'uint256' },
      ]},
      { name: 'assets', type: 'uint256' },
      { name: 'onBehalf', type: 'address' },
      { name: 'data', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable' as const,
  },
  {
    name: 'withdrawCollateral',
    type: 'function',
    inputs: [
      { name: 'marketParams', type: 'tuple' as const, components: [
        { name: 'loanToken', type: 'address' },
        { name: 'collateralToken', type: 'address' },
        { name: 'oracle', type: 'address' },
        { name: 'irm', type: 'address' },
        { name: 'lltv', type: 'uint256' },
      ]},
      { name: 'assets', type: 'uint256' },
      { name: 'onBehalf', type: 'address' },
      { name: 'receiver', type: 'address' },
    ],
    outputs: [],
    stateMutability: 'nonpayable' as const,
  },
] as const;

// CToken ABI for setting operator and checking status
const CTOKEN_ABI = [
  {
    name: 'setOperator',
    type: 'function',
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'until', type: 'uint48' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    name: 'isOperator',
    type: 'function',
    inputs: [
      { name: 'holder', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const;

// LTV constant (75% in WAD)
const LTV = 750000000000000000n;

// Market params type
export interface MarketParams {
  loanToken: `0x${string}`;
  collateralToken: `0x${string}`;
  oracle: `0x${string}`;
  irm: `0x${string}`;
  lltv: bigint;
}

// User position type (decrypted)
export interface UserPosition {
  supplyShares: bigint;
  borrowShares: bigint;
  collateral: bigint;
}

// Hook state type
interface HookState {
  loading: boolean;
  error: Error | null;
}

// Get CMorpho address
function getCMorphoAddress() {
  return DEPLOYMENTS[11155111]?.cMorpho as `0x${string}` | undefined;
}

// Calculate market ID from market params
export function calculateMarketId(marketParams: MarketParams): `0x${string}` {
  const encoded = encodeAbiParameters(
    [
      { name: 'loanToken', type: 'address' },
      { name: 'collateralToken', type: 'address' },
      { name: 'oracle', type: 'address' },
      { name: 'irm', type: 'address' },
      { name: 'lltv', type: 'uint256' },
    ],
    [marketParams.loanToken, marketParams.collateralToken, marketParams.oracle, marketParams.irm, marketParams.lltv]
  );
  return keccak256(encoded);
}

// Get default market params for USDT/cETH market
export function getUSDTMarketParams(): MarketParams | undefined {
  const deployment = DEPLOYMENTS[11155111];
  if (!deployment?.cUSDT || !deployment?.cETH || !deployment?.Oracle || !deployment?.IRM) {
    return undefined;
  }
  return {
    loanToken: deployment.cUSDT as `0x${string}`,
    collateralToken: deployment.cETH as `0x${string}`,
    oracle: deployment.Oracle as `0x${string}`,
    irm: deployment.IRM as `0x${string}`,
    lltv: LTV,
  };
}
 
export function useSupply() {
  const { address } = useAccount(); 
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [state, setState] = useState<HookState>({ loading: false, error: null });

  const supply = useCallback(async (amount: bigint, marketParams: MarketParams) => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    if (!amount || amount === 0n) {
      throw new Error('Amount must be greater than 0');
    }

    const cMorphoAddress = getCMorphoAddress();
    if (!cMorphoAddress) {
      throw new Error('CMorpho not deployed');
    }

    setState({ loading: true, error: null });

    try {
      // Step 1: Check if CMorpho is already operator
      const isOperator = await publicClient.readContract({
        address: marketParams.loanToken,
        abi: CTOKEN_ABI,
        functionName: 'isOperator',
        args: [address, cMorphoAddress],
      }) as boolean;
 

      // Step 2: If not operator, set CMorpho as operator
      if (!isOperator) {
        console.log('Setting CMorpho as operator...');
        const operatorUntil = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        const setOperatorHash = await writeContractAsync({
          address: marketParams.loanToken,
          abi: CTOKEN_ABI,
          functionName: 'setOperator',
          args: [cMorphoAddress, operatorUntil],
          gas: 15_000_000n,
        });
        await publicClient.waitForTransactionReceipt({ hash: setOperatorHash });
        console.log('Operator set successfully');

          // Wait for approval to be processed
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Step 3: Supply to CMorpho
      const hash = await writeContractAsync({
        address: cMorphoAddress,
        abi: CMORPHO_ABI,
        functionName: 'supply',
        args: [
          {
            loanToken: marketParams.loanToken,
            collateralToken: marketParams.collateralToken,
            oracle: marketParams.oracle,
            irm: marketParams.irm,
            lltv: marketParams.lltv,
          },
          amount,
          0n, // shares = 0 means we pass assets, not shares
          address, // onBehalf
          '0x', // data
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      
      setState({ loading: false, error: null });
      return hash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Supply failed');
      setState({ loading: false, error });
      throw error;
    }
  }, [address, publicClient, writeContractAsync]);

  return { supply, loading: state.loading, error: state.error };
}

/**
 * Hook to withdraw assets from CMorpho
 */
export function useWithdraw() {
  const { address } = useAccount();
  const { client, connected } = useCoFHE();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [state, setState] = useState<HookState>({ loading: false, error: null });

  const withdraw = useCallback(async (amount: bigint, marketParams: MarketParams) => {
    if (!address || !client || !connected || !publicClient) {
      throw new Error('Wallet or CoFHE not connected');
    }

    if (!amount || amount === 0n) {
      throw new Error('Amount must be greater than 0');
    }

    const cMorphoAddress = getCMorphoAddress();
    if (!cMorphoAddress) {
      throw new Error('CMorpho not deployed');
    }

    setState({ loading: true, error: null });

    try {
      const hash = await writeContractAsync({
        address: cMorphoAddress,
        abi: CMORPHO_ABI,
        functionName: 'withdraw',
        args: [
          marketParams,
          amount,
          0n, // shares = 0 means we pass assets, not shares
          address, // onBehalf
          address, // receiver
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      
      setState({ loading: false, error: null });
      return hash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Withdraw failed');
      setState({ loading: false, error });
      throw error;
    }
  }, [address, client, connected, publicClient, writeContractAsync]);

  return { withdraw, loading: state.loading, error: state.error };
}

/**
 * Hook to borrow assets from CMorpho
 * Note: User must have supplied collateral first
 */
export function useBorrow() {
  const { address } = useAccount();
  const { client, connected } = useCoFHE();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [state, setState] = useState<HookState>({ loading: false, error: null });

  const borrow = useCallback(async (amount: bigint, marketParams: MarketParams) => {
    if (!address || !client || !connected || !publicClient) {
      throw new Error('Wallet or CoFHE not connected');
    }

    if (!amount || amount === 0n) {
      throw new Error('Amount must be greater than 0');
    }

    const cMorphoAddress = getCMorphoAddress();
    if (!cMorphoAddress) {
      throw new Error('CMorpho not deployed');
    }

    setState({ loading: true, error: null });

    try {
      const hash = await writeContractAsync({
        address: cMorphoAddress,
        abi: CMORPHO_ABI,
        functionName: 'borrow',
        args: [
          marketParams,
          amount,
          0n, // shares = 0 means we pass assets, not shares
          address, // onBehalf
          address, // receiver
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      
      setState({ loading: false, error: null });
      return hash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Borrow failed');
      setState({ loading: false, error });
      throw error;
    }
  }, [address, client, connected, publicClient, writeContractAsync]);

  return { borrow, loading: state.loading, error: state.error };
}

/**
 * Hook to repay assets to CMorpho
 * Automatically sets CMorpho as operator if not already set
 */
export function useRepay() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [state, setState] = useState<HookState>({ loading: false, error: null });

  const repay = useCallback(async (amount: bigint, marketParams: MarketParams) => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    if (!amount || amount === 0n) {
      throw new Error('Amount must be greater than 0');
    }

    const cMorphoAddress = getCMorphoAddress();
    if (!cMorphoAddress) {
      throw new Error('CMorpho not deployed');
    }

    setState({ loading: true, error: null });

    try {
      // Step 1: Check if CMorpho is already operator
      const isOperator = await publicClient.readContract({
        address: marketParams.loanToken,
        abi: CTOKEN_ABI,
        functionName: 'isOperator',
        args: [address, cMorphoAddress],
      }) as boolean;

      // Step 2: If not operator, set CMorpho as operator
      if (!isOperator) {
        console.log('Setting CMorpho as operator for repay...');
        const operatorUntil = Math.floor(Date.now() / 1000) + 3600; // 1 hour
        const setOperatorHash = await writeContractAsync({
          address: marketParams.loanToken,
          abi: CTOKEN_ABI,
          functionName: 'setOperator',
          args: [cMorphoAddress, operatorUntil],
        });
        await publicClient.waitForTransactionReceipt({ hash: setOperatorHash });
      }

      // Step 3: Repay to CMorpho
      const hash = await writeContractAsync({
        address: cMorphoAddress,
        abi: CMORPHO_ABI,
        functionName: 'repay',
        args: [
          {
            loanToken: marketParams.loanToken,
            collateralToken: marketParams.collateralToken,
            oracle: marketParams.oracle,
            irm: marketParams.irm,
            lltv: marketParams.lltv,
          },
          amount,
          0n, // shares = 0 means we pass assets, not shares
          address, // onBehalf
          '0x', // data
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      
      setState({ loading: false, error: null });
      return hash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Repay failed');
      setState({ loading: false, error });
      throw error;
    }
  }, [address, publicClient, writeContractAsync]);

  return { repay, loading: state.loading, error: state.error };
}

/**
 * Hook to supply collateral to CMorpho
 * Automatically sets CMorpho as operator on collateral token if not already set
 */
export function useSupplyCollateral() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [state, setState] = useState<HookState>({ loading: false, error: null });

  const supplyCollateral = useCallback(async (amount: bigint, marketParams: MarketParams) => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    if (!amount || amount === 0n) {
      throw new Error('Amount must be greater than 0');
    }

    const cMorphoAddress = getCMorphoAddress();
    if (!cMorphoAddress) {
      throw new Error('CMorpho not deployed');
    }

    setState({ loading: true, error: null });

    try {
      // Step 1: Check if CMorpho is operator on collateral token (cETH)
      const isOperator = await publicClient.readContract({
        address: marketParams.collateralToken,
        abi: CTOKEN_ABI,
        functionName: 'isOperator',
        args: [address, cMorphoAddress],
      }) as boolean;

      // Step 2: If not operator, set CMorpho as operator on collateral
      if (!isOperator) {
        console.log('Setting CMorpho as operator on collateral...');
        const operatorUntil = Math.floor(Date.now() / 1000) + 3600;
        const setOperatorHash = await writeContractAsync({
          address: marketParams.collateralToken,
          abi: CTOKEN_ABI,
          functionName: 'setOperator',
          args: [cMorphoAddress, operatorUntil],
        });
        await publicClient.waitForTransactionReceipt({ hash: setOperatorHash });
      }

      // Step 3: Supply collateral to CMorpho
      const hash = await writeContractAsync({
        address: cMorphoAddress,
        abi: CMORPHO_ABI,
        functionName: 'supplyCollateral',
        args: [
          {
            loanToken: marketParams.loanToken,
            collateralToken: marketParams.collateralToken,
            oracle: marketParams.oracle,
            irm: marketParams.irm,
            lltv: marketParams.lltv,
          },
          amount,
          address, // onBehalf
          '0x', // data
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      
      setState({ loading: false, error: null });
      return hash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Supply collateral failed');
      setState({ loading: false, error });
      throw error;
    }
  }, [address, publicClient, writeContractAsync]);

  return { supplyCollateral, loading: state.loading, error: state.error };
}

/**
 * Hook to withdraw collateral from CMorpho
 */
export function useWithdrawCollateral() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [state, setState] = useState<HookState>({ loading: false, error: null });

  const withdrawCollateral = useCallback(async (amount: bigint, marketParams: MarketParams) => {
    if (!address || !publicClient) {
      throw new Error('Wallet not connected');
    }

    if (!amount || amount === 0n) {
      throw new Error('Amount must be greater than 0');
    }

    const cMorphoAddress = getCMorphoAddress();
    if (!cMorphoAddress) {
      throw new Error('CMorpho not deployed');
    }

    setState({ loading: true, error: null });

    try {
      const hash = await writeContractAsync({
        address: cMorphoAddress,
        abi: CMORPHO_ABI,
        functionName: 'withdrawCollateral',
        args: [
          {
            loanToken: marketParams.loanToken,
            collateralToken: marketParams.collateralToken,
            oracle: marketParams.oracle,
            irm: marketParams.irm,
            lltv: marketParams.lltv,
          },
          amount,
          address, // onBehalf
          address, // receiver
        ],
      });

      await publicClient.waitForTransactionReceipt({ hash });
      
      setState({ loading: false, error: null });
      return hash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Withdraw collateral failed');
      setState({ loading: false, error });
      throw error;
    }
  }, [address, publicClient, writeContractAsync]);

  return { withdrawCollateral, loading: state.loading, error: state.error };
}

/**
 * Hook to set CMorpho as operator on a CToken
 * This must be called before supply/repay/supplyCollateral
 */
export function useSetOperator() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [state, setState] = useState<HookState>({ loading: false, error: null });

  const setOperator = useCallback(async (cTokenAddress: `0x${string}`, operatorAddress: `0x${string}`, durationSeconds: number = 3600) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    setState({ loading: true, error: null });

    try {
      // Set operator for 1 hour (3600 seconds) by default
      const operatorUntil = Math.floor(Date.now() / 1000) + durationSeconds;
      
      const hash = await writeContractAsync({
        address: cTokenAddress,
        abi: CTOKEN_ABI,
        functionName: 'setOperator',
        args: [operatorAddress, operatorUntil],
      });

      if (!publicClient) {
        throw new Error('Public client not available');
      }
      await publicClient.waitForTransactionReceipt({ hash });
      
      setState({ loading: false, error: null });
      return hash;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Set operator failed');
      setState({ loading: false, error });
      throw error;
    }
  }, [address, publicClient, writeContractAsync]);

  return { setOperator, loading: state.loading, error: state.error };
}