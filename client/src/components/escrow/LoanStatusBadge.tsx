
interface LoanStatusBadgeProps {
  status: string | Record<string, any>;
}

export function LoanStatusBadge({ status }: LoanStatusBadgeProps) {
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

  const getStatusColor = (status: string | Record<string, any>) => {
    const statusString = getStatusString(status).toLowerCase();
    const colors: Record<string, string> = {
      'collaterallocked': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      'active': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      'repaid': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'settled': 'bg-green-500/10 text-green-400 border-green-500/20',
      'liquidated': 'bg-red-500/10 text-red-400 border-red-500/20',
      'unknown': 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    return colors[statusString] || 'bg-gray-500/10 text-gray-400';
  };

  let statusString = getStatusString(status);
  if (statusString === "CollateralLocked") {
    statusString = "Prepare"
  }
  const colorClass = getStatusColor(status);

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {statusString}
    </span>
  );
}