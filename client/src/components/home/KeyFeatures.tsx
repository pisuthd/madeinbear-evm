import { useState } from 'react';

function KeyFeatures() {
  const [activeIndex, setActiveIndex] = useState(0);

  const features = [
    {
      title: "Fully Private Positions",
      description: "Collateral values, borrowing exposure, and health factors stay encrypted with Fhenix FHE, protected from MEV and external visibility.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      title: "On-Chain Credential System",
      description: "On-chain credentials for verified access, enabling seamless KYC, KYT, AML, and Travel Rule compliance through selective reveal.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      ),
    },
    {
      title: "Intelligent AI Assistant",
      description: "Personalized onboarding guidance and tailored borrowing recommendations designed specifically for institutional users.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];

  const activeFeature = features[activeIndex];

  return (
    <section className="py-20 px-4 md:px-8 bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-[#f8fafc]">
            Key Features
          </h2>
          <p className="text-lg md:text-xl text-[#94a3b8] max-w-2xl mx-auto">
            Enterprise-Grade Privacy Meets Institutional DeFi
          </p>
        </div>

        {/* Tabbed Layout */}
        <div className="grid md:grid-cols-12 gap-8">
          {/* Left Side - Vertical Tabs */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="flex flex-col gap-2">
              {features.map((feature, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 text-left border ${
                    activeIndex === index
                      ? 'bg-[#3eddfd]/10 border-[#3eddfd]/40 shadow-[0_0_20px_rgba(62,223,223,0.15)]'
                      : 'bg-[#1e293b]/50 border-[#3eddfd]/10 hover:border-[#3eddfd]/30 hover:bg-[#1e293b]'
                  }`}
                >
                  {/* Tab Icon */}
                  <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center transition-colors ${
                    activeIndex === index ? 'bg-[#3eddfd]/20 text-[#3eddfd]' : 'bg-[#3eddfd]/5 text-[#3eddfd]/60'
                  }`}>
                    {feature.icon}
                  </div>
                  
                  {/* Tab Title */}
                  <span className={`font-medium transition-colors ${
                    activeIndex === index ? 'text-[#f8fafc]' : 'text-[#94a3b8]'
                  }`}>
                    {feature.title}
                  </span>

                  {/* Active Indicator */}
                  {activeIndex === index && (
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
            <div className="h-full bg-[#1e293b]/50 backdrop-blur-sm rounded-2xl border border-[#3eddfd]/10 p-8 md:p-12">
              {/* Icon */}
              <div className="mb-8 flex justify-center md:justify-start">
                <div className="w-20 h-20 rounded-2xl bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20 shadow-[0_0_30px_rgba(62,223,223,0.1)]">
                  <div className="text-[#3eddfd]">
                    {activeFeature.icon}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold mb-6 text-[#f8fafc]">
                {activeFeature.title}
              </h3>

              {/* Description */}
              <p className="text-base md:text-lg text-[#94a3b8] leading-relaxed mb-8">
                {activeFeature.description}
              </p>

              {/* Feature Highlights (Optional decorative elements) */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm text-[#3eddfd]/80">
                  <div className="w-2 h-2 rounded-full bg-[#3eddfd]" />
                  <span>FHE-Powered</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#3eddfd]/80">
                  <div className="w-2 h-2 rounded-full bg-[#3eddfd]" />
                  <span>Institutional-Grade</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#3eddfd]/80">
                  <div className="w-2 h-2 rounded-full bg-[#3eddfd]" />
                  <span>Compliant</span>
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