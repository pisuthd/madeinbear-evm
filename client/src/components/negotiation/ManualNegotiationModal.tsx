import type { BorrowRequest } from '../../types';

interface ManualNegotiationModalProps {
  show: boolean;
  request: BorrowRequest | null;
  agreedUsdc: string;
  agreedRateBps: string;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  onChange: (usdc: string, rate: string) => void;
}

export function ManualNegotiationModal({
  show,
  request,
  agreedUsdc,
  agreedRateBps,
  isSubmitting,
  onSubmit,
  onClose,
  onChange,
}: ManualNegotiationModalProps) {
  if (!show || !request) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] rounded-2xl border border-[#334155] p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-[#f8fafc] mb-6">Negotiate Loan Terms</h2>
        <div className="bg-[#0f172a] rounded-lg p-4 mb-6">
          <div className="text-sm text-[#94a3b8] mb-2">Original Request</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#cbd5e1]">Collateral:</span> {request.collateralAmount} mXAU
            </div>
            <div>
              <span className="text-[#cbd5e1]">Requested:</span> ${request.requestedUsdc} USDC
            </div>
            <div>
              <span className="text-[#cbd5e1]">Max Rate:</span> {request.maxRateBps / 100}%
            </div>
            <div>
              <span className="text-[#cbd5e1]">Duration:</span> {request.durationSeconds / 86400} days
            </div>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Agreed USDC Amount
            </label>
            <input
              type="number"
              step="0.01"
              value={agreedUsdc}
              onChange={(e) => onChange(e.target.value, agreedRateBps)}
              className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#3eddfd]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Agreed Rate (Basis Points)
            </label>
            <input
              type="number"
              value={agreedRateBps}
              onChange={(e) => onChange(agreedUsdc, e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#3eddfd]"
              required
            />
            <p className="text-sm text-[#94a3b8] mt-1">
              {(parseInt(agreedRateBps) / 100).toFixed(2)}% APR
            </p>
          </div>
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg hover:bg-[#2dd4d4] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Negotiating...' : 'Accept Terms'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-[#334155] text-[#f8fafc] font-semibold rounded-lg hover:bg-[#475569] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}