import { useMarketInfo } from '../hooks/useMarketInfo';
import { useNavigate } from 'react-router-dom';

export default function Earn() {
  const { marketData, supplyAPY, utilization } = useMarketInfo();
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
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-[48px] font-bold mb-4 text-[#f8fafc] tracking-tight">Earn</h1>
          <div className="w-24 h-1 bg-gradient-to-r from-[#3eddfd] to-transparent mx-auto mt-4" />
          <p className="text-base mt-[24px] md:text-xl text-[#cbd5e1] max-w-xl mx-auto">
            Deposit assets and earn yield with private, confidential balances powered by Fhenix FHE
          </p>
        </div>

        {/* Market Table */}
        <div 
          className="bg-[#1e293b]/50 backdrop-blur-lg border border-[#3eddfd]/10 rounded-xl overflow-hidden cursor-pointer hover:bg-[#1e293b]/70 hover:border-[#3eddfd]/30 transition-all"
          onClick={handleRowClick}
        >
          {/* Table Header */}
          <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-[#0f172a]/30 border-b border-[#3eddfd]/10">
            <div className="text-sm font-medium text-[#94a3b8]">Product</div>
            <div className="text-sm font-medium text-[#94a3b8] text-right">Supply APY</div>
            <div className="text-sm font-medium text-[#94a3b8] text-right">Utilization</div>
            <div className="text-sm font-medium text-[#94a3b8] text-right">Total Supplied</div>
          </div>

          {/* Table Row */}
          <div className="grid grid-cols-4 gap-4 px-6 py-6">
            <div className="flex items-center gap-3">
              <img src="https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" alt="USDT" className="w-10 h-10 rounded-full" />
              <div className="font-semibold text-[#f8fafc]">cUSDT</div>
            </div>
            <div className="text-right flex items-center justify-end">
              <div className="text-[#3eddfd] font-semibold text-lg">{formatAPY(supplyAPY)}</div>
            </div>
            <div className="text-right flex items-center justify-end">
              <div className="text-[#f8fafc] text-lg">{utilization.toFixed(1)}%</div>
            </div>
            <div className="text-right flex items-center justify-end">
              <div className="text-[#f8fafc] text-lg">
                {marketData ? formatAmount(marketData.totalSupplyAssets) : '0.00'} cUSDT
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-8 p-6 bg-[#1e293b]/30 border border-[#3eddfd]/10 rounded-lg">
          <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">How it works</h3>
          <ul className="space-y-3 text-[#94a3b8]">
            <li className="flex items-start gap-2">
              <span className="text-[#3eddfd]">1.</span>
              <span>Deposit USDT and wrap it to cUSDT (ERC-7984 Confidential Token) at the Portfolio page</span>
            </li> 
            <li className="flex items-start gap-2">
              <span className="text-[#3eddfd]">2.</span>
              <span>Markets use Morpho Blue's isolated market model with risk-isolated design for deeper liquidity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#3eddfd]">3.</span>
              <span>Unwrap cUSDT back to USDT anytime at Portfolio page</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
