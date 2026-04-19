// import { useState } from 'react';
// import { useAccount, useReadContract } from 'wagmi';
// import { erc20Abi } from 'viem';
// import { useCToken } from '../hooks/useCToken';
// import { getBalance } from '../utils/confidentialBalances';
// import { DEPLOYMENTS } from '../constants/deployments';

// type Tab = 'wrap' | 'unwrap';

// interface TokenConfig {
//   symbol: string;
//   name: string;
//   erc20Address: `0x${string}`;
//   cTokenAddress: `0x${string}`;
//   decimals: number;
//   icon: string;
// }

// const TOKENS: TokenConfig[] = [
//   {
//     symbol: 'USDT',
//     name: 'Mock USDT',
//     erc20Address: DEPLOYMENTS[11155111].MockUSDT as `0x${string}`,
//     cTokenAddress: DEPLOYMENTS[11155111].cUSDT as `0x${string}`,
//     decimals: 6,
//     icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
//   },
//   {
//     symbol: 'ETH',
//     name: 'Mock ETH',
//     erc20Address: DEPLOYMENTS[11155111].MockETH as `0x${string}`,
//     cTokenAddress: DEPLOYMENTS[11155111].cETH as `0x${string}`,
//     decimals: 6,
//     icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
//   },
// ];

// export default function WrapUnwrap() {
//   const { address } = useAccount();
//   const [tab, setTab] = useState<Tab>('wrap');
//   const [amounts, setAmounts] = useState<Record<string, string>>({});
//   const [successMessages, setSuccessMessages] = useState<Record<string, string>>({});
//   const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

//   const { wrap, unwrap, loading: globalLoading } = useCToken();

//   const formatBalance = (balance: bigint | undefined, decimals: number) => {
//     if (!balance) return '0.00';
//     const divisor = BigInt(10 ** decimals);
//     const whole = balance / divisor;
//     const fraction = balance % divisor;
//     return `${Number(whole).toLocaleString()}.${fraction.toString().padStart(decimals, '0').slice(0, 2)}`;
//   };

//   const parseAmount = (value: string, decimals: number) => {
//     if (!value) return 0n;
//     const [whole, fraction = '0'] = value.split('.');
//     const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
//     return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction || '0');
//   };

//   const getErc20Balance = (erc20Address: `0x${string}`) => {
//     const { data } = useReadContract({
//       address: erc20Address,
//       abi: erc20Abi,
//       functionName: 'balanceOf',
//       args: address ? [address] : undefined,
//     });
//     return data ?? 0n;
//   };

//   const getConfidentialBalance = (cTokenAddress: `0x${string}`) => {
//     const rawBalance = address ? getBalance(address, cTokenAddress) : 0n;
//     return rawBalance * BigInt(10 ** 12);
//   };

//   const setMaxAmount = (token: TokenConfig) => {
//     const balance = tab === 'wrap' 
//       ? getErc20Balance(token.erc20Address)
//       : getConfidentialBalance(token.cTokenAddress);
    
//     if (balance) {
//       setAmounts(prev => ({
//         ...prev,
//         [token.symbol]: formatBalance(balance, token.decimals),
//       }));
//     }
//   };

//   const handleWrap = async (token: TokenConfig) => {
//     const amount = amounts[token.symbol];
//     if (!address || !amount) return;

//     setSuccessMessages(prev => ({ ...prev, [token.symbol]: '' }));
//     setErrorMessages(prev => ({ ...prev, [token.symbol]: '' }));

//     try {
//       const amountInWei = parseAmount(amount, token.decimals);
//       await wrap(token.cTokenAddress, amountInWei, address);
//       setSuccessMessages(prev => ({ ...prev, [token.symbol]: `Wrapped ${amount} ${token.symbol}!` }));
//       setAmounts(prev => ({ ...prev, [token.symbol]: '' }));
//     } catch (err) {
//       setErrorMessages(prev => ({ ...prev, [token.symbol]: err instanceof Error ? err.message : 'Failed to wrap' }));
//     }
//   };

//   const handleUnwrap = async (token: TokenConfig) => {
//     const amount = amounts[token.symbol];
//     if (!address || !amount) return;

//     setSuccessMessages(prev => ({ ...prev, [token.symbol]: '' }));
//     setErrorMessages(prev => ({ ...prev, [token.symbol]: '' }));

//     try {
//       const amountInWei = parseAmount(amount, token.decimals);
//       const rawBalance = address ? getBalance(address, token.cTokenAddress) : 0n;
//       const storedBalanceAsERC20 = rawBalance * BigInt(10 ** 12);

//       if (storedBalanceAsERC20 < amountInWei) {
//         setErrorMessages(prev => ({ ...prev, [token.symbol]: 'Insufficient confidential balance' }));
//         return;
//       }

