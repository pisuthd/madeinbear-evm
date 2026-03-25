function WhyAgentToAgent() {
  const traditionalFeatures = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      title: "Fixed Protocols",
      description: "Predefined logic with no flexibility for custom agreements"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      title: "Limited Collateral",
      description: "Restricted to whitelisted on-chain assets"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      title: "Static Contracts",
      description: "Cannot adapt to market conditions or negotiations"
    },
     {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      title: "Manual Coordination",
      description: "Custom terms require off-chain negotiation and intervention"
    }
  ];

  const agentFeatures = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      title: "Dynamic Negotiation",
      description: "AI agents negotiate terms in real time based on constraints"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      title: "Any Asset with Pricing",
      description: "Support any asset with oracle data via Pyth Network and Chainlink"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      title: "Autonomous Execution",
      description: "Agreements are negotiated and executed on-chain without manual intervention"
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      title: "Programmable Rules",
      description: "Institutions define agent behavior, risk, and parameters"
    },
    
  ];

  return (
    <section className="py-16 md:py-32 px-4 md:px-8 bg-[#0f172a]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-[#f8fafc]">
            Why Agentic Finance
          </h2>
          <p className="text-lg md:text-xl text-[#94a3b8] max-w-2xl mx-auto">
            Built for real-world institutional requirements
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid lg:grid-cols-2 gap-8 relative">
          {/* VS Divider (Desktop) */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#3eddfd]/0 via-[#3eddfd]/20 to-[#3eddfd]/0 transform -translate-x-1/2" />
           

          {/* Traditional DeFi Column */}
          <div className="relative">
            <div className="sticky top-8">
              {/* Header */}
              <div className="mb-8 text-center">
                <h3 className="text-2xl md:text-3xl font-bold mb-3 text-[#64748b]">
                  Traditional DeFi
                </h3>
                <p className="text-[#94a3b8]">
                  Rigid, limited, and manual
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                {traditionalFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-[#1e293b]/50 rounded-xl p-6 border border-[#475569]/20"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                        <div className="text-red-400">
                          {feature.icon}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#94a3b8] mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-[#64748b]">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Agent-to-Agent DeFi Column */}
          <div className="relative">
            <div className="sticky top-8">
              {/* Header */}
              <div className="mb-8 text-center">
                <h3 className="text-2xl md:text-3xl font-bold mb-3 text-[#3eddfd]">
                  Agentic Finance
                </h3>
                <p className="text-[#94a3b8]">
                  Flexible, autonomous, and institution-ready
                </p>
              </div>

              {/* Features */}
              <div className="space-y-4">
                {agentFeatures.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-[#1e293b] rounded-xl p-6 border border-[#3eddfd]/20 hover:border-[#3eddfd]/40 transition-all duration-300 hover:shadow-[0_0_30px_rgba(62,223,223,0.1)]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20">
                        <div className="text-[#3eddfd]">
                          {feature.icon}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#f8fafc] mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-[#94a3b8]">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
 
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyAgentToAgent;