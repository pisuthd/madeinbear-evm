import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useCToken } from '../hooks/useCToken'; 

interface TokenConfig {
  symbol: string;
  cSymbol: string;
  name: string;
  erc20Address: `0x${string}`;
  cTokenAddress: `0x${string}`;
  decimals: number;
  icon: string;
}

interface ConvertModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'wrap' | 'unwrap';
  token: TokenConfig | null;
  erc20Balance: bigint;
  confidentialBalance: bigint;
  onSuccess: () => void;
}

export default function ConvertModal({
  isOpen,
  onClose,
  mode,
  token,
  erc20Balance,
  confidentialBalance,
  onSuccess,
}: ConvertModalProps) {
  const { address } = useAccount();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { wrap, unwrap } = useCToken();

  if (!isOpen || !token) return null;

  const balance = mode === 'wrap' ? erc20Balance : confidentialBalance;
  const decimals = token.decimals;

  const formatBalance = (bal: bigint) => {
    const divisor = BigInt(10 ** decimals);
    const whole = bal / divisor;
    const fraction = bal % divisor;
    return `${Number(whole).toLocaleString()}.${fraction.toString().padStart(decimals, '0').slice(0, 2)}`;
  };

  const parseAmount = (value: string) => {
    if (!value) return 0n;
    const [whole, fraction = '0'] = value.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction || '0');
  };

  const setPercentage = (pct: number) => {
    const amountInWei = (balance * BigInt(pct)) / BigInt(100);
    const whole = amountInWei / BigInt(10 ** decimals);
    const fraction = amountInWei % BigInt(10 ** decimals);
    setAmount(`${whole}.${fraction.toString().padStart(decimals, '0').slice(0, 2)}`);
  };

  const handleSubmit = async () => {
    if (!address || !amount) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const amountInWei = parseAmount(amount);
      if (amountInWei > balance) {
        setError('Insufficient balance');
        return;
      }

      if (mode === 'wrap') {
        await wrap(token.cTokenAddress, amountInWei, address);
        setSuccess(`Wrapped ${amount} ${token.symbol}!`);
      } else {
        await unwrap(token.cTokenAddress, amountInWei, address, amountInWei);
        setSuccess(`Unwrapping ${amount} ${token.cSymbol}...`);
      }

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#1e293b] border border-[#3eddfd]/20 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#f8fafc]">
            {mode === 'wrap' ? 'Wrap' : 'Unwrap'} {mode === 'wrap' ? token.symbol : token.cSymbol}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#3eddfd]/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Balance */}
        <div className="mb-4 p-3 bg-[#0f172a] rounded-lg">
          <span className="text-sm text-[#94a3b8]">Your Balance</span>
          <div className="flex items-center gap-2 mt-1">
            <img src={token.icon} alt={token.symbol} className="w-6 h-6 rounded-full" />
            <span className="text-lg font-semibold text-[#f8fafc]">
              {formatBalance(balance)} {mode === 'wrap' ? token.symbol : token.cSymbol}
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="block text-sm text-[#94a3b8] mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0f172a] border border-[#3eddfd]/20 rounded-lg px-4 py-3 text-xl text-[#f8fafc] text-center focus:outline-none focus:border-[#3eddfd]/50"
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2 mb-6">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              onClick={() => setPercentage(pct)}
              className="flex-1 py-2 bg-[#3eddfd]/10 text-[#3eddfd] font-medium rounded-lg hover:bg-[#3eddfd]/20 transition-colors text-sm"
            >
              {pct === 100 ? 'MAX' : `${pct}%`}
            </button>
          ))}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
            {success}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#0f172a] text-[#94a3b8] font-medium rounded-lg hover:bg-[#1e293b] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!amount || loading}
            className="flex-1 py-3 bg-[#3eddfd] text-[#0f172a] font-bold rounded-lg hover:bg-[#3eddfd]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : mode === 'wrap' ? 'Wrap' : 'Unwrap'}
          </button>
        </div>
      </div>
    </div>
  );
}