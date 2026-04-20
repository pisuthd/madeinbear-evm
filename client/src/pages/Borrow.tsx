import { useMarketInfo } from '../hooks/useMarketInfo';
import { useNavigate } from 'react-router-dom';

export default function Borrow() {
  const { marketData, borrowAPY, utilization, lltvPercent, loading } = useMarketInfo();
  const navigate = useNavigate();

  const formatAmount = (amount: bigint | undefined, decimals: number = 6) => {
    if (!amount || amount === 0n) return '0.00';
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const remainder = amount % divisor;
    const fractional = remainder.toString().padStart(decimals, '0').slice(0, 2);
    return `${whole.toString()}.${fractional}`;
  };

  const formatAPY = (apy: number) => {
    return apy.toFixed(2) + '%';
  };

  const handleRowClick = () => {
    navigate('/borrow/usdt');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#f8fafc] mb-2">Borrow</h1>
          <p className="text-lg text-[#94a3b8]">
            Borrow USDT against your ETH collateral. Repay anytime with no penalties.
          </p>
        </div>

        {/* Market Table */}
        <div 
          className="bg-[#1e293b]/50 border border-[#f59e0b]/10 rounded-lg overflow-hidden cursor-pointer hover:bg-[#1e293b]/70 transition-all"
          onClick={handleRowClick}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#f59e0b]/10">
            <h3 className="text-xl font-bold text-[#f8fafc]">Available Markets</h3>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0f172a]/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Borrow APY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Total Borrowed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                    LTV
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f59e0b]/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#94a3b8]">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  <tr className="border-b border-[#f59e0b]/10 hover:bg-[#f59e0b]/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" alt="USDT" className="w-10 h-10 rounded-full" />
                        <div>
                          <div className="font-semibold text-[#f8fafc]">USDT Borrow</div>
                          <div className="text-xs text-[#94a3b8]">Borrow USDT with ETH collateral</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#f59e0b] font-semibold">{formatAPY(borrowAPY)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#f8fafc]">{utilization.toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#f8fafc]">
                        {marketData ? formatAmount(marketData.totalBorrowAssets) : '0.00'} cUSDT
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#f8fafc]">{lltvPercent}%</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 p-6 bg-[#1e293b]/30 border border-[#f59e0b]/10 rounded-lg">
          <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">How borrowing works</h3>
          <ul className="space-y-2 text-[#94a3b8]">
            <li className="flex items-start gap-2">
              <span className="text-[#f59e0b]">1.</span>
              <span>Deposit ETH as collateral - your funds remain in your wallet but are used as security</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#f59e0b]">2.</span>
              <span>Borrow USDT up to {lltvPercent}% of your collateral value (LTV)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#f59e0b]">3.</span>
              <span>Pay interest on your borrowed amount - repay anytime with no penalties</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#f59e0b]">4.</span>
              <span>Your position is monitored - if collateral drops below threshold, you may be liquidated</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}