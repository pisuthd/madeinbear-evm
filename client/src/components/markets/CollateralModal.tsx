import { useState } from 'react';
import { useSupplyCollateral, useWithdrawCollateral, getUSDTMarketParams } from '../../hooks/useCMorphoActions';
 
import { useCTokenBalance } from '../../hooks/useCTokenBalance';
import { useUserCollateralPosition } from '../../hooks/useCMorphoPosition';
import { DEPLOYMENTS } from '../../constants/deployments';

interface CollateralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CollateralModal({ isOpen, onClose, onSuccess }: CollateralModalProps) {
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);

  const marketParams = getUSDTMarketParams();
  const cETHAddress = DEPLOYMENTS[11155111]?.cETH as `0x${string}`;
  const { balance: cETHBalance, refresh: refreshETHBalance } = useCTokenBalance(cETHAddress);
  const { collateral: userCollateral, refetch: refetchPosition } = useUserCollateralPosition();

  const { supplyCollateral, loading: supplyLoading } = useSupplyCollateral();
  const { withdrawCollateral, loading: withdrawLoading } = useWithdrawCollateral();

  if (!isOpen) return null;

  const formatAmount = (value: bigint | undefined, decimals: number = 6) => {
    if (!value || value === 0n) return '0.00';
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const remainder = value % divisor;
    const fractional = remainder.toString().padStart(decimals, '0').slice(0, 2);
    return `${whole.toString()}.${fractional}`;
  };

  const handleDeposit = async () => {
    if (!marketParams || !amount) return;
    
    const amountBigInt = BigInt(parseFloat(amount) * 1e6);
    if (amountBigInt <= 0n) return;

    setTxHash(null);

    try {
      const hash = await supplyCollateral(amountBigInt, marketParams);
      setAmount('');
      setTxHash(hash);
      refreshETHBalance();
      refetchPosition();
      onSuccess();
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!marketParams || !amount) return;
    
    const amountBigInt = BigInt(parseFloat(amount) * 1e6);
    if (amountBigInt <= 0n) return;

    setTxHash(null);

    try {
      const hash = await withdrawCollateral(amountBigInt, marketParams);
      setAmount('');
      setTxHash(hash);
      refreshETHBalance();
      refetchPosition();
      onSuccess();
    } catch (error) {
      console.error('Withdraw failed:', error);
    }
  };

  const handleSubmit = async () => {
    if (mode === 'deposit') {
      await handleDeposit();
    } else {
      await handleWithdraw();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1e293b] border border-[#f59e0b]/20 rounded-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#f8fafc]">Collateral</h2>
          <button 
            onClick={onClose}
            className="text-[#94a3b8] hover:text-[#f8fafc] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Token Info */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-[#0f172a] rounded-lg">
          <img 
            src="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" 
            alt="ETH" 
            className="w-10 h-10 rounded-full"
          />
          <div>
            <div className="text-[#f8fafc] font-semibold">cETH</div>
            <div className="text-[#94a3b8] text-sm">Confidential ETH</div>
          </div>
        </div>

        {/* Balance Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-[#0f172a] rounded-lg">
              <div className="text-[#94a3b8] text-xs mb-1">Wallet Balance</div>
              <div className="text-[#f8fafc] font-semibold">{formatAmount(cETHBalance)} cETH</div>
            </div>
            <div className="p-3 bg-[#0f172a] rounded-lg">
              <div className="text-[#94a3b8] text-xs mb-1">Locked Collateral</div>
              <div className="text-[#10b981] font-semibold">{formatAmount(userCollateral)} cETH</div>
            </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('deposit')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === 'deposit' 
                ? 'bg-[#f59e0b] text-[#0f172a]' 
                : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setMode('withdraw')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === 'withdraw' 
                ? 'bg-[#f59e0b] text-[#0f172a]' 
                : 'bg-[#0f172a] text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <label className="text-[#94a3b8] text-sm mb-2 block">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-[#0f172a] border border-[#f59e0b]/20 rounded-lg px-4 py-3 text-[#f8fafc] placeholder-[#94a3b8] focus:outline-none focus:border-[#f59e0b]/50"
          />
          <div className="text-[#94a3b8] text-sm mt-2">
            {mode === 'deposit' ? (
              <>Balance: <span className="text-[#f8fafc]">{formatAmount(cETHBalance)} cETH</span></>
            ) : (
              <>Available: <span className="text-[#10b981]">{formatAmount(userCollateral)} cETH</span></>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={supplyLoading || withdrawLoading || !amount}
          className="w-full bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-[#0f172a] font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {supplyLoading || withdrawLoading ? 'Processing...' : mode === 'deposit' ? 'Deposit cETH' : 'Withdraw cETH'}
        </button>

        {/* Transaction Link */}
        {txHash && (
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-[#3eddfd] hover:underline text-sm mt-4"
          >
            View transaction →
          </a>
        )}

        {/* Warning */}
        <div className="mt-4 p-3 bg-[#f59e0b]/10 border border-[#f59e0b]/20 rounded-lg">
          <div className="text-[#f59e0b] text-sm font-medium mb-1">⚠️ Important</div>
          <div className="text-[#94a3b8] text-xs">
            Deposited collateral is locked and used as security for borrowing. 
            You can withdraw when your health factor is safe.
          </div>
        </div>
      </div>
    </div>
  );
}