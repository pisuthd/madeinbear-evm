import { useState, useEffect } from 'react';
import { usePositions, useRepay } from '../../hooks/useCCToken';
import { useCoFHE } from '../../context/CoFHEContext';
import { getAllMarkets, DEPLOYMENTS } from '../../constants/deployments';
import { usePublicClient } from 'wagmi';

interface BorrowPosition {
  token: string;
  symbol: string;
  icon: string;
  borrowBalance: bigint | null;
  decimals: number;
  price: number;
  address: string;
  borrowAPY: number;
}

export default function BorrowPositions() {
  const publicClient = usePublicClient();
  const { connected } = useCoFHE();
  const { positions, fetchPositions, loading } = usePositions();
  const { repay, loading: repayLoading } = useRepay();
  const [repayAmounts, setRepayAmounts] = useState<Record<string, string>>({});
  const [repaying, setRepaying] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!connected || !publicClient) return;

    const loadPositions = async () => {
      try {
        const chainId = await publicClient.getChainId();
        const deployment = DEPLOYMENTS[chainId as keyof typeof DEPLOYMENTS];
        const marketAddresses = getAllMarkets(chainId);

        const markets = marketAddresses.map((address) => {
          const isWETH = address.toLowerCase() === deployment.ccWETH.toLowerCase();
          return {
            address,
            symbol: isWETH ? 'ccWETH' : 'ccUSDT',
            icon: isWETH ? '⟠' : '₮',
            decimals: 18,
            price: isWETH ? 3500 : 1,
          };
        });

        await fetchPositions(markets);
      } catch (error) {
        console.error('Failed to load positions:', error);
      }
    };

    loadPositions();
  }, [connected, publicClient, fetchPositions]);

  const borrowPositions: BorrowPosition[] = positions.map((pos) => ({
    ...pos,
    borrowAPY: 5, // 5% borrow APY
  })).filter((pos) => pos.borrowBalance && pos.borrowBalance > 0n);

  const formatBalance = (balance: bigint, decimals: number) => {
    if (!balance) return '0';
    const divisor = BigInt(10 ** decimals);
    const whole = balance / divisor;
    const fraction = balance % divisor;
    return `${Number(whole)}.${fraction.toString().padStart(decimals, '0').slice(0, 4)}`;
  };

  const calculateUsdValue = (balance: bigint | null, decimals: number, price: number) => {
    if (!balance) return 0;
    const formattedBalance = parseFloat(formatBalance(balance, decimals));
    return formattedBalance * price;
  };

  const handleRepay = async (position: BorrowPosition) => {
    const amountStr = repayAmounts[position.address];
    if (!amountStr) return;

    const amount = BigInt(parseFloat(amountStr) * 10 ** position.decimals);
    
    try {
      setRepaying((prev) => ({ ...prev, [position.address]: true }));
      await repay(position.address, amount);
      setRepayAmounts((prev) => ({ ...prev, [position.address]: '' }));
      // Reload positions after repayment
      const chainId = await publicClient!.getChainId();
      const deployment = DEPLOYMENTS[chainId as keyof typeof DEPLOYMENTS];
      const marketAddresses = getAllMarkets(chainId);
      const markets = marketAddresses.map((address) => {
        const isWETH = address.toLowerCase() === deployment.ccWETH.toLowerCase();
        return {
          address,
          symbol: isWETH ? 'ccWETH' : 'ccUSDT',
          icon: isWETH ? '⟠' : '₮',
          decimals: 18,
          price: isWETH ? 3500 : 1,
        };
      });
      await fetchPositions(markets);
    } catch (error) {
      console.error('Repay failed:', error);
      alert('Repay failed. Please try again.');
    } finally {
      setRepaying((prev) => ({ ...prev, [position.address]: false }));
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">Borrow Positions</h3>
        <div className="text-center py-8 text-[#94a3b8]">Loading positions...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">Borrow Positions</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3eddfd]/10">
              <th className="text-left py-3 px-4 text-sm font-medium text-[#94a3b8]">Token</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Borrow Balance</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Borrow APY</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">$ Value</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Action</th>
            </tr>
          </thead>
          <tbody>
            {borrowPositions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[#94a3b8]">
                  No borrow positions. Go to Markets to borrow tokens.
                </td>
              </tr>
            ) : (
              borrowPositions.map((position) => (
                <tr key={position.address} className="border-b border-[#3eddfd]/10 hover:bg-[#0f172a]/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0f172a] flex items-center justify-center border border-[#3eddfd]/20">
                        <span className="text-[#3eddfd] text-lg">{position.icon}</span>
                      </div>
                      <div>
                        <div className="font-medium text-[#f8fafc]">{position.symbol}</div>
                        <div className="text-xs text-[#94a3b8]">{position.token}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className="text-lg font-semibold text-[#f8fafc]">
                      {position.borrowBalance ? formatBalance(position.borrowBalance, position.decimals) : '0'}
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className="text-lg font-semibold text-[#ef4444]">
                      {position.borrowAPY}%
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className="text-lg font-semibold text-[#3eddfd]">
                      ${calculateUsdValue(position.borrowBalance, position.decimals, position.price).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <input
                        type="number"
                        placeholder="Amount"
                        value={repayAmounts[position.address] || ''}
                        onChange={(e) => setRepayAmounts((prev) => ({ ...prev, [position.address]: e.target.value }))}
                        className="w-32 px-3 py-2 bg-[#0f172a] border border-[#3eddfd]/20 rounded-lg text-[#f8fafc] text-sm focus:outline-none focus:border-[#3eddfd]"
                      />
                      <button
                        onClick={() => handleRepay(position)}
                        disabled={!repayAmounts[position.address] || repaying[position.address] || repayLoading}
                        className="px-4 py-2 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg text-sm hover:bg-[#3eddfd]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {repaying[position.address] || repayLoading ? 'Repaying...' : 'Repay'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}