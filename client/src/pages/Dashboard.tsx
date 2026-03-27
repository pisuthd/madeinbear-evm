import { useState } from 'react';

function Dashboard() {
  const [activeTab, setActiveTab] = useState('markets');

  const tabs = [
    {
      id: 'markets',
      title: 'Markets',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
    },
    {
      id: 'portfolio',
      title: 'My Portfolio',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'wrap',
      title: 'Wrap / Unwrap',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 pt-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#f8fafc] tracking-tight">
          Dashboard
        </h1>
        <p className="text-lg text-[#cbd5e1]">
          Monitor your agents, balances, and financial activity
        </p>
      </div>

      {/* Tabbed Layout */}
      <div className="grid md:grid-cols-12 gap-6">
        {/* Left Side - Vertical Tabs */}
        <div className="md:col-span-4 lg:col-span-3">
          <div className="flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 text-left border ${
                  activeTab === tab.id
                    ? 'bg-[#3eddfd]/10 border-[#3eddfd]/40 shadow-[0_0_20px_rgba(62,223,223,0.15)]'
                    : 'bg-[#1e293b]/50 border-[#3eddfd]/10 hover:border-[#3eddfd]/30 hover:bg-[#1e293b]'
                }`}
              >
                {/* Tab Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                  activeTab === tab.id ? 'bg-[#3eddfd]/20 text-[#3eddfd]' : 'bg-[#3eddfd]/5 text-[#3eddfd]/60'
                }`}>
                  {tab.icon}
                </div>
                
                {/* Tab Title */}
                <span className={`font-medium transition-colors ${
                  activeTab === tab.id ? 'text-[#f8fafc]' : 'text-[#94a3b8]'
                }`}>
                  {tab.title}
                </span>

                {/* Active Indicator */}
                {activeTab === tab.id && (
                  <div className="ml-auto">
                    <svg className="w-5 h-5 text-[#3eddfd]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side - Content Area */}
        <div className="md:col-span-8 lg:col-span-9">
          <div className="bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#3eddfd]/10 p-6 md:p-8 min-h-[500px]">
            {activeTab === 'markets' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20">
                    <svg className="w-6 h-6 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#f8fafc]">Markets</h2>
                </div>
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#3eddfd]/5 flex items-center justify-center border border-[#3eddfd]/10">
                    <svg className="w-10 h-10 text-[#3eddfd]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                  <p className="text-[#94a3b8] text-lg">Markets content placeholder</p>
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20">
                    <svg className="w-6 h-6 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#f8fafc]">My Portfolio</h2>
                </div>
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#3eddfd]/5 flex items-center justify-center border border-[#3eddfd]/10">
                    <svg className="w-10 h-10 text-[#3eddfd]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="text-[#94a3b8] text-lg">My Portfolio content placeholder</p>
                </div>
              </div>
            )}

            {activeTab === 'wrap' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20">
                    <svg className="w-6 h-6 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#f8fafc]">Wrap / Unwrap</h2>
                </div>
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#3eddfd]/5 flex items-center justify-center border border-[#3eddfd]/10">
                    <svg className="w-10 h-10 text-[#3eddfd]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <p className="text-[#94a3b8] text-lg">Wrap / Unwrap content placeholder</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;