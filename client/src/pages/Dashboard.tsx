import { useState } from 'react';
import { useAccount } from 'wagmi';
import MockTokenFaucet from '../components/MockTokenFaucet';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('faucet');
  const { isConnected } = useAccount();

  const tabs = [
   
    {
      id: 'markets',
      title: 'Markets',
      subtitle: 'Discover permissioned lending pools',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
    {
      id: 'portfolio',
      title: 'My Portfolio',
      subtitle: 'Private positions & health overview',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
     {
      id: 'faucet',
      title: 'Faucet',
      subtitle: 'Get test tokens for testing',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'wrap',
      title: 'Wrap / Unwrap',
      subtitle: 'Convert ERC-20 to Confidential Tokens',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
  ];

  const renderContent = () => {
    if (!isConnected) {
      return (
        <div className="w-full h-full min-h-[600px] flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-[#3eddfd]/5 flex items-center justify-center border border-[#3eddfd]/20">
            <svg className="w-16 h-16 text-[#3eddfd]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-[#f8fafc] mb-4">Connect Your Wallet</h2>
          <p className="text-[#94a3b8] text-lg mb-8 max-w-lg">
            Please connect your wallet to access the Dashboard
          </p>
        </div>
      );
    }

    switch (activeTab) {
      case 'faucet':
        return <MockTokenFaucet />;
      case 'markets':
        return (
          <div className="space-y-6">
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[#3eddfd]/5 flex items-center justify-center border border-[#3eddfd]/20">
                <svg className="w-12 h-12 text-[#3eddfd]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#f8fafc] mb-3">Markets</h3>
              <p className="text-[#94a3b8] text-lg">Discover & interact with permissioned lending pools</p>
              <p className="text-[#64748b] text-sm mt-4">Content coming soon...</p>
            </div>
          </div>
        );
      case 'portfolio':
        return (
          <div className="space-y-6">
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[#3eddfd]/5 flex items-center justify-center border border-[#3eddfd]/20">
                <svg className="w-12 h-12 text-[#3eddfd]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#f8fafc] mb-3">My Portfolio</h3>
              <p className="text-[#94a3b8] text-lg">Private positions & health overview</p>
              <p className="text-[#64748b] text-sm mt-4">Content coming soon...</p>
            </div>
          </div>
        );
      case 'wrap':
        return (
          <div className="space-y-6">
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-[#3eddfd]/5 flex items-center justify-center border border-[#3eddfd]/20">
                <svg className="w-12 h-12 text-[#3eddfd]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#f8fafc] mb-3">Wrap / Unwrap</h3>
              <p className="text-[#94a3b8] text-lg">Convert ERC-20 to Confidential Tokens</p>
              <p className="text-[#64748b] text-sm mt-4">Content coming soon...</p>
            </div>
          </div>
        );
      default:
        return null;
    }
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
              <span className="text-sm font-medium text-[#3eddfd]">Dashboard</span>
            </div>
            
            {/* Table Rows */}
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full px-4 py-5 border-b border-[#3eddfd]/10 transition-all duration-200 text-left flex items-center gap-4 last:border-b-0 ${
                  activeTab === tab.id
                    ? 'bg-[#3eddfd]/10 border-l-4 border-l-[#3eddfd]'
                    : 'bg-transparent hover:bg-[#1e293b] border-l-4 border-l-transparent'
                }`}
              >
                {/* Icon Cell */}
                <div className={`flex-shrink-0 w-10 h-10 rounded flex items-center justify-center transition-colors ${
                  activeTab === tab.id ? 'bg-[#3eddfd]/20 text-[#3eddfd]' : 'bg-[#3eddfd]/5 text-[#3eddfd]/60'
                }`}>
                  {tab.icon}
                </div>
                
                {/* Text Content Cell */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-base mb-1 ${
                    activeTab === tab.id ? 'text-[#f8fafc]' : 'text-[#cbd5e1]'
                  }`}>
                    {tab.title}
                  </div>
                  <div className={`text-xs leading-relaxed ${
                    activeTab === tab.id ? 'text-[#3eddfd]' : 'text-[#94a3b8]'
                  }`}>
                    {tab.subtitle}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Content Area (Shows Connect Wallet or Tab Content) */}
        <div className="flex-1 min-w-0">
          <div className="w-full bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6 md:p-8 min-h-[600px]">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;