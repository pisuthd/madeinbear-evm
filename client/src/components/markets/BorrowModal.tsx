import { useState } from 'react';
import { useBorrow } from '../../hooks/useCCToken';

interface BorrowModalProps {
  market: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BorrowModal({ market, onClose, onSuccess }: BorrowModalProps) {
  const [amount, setAmount] = useState('');
  const { borrow, loading, error } = useBorrow();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    try {
      const amountInWei = BigInt(Math.floor(parseFloat(amount) * 10 ** market.decimals));
      await borrow(market.address, amountInWei);
      onSuccess();
    } catch (err) {
      console.error('Borrow failed:', err);
    }
  };

  const setMaxAmount = () => {
    // For now, set to 1000 as placeholder
    // In production, calculate based on collateral
    setAmount('1000');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] border border-[#3eddfd]/20 rounded-2xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#3eddfd]/10 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-[#f8fafc]">Borrow {market.symbol}</h3>
            <p className="text-sm text-[#94a3b8] mt-1">Borrow against your collateral</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0f172a] hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc] transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-2">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full px-4 py-3 bg-[#0f172a] border border-[#3eddfd]/20 rounded-lg text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-[#3eddfd] pr-20"
              />
              <button
                type="button"
                onClick={setMaxAmount}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-medium text-[#3eddfd] bg-[#3eddfd]/10 hover:bg-[#3eddfd]/20 rounded transition-colors"
              >
                MAX
              </button>
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-[#94a3b8]">Available: 1000.00 {market.underlying}</span>
              <span className="text-[#f59e0b]">Borrow APY: 5.00%</span>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-[#0f172a]/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">Borrow Limit Used</span>
              <span className="text-[#f8fafc]">0%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">Liquidation Threshold</span>
              <span className="text-[#f8fafc]">80%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">Health Factor</span>
              <span className="text-[#3eddfd]">∞</span>
            </div>
          </div>

          {/* Warning */}
          {/* <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-400">
              ⚠️ Ensure you maintain sufficient collateral to avoid liquidation. If health factor falls below 1, your position may be liquidated.
            </p>
          </div> */}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error.message}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0 || loading}
            className="w-full px-4 py-3 bg-[#f59e0b] hover:bg-[#f59e0b]/90 disabled:bg-[#f59e0b]/30 disabled:cursor-not-allowed text-[#0f172a] font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-[#0f172a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Borrowing...
              </>
            ) : (
              'Borrow Assets'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}