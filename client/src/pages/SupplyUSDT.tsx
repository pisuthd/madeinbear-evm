import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMarketInfo } from '../hooks/useMarketInfo';
import { useSupply, useWithdraw, getUSDTMarketParams } from '../hooks/useCMorphoActions';
import { useCTokenBalance } from '../hooks/useCTokenBalance';
import { useUserSupplyPosition } from '../hooks/useCMorphoPosition';
import { DEPLOYMENTS } from '../constants/deployments';

// Skeleton loading component
function StatCardSkeleton() {
  return (
    <div className="bg-[#1e293b]/50 border border-[#3eddfd]/20 rounded-xl p-6 animate-pulse">
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

export default function SupplyUSDT() {
  const { marketData, supplyAPY, utilization, loading: marketLoading } = useMarketInfo();
  const marketParams = getUSDTMarketParams();
  const cUSDTAddress = DEPLOYMENTS[11155111]?.cUSDT as `0x${string}`;
  const { balance: cUSDTBalance, loading: balanceLoading, refresh: refreshBalance } = useCTokenBalance(cUSDTAddress);
  
  // Get user's supply position
  const { supplyAssets: userSupplied, loading: positionLoading, refetch: refetchPosition } = useUserSupplyPosition();
  
  const [supplyAmount, setSupplyAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [txType, setTxType] = useState<'supply' | 'withdraw' | null>(null);
  
  const { supply, loading: supplyLoading } = useSupply();
  const { withdraw, loading: withdrawLoading } = useWithdraw();

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

  // Use cUSDT balance from CoFHE hook
  const userBalance = cUSDTBalance;
  const totalSupplied = marketData?.totalSupplyAssets ?? 0n;

  const handleSupply = async () => {
    if (!marketParams || !supplyAmount) return;
    
    const amount = BigInt(parseFloat(supplyAmount) * 1e6); // USDT has 6 decimals
    if (amount <= 0n) return;

    setTxHash(null);
    setTxType(null);

    try {
      const hash = await supply(amount, marketParams);
      setSupplyAmount('');
      setTxHash(hash);
      setTxType('supply');
      // Refresh balances after successful supply
      refreshBalance();
      refetchPosition();
    } catch (error) {
      console.error('Supply failed:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!marketParams || !withdrawAmount) return;
    
    const amount = BigInt(parseFloat(withdrawAmount) * 1e6); // USDT has 6 decimals
    if (amount <= 0n) return;

    setTxHash(null);
    setTxType(null);

    try {
      const hash = await withdraw(amount, marketParams);
      setWithdrawAmount('');
      setTxHash(hash);
      setTxType('withdraw');
      // Refresh balances after successful withdraw
      refreshBalance();
      refetchPosition();
    } catch (error) {
      console.error('Withdraw failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] py-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Section 1: Header with Back Link and Title */}
        <div className="mb-6">
          <Link to="/earn" className="text-[#94a3b8] hover:text-[#f8fafc] transition-colors text-sm mb-4 inline-block">
            ← Back to Earn
          </Link>
          <div className="flex items-center gap-4 mt-2">
            <img 
              src="https://s2.coinmarketcap.com/static/img/coins/64x64/825.png" 
              alt="USDT" 
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h1 className="text-3xl font-bold text-[#f8fafc]">USDT Saving</h1>
              <p className="text-[#94a3b8]">Supply USDT to earn interest</p>
            </div>
          </div>
        </div>

        {/* Transaction Result Banner */}
        {txHash && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="text-green-400 font-semibold">
                {txType === 'supply' ? 'Supply' : 'Withdraw'} successful!
              </div>
              <a 
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3eddfd] hover:underline text-sm flex items-center gap-1"
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
              {/* Your Balance */}
              <div className="bg-[#1e293b]/50 border border-[#3eddfd]/20 rounded-xl p-6">
                <div className="text-[#94a3b8] text-sm mb-2">Your Balance</div>
                <div className="text-[#f8fafc] text-2xl font-bold">{formatAmount(userBalance)}</div>
                <div className="text-[#3eddfd] text-sm">cUSDT</div>
              </div>

              {/* Your Supplied */}
              <div className="bg-[#1e293b]/50 border border-[#3eddfd]/20 rounded-xl p-6">
                <div className="text-[#94a3b8] text-sm mb-2">Your Supplied</div>
                <div className="text-[#10b981] text-2xl font-bold">{formatAmount(userSupplied)}</div>
                <div className="text-[#94a3b8] text-sm">cUSDT</div>
              </div>

              {/* APY */}
              <div className="bg-[#1e293b]/50 border border-[#3eddfd]/20 rounded-xl p-6">
                <div className="text-[#94a3b8] text-sm mb-2">APY</div>
                <div className="text-[#3eddfd] text-2xl font-bold">{formatAPY(supplyAPY)}</div>
                <div className="text-[#94a3b8] text-sm">Annual yield</div>
              </div>

              {/* Total Supplied */}
              <div className="bg-[#1e293b]/50 border border-[#3eddfd]/20 rounded-xl p-6">
                <div className="text-[#94a3b8] text-sm mb-2">Total Supplied</div>
                <div className="text-[#f8fafc] text-2xl font-bold">{formatAmount(totalSupplied)}</div>
                <div className="text-[#94a3b8] text-sm">cUSDT</div>
              </div>
            </>
          )}
        </div>

        {/* Section 3: Two Columns - Chart and Action Panel */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Chart Area */}
          <div className="bg-[#1e293b]/50 border border-[#3eddfd]/10 rounded-xl p-6">
            <div className="text-[#f8fafc] text-lg font-semibold mb-4">APY History</div>
            {/* Chart placeholder */}
            <div className="h-64 bg-[#0f172a]/50 rounded-lg flex items-center justify-center">
              <div className="text-center text-[#94a3b8]">
                <div className="text-4xl mb-2">📊</div>
                <div>Chart Coming Soon</div>
                <div className="text-sm mt-1">APY over time visualization</div>
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
          <div className="bg-[#1e293b]/50 border border-[#3eddfd]/10 rounded-xl p-6">
            <div className="text-[#f8fafc] text-lg font-semibold mb-4">Supply</div>
            
            {isLoading ? (
              <InputSkeleton />
            ) : (
              <>
                {/* Amount Input */}
                <div className="mb-4">
                  <label className="text-[#94a3b8] text-sm mb-2 block">Amount</label>
                  <input
                    type="number"
                    value={supplyAmount}
                    onChange={(e) => setSupplyAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0f172a] border border-[#3eddfd]/20 rounded-lg px-4 py-3 text-[#f8fafc] placeholder-[#94a3b8] focus:outline-none focus:border-[#3eddfd]/50"
                  />
                  <div className="text-[#94a3b8] text-sm mt-2">
                    Balance: <span className="text-[#f8fafc]">{formatAmount(cUSDTBalance)} cUSDT</span>
                  </div>
                </div>

                {/* Supply Button */}
                <button 
                  onClick={handleSupply}
                  disabled={supplyLoading || !supplyAmount}
                  className="w-full bg-[#3eddfd] hover:bg-[#3eddfd]/90 text-[#0f172a] font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {supplyLoading ? 'Supplying...' : 'Supply USDT'}
                </button>
              </>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-[#3eddfd]/10"></div>
              <span className="text-[#94a3b8] text-sm">or</span>
              <div className="flex-1 h-px bg-[#3eddfd]/10"></div>
            </div>

            {isLoading ? (
              <InputSkeleton />
            ) : (
              <>
                {/* Withdraw Section */}
                <div className="mb-4">
                  <label className="text-[#94a3b8] text-sm mb-2 block">Withdraw Amount</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#0f172a] border border-[#3eddfd]/20 rounded-lg px-4 py-3 text-[#f8fafc] placeholder-[#94a3b8] focus:outline-none focus:border-[#3eddfd]/50"
                  />
                  <div className="text-[#94a3b8] text-sm mt-2">
                    Supplied: <span className="text-[#10b981]">{formatAmount(userSupplied)} cUSDT</span>
                  </div>
                </div>

                {/* Withdraw Button */}
                <button 
                  onClick={handleWithdraw}
                  disabled={withdrawLoading || !withdrawAmount}
                  className="w-full bg-[#3eddfd]/10 hover:bg-[#3eddfd]/20 text-[#3eddfd] font-semibold py-3 rounded-lg border border-[#3eddfd]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {withdrawLoading ? 'Withdrawing...' : 'Withdraw'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}