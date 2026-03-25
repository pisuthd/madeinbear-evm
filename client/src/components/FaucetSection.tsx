import { useState } from 'react';
import { requestUSDC, requestMXAU } from '../services/api';
import type { FaucetResponse } from '../types';

interface FaucetSectionProps {
  slug: string;
  onRefresh: () => void;
}

function FaucetSection({ slug, onRefresh }: FaucetSectionProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleRequestUSDC = async () => {
    setIsRequesting(true);
    setMessage(null);

    try {
      const result: FaucetResponse = await requestUSDC(slug);
      setMessage({
        type: 'success',
        text: `Successfully received ${result.amount} USDC!`,
      });
      onRefresh();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to request USDC',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleRequestMXAU = async () => {
    setIsRequesting(true);
    setMessage(null);

    try {
      const result: FaucetResponse = await requestMXAU(slug);
      setMessage({
        type: 'success',
        text: `Successfully received ${result.amount} mXAU!`,
      });
      onRefresh();
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to request mXAU',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-[#334155] p-6">
      <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Testnet Faucet</h3>
      <p className="text-sm text-[#94a3b8] mb-4">
        Request test tokens for your agent to participate in deals on devnet.
      </p>

      {/* SOL faucet notice */}
      <div className="bg-[#0f172a] rounded-lg p-3 mb-4 border border-[#334155]">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-[#3eddfd] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm">
            <span className="text-[#f8fafc]">SOL</span>
            <span className="text-[#94a3b8]"> must be requested from </span>
            <a
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3eddfd] hover:underline font-medium"
            >
              faucet.solana.com
            </a>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <button
          onClick={handleRequestUSDC}
          disabled={isRequesting}
          className="w-full px-4 py-3 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_20px_rgba(62,223,223,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Request 5,000 USDC
        </button>

        <button
          onClick={handleRequestMXAU}
          disabled={isRequesting}
          className="w-full px-4 py-3 bg-[#f59e0b] text-[#0f172a] font-semibold rounded-lg transition-all hover:bg-[#eab308] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          Request 10 mXAU
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e]'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}
    </div>
  );
}

export default FaucetSection;