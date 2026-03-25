import type { Loan } from '../../types';
import { formatWalletAddress } from '../../services/api';
import { LoanStatusBadge } from './LoanStatusBadge';

interface LoanRowProps {
  loan: Loan;
  userWalletAddress: string | undefined;
  onLockCollateral: (loan: Loan) => void;
  onFundLoan: (loan: Loan) => void;
  onRepayLoan: (loan: Loan) => void;
  onSettleLoan: (loan: Loan) => void;
}

export function LoanRow({
  loan,
  userWalletAddress,
  onLockCollateral,
  onFundLoan,
  onRepayLoan,
  onSettleLoan,
}: LoanRowProps) {
  // Helper to get status as string
  const getStatusString = (status: string | Record<string, any>): string => {
    if (typeof status === 'string') return status;
    const keys = Object.keys(status);
    return keys[0] ? keys[0].charAt(0).toUpperCase() + keys[0].slice(1) : 'Unknown';
  };
 
  const currentStatus = getStatusString(loan.status);
  const isLender = userWalletAddress === loan.lender;
  const isBorrower = userWalletAddress === loan.borrower;

  // Calculate interest and total repayment
  const calculateInterest = (amount: number, rateBps: number, durationSeconds: number): number => {
    const interest = (amount * (rateBps / 10000) * (durationSeconds / 31536000));
    return interest;
  };

  // const calculateTotalRepayment = (amount: number, rateBps: number, durationSeconds: number): number => {
  //   return amount + calculateInterest(amount, rateBps, durationSeconds);
  // };

  const getMaturityDate = (startTime: string | number, duration: number): string => {
    const startTimestamp = typeof startTime === 'number'
      ? startTime
      : new Date(startTime).getTime() / 1000;
    return new Date((startTimestamp + duration) * 1000).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const interest = calculateInterest(loan.loanAmount, loan.rateBps, loan.durationSeconds);

  const getTime = (input: number) => {
    if (input < 86400) {
      return `${input / 60} minutes`
    } else {
      return `${input / 86400} days`
    }
  }

  return (
    <tr key={loan.address} className="border-t border-[#334155] hover:bg-[#0f172a]/50">
      <td className="px-6 py-4">
        <div className="text-[#3eddfd] font-mono text-sm">
          {formatWalletAddress(loan.lender)}
        </div>
        {isLender && (
          <span className="text-xs text-[#22c55e] ml-2">(You)</span>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="text-[#f8fafc] font-mono text-sm">
          {formatWalletAddress(loan.borrower)}
        </div>
        {isBorrower && (
          <span className="text-xs text-[#22c55e] ml-2">(You)</span>
        )}
      </td>
      <td className="px-6 py-4 text-[#f8fafc]">
        <div>${(loan.loanAmount / 1000000).toLocaleString()} USDC</div>
        <div className="text-xs text-[#94a3b8]">
          Interest: ${(interest / 1000000).toFixed(2)}
        </div>
      </td>
      <td className="px-6 py-4 text-[#f8fafc]">
        {(loan.rateBps / 100).toFixed(2)}% APR
      </td>
      <td className="px-6 py-4 text-[#f8fafc]">
        {getTime(loan.durationSeconds)}
      </td>
      <td className="px-6 py-4 text-[#f8fafc]">
        { currentStatus === 'CollateralLocked' ? "--" :getMaturityDate(loan.startTime, loan.durationSeconds)}
      </td>
      <td className="px-6 py-4">
        <LoanStatusBadge status={loan.status} />
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2 flex-wrap">
          {/* Lock Collateral: Borrower transfers mXAU to vault when status is CollateralLocked */}
          {currentStatus === 'CollateralLocked' && isBorrower && (
            <button
              onClick={() => onLockCollateral(loan)}
              className="px-3 py-1.5 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors text-xs"
            >
              Lock Collateral
            </button>
          )}
          {/* Fund Loan: Lender transfers USDC to borrower when status is CollateralLocked */}
          {currentStatus === 'CollateralLocked' && isLender && (
            <button
              onClick={() => onFundLoan(loan)}
              className="px-3 py-1.5 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg hover:bg-[#2dd4d4] transition-colors text-xs"
            >
              Fund Loan
            </button>
          )}
          {/* Repay: Borrower repays principal + interest when status is Active */}
          {currentStatus === 'Active' && isBorrower && (
            <button
              onClick={() => onRepayLoan(loan)}
              className="px-3 py-1.5 bg-purple-500 text-white font-semibold rounded-lg hover:bg-purple-600 transition-colors text-xs"
            >
              Repay
            </button>
          )}
          {/* Settle: Lender claims repayment + returns collateral when status is Repaid */}
          {currentStatus === 'Repaid' && isLender && (
            <button
              onClick={() => onSettleLoan(loan)}
              className="px-3 py-1.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors text-xs"
            >
              Settle
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}