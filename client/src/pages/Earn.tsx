import { useMarketInfo } from '../hooks/useMarketInfo';
import { useNavigate } from 'react-router-dom';

export default function Earn() {
  const { marketData, supplyAPY, utilization, loading } = useMarketInfo();
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
    navigate('/earn/usdt');
  };

  return (
    <div className="min-h-screen bg-[#0f172a] pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#f8fafc] mb-2">USDT Saving</h1>
          <p className="text-lg text-[#94a3b8]">
            Supply USDT to earn interest. Your funds are used to facilitate borrowings.
          </p>
        </div>

        {/* Market Table */}
        <div 
          className="bg-[#1e293b]/50 border border-[#3eddfd]/10 rounded-lg overflow-hidden cursor-pointer hover:bg-[#1e293b]/70 transition-all"
          onClick={handleRowClick}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#3eddfd]/10">
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
                    Supply APY
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Utilization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Total Supplied
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                    Available
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3eddfd]/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[#94a3b8]">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  <tr className="border-b border-[#3eddfd]/10 hover:bg-[#3eddfd]/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" alt="USDT" className="w-10 h-10 rounded-full" />
                        <div>
                          <div className="font-semibold text-[#f8fafc]">USDT Saving</div>
                          <div className="text-xs text-[#94a3b8]">Earn yield on USDT</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#3eddfd] font-semibold">{formatAPY(supplyAPY)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#f8fafc]">{utilization.toFixed(1)}%</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#f8fafc]">
                        {marketData ? formatAmount(marketData.totalSupplyAssets) : '0.00'} cUSDT
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[#f8fafc]">
                        {marketData && marketData.totalSupplyAssets > 0n && marketData.totalBorrowAssets > 0n
                          ? formatAmount(marketData.totalSupplyAssets - marketData.totalBorrowAssets)
                          : '0.00'} cUSDT
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 p-6 bg-[#1e293b]/30 border border-[#3eddfd]/10 rounded-lg">
          <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">How it works</h3>
          <ul className="space-y-2 text-[#94a3b8]">
            <li className="flex items-start gap-2">
              <span className="text-[#3eddfd]">1.</span>
              <span>Supply USDT to the pool and earn interest based on the borrow rate and utilization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#3eddfd]">2.</span>
              <span>Your funds are used to facilitate borrowings - you earn a share of the interest paid by borrowers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#3eddfd]">3.</span>
              <span>Withdraw your funds anytime - your balance is always accessible</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}