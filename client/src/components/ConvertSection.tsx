import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { erc20Abi } from 'viem';
import { FheTypes } from '@cofhe/sdk';
import { usePendingClaims, useCToken, type Claim } from '../hooks/useCToken';
import { useCoFHE } from '../context/CoFHEContext';
import { DEPLOYMENTS } from '../constants/deployments';
import ConvertModal from './ConvertModal';
import { isCofheError } from '@cofhe/sdk';


interface TokenConfig {
  symbol: string;
  cSymbol: string;
  name: string;
  erc20Address: `0x${string}`;
  cTokenAddress: `0x${string}`;
  decimals: number;
  icon: string;
}

const TOKENS: TokenConfig[] = [
  {
    symbol: 'USDT',
    cSymbol: 'cUSDT',
    name: 'Mock USDT',
    erc20Address: DEPLOYMENTS[11155111].MockUSDT as `0x${string}`,
    cTokenAddress: DEPLOYMENTS[11155111].cUSDT as `0x${string}`,
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
  },
  {
    symbol: 'ETH',
    cSymbol: 'cETH',
    name: 'Mock ETH',
    erc20Address: DEPLOYMENTS[11155111].MockETH as `0x${string}`,
    cTokenAddress: DEPLOYMENTS[11155111].cETH as `0x${string}`,
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
];

const CLAIM_TOKENS: Record<string, { icon: string; name: string; cTokenAddress: `0x${string}` }> = {
  cUSDT: {
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
    name: 'Confidential USDT',
    cTokenAddress: DEPLOYMENTS[11155111].cUSDT as `0x${string}`,
  },
  cETH: {
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    name: 'Confidential ETH',
    cTokenAddress: DEPLOYMENTS[11155111].cETH as `0x${string}`,
  },
};

// Skeleton loading row component
function TableRowSkeleton() {
  return (
    <tr className="border-b border-[#3eddfd]/10 last:border-b-0">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0f172a] animate-pulse"></div>
          <div className="space-y-1">
            <div className="h-4 w-16 bg-[#0f172a] rounded animate-pulse"></div>
            <div className="h-3 w-20 bg-[#0f172a] rounded animate-pulse"></div>
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="h-6 w-24 ml-auto bg-[#0f172a] rounded animate-pulse"></div>
      </td>
      <td className="py-4 px-4 text-right">
        <div className="h-8 w-16 ml-auto bg-[#0f172a] rounded animate-pulse"></div>
      </td>
    </tr>
  );
}

