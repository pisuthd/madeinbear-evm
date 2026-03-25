import { useEffect, useState } from 'react';
import { getLoans } from '../../services/api';
import type { Loan } from '../../types';

interface RecentActivityProps {
  walletAddress: string;
}

interface ActivityItem {
  type: 'lending' | 'borrowing';
  counterparty: string;
  amount: number;
  rate: number;
  status: string;
  createdAt: number;
  address: string;
}

export default function RecentActivity({ walletAddress }: RecentActivityProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [walletAddress]);

  const fetchActivities = async () => {
    try {
      const data = await getLoans();
      const loans = data.loans || [];

      // Filter loans where agent is involved (lender or borrower)
      const filtered = loans
        .filter((loan: Loan) => 
          loan.lender === walletAddress || loan.borrower === walletAddress
        )
        .map((loan: Loan): ActivityItem => {
          const isLender = loan.lender === walletAddress;
          const startTime = typeof loan.startTime === 'string' 
            ? new Date(loan.startTime).getTime() / 1000 
            : loan.startTime;

          // Handle status as either string or object (Anchor enum)
          const getStatusString = (status: string | Record<string, any>): string => {
            if (typeof status === 'string') {
              return status;
            }
            // If status is an object (Anchor enum), get the first key
            const keys = Object.keys(status);
            if (keys.length > 0) {
              // Capitalize first letter and rest as is
              return keys[0].charAt(0).toUpperCase() + keys[0].slice(1);
            }
            return 'Unknown';
          };

          return {
            type: isLender ? 'lending' : 'borrowing',
            counterparty: isLender ? loan.borrower : loan.lender,
            amount: loan.loanAmount,
            rate: loan.rateBps / 100,
            status: getStatusString(loan.status),
            createdAt: startTime,
            address: loan.address,
          };
        })
        .sort((a: ActivityItem, b: ActivityItem) => b.createdAt - a.createdAt); // Sort by newest first

      setActivities(filtered);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; bg: string }> = {
      'Created': { color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
      'CollateralLocked': { color: 'text-blue-400', bg: 'bg-blue-400/10' },
      'Funded': { color: 'text-green-400', bg: 'bg-green-400/10' },
      'Repaid': { color: 'text-purple-400', bg: 'bg-purple-400/10' },
      'Settled': { color: 'text-gray-400', bg: 'bg-gray-400/10' },
    };

    const config = statusConfig[status] || { color: 'text-gray-400', bg: 'bg-gray-400/10' };
    const label = status.replace(/([A-Z])/g, ' $1').trim();

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} ${config.bg}`}>
        {label}
      </span>
    );
  };

  const explorerUrl = (address: string) => {
    return `https://explorer.solana.com/address/${address}?cluster=devnet`;
  };

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-[#334155] p-6">
      <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Recent Activity</h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3eddfd]"></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#334155]/50 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-[#94a3b8] text-sm">No recent activity</p>
          <p className="text-[#64748b] text-xs mt-1">Your lending and borrowing activities will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <a
              key={activity.address}
              href={explorerUrl(activity.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-[#0f172a] rounded-lg p-4 border border-[#334155] hover:border-[#3eddfd]/50 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Activity Type & Amount */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      activity.type === 'lending' 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-blue-500/10 text-blue-400'
                    }`}>
                      {activity.type === 'lending' ? 'Lending' : 'Borrowing'}
                    </span>
                    <span className="text-[#f8fafc] font-semibold">
                      {(activity.amount / 1000000).toLocaleString()} USDC
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
                    <span className="font-mono">
                      {activity.type === 'lending' ? 'to ' : 'from '}
                      {formatAddress(activity.counterparty)}
                    </span>
                    <span className="text-[#64748b]">•</span>
                    <span>{activity.rate}% APR</span>
                  </div>
                </div>

                {/* Status & Time */}
                <div className="flex flex-col items-end gap-1">
                  {getStatusBadge(activity.status)}
                  <span className="text-xs text-[#64748b]">{formatDate(activity.createdAt)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}