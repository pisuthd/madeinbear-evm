interface PriceData {
  price: number;
  confidence: number;
  fallback?: boolean;
}

interface PriceCardsProps {
  prices: { XAU_USD: PriceData; SOL_USD: PriceData } | null;
}

export function PriceCards({ prices }: PriceCardsProps) {
  if (!prices) return null;

  const priceItems = [
    {
      name: 'Gold',
      symbol: 'XAU',
      price: prices.XAU_USD.price,
      fallback: prices.XAU_USD.fallback,
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/34212.png',
      change: '+2.34%', // Mock change for demo - could be fetched from API
    },
    {
      name: 'Solana',
      symbol: 'SOL',
      price: prices.SOL_USD.price,
      fallback: prices.SOL_USD.fallback,
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
      change: '-1.23%', // Mock change for demo - could be fetched from API
    },
  ];

  return (
    <div className="bg-[#0f172a] rounded-xl border border-[#334155]/50 p-3  ">
      <div className="flex items-center gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5 text-[#94a3b8] text-sm whitespace-nowrap">
          <span className="font-medium">Market Prices</span>
          <span className="w-px h-4 bg-[#334155] mx-1"></span>
        </div>
        {priceItems.map((item) => (
          <div
            key={item.symbol}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1e293b] rounded-lg border border-[#334155]/30 hover:border-[#3eddfd]/30 transition-all whitespace-nowrap group"
          >
            <img
              src={item.icon}
              alt={item.name}
              className="w-5 h-5 rounded-full"
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[#94a3b8] text-xs font-medium">{item.symbol}</span>
                <span className="text-[#f8fafc] text-sm font-semibold">
                  ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div> 
            </div>
          </div>
        ))} 
      </div>
    </div>
  );
}