export default function ConvertSection() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [refreshKey, setRefreshKey] = useState(0);
  const [claiming, setClaiming] = useState<Record<string, boolean>>({});
  const [claimError, setClaimError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'wrap' | 'unwrap'>('wrap');
  const [selectedToken, setSelectedToken] = useState<TokenConfig | null>(null);

  // Store balances in state
  const [erc20Balances, setErc20Balances] = useState<Record<string, bigint>>({});
  const [confidentialBalances, setConfidentialBalances] = useState<Record<string, bigint>>({});
  const [balancesLoading, setBalancesLoading] = useState(false);

  const { pendingClaims } = usePendingClaims(address);
  const { client: cofheClient, connected } = useCoFHE();
  const { claim } = useCToken();

  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return '0.00';
    const divisor = BigInt(10 ** decimals);
    const whole = balance / divisor;
    const fraction = balance % divisor;
    return `${Number(whole).toLocaleString()}.${fraction.toString().padStart(decimals, '0').slice(0, 2)}`;
  };

  // Fetch ERC-20 balance
  const fetchErc20Balance = async (erc20Address: `0x${string}`): Promise<bigint> => {
    if (!address || !publicClient) return 0n;

    try {
      const balance = await publicClient.readContract({
        address: erc20Address,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address] as [`0x${string}`],
      });
      return (balance as bigint) ?? 0n;
    } catch (error) {
      console.warn('Failed to get ERC-20 balance:', error);
      return 0n;
    }
  };

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

  // Fetch confidential balance - use confidentialBalanceOf + CoFHE decryption
  const fetchConfidentialBalance = useCallback(async (cTokenAddress: `0x${string}`): Promise<bigint> => {
    if (!address || !publicClient || !cofheClient || !connected) return 0n;

    try {
  
      // confidentialBalanceOf returns euint64 (as bytes32 ctHash)
      const ctHash = await publicClient.readContract({
        address: cTokenAddress,
        abi: confidentialBalanceOfAbi,
        functionName: 'confidentialBalanceOf',
        args: [address] as [`0x${string}`],
      }) as `0x${string}`; 

      // Decrypt with permit  
      const permit = await cofheClient.permits.getOrCreateSelfPermit();
 
      const decrypted = await cofheClient
        .decryptForView(ctHash, FheTypes.Uint64)
        .withPermit(permit)
        .execute();

      console.log('Decrypted confidential balance:', decrypted);
      return decrypted;
    } catch (err) {

      if (isCofheError(err)) {
        console.error(err.code, err.message);
      }

      // console.warn('Failed to get confidential balance:', error);
      return 0n;
    }
  }, [cofheClient, connected, address, publicClient])

  // Fetch all balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) return;

      setBalancesLoading(true);
      try {
        const erc20Bals: Record<string, bigint> = {};
        const confBals: Record<string, bigint> = {};

        for (const token of TOKENS) {
          erc20Bals[token.symbol] = await fetchErc20Balance(token.erc20Address);
          confBals[token.symbol] = await fetchConfidentialBalance(token.cTokenAddress);
        }

        setErc20Balances(erc20Bals);
        setConfidentialBalances(confBals);
      } finally {
        setBalancesLoading(false);
      }
    };

    fetchBalances();
  }, [address, refreshKey, cofheClient, connected]);

  // Refresh balances
  const refreshBalances = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Open modal
  const openWrapModal = (token: TokenConfig) => {
    setModalMode('wrap');
    setSelectedToken(token);
    setModalOpen(true);
  };

  const openUnwrapModal = (token: TokenConfig) => {
    setModalMode('unwrap');
    setSelectedToken(token);
    setModalOpen(true);
  };

  const handleClaim = async (claimData: Claim) => {
    if (!cofheClient) {
      setClaimError('CoFHE client not connected');
      return;
    }

    if (!claimData.token) {
      setClaimError('Token information missing');
      return;
    }

    setClaiming(prev => ({ ...prev, [claimData.ctHash]: true }));
    setClaimError(null);

    try {
      const decryptResult = await cofheClient
        .decryptForTx(claimData.ctHash)
        .withoutPermit()
        .execute();

      if (!decryptResult) {
        throw new Error('Decryption failed - no result returned');
      }

      const { decryptedValue, signature } = decryptResult;

      if (!decryptedValue || decryptedValue === 0n) {
        throw new Error('Decryption returned zero amount. Please try again.');
      }

      if (!signature) {
        throw new Error('Decryption failed - no signature returned');
      }

      const tokenInfo = CLAIM_TOKENS[claimData.token];
      await claim(
        tokenInfo.cTokenAddress,
        claimData.ctHash,
        decryptedValue,
        signature as `0x${string}`
      );
      refreshBalances();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim';
      setClaimError(errorMessage);
    } finally {
      setClaiming(prev => ({ ...prev, [claimData.ctHash]: false }));
    }
  };

  return (
    <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
      <h3 className="text-2xl font-bold text-[#f8fafc] mb-2">Convert</h3>
      <p className="text-base text-[#94a3b8] mb-6">
        Wrap ERC-20 tokens to confidential tokens or unwrap to claim your tokens.
      </p>

      {/* 2-Column Grid with Table Layouts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT: Wrap Panel - ERC-20 Standard Tokens */}
        <div className="bg-[#0f172a]/50 rounded-lg border border-[#3eddfd]/10 overflow-hidden">
          <div className="bg-[#1e293b] px-4 py-3 border-b border-[#3eddfd]/10">
            <span className="text-sm font-medium text-[#3eddfd]">ERC-20 Standard Tokens</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#3eddfd]/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-[#94a3b8]">Token</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Balance</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Action</th>
                </tr>
              </thead>
              <tbody>
                {balancesLoading ? (
                  <>
                    <TableRowSkeleton />
                    <TableRowSkeleton />
                  </>
                ) : (
                  TOKENS.map((token) => {
                    const erc20Balance = erc20Balances[token.symbol] || 0n;
                    return (
                      <tr key={token.symbol} className="border-b border-[#3eddfd]/10 last:border-b-0 hover:bg-[#1e293b]/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <img src={token.icon} alt={token.symbol} className="w-10 h-10 rounded-full" />
                            <div>
                              <div className="font-medium text-[#f8fafc]">{token.symbol}</div>
                              <div className="text-xs text-[#94a3b8]">{token.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-4 px-4">
                          <span className="text-lg font-semibold text-[#f8fafc]">
                            {formatBalance(erc20Balance, token.decimals)}
                          </span>
                        </td>
                        <td className="text-right py-4 px-4">
                          <button
                            onClick={() => openWrapModal(token)}
                            className="px-4 py-2 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg text-sm hover:bg-[#3eddfd]/80 transition-colors whitespace-nowrap"
                          >
                            Wrap
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Unwrap Panel + Pending Claims */}
        <div className="space-y-4">
          {/* Unwrap Table */}
          <div className="bg-[#0f172a]/50 rounded-lg border border-[#3eddfd]/10 overflow-hidden">
            <div className="bg-[#1e293b] px-4 py-3 border-b border-[#3eddfd]/10">
              <span className="text-sm font-medium text-[#3eddfd]">ERC-7984 Confidential Tokens</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3eddfd]/10">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[#94a3b8]">Token</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Balance</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {balancesLoading ? (
                    <>
                      <TableRowSkeleton />
                      <TableRowSkeleton />
                    </>
                  ) : (
                    TOKENS.map((token) => {
                      const confidentialBalance = confidentialBalances[token.symbol] || 0n;
                      return (
                        <tr key={token.symbol} className="border-b border-[#3eddfd]/10 last:border-b-0 hover:bg-[#1e293b]/50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <img src={token.icon} alt={token.symbol} className="w-10 h-10 rounded-full" />
                              <div>
                                <div className="font-medium text-[#f8fafc]">{token.cSymbol}</div>
                                <div className="text-xs text-[#94a3b8]">Confidential {token.symbol}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-4 px-4">
                            <span className="text-lg font-semibold text-[#f8fafc]">
                              {formatBalance(confidentialBalance, token.decimals)}
                            </span>
                          </td>
                          <td className="text-right py-4 px-4">
                            <button
                              onClick={() => openUnwrapModal(token)}
                              className="px-4 py-2 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg text-sm hover:bg-[#3eddfd]/80 transition-colors whitespace-nowrap"
                            >
                              Unwrap
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Claims Section */}
          <div className="bg-[#0f172a]/50 rounded-lg border border-[#3eddfd]/10 p-4">
            <h4 className="text-base font-semibold text-[#f8fafc] mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pending Claims
            </h4>

            {claimError && (
              <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-400">
                {claimError}
              </div>
            )}

            {pendingClaims.length === 0 ? (
              <p className="text-sm text-[#94a3b8] text-center py-4">No pending claims</p>
            ) : (
              <div className="space-y-2">
                {pendingClaims.map((claimData) => {
                  const tokenInfo = CLAIM_TOKENS[claimData.token];
                  if (!tokenInfo) return null;
                  const isClaiming = claiming[claimData.ctHash];

                  return (
                    <div key={claimData.ctHash} className="flex items-center justify-between bg-[#1e293b] rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <img src={tokenInfo.icon} alt={claimData.token} className="w-5 h-5 rounded-full" />
                        <span className="text-sm text-[#f8fafc]">{claimData.token}</span>
                        <span className="text-sm text-[#94a3b8]">
                          {formatBalance(claimData.requestedAmount, 6)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleClaim(claimData)}
                        disabled={isClaiming}
                        className="px-4 py-1.5 bg-[#3eddfd] text-[#0f172a] font-medium rounded text-sm hover:bg-[#3eddfd]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isClaiming ? 'Claiming...' : 'Claim'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <ConvertModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        token={selectedToken}
        erc20Balance={selectedToken ? erc20Balances[selectedToken.symbol] || 0n : 0n}
        confidentialBalance={selectedToken ? confidentialBalances[selectedToken.symbol] || 0n : 0n}
        onSuccess={refreshBalances}
      />
    </div>
  );
}