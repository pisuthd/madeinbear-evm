import { useMarketInfo } from '../hooks/useMarketInfo';
import { useNavigate } from 'react-router-dom';

export default function Borrow() {
  const { marketData, borrowAPY } = useMarketInfo();
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
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-[48px] font-bold mb-4 text-[#f8fafc] tracking-tight">Borrow</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-[#3eddfd] to-transparent mx-auto mt-4" />
          <p className="text-base mt-[24px] md:text-xl text-[#cbd5e1] max-w-xl mx-auto">
           Borrow against your assets and access instant credit on-chain with confidential collateral
          </p>
        </div>

        {/* Market Table */}
        <div 
          className="bg-[#1e293b]/50 backdrop-blur-lg border border-[#3eddfd]/10 rounded-xl overflow-hidden cursor-pointer hover:bg-[#1e293b]/70 hover:border-[#3eddfd]/30 transition-all"
          onClick={handleRowClick}
        >
          {/* Table Header */}
          <div className="grid grid-cols-5 gap-4 px-6 py-4 bg-[#0f172a]/30 border-b border-[#3eddfd]/10">
            <div className="text-sm font-medium text-[#94a3b8]">Borrowable Asset</div>
            <div className="text-sm font-medium text-[#94a3b8] text-right">Borrow APR</div>
            <div className="text-sm font-medium text-[#94a3b8] text-right">Collateral</div>
            <div className="text-sm font-medium text-[#94a3b8] text-right">Total Borrowed</div>
            <div className="text-sm font-medium text-[#94a3b8] text-right">Available</div>
          </div>

          {/* Table Row */}
          <div className="grid grid-cols-5 gap-4 px-6 py-6">
            <div className="flex items-center gap-3">
              <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" alt="USDT" className="w-10 h-10 rounded-full" />
              <div className="font-semibold text-[#f8fafc]">cUSDT</div>
            </div>
            <div className="text-right flex items-center justify-end">
              <div className="text-[#3eddfd] font-semibold text-lg">{formatAPY(borrowAPY)}</div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" alt="ETH" className="w-6 h-6 rounded-full" />
              <div className="text-[#f8fafc]">cETH</div>
            </div>
            <div className="text-right flex items-center justify-end">
              <div className="text-[#f8fafc] text-lg">
                {marketData ? formatAmount(marketData.totalBorrowAssets) : '0.00'} cUSDT
              </div>
            </div>
            <div className="text-right flex items-center justify-end">
              <div className="text-[#f8fafc] text-lg">
                {marketData && marketData.totalSupplyAssets > 0n
                  ? formatAmount(marketData.totalSupplyAssets - marketData.totalBorrowAssets)
                  : '0.00'} cUSDT
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 p-6 bg-[#1e293b]/30 border border-[#3eddfd]/10 rounded-lg">
          <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">How borrowing works</h3>
          <ul className="space-y-3 text-[#94a3b8]">
            <li className="flex items-start gap-2">
              <span className="text-[#3eddfd]">1.</span>
              <span>Use cETH as collateral to borrow USDT - borrow up to 75% of your collateral value</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#3eddfd]">2.</span>
              <span>Your collateral balance and positions stay private on-chain with Fhenix FHE</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#3eddfd]">3.</span>
              <span>Repay your loan anytime to unlock and unwrap your collateral</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
