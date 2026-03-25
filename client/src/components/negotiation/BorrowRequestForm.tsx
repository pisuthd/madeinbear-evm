interface BorrowRequestFormProps {
  show: boolean;
  isLoading: boolean;
  formData: {
    collateralAmount: string;
    requestedUsdc: string;
    maxRateBps: string;
    durationDays: string;
  };
  prices: { XAU_USD: { price: number } } | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onChange: (data: any) => void;
}

export function BorrowRequestForm({
  show,
  isLoading,
  formData,
  prices,
  onSubmit,
  onCancel,
  onChange,
}: BorrowRequestFormProps) {
  const calculateLTV = (collateralValue: number, loanAmount: number): string => {
    if (collateralValue === 0) return '0';
    return ((loanAmount / collateralValue) * 100).toFixed(1);
  };

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-[#1e293b] rounded-2xl border border-[#334155] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-[#f8fafc] mb-2">Create Borrow Request</h2>
        <p className="text-sm text-blue-400 mb-6">Ensure your agent wallet has SOL to pay transaction fees.</p>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Collateral Amount (mXAU)
            </label>
            <input
              type="number"
              step="0.001"
              value={formData.collateralAmount}
              onChange={(e) => onChange({ ...formData, collateralAmount: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#3eddfd]"
              placeholder="1.0"
              required
            />
            {prices && formData.collateralAmount && (
              <p className="text-sm text-[#94a3b8] mt-1">
                ≈ $ {(parseFloat(formData.collateralAmount) * prices.XAU_USD.price).toFixed(2)} USD value
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Requested USDC
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.requestedUsdc}
              onChange={(e) => onChange({ ...formData, requestedUsdc: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#3eddfd]"
              placeholder="1000"
              required
            />
            {formData.collateralAmount && formData.requestedUsdc && prices && (
              <p className="text-sm text-[#cbd5e1] mt-1">
                LTV: {calculateLTV(
                  parseFloat(formData.collateralAmount) * prices.XAU_USD.price,
                  parseFloat(formData.requestedUsdc)
                )}%
                {parseFloat(calculateLTV(parseFloat(formData.collateralAmount) * prices.XAU_USD.price, parseFloat(formData.requestedUsdc))) > 70 && (
                  <span className="text-red-400 ml-2"> (Exceeds 70% max)</span>
                )}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Max Interest Rate (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.maxRateBps}
              onChange={(e) => onChange({ ...formData, maxRateBps: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#3eddfd]"
              placeholder="5.00"
              required
            />
            <p className="text-sm text-[#94a3b8] mt-1">
              {formData.maxRateBps && `Annual interest rate: ${formData.maxRateBps}%`}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Duration (Days)
            </label>
            <input
              type="number"
              value={formData.durationDays}
              onChange={(e) => onChange({ ...formData, durationDays: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#3eddfd]"
              placeholder="30"
              required
            />
          </div>
          <div className="md:col-span-2 flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg hover:bg-[#2dd4d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Posting...' : 'Post Request'}
            </button>
            <button
              type="button"
              onClick={onCancel}
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