import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useAllMockTokens } from '../hooks/useFaucet';

function MockTokenFaucet() {
  const { address } = useAccount();
  const [mintingToken, setMintingToken] = useState<string | null>(null);
  
  // Pass address to ensure re-fetch when address changes
  const tokens = useAllMockTokens(address);

  const formatBalance = (balance: bigint, decimals: number) => {
    if (!balance) return '0.00';
    const divisor = BigInt(10 ** decimals);
    const whole = balance / divisor;
    const fraction = balance % divisor;
    return `${Number(whole).toLocaleString()}.${fraction.toString().padStart(decimals, '0').slice(0, 2)}`;
  };

  const formatMintAmount = (amount: bigint, decimals: number) => {
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    const formattedFraction = fraction.toString().padStart(decimals, '0').slice(0, 2);
    // Remove trailing zeros from fraction
    const cleanFraction = formattedFraction.replace(/0+$/, '');
    return cleanFraction ? `${Number(whole).toLocaleString()}.${cleanFraction}` : `${Number(whole).toLocaleString()}`;
  };

  const handleMint = async (tokenAddress: string, mintFn: () => Promise<void>) => {
    if (!address) return;
    setMintingToken(tokenAddress);
    try {
      await mintFn();
    } catch (error) {
      // Error handled by hook
    } finally {
      setMintingToken(null);
    }
  };

  return (
    <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">Faucet</h3>
      <p className="text-sm text-[#94a3b8] mb-6">
        Mint test tokens to try the protocol on Sepolia Testnet.
      </p>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3eddfd]/10">
              <th className="text-left py-3 px-4 text-sm font-medium text-[#94a3b8]">Token</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Balance</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Action</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => (
              <tr key={token.address} className="border-b border-[#3eddfd]/10 hover:bg-[#0f172a]/50 transition-colors">
                {/* Token */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <img src={token.icon} alt={token.symbol} className="w-10 h-10 rounded-full" />
                    <div>
                      <div className="font-medium text-[#f8fafc]">{token.symbol}</div>
                      <div className="text-xs text-[#94a3b8]">{token.name}</div>
                    </div>
                  </div>
                </td>
                
                {/* Balance */}
                <td className="text-right py-4 px-4">
                  <span className="text-lg font-semibold text-[#f8fafc]">
                    {formatBalance(token.balance, token.decimals)}
                  </span>
                </td>
                
                {/* Mint Button */}
                <td className="text-right py-4 px-4">
                  <button
                    onClick={() => handleMint(token.address, () => token.mint(address as `0x${string}`))}
                    disabled={mintingToken !== null || !address}
                    className="px-4 py-2 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg text-sm hover:bg-[#3eddfd]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {mintingToken === token.address 
                      ? 'Minting...' 
                      : `Mint ${formatMintAmount(token.mintAmount, token.decimals)} ${token.symbol}`
                    }
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Error Messages */}
      {tokens.some(t => t.mintError) && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">
            {tokens.find(t => t.mintError)?.mintError?.message || 'Failed to mint tokens'}
          </p>
        </div>
      )}

      {/* Wallet Not Connected Notice */}
      {!address && (
        <div className="mt-6 p-4 bg-[#0f172a] rounded-xl border border-[#334155] text-[#94a3b8] flex items-center gap-3">
          <svg className="w-6 h-6 text-[#3eddfd] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold text-[#f8fafc]">Wallet Required</p>
            <p className="text-sm">Connect your wallet to mint test tokens</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MockTokenFaucet;
