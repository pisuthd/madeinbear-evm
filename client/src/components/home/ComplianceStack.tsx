function ComplianceStack() {
  const complianceFeatures = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "KYC via Solana Attestation Service",
      description: "Verified institutional identities with persistent on-chain credentials across all transactions.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      title: "Real-Time Pricing via Pyth Network",
      description: "Live market data ensures accurate valuation and reliable LTV calculations.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      title: "Travel Rule Enforcement",
      description: "Originator and beneficiary information recorded on every transaction, aligned with FATF standards.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: "Bear Agent Oversight",
      description: "AI agent enforces risk parameters (e.g. max LTV) and validates agreements before execution.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: "Enforced On-Chain",
      description: "All compliance rules are verified and executed on-chain—no manual intervention, no trusted intermediaries.",
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 md:px-8 bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-[#f8fafc]">
            Compliance Stack
          </h2>
          <p className="text-lg md:text-xl text-[#94a3b8] max-w-2xl mx-auto">
            Built-in compliance for every financial agreement
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12 max-w-3xl mx-auto">
          {complianceFeatures.slice(0, 4).map((feature, index) => (
            <div
              key={index}
              className="relative group bg-[#1e293b] rounded-2xl p-8 border border-[#3eddfd]/10 hover:border-[#3eddfd]/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(62,223,223,0.1)] hover:-translate-y-1"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#3eddfd]/0 to-[#3eddfd]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />

              {/* Icon */}
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-xl bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20 group-hover:border-[#3eddfd]/40 transition-colors">
                  <div className="text-[#3eddfd]">
                    {feature.icon}
                  </div>
                </div>
              </div>

              {/* Title */}
              <h3 className="relative text-xl font-semibold mb-3 text-[#f8fafc]">
                {feature.title}
              </h3>

              {/* Description */}
              <p className="relative text-sm text-[#94a3b8] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
 
      </div>
    </section>
  );
}

export default ComplianceStack;