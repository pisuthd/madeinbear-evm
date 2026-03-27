import { useCallback, useState } from 'react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { useCoFHE } from '../context/CoFHEContext';
import { Encryptable, FheTypes } from '@cofhe/sdk';
import { CCTokenABI } from '../abis/CCToken';

interface CCTokenHookState {
  loading: boolean;
  error: Error | null;
}

interface InEuint64 {
  ctHash: bigint;
  securityZone: number;
  utype: number;
  signature: `0x${string}`;
}

export function useSupply() {
  const { address } = useAccount();
  const { client, connected } = useCoFHE();
  const { writeContract, isPending: writePending } = useWriteContract();
  const [state, setState] = useState<CCTokenHookState>({ loading: false, error: null });

  const supply = useCallback(async (contractAddress: string, amount: bigint) => {
    if (!address || !client || !connected) {
      throw new Error('Wallet or CoFHE not connected');
    }

    setState({ loading: true, error: null });

    try {
      // Encrypt the amount
      const [encryptedAmount] = await client
        .encryptInputs([Encryptable.uint64(amount)])
        .execute();

      // Call the supply function on the contract
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: CCTokenABI,
        functionName: 'supply',
        args: [encryptedAmount as InEuint64],
      });

      setState({ loading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Supply failed');
      setState({ loading: false, error });
      throw error;
    }
  }, [address, client, connected, writeContract]);

  return { supply, loading: state.loading || writePending, error: state.error };
}

export function useBorrow() {
  const { address } = useAccount();
  const { client, connected } = useCoFHE();
  const { writeContract, isPending: writePending } = useWriteContract();
  const [state, setState] = useState<CCTokenHookState>({ loading: false, error: null });

  const borrow = useCallback(async (contractAddress: string, amount: bigint) => {
    if (!address || !client || !connected) {
      throw new Error('Wallet or CoFHE not connected');
    }

    setState({ loading: true, error: null });

    try {
      // Encrypt the amount
      const [encryptedAmount] = await client
        .encryptInputs([Encryptable.uint64(amount)])
        .execute();

      // Call the borrow function on the contract
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: CCTokenABI,
        functionName: 'borrow',
        args: [encryptedAmount as InEuint64],
      });

      setState({ loading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Borrow failed');
      setState({ loading: false, error });
      throw error;
    }
  }, [address, client, connected, writeContract]);

  return { borrow, loading: state.loading || writePending, error: state.error };
}

export function useRepay() {
  const { address } = useAccount();
  const { client, connected } = useCoFHE();
  const { writeContract, isPending: writePending } = useWriteContract();
  const [state, setState] = useState<CCTokenHookState>({ loading: false, error: null });

  const repay = useCallback(async (contractAddress: string, amount: bigint) => {
    if (!address || !client || !connected) {
      throw new Error('Wallet or CoFHE not connected');
    }

    setState({ loading: true, error: null });

    try {
      // Encrypt the amount
      const [encryptedAmount] = await client
        .encryptInputs([Encryptable.uint64(amount)])
        .execute();

      // Call the repay function on the contract
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: CCTokenABI,
        functionName: 'repay',
        args: [encryptedAmount as InEuint64],
      });

      setState({ loading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Repay failed');
      setState({ loading: false, error });
      throw error;
    }
  }, [address, client, connected, writeContract]);

  return { repay, loading: state.loading || writePending, error: state.error };
}

export function useWithdraw() {
  const { address } = useAccount();
  const { client, connected } = useCoFHE();
  const { writeContract, isPending: writePending } = useWriteContract();
  const [state, setState] = useState<CCTokenHookState>({ loading: false, error: null });

  const withdraw = useCallback(async (contractAddress: string, amount: bigint) => {
    if (!address || !client || !connected) {
      throw new Error('Wallet or CoFHE not connected');
    }

    setState({ loading: true, error: null });

    try {
      // Encrypt the amount
      const [encryptedAmount] = await client
        .encryptInputs([Encryptable.uint64(amount)])
        .execute();

      // Call the withdraw function on the contract
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: CCTokenABI,
        functionName: 'withdraw',
        args: [encryptedAmount as InEuint64],
      });

      setState({ loading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Withdraw failed');
      setState({ loading: false, error });
      throw error;
    }
  }, [address, client, connected, writeContract]);

  return { withdraw, loading: state.loading || writePending, error: state.error };
}

export function useBalance() {
  const { address } = useAccount();
  const { client, connected } = useCoFHE();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async (contractAddress: string) => {
    if (!address || !client || !connected) {
      throw new Error('Wallet or CoFHE not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Get the encrypted balance from the contract
      // Note: This is a placeholder since we need the actual read contract hook
      // In a real implementation, you would use useReadContract or readContract
      const ctHash = '0x' + '0'.repeat(64) as `0x${string}`;

      // Decrypt the balance
      const decryptedBalance = await client
        .decryptForView(ctHash, FheTypes.Uint64)
        .execute();

      setBalance(decryptedBalance);
      return decryptedBalance;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch balance');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [address, client, connected]);

  return { balance, fetchBalance, loading, error };
}

export function useBorrowed() {
  const { address } = useAccount();
  const { client, connected } = useCoFHE();
  const [borrowed, setBorrowed] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBorrowed = useCallback(async (contractAddress: string) => {
    if (!address || !client || !connected) {
      throw new Error('Wallet or CoFHE not connected');
    }

    setLoading(true);
    setError(null);

    try {
      // Get the encrypted borrowed amount from the contract
      // Note: This is a placeholder since we need the actual read contract hook
      // In a real implementation, you would use useReadContract or readContract
      const ctHash = '0x' + '0'.repeat(64) as `0x${string}`;

      // Decrypt the borrowed amount
      const decryptedBorrowed = await client
        .decryptForView(ctHash, FheTypes.Uint64)
        .execute();

      setBorrowed(decryptedBorrowed);
      return decryptedBorrowed;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch borrowed amount');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [address, client, connected]);

  return { borrowed, fetchBorrowed, loading, error };
}