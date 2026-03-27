import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { createCofheConfig, createCofheClient } from '@cofhe/sdk/web';
import { chains } from '@cofhe/sdk/chains';

interface CoFHEContextValue {
  client: ReturnType<typeof createCofheClient> | null;
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const CoFHEContext = createContext<CoFHEContextValue | undefined>(undefined);

export function CoFHEProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<ReturnType<typeof createCofheClient> | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { isConnected, address, chain } = useAccount();
  const wagmiPublicClient = usePublicClient();
  const { data: wagmiWalletClient } = useWalletClient();

  // Initialize CoFHE client
  useEffect(() => {
    try {
      const config = createCofheConfig({
        supportedChains: [chains.sepolia],
      });
      const cofheClient = createCofheClient(config);
      setClient(cofheClient);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to initialize CoFHE client'));
    }
  }, []);

  // Connect when wallet is connected
  const connect = useCallback(async () => {
    if (!client || !wagmiPublicClient || !wagmiWalletClient) {
      setError(new Error('Wallet or CoFHE client not available'));
      return;
    }

    if (connected) return;

    setConnecting(true);
    setError(null);

    try {
      // Create permit for the account
      if (address) {
        await client.permits.getOrCreateSelfPermit();
      }

      await client.connect(wagmiPublicClient, wagmiWalletClient);
      setConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to connect to CoFHE'));
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  }, [client, wagmiPublicClient, wagmiWalletClient, connected, address]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (!client) return;

    try {
      client.disconnect();
      setConnected(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to disconnect from CoFHE'));
    }
  }, [client]);

  // Auto-connect when wallet connects
  useEffect(() => {
    if (isConnected && address && chain?.id === 11155111) {
      connect();
    } else if (!isConnected) {
      disconnect();
    }
  }, [isConnected, address, chain?.id, connect, disconnect]);

  const value: CoFHEContextValue = {
    client,
    connected,
    connecting,
    error,
    connect,
    disconnect,
  };

  return <CoFHEContext.Provider value={value}>{children}</CoFHEContext.Provider>;
}

export function useCoFHE() {
  const context = useContext(CoFHEContext);
  if (context === undefined) {
    throw new Error('useCoFHE must be used within a CoFHEProvider');
  }
  return context;
}