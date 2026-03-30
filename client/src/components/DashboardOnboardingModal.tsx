interface DashboardOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function DashboardOnboardingModal({ isOpen, onClose }: DashboardOnboardingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-[#1e293b] border border-[#3eddfd]/20 rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-[#0f172a] hover:bg-[#3eddfd]/10 text-[#94a3b8] hover:text-[#3eddfd] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#f8fafc] mb-2">Welcome</h2>

          <div className="w-16 h-1 bg-[#3eddfd]" />
        </div>
        <p className="text-lg text-[#94a3b8] mb-4">This version you can:</p>
        {/* Capabilities List */}
        <div className="space-y-6 mb-8">
          {/* Item 1 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20">
              <svg className="w-6 h-6 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-1">Wrap Tokens</h3>
              <p className="text-[#94a3b8] leading-relaxed">
                Convert ERC-20 tokens (USDT/WETH) to confidential tokens on FHERC20 confidential token standard
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20">
              <svg className="w-6 h-6 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-1">Unwrap & Claim</h3>
              <p className="text-[#94a3b8] leading-relaxed">
                Convert confidential tokens back to ERC-20 and claim your tokens after process is complete
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20">
              <svg className="w-6 h-6 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-1">Supply & Borrow</h3>
              <p className="text-[#94a3b8] leading-relaxed">
                Explore markets to supply and borrow with encrypted state tracking (simplified: no actual token transfers yet for this version)
              </p>
            </div>
          </div>

          {/* Item 4 */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[#3edfdf]/10 flex items-center justify-center border border-[#3eddfd]/20">
              <svg className="w-6 h-6 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-1">Track Private Positions</h3>
              <p className="text-[#94a3b8] leading-relaxed">
                View your confidential supply/borrow positions by decrypting encrypted data on-chain with decryptForView()
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-[#3eddfd] hover:bg-[#2dd4d4] text-[#0f172a] font-semibold rounded-lg transition-colors"
          >
            Got it, let's start!
          </button>
        </div>
      </div>
    </div>
  );
}

export default DashboardOnboardingModal;