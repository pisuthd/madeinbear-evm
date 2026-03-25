import { useState, useEffect } from 'react';
import { useAgent } from '../context/AgentContext';
import { getAgent } from '../services/api';
import BalanceTable from '../components/dashboard/BalanceTable';
import QuickActions from '../components/dashboard/QuickActions';
import RecentActivity from '../components/dashboard/RecentActivity';
import FaucetSection from '../components/FaucetSection';
import type { AgentApiResponse, TokenBalances } from '../types';

interface DashboardProps {
  onNavigate: (path: string) => void;
}

function Dashboard({ onNavigate }: DashboardProps) {
  const { agent, updateBalance } = useAgent();
  const [agentData, setAgentData] = useState<AgentApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch agent data from API on mount
  useEffect(() => {
    const fetchAgentData = async () => {
      const slug = agent?.organization?.slug;
      if (!slug) {
        console.log('No slug available, skipping API fetch');
        return;
      }

      setIsLoading(true);
      try {
        const data = await getAgent(slug);
        if (data && data.balances) {
          setAgentData(data);
          updateBalance(data.balances.usdc);
        }
      } catch (error) {
        console.error('Failed to fetch agent data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentData();
  }, [agent?.organization?.slug]);

  // Refresh agent data
  const handleRefresh = async () => {
    const slug = agent?.organization?.slug;
    if (!slug) return;
    try {
      const data = await getAgent(slug);
      if (data && data.balances) {
        setAgentData(data);
        updateBalance(data.balances.usdc);
      }
    } catch (error) {
      console.error('Failed to refresh agent data:', error);
    }
  };

  // Get display balances (prefer API data)
  const displayBalances: TokenBalances = agentData?.balances || {
    sol: 0,
    usdc: agent?.balance || 0,
    mxau: 0,
  };

  const slug = agent?.organization?.slug || '';

  if (!agent) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 pt-24">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#f8fafc] tracking-tight">
            Dashboard
          </h1>
          <p className="text-lg text-[#cbd5e1] mb-8">
            Monitor your agents, balances, and financial activity
          </p>

          <div className="mt-16 p-8 rounded-2xl border border-[#334155] bg-[#1e293b]">
            <div>
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20">
                <svg className="w-8 h-8 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-[#f8fafc]">Agent Required</h2>
              <p className="text-[#94a3b8] text-lg leading-relaxed mb-6">
                Please deploy your agent to view your dashboard.
              </p>
              <button
                onClick={() => onNavigate('/deploy-agent')}
                className="px-6 py-2.5 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_20px_rgba(62,223,223,0.3)]"
              >
                Deploy Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 pt-24">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#f8fafc] tracking-tight">
            Dashboard
          </h1>
          <p className="text-lg text-[#cbd5e1]">
            Loading your agent data...
          </p>
          <div className="mt-8 animate-pulse">
            <div className="h-4 bg-[#334155] rounded w-3/4 mx-auto mb-4"></div>
            <div className="h-4 bg-[#334155] rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  const expiryDate = new Date((agentData?.expiry || 0) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 pt-24">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#f8fafc] tracking-tight">
          Dashboard
        </h1>
        <p className="text-lg text-[#cbd5e1]">
          Monitor your agents, balances, and financial activity
        </p>
      </div>

      {agentData ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column (65%) - Token Balances & Recent Activity */}
          <div className="lg:col-span-3 space-y-6">
            <BalanceTable balances={displayBalances} />
            <RecentActivity walletAddress={agentData?.walletAddress || ''} />
          </div>

          {/* Right Column (35%) - Quick Actions, Credentials, Faucet */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <QuickActions onNavigate={onNavigate} />

            {/* Credentials & KYC & Institution Info */}
            <div className="bg-[#1e293b] rounded-2xl border border-[#334155] p-6">
              <h3 className="text-lg font-semibold text-[#f8fafc] mb-4">Agent Identity</h3>

              <div className="mb-4 grid-cols-2 grid gap-3">
                {/* Institution Info */}
                <div>
                  <div className="text-sm text-[#94a3b8] mb-1">Institution</div>
                  <div className="text-[#f8fafc] font-semibold text-lg">
                    {agentData.institutionName} ({agentData.country})
                  </div>
                </div>
                {/* KYC Level */}
                <div>
                  <div className="text-sm text-[#94a3b8] mb-1">KYC Level</div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 rounded-full text-sm font-medium">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Level {agentData.kycLevel} - Verified
                  </div>
                </div>
              </div>

              {/* Wallet Address */}
              {agentData.explorerUrls?.wallet ? (
                <a
                  href={agentData.explorerUrls.wallet}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#0f172a] rounded-lg p-3 mb-3   transition-colors group"
                >
                  <div className="text-xs text-[#94a3b8] mb-1">Wallet Address</div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[#3eddfd] font-mono text-xs break-all flex-1 group-hover:underline">
                      {agentData.walletAddress}
                    </div>
                    <svg className="w-4 h-4 text-[#3eddfd] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="bg-[#0f172a] rounded-lg p-3 mb-3">
                  <div className="text-xs text-[#94a3b8] mb-1">Wallet Address</div>
                  <div className="text-[#f8fafc] font-mono text-xs break-all">{agentData.walletAddress}</div>
                </div>
              )}

              {/* Attestation PDA */}
              {agentData.explorerUrls?.attestation ? (
                <a
                  href={agentData.explorerUrls.attestation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#0f172a] rounded-lg p-3 mb-3  transition-colors group"
                >
                  <div className="text-xs text-[#94a3b8] mb-1">Attestation PDA</div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[#3eddfd] font-mono text-xs break-all flex-1 group-hover:underline">
                      {agentData.attestationPda}
                    </div>
                    <svg className="w-4 h-4 text-[#3eddfd] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              ) : (
                <div className="bg-[#0f172a] rounded-lg p-3 mb-3">
                  <div className="text-xs text-[#94a3b8] mb-1">Attestation PDA</div>
                  <div className="text-[#94a3b8] font-mono text-xs break-all">{agentData.attestationPda}</div>
                </div>
              )}

              {/* Expires */}
              <div className="bg-[#0f172a] rounded-lg p-3">
                <div className="text-xs text-[#94a3b8] mb-1">Expires</div>
                <div className="text-[#f8fafc] text-sm">{expiryDate}</div>
              </div>
            </div>

            

            {/* Testnet Faucet */}
            <FaucetSection slug={slug} onRefresh={handleRefresh} />
          </div>
        </div>
      ) : (
        <div className="bg-[#1e293b] rounded-2xl border border-[#334155] p-8 text-center">
          <p className="text-[#94a3b8]">
            Unable to load agent data. Please try refreshing the page.
          </p>
        </div>
      )}
    </div>
  );
}

export default Dashboard;