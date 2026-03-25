function HowItWorks() {
    const steps = [
        {
            step: "1",
            title: "Deploy Institutional Agent",
            description: "Deploy an AI agent with on-chain credentials via Solana Attestation Service for persistent identity and compliance",
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
        },
        {
            step: "2",
            title: "Submit a Financial Request",
            description: "Create a request for lending, payments, or structured agreements—represented and executed by your agent",
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
            ),
        },
        {
            step: "3",
            title: "Negotiate and Settle",
            description: "Agents negotiate terms in real time and automatically execute agreements with built-in compliance (KYC, KYT, Travel Rule)",
            icon: (
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
            ),
        },
    ];

    return (
        <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 text-[#f8fafc]">
                        How It Works
                    </h2>
                    <p className="text-lg md:text-xl text-[#94a3b8] max-w-2xl mx-auto">
                        Three Steps to Autonomous Institutional Finance
                    </p>
                </div>

                {/* Steps */}
                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting Lines (Desktop) */}
                    <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-[#3eddfd]/0 via-[#3eddfd]/30 to-[#3eddfd]/0" />

                    {steps.map((step, index) => (
                        <div
                            key={index}
                            className="relative group"
                        >
                            {/* Step Number Badge */}
                            {/* <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full bg-[#3eddfd] text-[#0f172a] font-bold text-xl flex items-center justify-center z-10 border-4 border-[#1e293b]">
                                {step.step}
                            </div> */}

                            {/* Card */}
                            <div className="relative pt-8 bg-[#1e293b] rounded-2xl p-8 border border-[#3eddfd]/10 hover:border-[#3eddfd]/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(62,223,223,0.1)] hover:-translate-y-1">
                                {/* Icon */}
                                <div className="mb-6 flex justify-center">
                                    <div className="w-16 h-16 rounded-full bg-[#3eddfd]/10 flex items-center justify-center border border-[#3eddfd]/20 group-hover:border-[#3eddfd]/40 transition-colors">
                                        <div className="text-[#3eddfd] text-2xl font-bold">
                                            {step.step}
                                        </div>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg md:text-xl font-semibold mb-3 text-[#f8fafc] text-center">
                                    {step.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm md:text-base text-[#94a3b8] text-center leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default HowItWorks;