//       const confidentialAmount = amountInWei / BigInt(10 ** 12);
//       await unwrap(token.cTokenAddress, confidentialAmount, address, amountInWei);
//       setSuccessMessages(prev => ({ ...prev, [token.symbol]: `Unwrapping ${amount} ${token.symbol}...` }));
//       setAmounts(prev => ({ ...prev, [token.symbol]: '' }));
//     } catch (err) {
//       setErrorMessages(prev => ({ ...prev, [token.symbol]: err instanceof Error ? err.message : 'Failed to unwrap' }));
//     }
//   };

//   return (
//     <div className="space-y-6">
//       {/* Main Card */}
//       <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
//         <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">Convert</h3>
//         <p className="text-sm text-[#94a3b8] mb-6">
//           Wrap ERC-20 tokens to confidential tokens or unwrap to claim your tokens.
//         </p>

//         {/* Tabs */}
//         <div className="flex gap-2 mb-6">
//           <button
//             onClick={() => setTab('wrap')}
//             className={`flex-1 px-4 py-3 rounded-lg font-medium ${tab === 'wrap'
//               ? 'bg-[#3eddfd] text-[#0f172a]'
//               : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#0f172a]/80'
//               }`}
//           >
//             Wrap
//           </button>
//           <button
//             onClick={() => setTab('unwrap')}
//             className={`flex-1 px-4 py-3 rounded-lg font-medium ${tab === 'unwrap'
//               ? 'bg-[#3eddfd] text-[#0f172a]'
//               : 'bg-[#0f172a] text-[#94a3b8] hover:bg-[#0f172a]/80'
//               }`}
//           >
//             Unwrap
//           </button>
//         </div>

//         {/* Table */}
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="border-b border-[#3eddfd]/10">
//                 <th className="text-left py-3 px-4 text-sm font-medium text-[#94a3b8]">Token</th>
//                 <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">
//                   {tab === 'wrap' ? 'ERC-20 Balance' : 'Confidential Balance'}
//                 </th>
//                 <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Amount</th>
//                 <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {TOKENS.map((token) => {
//                 const erc20Balance = getErc20Balance(token.erc20Address);
//                 const confidentialBalance = getConfidentialBalance(token.cTokenAddress);
//                 const displayBalance = tab === 'wrap' ? erc20Balance : confidentialBalance;
//                 const isProcessing = globalLoading && (amounts[token.symbol] || successMessages[token.symbol]);

//                 return (
//                   <tr key={token.symbol} className="border-b border-[#3eddfd]/10">
//                     {/* Token */}
//                     <td className="py-4 px-4">
//                       <div className="flex items-center gap-3">
//                         <img src={token.icon} alt={token.symbol} className="w-10 h-10 rounded-full" />
//                         <div>
//                           <div className="font-medium text-[#f8fafc]">{token.symbol}</div>
//                           <div className="text-xs text-[#94a3b8]">{token.name}</div>
//                         </div>
//                       </div>
//                     </td>

//                     {/* Balance */}
//                     <td className="text-right py-4 px-4">
//                       <span className="text-sm font-semibold text-[#f8fafc]">
//                         {formatBalance(displayBalance, token.decimals)}
//                       </span>
//                     </td>

//                     {/* Amount Input */}
//                     <td className="py-4 px-4">
//                       <div className="flex items-center gap-2">
//                         <input
//                           type="number"
//                           value={amounts[token.symbol] || ''}
//                           onChange={(e) => setAmounts(prev => ({ ...prev, [token.symbol]: e.target.value }))}
//                           placeholder="0.00"
//                           step="0.01"
//                           className="w-full bg-[#0f172a] border border-[#3eddfd]/20 rounded-lg px-3 py-2 text-[#f8fafc] text-right focus:outline-none focus:border-[#3eddfd]/50"
//                         />
//                         <button
//                           type="button"
//                           onClick={() => setMaxAmount(token)}
//                           className="px-2 py-1 text-xs font-medium text-[#3eddfd] bg-[#3eddfd]/10 rounded hover:bg-[#3eddfd]/20"
//                         >
//                           MAX
//                         </button>
//                       </div>
//                     </td>

//                     {/* Action */}
//                     <td className="text-right py-4 px-4">
//                       <button
//                         onClick={() => tab === 'wrap' ? handleWrap(token) : handleUnwrap(token)}
//                         disabled={!amounts[token.symbol] || !address}
//                         className="px-4 py-2 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg text-sm hover:bg-[#3eddfd]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
//                       >
//                         {isProcessing ? 'Processing...' : tab === 'wrap' ? 'Wrap' : 'Unwrap'}
//                       </button>
//                     </td>
//                   </tr>
//                 );
//               })}
//             </tbody>
//           </table>
//         </div>

//         {/* Success/Error Messages */}
//         {Object.entries(successMessages).map(([symbol, message]) => 
//           message && (
//             <div key={`success-${symbol}`} className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
//               <p className="text-sm text-green-400">{message}</p>
//             </div>
//           )
//         )}
//         {Object.entries(errorMessages).map(([symbol, message]) => 
//           message && (
//             <div key={`error-${symbol}`} className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
//               <p className="text-sm text-red-400">{message}</p>
//             </div>
//           )
//         )}
//       </div>
//     </div>
//   );
// }