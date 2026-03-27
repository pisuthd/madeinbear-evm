import { useState } from 'react';

function KeyFeatures() {
  const [activeTab, setActiveTab] = useState(0);

  const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Fully Private Positions",
    description: "Sensitive collateral values, borrowing exposure, and health factors stay fully encrypted with Fhenix Fully Homomorphic Encryption. Protected from MEV sniping, competitors, and external visibility."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10V4a3 3 0 00-3-3v0a3 3 0 00-3 3v6M5 10h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
      </svg>
    ),
    title: "On-Chain KYC & Credentialing",
    description: "Seamless on-chain credential system that enables verified KYC while preserving full privacy of your positions through selective reveal."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "KYT & AML Compliance",
    description: "Integrated support for Know-Your-Transaction and Anti-Money Laundering checks using selective reveal and third-party verification hooks."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2" />
      </svg>
    ),
    title: "Travel Rule Support",
    description: "Built-in mechanisms for Travel Rule compliance, allowing controlled information sharing when required while keeping core position data private."
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Intelligent AI Assistant",
    description: "AI-powered personalized onboarding, setup guidance, and borrowing strategy recommendations tailored for institutional users and compliance teams."
  }
];

  return (
    <section className="relative py-20 md:py-32 px-4 md:px-8 bg-[#0f172a]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(62, 223, 223, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(62, 223, 223, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#3eddfd]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-[#3eddfd]/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-[48px] font-bold mb-4 text-[#f8fafc] tracking-tight">
            Key Features
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#3eddfd] to-transparent mx-auto" />
        </div>

        {/* Sidebar Tabs Layout */}
        <div className="grid md:grid-cols-12 gap-8">
          {/* Sidebar - Navigation Tabs */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="sticky top-8 space-y-2">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`w-full text-left px-6 py-4 rounded-xl transition-all duration-300 border ${
                    activeTab === index
                      ? 'bg-gradient-to-r from-[#3eddfd]/20 to-[#3eddfd]/5 border-[#3eddfd]/50 shadow-[0_0_20px_rgba(62,223,223,0.2)]'
                      : 'bg-[#1e293b] border-[#334155] hover:border-[#3eddfd]/30 hover:bg-[#1e293b]/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`transition-colors duration-300 ${
                      activeTab === index ? 'text-[#3eddfd]' : 'text-[#94a3b8]'
                    }`}>
                      {feature.icon}
                    </div>
                    <span className={`font-semibold transition-colors duration-300 ${
                      activeTab === index ? 'text-[#f8fafc]' : 'text-[#94a3b8]'
                    }`}>
                      {feature.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-[#3eddfd]/10 rounded-2xl p-8 md:p-12 min-h-[400px] transition-all duration-500 hover:border-[#3eddfd]/20">
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                {/* Active Feature Icon */}
                <div className="w-20 h-20 bg-[#3eddfd]/10 rounded-2xl flex items-center justify-center mb-8">
                  <div className="text-[#3eddfd]">
                    {features[activeTab].icon}
                  </div>
                </div>

                {/* Active Feature Title */}
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-[#f8fafc]">
                  {features[activeTab].title}
                </h3>
                
                {/* Active Feature Description */}
                <p className="text-lg text-[#94a3b8] leading-relaxed max-w-3xl">
                  {features[activeTab].description}
                </p>

                {/* Decorative Elements */}
                <div className="mt-8 pt-8 border-t border-[#334155]/50">
                  <div className="flex items-center gap-2 text-[#3eddfd] text-sm font-medium">
                    <div className="w-2 h-2 bg-[#3eddfd] rounded-full animate-pulse" />
                    <span>Feature {activeTab + 1} of {features.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default KeyFeatures;