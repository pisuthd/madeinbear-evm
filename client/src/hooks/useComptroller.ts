import { useCallback, useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { useCoFHE } from '../context/CoFHEContext';
import { DEPLOYMENTS, getAllMarkets, isChainSupported } from '../constants/deployments';

interface MarketInfo {
  address: string;
  symbol: string;
  name: string;
  underlying: string;
  decimals: number;
  icon: string;
}

export function useMarkets() {
  const publicClient = usePublicClient();
  const { connected } = useCoFHE();
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
 

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMarkets = useCallback(async () => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    setLoading(true);
    setError(null);

    try {
      const chainId = await publicClient.getChainId();
      
      if (!isChainSupported(chainId)) {
        throw new Error(`Chain ${chainId} is not supported`);
      }

      const deployment = DEPLOYMENTS[chainId as keyof typeof DEPLOYMENTS];
      const marketAddresses = getAllMarkets(chainId);

      // For now, we'll use the deployment addresses
      const marketsList: MarketInfo[] = marketAddresses.map((address) => ({
        address,
        symbol: address === deployment.ccWETH ? 'ccWETH' : 'ccUSDT',
        name: address === deployment.ccWETH ? 'Confidential Wrapped ETH' : 'Confidential USDT',
        underlying: address === deployment.ccWETH ? 'WETH' : 'USDT',
        decimals: address === deployment.ccWETH ? 18 : 18,
        icon: address === deployment.ccWETH ? 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png' : 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
      }));

      setMarkets(marketsList);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch markets');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    if (connected) {
      fetchMarkets();
    }
  }, [connected, fetchMarkets]);

  return { markets, fetchMarkets, loading, error };
}

export function useIsMarket(address: string) {
  const publicClient = usePublicClient();
  const [isMarket, setIsMarket] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const checkIsMarket = useCallback(async () => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    setLoading(true);
    setError(null);

    try {
      const chainId = await publicClient.getChainId();
      
      if (!isChainSupported(chainId)) {
        setIsMarket(false);
        return;
      }

      const deployment = DEPLOYMENTS[chainId as keyof typeof DEPLOYMENTS];
      
      // In a real implementation:
      // const comptroller = getContract({
      //   address: deployment.Comptroller,
      //   abi: ComptrollerABI,
      //   publicClient,
      // });
      // const result = await comptroller.read.isMarket([address as `0x${string}`]);
      // setIsMarket(result);

      // For now, check against deployment addresses
      setIsMarket(
        address.toLowerCase() === deployment.ccWETH.toLowerCase() ||
        address.toLowerCase() === deployment.ccUSDT.toLowerCase()
      );
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to check market status');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicClient, address]);

  useEffect(() => {
    if (address) {
      checkIsMarket();
    }
  }, [address, checkIsMarket]);

  return { isMarket, checkIsMarket, loading, error };
}

export function useMarketData(marketAddress: string) {
  const publicClient = usePublicClient();
  const { connected, client } = useCoFHE();
  const [data, setData] = useState<{
    supplyAPY: bigint;
    borrowAPY: bigint;
    collateralFactor: bigint;
    totalSupply: bigint;
    totalBorrowed: bigint;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMarketData = useCallback(async () => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    setLoading(true);
    setError(null);

    try {
      const chainId = await publicClient.getChainId();
      
      if (!isChainSupported(chainId)) {
        throw new Error(`Chain ${chainId} is not supported`);
      }

      // Import CCTokenABI
      const { CCTokenABI } = await import('../abis/CCToken');

      // Fetch encrypted total supply and total borrows from contract
      const totalSuppliedCtHash = await publicClient.readContract({
        address: marketAddress as `0x${string}`,
        abi: CCTokenABI,
        functionName: 'totalSupplied',
        args: [],
      }) as `0x${string}`;

      const totalBorrowsCtHash = await publicClient.readContract({
        address: marketAddress as `0x${string}`,
        abi: CCTokenABI,
        functionName: 'totalBorrows',
        args: [],
      }) as `0x${string}`;

      // Decrypt the public encrypted values (anyone can decrypt these)
      const { FheTypes } = await import('@cofhe/sdk');
      
      let totalSupply = BigInt(0);
      let totalBorrowed = BigInt(0);

      try {
        if (client && connected) {
          const permit = await client.permits.getOrCreateSelfPermit();
          
          totalSupply = await client
            .decryptForView(totalSuppliedCtHash as `0x${string}`, FheTypes.Uint64)
            .withPermit(permit)
            .execute();

          totalBorrowed = await client
            .decryptForView(totalBorrowsCtHash as `0x${string}`, FheTypes.Uint64)
            .withPermit(permit)
            .execute();
        }
      } catch (decryptErr) {
        // If decryption fails, use 0 values
        console.warn('Failed to decrypt market totals:', decryptErr);
      }

      const marketData = {
        supplyAPY: 300n, // 3%
        borrowAPY: 500n, // 5%
        collateralFactor: 8000n, // 0.8 (80%)
        totalSupply,
        totalBorrowed,
      };

      setData(marketData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch market data');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [publicClient, marketAddress, client, connected]);

  useEffect(() => {
    if (connected && marketAddress) {
      fetchMarketData();
    }
  }, [connected, marketAddress, fetchMarketData]);

  return { data, fetchMarketData, loading, error };
}
