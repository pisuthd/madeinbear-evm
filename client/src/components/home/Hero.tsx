import { Link } from 'react-router-dom';

function Hero() {
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
       
        {/* <div className="mb-8 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-[#3eddfd]/10 to-[#3eddfd]/5 border border-[#3eddfd]/30 rounded-xl px-6 py-4 flex items-start gap-4">
            <div className="flex-shrink-0 ">
              <svg className="w-5 h-5 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1"> 
              <p className="text-sm  text-[#94a3b8]">
                MadeInBear is in early development and currently live on <span className="text-[#3eddfd] font-medium">Sepolia Testnet</span>.
              </p>
            </div>
          </div>
        </div> */}

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
              Sensitive collateral values, borrowing exposure, and health factors stay fully private. Selective reveal supports seamless KYC, KYT, AML, and Travel Rule compliance.
            </p>
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12"> 
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_30px_rgba(62,223,223,0.4)] hover:-translate-y-0.5 text-center"
              >
                Deploy Capital
              </Link>
              <Link
                to="/ask-ai"
                className="px-8 py-4 bg-[#1e293b] text-[#3eddfd] font-semibold rounded-lg transition-all hover:bg-[#334155] hover:shadow-[0_0_20px_rgba(62,223,223,0.2)] border border-[#3eddfd]/30 text-center"
              >
                Get Your Credential
              </Link>
            </div>

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