import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import MockTokenFaucet from '../components/MockTokenFaucet';
import ConvertSection from '../components/ConvertSection';

function Portfolio() {
  const [activeTab, setActiveTab] = useState('deposits');
  const { isConnected } = useAccount();

  const tabs = [
    {
      id: 'deposits',
      title: 'My Deposits',
      subtitle: 'Earn yield on your assets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'borrows',
      title: 'My Borrows',
      subtitle: 'Active loans & health',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: 'convert',
      title: 'Convert',
      subtitle: 'ERC-20 ↔ Confidential Tokens',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      id: 'faucet',
      title: 'Faucet',
      subtitle: 'Get test tokens',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
    },
  ];

  const renderContent = (tabId: string) => {
    // Faucet tab uses the actual component
    if (tabId === 'faucet') {
      return <MockTokenFaucet />;
    }

    // Convert tab uses the new ConvertSection component
    if (tabId === 'convert') {
      return <ConvertSection />;
    }

    const placeholders: Record<string, { title: string; description: string }> = {
      deposits: {
        title: 'My Deposits',
        description: 'View and manage your supply positions. Earn yield by supplying assets to the protocol.',
      },
      borrows: {
        title: 'My Borrows',
        description: 'Track your active loans, collateral health, and borrowing capacity.',
      },
      wallet: {
        title: 'Wallet',
        description: 'View your ERC-20 and confidential token balances across all supported assets.',
      },
    };

    const content = placeholders[tabId] || { title: 'Coming Soon', description: 'This feature is under development.' };

    return (
      <div className="space-y-6">
        <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">{content.title}</h3>
          <div className="text-[#94a3b8] mb-6">
            <p>{content.description}</p>
          </div>
          
          {/* Placeholder Table */}
          <div className="border border-[#3eddfd]/10 rounded-lg overflow-hidden">
            <div className="bg-[#0f172a] px-4 py-3 border-b border-[#3eddfd]/10">
              <span className="text-sm font-medium text-[#3eddfd]">Coming Soon</span>
            </div>
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#3eddfd]/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#3eddfd]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[#94a3b8] mb-2">This section is under construction</p>
              <p className="text-sm text-[#64748b]">Check back soon for updates</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full px-4 md:px-8 py-12 pt-24">
      {/* Split Layout: Sidebar + Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Sidebar - Table Style Tabs (Always Visible) */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="bg-[#1e293b]/50 border border-[#3eddfd]/10 rounded-lg overflow-hidden">
            {/* Table Header */}
            <div className="bg-[#0f172a] px-4 py-3 border-b border-[#3eddfd]/10">
              <span className="text-sm font-medium text-[#3eddfd]">Portfolio</span>
            </div>

            {/* Table Rows */}
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-4 py-5 border-b border-[#3eddfd]/10 transition-all duration-200 text-left flex items-center gap-4 last:border-b-0 ${activeTab === tab.id
                  ? 'bg-[#3eddfd]/10 border-l-4 border-l-[#3eddfd]'
                  : 'bg-transparent hover:bg-[#1e293b] border-l-4 border-l-transparent'
                  }`}
              >
                {/* Icon Cell */}
                <div className={`flex-shrink-0 w-10 h-10 rounded flex items-center justify-center transition-colors ${activeTab === tab.id ? 'bg-[#3eddfd]/20 text-[#3eddfd]' : 'bg-[#3eddfd]/5 text-[#3eddfd]/60'
                  }`}>
                  {tab.icon}
                </div>

                {/* Text Content Cell */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-base mb-1 ${activeTab === tab.id ? 'text-[#f8fafc]' : 'text-[#cbd5e1]'
                    }`}>
                    {tab.title}
                  </div>
                  <div className={`text-xs leading-relaxed ${activeTab === tab.id ? 'text-[#3eddfd]' : 'text-[#94a3b8]'
                    }`}>
                    {tab.subtitle}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Content Area */}
        <div className="flex-1 min-w-0">
          <div className="w-full bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6 md:p-8 min-h-[600px]">
            {!isConnected ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-[#3eddfd]/5 flex items-center justify-center border border-[#3eddfd]/20">
                  <svg className="w-16 h-16 text-[#3eddfd]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-[#f8fafc] mb-4">Connect Your Wallet</h2>
                <p className="text-[#94a3b8] text-lg mb-8 max-w-lg">
                  Connect your wallet to view your portfolio, deposits, borrows, and manage your confidential positions.
                </p>
                <ConnectButton />
              </div>
            ) : (
              renderContent(activeTab)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Portfolio;
