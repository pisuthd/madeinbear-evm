import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useWETHFaucet, useUSDTFaucet } from '../hooks/useFaucet';

type SuccessMessage = { weth: boolean; usdt: boolean };

function MockTokenFaucet() {
  const { address } = useAccount();
  const { mintWETH, loading: wethLoading, error: wethError } = useWETHFaucet();
  const { mintUSDT, loading: usdtLoading, error: usdtError } = useUSDTFaucet();
  const [success, setSuccess] = useState<SuccessMessage>({ weth: false, usdt: false });

  const handleMintWETH = async () => {
    if (!address) return;
    setSuccess(prev => ({ ...prev, weth: false }));
    try {
      await mintWETH(address as `0x${string}`);
      setSuccess(prev => ({ ...prev, weth: true }));
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleMintUSDT = async () => {
    if (!address) return;
    setSuccess(prev => ({ ...prev, usdt: false }));
    try {
      await mintUSDT(address as `0x${string}`);
      setSuccess(prev => ({ ...prev, usdt: true }));
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-[#334155] p-6">
      <h3 className="text-lg font-semibold text-[#f8fafc] mb-2">Faucet</h3>
      <p className="text-sm text-[#94a3b8] mb-6">
        Mint test WETH and USDT tokens for testing on Sepolia testnet.
      </p>

      <div className="grid grid-cols-3 gap-4">
        {/* WETH Faucet */}
        <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155] hover:border-[#3eddfd]/30 transition-all">
          {/* WETH Success Message */}
          {success.weth && (
            <div className="mb-4 p-3 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[#22c55e] text-sm font-medium">Successfully minted 10 WETH!</span>
            </div>
          )}

          {/* WETH Error Message */}
          {wethError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-red-400 text-sm font-medium">{wethError.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#627eea] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#627eea]/30">
                ⟠
              </div>
              <div>
                <p className="font-bold text-[#f8fafc] text-lg">WETH</p>
                <p className="text-sm text-[#94a3b8]">Wrapped ETH</p>
              </div>
            </div>
            <span className="text-[#3eddfd] font-mono text-lg font-semibold">10 tokens</span>
          </div>
          <button
            onClick={handleMintWETH}
            disabled={wethLoading || !address}
            className="w-full px-6 py-3 bg-[#3eddfd] text-[#0f172a] font-bold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_20px_rgba(62,223,223,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {wethLoading ? 'Minting...' : 'Mint WETH'}
          </button>
        </div>

        {/* USDT Faucet */}
        <div className="bg-[#0f172a] rounded-lg p-6 border border-[#334155] hover:border-[#3eddfd]/30 transition-all">
          {/* USDT Success Message */}
          {success.usdt && (
            <div className="mb-4 p-3 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-[#22c55e] text-sm font-medium">Successfully minted 10,000 USDT!</span>
            </div>
          )}

          {/* USDT Error Message */}
          {usdtError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="text-red-400 text-sm font-medium">{usdtError.message}</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#26a17b] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#26a17b]/30">
                ₮
              </div>
              <div>
                <p className="font-bold text-[#f8fafc] text-lg">USDT</p>
                <p className="text-sm text-[#94a3b8]">Tether USD</p>
              </div>
            </div>
            <span className="text-[#3eddfd] font-mono text-lg font-semibold">10,000 tokens</span>
          </div>
          <button
            onClick={handleMintUSDT}
            disabled={usdtLoading || !address}
            className="w-full px-6 py-3 bg-[#3eddfd] text-[#0f172a] font-bold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_20px_rgba(62,223,223,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            {usdtLoading ? 'Minting...' : 'Mint USDT'}
          </button>
        </div>
      </div>

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