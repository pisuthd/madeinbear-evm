import type { Loan } from '../../types';
import { formatWalletAddress } from '../../services/api';

interface LoanActionModalProps {
  isOpen: boolean;
  action: 'lock' | 'fund' | 'repay' | 'settle' | null;
  loan: Loan | null;
  counterpartyInput: string;
  onCounterpartyChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export function LoanActionModal({
  isOpen,
  action,
  loan,
  onSubmit,
  onClose,
  isSubmitting,
}: LoanActionModalProps) {
  if (!isOpen || !action || !loan) return null;

  const getActionDescription = () => {
    switch (action) {
      case 'lock':
        return 'This will lock your mXAU collateral in the escrow contract.';
      case 'fund':
        return 'This will transfer USDC from your agent to the borrower.';
      case 'repay':
        return 'This will repay the loan amount + interest to the lender.';
      case 'settle':
        return 'This will return collateral to borrower and repayment to lender.';
    }
  };

  const getActionLabel = () => {
    const labels: Record<string, string> = {
      lock: 'Lock Collateral',
      fund: 'Fund Loan',
      repay: 'Repay Loan',
      settle: 'Settle Loan',
    };
    return labels[action] || action;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] rounded-2xl border border-[#334155] p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-[#f8fafc] mb-6 capitalize">
          {getActionLabel()}
        </h2>
        
        <div className="bg-[#0f172a] rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#94a3b8]">Lender:</span>
              <div className="text-[#f8fafc] font-mono text-xs">{formatWalletAddress(loan.lender)}</div>
            </div>
            <div>
              <span className="text-[#94a3b8]">Borrower:</span>
              <div className="text-[#f8fafc] font-mono text-xs">{formatWalletAddress(loan.borrower)}</div>
            </div>
            <div>
              <span className="text-[#94a3b8]">Amount:</span>
              <div className="text-[#f8fafc]">${(loan.loanAmount / 1000000).toLocaleString()} USDC</div>
            </div>
            <div>
              <span className="text-[#94a3b8]">Rate:</span>
              <div className="text-[#f8fafc]">{(loan.rateBps / 100).toFixed(2)}% APR</div>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* <div>
            <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
              {action === 'fund' ? 'Your Agent Slug' : 'Counterparty Slug'}
            </label>
            <input
              type="text"
              value={counterpartyInput}
              onChange={(e) => onCounterpartyChange(e.target.value)}
              placeholder="Enter agent slug"
              className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#3eddfd]"
            />
            <p className="text-xs text-[#94a3b8] mt-1">
              Enter the agent slug for the counterparty or your own agent
            </p>
          </div> */}
          
          <div className="bg-[#334155]/50 rounded-lg p-3 text-sm text-[#cbd5e1]">
            {getActionDescription()}
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-2.5 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg hover:bg-[#2dd4d4] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : `Confirm ${action}`}
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