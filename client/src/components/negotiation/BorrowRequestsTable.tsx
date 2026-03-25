import type { BorrowRequest } from '../../types';

interface BorrowRequestsTableProps {
  isLoading: boolean;
  requests: BorrowRequest[];
  userWalletAddress: string | undefined;
  onNegotiate: (request: BorrowRequest) => void;
  onAINegotiate: (request: BorrowRequest) => void;
  formatWalletAddress: (address: string) => string;
}

export function BorrowRequestsTable({
  isLoading,
  requests,
  userWalletAddress,
  onAINegotiate,
  formatWalletAddress,
}: BorrowRequestsTableProps) {
  // Helper function to extract status string from either string or object format
  const getStatusString = (status: string | Record<string, any>): string => {
    if (typeof status === 'string') {
      return status;
    }
    // If status is an object, get the first key (e.g., {matched: {}} -> "Matched")
    const keys = Object.keys(status);
    if (keys.length > 0) {
      // Capitalize first letter and rest as is
      return keys[0].charAt(0).toUpperCase() + keys[0].slice(1);
    }
    return 'Open'; // Default fallback
  };

  const getStatusColor = (status: string | Record<string, any>) => {
    const statusString = getStatusString(status);
    const colors: Record<string, string> = {
      'Open': 'bg-green-500/10 text-green-400 border-green-500/20',
      'Negotiating': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'Locked': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Funded': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'Completed': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
      'Active': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'Repaid': 'bg-green-500/10 text-green-400 border-green-500/20',
      'Defaulted': 'bg-red-500/10 text-red-400 border-red-500/20',
    };
    return colors[statusString] || 'bg-gray-500/10 text-gray-400';
  };

  const calculateLTV = (collateralValue: number, loanAmount: number): string => {
    if (collateralValue === 0) return '0';
    return ((loanAmount / collateralValue) * 100).toFixed(1);
  };

  const getTime = (input: number) => {
      if (input < 86400) {
        return `${input / 60 } minutes`
      } else {
        return `${input / 86400 } days`
      }
  }
 
  return (
    <div className="bg-[#1e293b] rounded-2xl border border-[#334155] overflow-hidden mb-8">
      <div className="p-6 border-b border-[#334155]">
        <h2 className="text-xl font-semibold text-[#f8fafc]">Borrow Requests</h2>
      </div>
      {isLoading ? (
        <div className="p-12 text-center text-[#94a3b8]">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center text-[#94a3b8]">No borrow requests found. Create one to get started!</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0f172a]">
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Borrower</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Collateral</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">LTV</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Requested</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Max Rate</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Duration</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={String(request.address)} className="border-t border-[#334155] hover:bg-[#0f172a]/50">
                  <td className="px-6 py-4">
                    <div className="text-[#3eddfd] font-mono text-sm">
                      {formatWalletAddress(String(request.borrower))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#f8fafc]">
                    <div>{request.collateralAmount / 100000000} mXAU</div>
                    <div className="text-xs text-[#94a3b8]">≈ ${(request.collateralUsdValue / 1000000).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 text-[#f8fafc]">
                    {calculateLTV(request.collateralUsdValue, request.requestedUsdc)}%
                  </td>
                  <td className="px-6 py-4 text-[#f8fafc]">
                    ${(request.requestedUsdc / 1000000).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-[#f8fafc]">
                    {(request.maxRateBps / 100).toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 text-[#f8fafc]"> 
                    { getTime(request.durationSeconds) }
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {getStatusString(request.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {getStatusString(request.status) === 'Open' && userWalletAddress !== String(request.borrower) && (
                        <>
                          <button
                            onClick={() => onAINegotiate(request)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90 transition-colors text-sm flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Make Offer
                          </button>
                        </>
                      )}
                      {userWalletAddress === String(request.borrower) && (
                        <span className="text-[#94a3b8] text-sm">Your request</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}