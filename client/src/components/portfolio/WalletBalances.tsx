import {  useAccount } from 'wagmi';
import { useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';

const TOKENS = [
  {
    symbol: 'WETH',
    name: 'Wrapped ETH',
    address: '0x4C143F18881a1D75c3458df023802f129a590Dc3' as const,
    decimals: 18,
    icon: '⟠',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    address: '0x1e94972F3EEc3848297e9c9ad84a4f8aB7AC55EE' as const,
    decimals: 18,
    icon: '₮',
  },
];

export default function WalletBalances() {
  const { address } = useAccount();
  
  // Native ETH balance
//   const { data: ethBalance } = useBalance({
//     address,
//   });

  // ERC-20 token balances
  const { data: wethBalance } = useReadContract({
    address: TOKENS[0].address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  }) as { data: bigint | undefined };

  const { data: usdtBalance } = useReadContract({
    address: TOKENS[1].address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  }) as { data: bigint | undefined };

  // Hardcoded prices for Sepolia testnet (in real app, fetch from oracle)
  const prices = {
    ETH: 2000,
    WETH: 2000,
    USDT: 1,
  };

  const tokenBalances = [
    // {
    //   name: 'Ethereum',
    //   symbol: 'ETH',
    //   balance: ethBalance?.value || 0n,
    //   decimals: 18,
    //   icon: '⟠',
    //   price: prices.ETH,
    // },
    {
      name: TOKENS[0].name,
      symbol: TOKENS[0].symbol,
      balance: wethBalance || 0n,
      decimals: TOKENS[0].decimals,
      icon: TOKENS[0].icon,
      price: prices.WETH,
    },
    {
      name: TOKENS[1].name,
      symbol: TOKENS[1].symbol,
      balance: usdtBalance || 0n,
      decimals: TOKENS[1].decimals,
      icon: TOKENS[1].icon,
      price: prices.USDT,
    },
  ];

  const formatBalance = (balance: bigint, decimals: number) => {
    const divisor = BigInt(10 ** decimals);
    const whole = balance / divisor;
    const fraction = balance % divisor;
    return `${Number(whole)}.${fraction.toString().padStart(decimals, '0').slice(0, 4)}`;
  };

  const calculateUsdValue = (balance: bigint, decimals: number, price: number) => {
    const formattedBalance = parseFloat(formatBalance(balance, decimals));
    return formattedBalance * price;
  };

  return (
    <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">Wallet Balances</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3eddfd]/10">
              <th className="text-left py-3 px-4 text-sm font-medium text-[#94a3b8]">Token</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Balance</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">$ Value</th>
            </tr>
          </thead>
          <tbody>
            {tokenBalances.map((token) => (
              <tr key={token.symbol} className="border-b border-[#3eddfd]/10 hover:bg-[#0f172a]/50 transition-colors">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0f172a] flex items-center justify-center border border-[#3eddfd]/20">
                      <span className="text-[#3eddfd] text-lg">{token.icon}</span>
                    </div>
                    <div>
                      <div className="font-medium text-[#f8fafc]">{token.name}</div>
                      <div className="text-xs text-[#94a3b8]">{token.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="text-right py-4 px-4">
                  <span className="text-lg font-semibold text-[#f8fafc]">
                    {formatBalance(token.balance, token.decimals)}
                  </span>
                </td>
                <td className="text-right py-4 px-4">
                  <span className="text-lg font-semibold text-[#3eddfd]">
                    ${calculateUsdValue(token.balance, token.decimals, token.price).toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
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