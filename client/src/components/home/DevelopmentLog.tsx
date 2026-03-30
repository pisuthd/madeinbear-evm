function DevelopmentLog() {
    const waves = [
        {
            id: 1,
            status: 'current',
            items: [
                'Explore Fhenix FHE + finalize concept',
                'Minimal lending contract (no token transfers but with encrypted state)',
                'Implement ERC20 ↔ confidential wrapper (FHERC20WrappedERC20)',
                'Handle client-side decrypt flows (decryptForTx / decryptForView)',
            ],
        },
        {
            id: 2,
            status: 'upcoming',
            items: [
                'Replace fixed rates with utilization-based interest model',
                'Add health factor + collateral-based borrow limits',
                'Integrate oracle pricing for collateral + debt',
                'Enforce liquidity + risk checks on borrow',
            ],
        },
        {
            id: 3,
            status: 'upcoming',
            items: [
                'Build on-chain credential system (KYC / KYT)',
                'Implement selective disclosure from encrypted state',
                'Implement liquidation mechanism (health factor < 1)',
                'Add liquidation incentive + close factor',
            ],
        },
        {
            id: 4,
            status: 'upcoming',
            items: [
                'Refine for institutional usage (privacy, control, risk visibility)',
                'Improve UX across lending + credential flows',
                'Finalize compliance layer (KYT / AML / Travel Rule)',
                'Add AI-assisted onboarding + risk monitoring',
            ],
        },
    ];

    return (
        <section className="py-16 px-4 md:px-8 bg-gradient-to-b from-[#0f172a] to-[#1e293b]">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-[48px] font-bold mb-4 text-[#f8fafc] tracking-tight">
                        Development Roadmap
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-[#3eddfd] to-transparent mx-auto" />
                </div>

                {/* Roadmap Container */}
                <div className="relative">
                    {/* Horizontal Progress Line */}
                    <div className="absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-[#3eddfd]/0 via-[#3eddfd]/30 to-[#3eddfd]/0 hidden md:block" />

                    {/* Milestones Grid */}
                    <div className="grid md:grid-cols-4 gap-6 relative">
                        {waves.map((wave) => (
                            <div
                                key={wave.id}
                                className="relative group"
                            >
                                {/* Milestone Node */}
                                <div className="flex justify-center mb-4">
                                    <div className={`
                                        relative flex items-center justify-center
                                        w-24 h-24 rounded-full border-4
                                        transition-all duration-300
                                        ${wave.status === 'current'
                                            ? 'bg-[#3eddfd] border-[#1e293b] scale-110 shadow-[0_0_30px_rgba(62,223,223,0.4)]'
                                            : 'bg-[#1e293b] border-[#3eddfd]/20 group-hover:border-[#3eddfd]/40'
                                        }
                                    `}>
                                        <span className={`
                                            text-2xl font-bold
                                            ${wave.status === 'current' ? 'text-[#0f172a]' : 'text-[#94a3b8]'}
                                        `}>
                                            {wave.id}
                                        </span>
                                        
                                        {/* Arrow Indicator for Current Wave */}
                                        {wave.status === 'current' && (
                                            <div className="absolute -top-12 animate-bounce">
                                                <svg className="w-8 h-8 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                                </svg>
                                            </div>
                                        )}
                                        
                                        {/* Status Badge */}
                                        <div className={`
                                            absolute -bottom-10 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap
                                            ${wave.status === 'current'
                                                ? 'bg-[#3eddfd] text-[#0f172a]'
                                                : 'bg-[#1e293b] text-[#94a3b8] border border-[#3eddfd]/20'
                                            }
                                        `}>
                                            {wave.status === 'current' ? 'CURRENT' : 'UPCOMING'}
                                        </div>
                                    </div>
                                </div>

                                {/* Wave Title */}
                                <div className="text-center mb-4 mt-14">
                                    <h3 className="text-lg font-semibold text-[#f8fafc]">
                                        Wave #{wave.id}
                                    </h3>
                                </div>

                                {/* Wave Items Card */}
                                <div className={`
                                    rounded-xl p-5 border transition-all duration-300
                                    ${wave.status === 'current'
                                        ? 'bg-[#3eddfd]/5 border-[#3eddfd]/30 shadow-lg'
                                        : 'bg-[#1e293b]/50 border-[#3eddfd]/10 group-hover:border-[#3edfidf]/20'
                                    }
                                `}>
                                    <ul className="space-y-3">
                                        {wave.items.map((item, index) => (
                                            <li
                                                key={index}
                                                className={`
                                                    text-sm leading-relaxed flex items-start gap-2
                                                    ${wave.status === 'current' ? 'text-[#f8fafc]' : 'text-[#94a3b8]'}
                                                `}
                                            >
                                                <span className="mt-1.5 flex-shrink-0">
                                                    <span className={`
                                                        inline-block w-1.5 h-1.5 rounded-full
                                                        ${wave.status === 'current' ? 'bg-[#3eddfd]' : 'bg-[#94a3b8]'}
                                                    `} />
                                                </span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
 
            </div>
        </section>
    );
}

export default DevelopmentLog;