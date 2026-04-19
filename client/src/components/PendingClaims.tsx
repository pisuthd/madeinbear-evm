// import { useAccount } from 'wagmi';
// import { usePendingClaims, useCToken, type Claim } from '../hooks/useCToken';
// import { useCoFHE } from '../context/CoFHEContext';
// import { useState } from 'react';
// import { DEPLOYMENTS } from '../constants/deployments';

// const TOKENS: Record<string, { icon: string; name: string; cTokenAddress: `0x${string}` }> = {
//   ccUSDT: {
//     icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
//     name: 'Confidential USDT',
//     cTokenAddress: DEPLOYMENTS[11155111].cUSDT as `0x${string}`,
//   },
//   ccETH: {
//     icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
//     name: 'Confidential ETH',
//     cTokenAddress: DEPLOYMENTS[11155111].cETH as `0x${string}`,
//   },
// };

// export default function PendingClaims() {
//   const { address } = useAccount();
//   const { pendingClaims } = usePendingClaims(address);
//   const { claim } = useCToken();
//   const { client: cofheClient } = useCoFHE();
//   const [claiming, setClaiming] = useState<Record<string, boolean>>({});
//   const [claimError, setClaimError] = useState<string | null>(null);

//   const formatBalance = (balance: bigint, decimals = 6) => {
//     const divisor = BigInt(10 ** decimals);
//     const whole = balance / divisor;
//     const fraction = balance % divisor;
//     return `${Number(whole).toLocaleString()}.${fraction.toString().padStart(decimals, '0').slice(0, 6)}`;
//   };

//   const handleClaim = async (claimData: Claim) => {
//     if (!cofheClient) {
//       setClaimError('CoFHE client not connected');
//       return;
//     }

//     if (!claimData.token) {
//       setClaimError('Token information missing');
//       return;
//     }

//     setClaiming(prev => ({ ...prev, [claimData.ctHash]: true }));
//     setClaimError(null);

//     try {
//       // Decrypt the ciphertext hash to get the plaintext and signature
//       const decryptResult = await cofheClient
//         .decryptForTx(claimData.ctHash)
//         .withoutPermit()
//         .execute();

//       if (!decryptResult) {
//         throw new Error('Decryption failed - no result returned');
//       }

//       const { decryptedValue, signature } = decryptResult;

//       if (!decryptedValue || decryptedValue === 0n) {
//         throw new Error('Decryption returned zero amount. Please try again.');
//       }

//       if (!signature) {
//         throw new Error('Decryption failed - no signature returned');
//       }

//       // Claim the unshielded tokens on-chain
//       const tokenInfo = TOKENS[claimData.token];
//       await claim(
//         tokenInfo.cTokenAddress,
//         claimData.ctHash,
//         decryptedValue,
//         signature as `0x${string}`
//       );
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Failed to claim';
//       setClaimError(errorMessage);
//     } finally {
//       setClaiming(prev => ({ ...prev, [claimData.ctHash]: false }));
//     }
//   };

//   if (!address) {
//     return (
//       <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
//         <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">Pending Claims</h3>
//         <p className="text-[#94a3b8]">Connect your wallet to view pending claims</p>
//       </div>
//     );
//   }

//   if (pendingClaims.length === 0) {
//     return (
//       <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
//         <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">Pending Claims</h3>
//         <p className="text-[#94a3b8]">No pending claims</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
//       <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">Pending Claims</h3>
//       <p className="text-sm text-[#94a3b8] mb-6">
//         Claim your unshielded tokens after decryption is complete.
//       </p>

//       {claimError && (
//         <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
//           <p className="text-sm text-red-400">{claimError}</p>
//         </div>
//       )}

//       <div className="overflow-x-auto">
//         <table className="w-full">
//           <thead>
//             <tr className="border-b border-[#3eddfd]/10">
//               <th className="text-left py-3 px-4 text-sm font-medium text-[#94a3b8]">Token</th>
//               <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Amount</th> 
//               <th className="text-center py-3 px-4 text-sm font-medium text-[#94a3b8]">Action</th>
//             </tr>
//           </thead>
//           <tbody>
//             {pendingClaims.map((claimData) => {
//               const tokenInfo = TOKENS[claimData.token];
//               if (!tokenInfo) return null;

//               const isClaiming = claiming[claimData.ctHash];

//               return (
//                 <tr key={claimData.ctHash} className="border-b border-[#3eddfd]/10 hover:bg-[#0f172a]/50 transition-colors">
//                   <td className="py-4 px-4">
//                     <div className="flex items-center gap-3">
//                       <img
//                         src={tokenInfo.icon}
//                         alt={claimData.token}
//                         className="w-10 h-10 rounded-full"
//                       />
//                       <div>
//                         <div className="font-medium text-[#f8fafc]">{claimData.token}</div>
//                         <div className="text-xs text-[#94a3b8]">{tokenInfo.name}</div>
//                       </div>
//                     </div>
//                   </td>
//                   <td className="text-right py-4 px-4">
//                     <span className="text-lg font-semibold text-[#f8fafc]">
//                       {formatBalance(claimData.requestedAmount)}
//                     </span>
//                   </td> 
//                   <td className="text-center py-4 px-4">
//                     <button
//                       onClick={() => handleClaim(claimData)}
//                       disabled={isClaiming}
//                       className="px-4 py-2 bg-[#3eddfd] hover:bg-[#3eddfd]/80 disabled:bg-[#3eddfd]/50 disabled:cursor-not-allowed text-[#0f172a] font-medium rounded-lg transition-all text-sm"
//                     >
//                       {isClaiming ? 'Claiming...' : 'Claim'}
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }