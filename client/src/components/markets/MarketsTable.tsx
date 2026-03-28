import { useState } from 'react';
import { useMarkets, useMarketData } from '../../hooks/useComptroller';
import SupplyModal from './SupplyModal';
import BorrowModal from './BorrowModal';

interface MarketRowProps {
  market: any;
  index: number;
  onSupply: (market: any) => void;
  onBorrow: (market: any) => void;
}

function MarketRow({ market, onSupply, onBorrow }: MarketRowProps) {
  const { data: marketData, loading } = useMarketData(market.address);

  const formatAmount = (amount: bigint, decimals: number) => {
    if (!amount || amount === 0n) return '0.00';
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const remainder = amount % divisor;
    const fractional = remainder.toString().padStart(decimals, '0').slice(0, 2);
    return `${whole.toString()}.${fractional}`;
  };

  return (
    <tr className="border-b border-[#3eddfd]/10 hover:bg-[#3eddfd]/5 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={market.icon} alt={market.symbol} className="w-10 h-10 rounded-full" />
          <div>
            <div className="font-semibold text-[#f8fafc]">{market.symbol}</div>
            <div className="text-xs text-[#94a3b8]">{market.name}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-[#3eddfd] font-semibold">3.00%</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-[#f59e0b] font-semibold">5.00%</div>
      </td> 
      <td className="px-6 py-4">
        {loading ? (
          <div className="text-[#94a3b8]">Loading...</div>
        ) : marketData ? (
          <div className="text-[#f8fafc]">
            {formatAmount(marketData.totalSupply, market.decimals)}
          </div>
        ) : (
          <div className="text-[#94a3b8]">-</div>
        )}
      </td>
      <td className="px-6 py-4">
        {loading ? (
          <div className="text-[#94a3b8]">Loading...</div>
        ) : marketData ? (
          <div className="text-[#f8fafc]">
            {formatAmount(marketData.totalBorrowed, market.decimals)}
          </div>
        ) : (
          <div className="text-[#94a3b8]">-</div>
        )}
      </td>
      <td className="px-6 py-4">
        {loading ? (
          <div className="text-[#94a3b8]">Loading...</div>
        ) : marketData ? (
          <div className="text-[#3eddfd] font-semibold">
            {formatAmount(marketData.totalSupply - marketData.totalBorrowed, market.decimals)}
          </div>
        ) : (
          <div className="text-[#94a3b8]">-</div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => onSupply(market)}
            className="px-4 py-2 bg-[#3eddfd]/10 hover:bg-[#3eddfd]/20 text-[#3eddfd] rounded-lg font-medium transition-all duration-200 text-sm border border-[#3eddfd]/20 hover:border-[#3eddfd]/40"
          >
            Supply
          </button>
          <button
            onClick={() => onBorrow(market)}
            className="px-4 py-2 bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 text-[#f59e0b] rounded-lg font-medium transition-all duration-200 text-sm border border-[#f59e0b]/20 hover:border-[#f59e0b]/40"
          >
            Borrow
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function MarketsTable() {
  const { markets, loading } = useMarkets();
  const [selectedSupplyMarket, setSelectedSupplyMarket] = useState<any>(null);
  const [selectedBorrowMarket, setSelectedBorrowMarket] = useState<any>(null);

  return (
    <>
      <div className="bg-[#1e293b]/50 border border-[#3eddfd]/10 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3eddfd]/10">
          <h3 className="text-xl font-bold text-[#f8fafc]">Available Markets</h3>
          <p className="text-sm text-[#94a3b8] mt-1">
            Supply assets to earn interest or borrow against your collateral
          </p>
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
                  Borrow APY
                </th> 
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                  Total Supplied
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                  Total Borrowed
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                  Available
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3eddfd]/10">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#94a3b8]">
                    Loading markets...
                  </td>
                </tr>
              ) : markets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-[#94a3b8]">
                    No markets available
                  </td>
                </tr>
              ) : (
                markets.map((market, index) => (
                  <MarketRow
                    key={market.address}
                    market={market}
                    index={index}
                    onSupply={setSelectedSupplyMarket}
                    onBorrow={setSelectedBorrowMarket}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supply Modal */}
      {selectedSupplyMarket && (
        <SupplyModal
          market={selectedSupplyMarket}
          onClose={() => setSelectedSupplyMarket(null)}
          onSuccess={() => setSelectedSupplyMarket(null)}
        />
      )}

      {/* Borrow Modal */}
      {selectedBorrowMarket && (
        <BorrowModal
          market={selectedBorrowMarket}
          onClose={() => setSelectedBorrowMarket(null)}
          onSuccess={() => setSelectedBorrowMarket(null)}
        />
      )}
    </>
  );
}