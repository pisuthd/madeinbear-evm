import type { TokenBalances } from '../../types';

interface BalanceTableProps {
  balances: TokenBalances;
}

export default function BalanceTable({ balances }: BalanceTableProps) {
  const tokens = [
    {
      name: 'Solana',
      symbol: 'SOL',
      balance: balances.sol,
      decimals: 4,
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
      price: 90.10,
    },
    {
      name: 'USD Coin',
      symbol: 'USDC',
      balance: balances.usdc,
      decimals: 2,
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
      price: 1.00,
    },
    {
      name: 'mXAU',
      symbol: 'mXAU',
      balance: balances.mxau,
      decimals: 4,
      icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/34212.png',
      price: 4818.88,
    },
  ];

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-[#334155] p-6">
      <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Token Balances</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left py-3 px-4 text-sm font-medium text-[#94a3b8]">Token</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Balance</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">$ Value</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.symbol} className="border-b border-[#334155] hover:bg-[#0f172a]/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0f172a] flex items-center justify-center overflow-hidden border border-[#334155]">
                      <img src={token.icon} alt={token.name} className="w-full h-full object-cover" />
                    </div>
                    <span className="font-medium text-[#f8fafc]">{token.name}</span>
                  </div>
                </td>
                <td className="text-right py-4 px-4">
                  <span className="text-lg font-semibold text-[#f8fafc]">
                    {token.balance.toFixed(token.decimals)}
                  </span>
                </td>
                <td className="text-right py-4 px-4">
                  <span className="text-lg font-semibold text-[#3eddfd]">
                    ${(token.balance * token.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}