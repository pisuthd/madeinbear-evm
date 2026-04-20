import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketInfo } from '../hooks/useMarketInfo';
import { useBorrow, useRepay, getUSDTMarketParams } from '../hooks/useCMorphoActions';
import { useCTokenBalance } from '../hooks/useCTokenBalance';
import { useUserCollateralPosition } from '../hooks/useCMorphoPosition';
import { DEPLOYMENTS } from '../constants/deployments';

// Skeleton loading component
function StatCardSkeleton() {
  return (
    <div className="bg-[#1e293b]/50 border border-[#f59e0b]/20 rounded-xl p-6 animate-pulse">
      <div className="h-4 bg-[#0f172a] rounded w-24 mb-2"></div>
      <div className="h-8 bg-[#0f172a] rounded w-32 mb-2"></div>
      <div className="h-4 bg-[#0f172a] rounded w-16"></div>
    </div>
  );
}

function InputSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-12 bg-[#0f172a] rounded-lg mb-2"></div>
      <div className="h-4 bg-[#0f172a] rounded w-32"></div>
    </div>
  );
}
export default function BorrowUSDT() {
  const { marketData, borrowAPY, lltvPercent, loading: marketLoading } = useMarketInfo();
  const marketParams = getUSDTMarketParams();
  const cUSDTAddress = DEPLOYMENTS[11155111]?.cUSDT as `0x${string}`;
  const cETHAddress = DEPLOYMENTS[11155111]?.cETH as `0x${string}`;
  const { balance: cUSDTBalance, refresh: refreshUSDTBalance } = useCTokenBalance(cUSDTAddress);
  const { balance: cETHBalance, loading: balanceLoading, refresh: refreshETHBalance } = useCTokenBalance(cETHAddress);
  
  // Get user's borrow position
  const { borrowAssets: userBorrow, collateral: userCollateral, loading: positionLoading, refetch: refetchPosition } = useUserCollateralPosition();
  
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txType, setTxType] = useState<'borrow' | 'repay' | null>(null);
  
  const { borrow, loading: borrowLoading } = useBorrow();
  const { repay, loading: repayLoading } = useRepay();
  // Combine all loading states
  const isLoading = marketLoading || balanceLoading || positionLoading;

  const formatAmount = (value: bigint | undefined, decimals: number = 6) => {
    if (!value || value === 0n) return '0.00';
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const remainder = value % divisor;
    const fractional = remainder.toString().padStart(decimals, '0').slice(0, 2);
    return `${whole.toString()}.${fractional}`;
  };

  const formatAPY = (apy: number) => {
    return apy.toFixed(2) + '%';
  };

  // Collateral balance
  const collateralBalance = cETHBalance;
  // User's current borrow
  const userBorrowBalance = userBorrow;
  // Total supplied (for reference)
  const totalSupplied = marketData?.totalSupplyAssets ?? 0n;

  const handleBorrow = async () => {
    if (!marketParams || !borrowAmount) return;
    
    const amount = BigInt(parseFloat(borrowAmount) * 1e6); // USDT has 6 decimals
    if (amount <= 0n) return;

    setTxHash(null);
    setTxType(null);

    try {
      const hash = await borrow(amount, marketParams);
      setBorrowAmount('');
      setTxHash(hash);
      setTxType('borrow');
      // Refresh balances after successful borrow
      refreshUSDTBalance();
      refreshETHBalance();
      refetchPosition();
    } catch (error) {
      console.error('Borrow failed:', error);
    }
  };

  const handleRepay = async () => {
    if (!marketParams || !repayAmount) return;
    
    const amount = BigInt(parseFloat(repayAmount) * 1e6); // USDT has 6 decimals
    if (amount <= 0n) return;

    setTxHash(null);
    setTxType(null);

    try {
      const hash = await repay(amount, marketParams);
      setRepayAmount('');
      setTxHash(hash);
      setTxType('repay');
      // Refresh balances after successful repay
      refreshUSDTBalance();
      refreshETHBalance();
      refetchPosition();
    } catch (error) {
      console.error('Repay failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] pt-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section 1: Header with Back Link and Title */}
        <div className="mb-6">
          <Link to="/borrow" className="text-[#94a3b8] hover:text-[#f8fafc] transition-colors text-sm mb-4 inline-block">
            ← Back to Borrow
          </Link>
          <div className="flex items-center gap-4 mt-2">
            <img 
              src="https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" 
              alt="USDT" 
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold text-[#f8fafc]">USDT Borrow</h1>
              <p className="text-[#94a3b8]">Borrow USDT against your ETH collateral</p>
            </div>
          </div>
        </div>

        {/* Transaction Result Banner */}
        {txHash && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="text-green-400 font-semibold">
                {txType === 'borrow' ? 'Borrow' : 'Repay'} successful!
              </div>
              <a 
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f59e0b] hover:underline text-sm flex items-center gap-1"
              >
                View on Etherscan
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        )}

        {/* Section 2: Stats Header */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              {/* Your Borrow */}
              <div className="bg-[#1e293b]/50 border border-[#f59e0b]/20 rounded-xl p-6">
                <div className="text-[#94a3b8] text-sm mb-2">Your Borrow</div>
                <div className="text-[#ef4444] text-2xl font-bold">{formatAmount(userBorrowBalance)}</div>
                <div className="text-[#94a3b8] text-sm">cUSDT</div>
              </div>

              {/* Your Collateral */}
              <div className="bg-[#1e293b]/50 border border-[#f59e0b]/20 rounded-xl p-6">
                <div className="text-[#94a3b8] text-sm mb-2">Your Collateral</div>
                <div className="text-[#10b981] text-2xl font-bold">{formatAmount(userCollateral)}</div>
                <div className="text-[#94a3b8] text-sm">cETH</div>
              </div>

              {/* APY */}
              <div className="bg-[#1e293b]/50 border border-[#f59e0b]/20 rounded-xl p-6">
                <div className="text-[#94a3b8] text-sm mb-2">Borrow APY</div>
                <div className="text-[#f59e0b] text-2xl font-bold">{formatAPY(borrowAPY)}</div>
                <div className="text-[#94a3b8] text-sm">Annual rate</div>
              </div>

              {/* LTV */}
              <div className="bg-[#1e293b]/50 border border-[#f59e0b]/20 rounded-xl p-6">
                <div className="text-[#94a3b8] text-sm mb-2">Max LTV</div>
                <div className="text-[#f8fafc] text-2xl font-bold">{lltvPercent}%</div>
                <div className="text-[#94a3b8] text-sm">Loan-to-value</div>
              </div>
            </>
          )}
        </div>

        {/* Section 3: Two Columns - Chart and Action Panel */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Chart Area */}
          <div className="bg-[#1e293b]/50 border border-[#f59e0b]/10 rounded-xl p-6">
            <div className="text-[#f8fafc] text-lg font-semibold mb-4">Borrow Rate History</div>
            {/* Chart placeholder */}
            <div className="h-64 bg-[#0f172a]/50 rounded-lg flex items-center justify-center">
              <div className="text-center text-[#94a3b8]">
                <div className="text-4xl mb-2">📈</div>
                <div>Chart Coming Soon</div>
                <div className="text-sm mt-1">Borrow rate over time</div>
              </div>
            </div>
            {/* Time range selector */}
            <div className="flex gap-2 mt-4">
              {['1D', '1W', '1M', '1Y'].map((range) => (
                <button
                  key={range}
                  className="px-3 py-1 text-sm text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#0f172a]/50 rounded transition-colors"
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Action Panel */}
          <div className="bg-[#1e293b]/50 border border-[#f59e0b]/10 rounded-xl p-6">
            <div className="text-[#f8fafc] text-lg font-semibold mb-4">Borrow</div>
            
            {isLoading ? (
              <InputSkeleton />
            ) : (
              <>
                {/* Collateral Info */}
                <div className="mb-4 p-4 bg-[#0f172a]/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png" 
                      alt="ETH" 
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <div className="text-[#94a3b8] text-sm">Your cETH Balance</div>
                      <div className="text-[#f8fafc] font-semibold">{formatAmount(collateralBalance)} ETH</div>
                    </div>
                  </div>
                </div>

                {/* Borrow Amount Input */}
                <div className="mb-4">
                  <label className="text-[#94a3b8] text-sm mb-2 block">Borrow Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={borrowAmount}
                      onChange={(e) => setBorrowAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#0f172a] border border-[#f59e0b]/20 rounded-lg px-4 py-3 text-[#f8fafc] placeholder-[#94a3b8] focus:outline-none focus:border-[#f59e0b]/50"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f59e0b] text-sm hover:underline">
                      MAX
                    </button>
                  </div>
                  <div className="text-[#94a3b8] text-sm mt-2">
                    Max borrow: <span className="text-[#f8fafc]">0.00 USDT</span>
                  </div>
                </div>

                {/* Borrow Button */}
                <button 
                  onClick={handleBorrow}
                  disabled={borrowLoading || !borrowAmount}
                  className="w-full bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-[#0f172a] font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {borrowLoading ? 'Borrowing...' : 'Borrow USDT'}
                </button>
              </>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#f59e0b]/10"></div>
              <span className="text-[#94a3b8] text-sm">or</span>
              <div className="flex-1 h-px bg-[#f59e0b]/10"></div>
            </div>

            {isLoading ? (
              <InputSkeleton />
            ) : (
              <>
                {/* Repay Section */}
                <div className="mb-4">
                  <label className="text-[#94a3b8] text-sm mb-2 block">Repay Amount</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={repayAmount}
                      onChange={(e) => setRepayAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#0f172a] border border-[#f59e0b]/20 rounded-lg px-4 py-3 text-[#f8fafc] placeholder-[#94a3b8] focus:outline-none focus:border-[#f59e0b]/50"
                    />
                    <button 
                      onClick={() => setRepayAmount((Number(cUSDTBalance) / 1e6).toFixed(2))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f59e0b] text-sm hover:underline"
                    >
                      MAX
                    </button>
                  </div>
                  <div className="text-[#94a3b8] text-sm mt-2">
                    Balance: <span className="text-[#f8fafc]">{formatAmount(cUSDTBalance)} cUSDT</span>
                  </div>
                </div>

                {/* Repay Button */}
                <button 
                  onClick={handleRepay}
                  disabled={repayLoading || !repayAmount}
                  className="w-full bg-[#f59e0b]/10 hover:bg-[#f59e0b]/20 text-[#f59e0b] font-semibold py-3 rounded-lg border border-[#f59e0b]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {repayLoading ? 'Repaying...' : 'Repay'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}