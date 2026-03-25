interface HeroProps {
  onNavigate: (path: string) => void;
}

function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="relative flex items-center min-h-screen px-4 md:px-8 py-20 md:py-32 pt-24 overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.1]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(62, 223, 223, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(62, 223, 223, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            {/* Pre-Headline */}
            <p className="mb-4 text-sm md:text-base lg:text-xl font-medium text-[#3eddfd] font-mono">
              2026: When Privacy Meets Institutional Finance
            </p>

            {/* Main Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-[56px] font-bold mb-4 leading-tight text-[#f8fafc] tracking-tight">
              Confidential Lending for Institutional Capital
            </h1>

            {/* Subheadline */}
            <h2 className="text-sm md:text-base  lg:text-[24px] mb-4 font-semibold text-[#cbd5e1] leading-relaxed">
              Built with Fhenix Fully Homomorphic Encryption
            </h2>
            {/* Description */}
            <p className="text-sm md:text-base text-[#94a3b8] mb-8 max-w-xl leading-relaxed">
              Individual borrow and supply details stay hidden from MEV bots and competitors with built-in selective reveal for KYC, KYT, AML, and Travel Rule requirements.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={() => onNavigate('/board')}
                className="px-8 py-4 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_30px_rgba(62,223,223,0.4)] hover:-translate-y-0.5"
              >
                Deploy Capital
              </button>
              <button
                onClick={() => onNavigate('/deploy-agent')}
                className="px-8 py-4 bg-[#1e293b] text-[#3eddfd] font-semibold rounded-lg transition-all hover:bg-[#334155] hover:shadow-[0_0_20px_rgba(62,223,223,0.2)] border border-[#3eddfd]/30"
              >
                Get Your Credential
              </button>
            </div>

            {/* Trust Indicators */}
            {/*<div className="flex flex-wrap gap-8">
              <div className="flex items-center gap-2 text-sm text-[#cbd5e1]">
                <div className="w-8 h-8 rounded-lg bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20">
                  <svg className="w-4 h-4 text-[#3eddfd]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>FHE-Enabled <span className="text-[#3eddfd] font-semibold">Lending Protocol</span></span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#cbd5e1]">
                <div className="w-8 h-8 rounded-lg bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20">
                  <svg className="w-4 h-4 text-[#3eddfd]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>On-Chain <span className="text-[#3eddfd] font-semibold">Verified Access</span></span>
              </div>
            </div>*/}

          </div>

          {/* Right Side - Brand Image */}
          <div className="relative flex items-center justify-center">
            <div className="relative">
              {/* Glow effect behind image */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#3eddfd] to-[#2dd4d4] opacity-20 blur-3xl rounded-full" />

              {/* Brand Image */}
              <img
                src="/made-in-bear-brand.png"
                alt="MadeInBear Brand"
                className="relative w-full max-w-md h-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;