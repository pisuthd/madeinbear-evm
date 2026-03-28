import { useState } from 'react';
import { useWithdraw } from '../../hooks/useCCToken'; 
import type { MarketPosition } from '../../hooks/useCCToken';

interface SupplyPosition {
  token: string;
  symbol: string;
  icon: string;
  supplyBalance: bigint | null;
  decimals: number;
  price: number;
  address: string;
  supplyAPY: number;
}

interface SupplyPositionsProps {
  positions: MarketPosition[];
  onReload: () => Promise<void>;
}

export default function SupplyPositions({ positions, onReload }: SupplyPositionsProps) {

  const { withdraw, loading: withdrawLoading } = useWithdraw();
  const [withdrawAmounts, setWithdrawAmounts] = useState<Record<string, string>>({});
  const [withdrawing, setWithdrawing] = useState<Record<string, boolean>>({});

  const supplyPositions: SupplyPosition[] = positions.filter((pos) => pos.supplyBalance && pos.supplyBalance > 0n).map((pos) => ({
    ...pos,
    supplyAPY: 3, // 3% supply APY
  }));

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

  const handleWithdraw = async (position: SupplyPosition) => {
    const amountStr = withdrawAmounts[position.address];
    if (!amountStr) return;

    const amount = BigInt(parseFloat(amountStr) * 10 ** position.decimals);
    
    try {
      setWithdrawing((prev) => ({ ...prev, [position.address]: true }));
      await withdraw(position.address, amount);
      setWithdrawAmounts((prev) => ({ ...prev, [position.address]: '' }));
      // Reload positions after withdrawal
      await onReload();
    } catch (error) {
      console.error('Withdraw failed:', error);
      alert('Withdraw failed. Please try again.');
    } finally {
      setWithdrawing((prev) => ({ ...prev, [position.address]: false }));
    }
  };

  return (
    <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">Supply Positions</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3eddfd]/10">
              <th className="text-left py-3 px-4 text-sm font-medium text-[#94a3b8]">Token</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Supply Balance</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Supply APY</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">$ Value</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Action</th>
            </tr>
          </thead>
          <tbody>
            {supplyPositions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-[#94a3b8]">
                  No supply positions. Go to Markets to supply tokens.
                </td>
              </tr>
            ) : (
              supplyPositions.map((position) => (
                <tr key={position.address} className="border-b border-[#3eddfd]/10 hover:bg-[#0f172a]/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img src={position.icon} alt={position.symbol} className="w-10 h-10 rounded-full" />
                      <div>
                        <div className="font-medium text-[#f8fafc]">{position.symbol}</div>
                        <div className="text-xs text-[#94a3b8]">{position.token}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className="text-lg font-semibold text-[#f8fafc]">
                      {position.supplyBalance ? formatBalance(position.supplyBalance, position.decimals) : '0'}
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className="text-lg font-semibold text-[#10b981]">
                      {position.supplyAPY}%
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className="text-lg font-semibold text-[#3eddfd]">
                      ${calculateUsdValue(position.supplyBalance, position.decimals, position.price).toLocaleString('en-US', {
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
                        value={withdrawAmounts[position.address] || ''}
                        onChange={(e) => setWithdrawAmounts((prev) => ({ ...prev, [position.address]: e.target.value }))}
                        className="w-32 px-3 py-2 bg-[#0f172a] border border-[#3eddfd]/20 rounded-lg text-[#f8fafc] text-sm focus:outline-none focus:border-[#3eddfd]"
                      />
                      <button
                        onClick={() => handleWithdraw(position)}
                        disabled={!withdrawAmounts[position.address] || withdrawing[position.address] || withdrawLoading}
                        className="px-4 py-2 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg text-sm hover:bg-[#3eddfd]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {withdrawing[position.address] || withdrawLoading ? 'Withdrawing...' : 'Withdraw'}
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