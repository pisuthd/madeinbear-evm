import { useNavigate } from 'react-router-dom';
import { useMarketInfo } from '../../hooks/useMarketInfo';

function Rates() {
    const navigate = useNavigate();
    const { supplyAPY, utilization, marketData, loading } = useMarketInfo();

    const formatAPY = (apy: number) => {
        if (apy === 0) return '—';
        return `${apy.toFixed(2)}%`;
    };

    const formatTVL = (value: bigint | undefined) => {
        if (!value || value === 0n) return '$0';
        console.log("value-->", value)
        const num = Number(value) / 1e6; // Convert to millions 
        return `$${Number(num).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const formatUtilization = (util: number) => {
        if (util === 0) return '—';
        return `${util.toFixed(1)}%`;
    };

    return (
        <section className="relative px-4 md:px-8 pb-32 bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
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

            <div className="max-w-7xl mx-auto w-full relative z-10">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl lg:text-[48px] font-bold mb-4 text-[#f8fafc] tracking-tight">
                        Current Rates
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-[#3eddfd] to-transparent mx-auto mt-4" />
                    <p className="text-base mt-[24px] md:text-xl text-[#cbd5e1] max-w-xl mx-auto">
                        Supply and earn while your positions stay private with Fhenix Fully Homomorphic Encryption
                    </p>

                </div>

                {/* Table */}
                <div className="max-w-4xl mx-auto">
                    <div
                        onClick={() => navigate('/earn')}
                        className="bg-[#1e293b]/50 backdrop-blur-lg border border-[#3eddfd]/10 rounded-xl overflow-hidden cursor-pointer hover:bg-[#1e293b]/70 hover:border-[#3eddfd]/30 transition-all duration-300 group"
                    >
                        {/* Table Header */}
                        <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-[#0f172a]/30 border-b border-[#3eddfd]/10">
                            <div className="text-sm font-medium text-[#94a3b8]">Product</div>
                            <div className="text-sm font-medium text-[#94a3b8] text-right">Supply APY</div>
                            <div className="text-sm font-medium text-[#94a3b8] text-right">Utilization</div>
                            <div className="text-sm font-medium text-[#94a3b8] text-right flex items-center justify-end gap-2">
                                TVL
                                <svg className="w-4 h-4 text-[#3eddfd] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>

                        {/* Table Row */}
                        <div className="grid grid-cols-4 gap-4 px-6 py-6">
                            <div className="flex items-center gap-3">
                                <img
                                    src="https://s2.coinmarketcap.com/static/img/coins/64x64/825.png"
                                    alt="USDT"
                                    className="w-8 h-8 rounded-full"
                                />
                                <div>
                                    <div className="font-semibold text-[#f8fafc]">USDT Saving</div>
                                </div>
                            </div>
                            <div className="text-right font-mono text-lg font-semibold text-[#f8fafc] flex items-center justify-end">
                                {loading ? (
                                    <div className="w-16 h-5 bg-[#334155] animate-pulse rounded" />
                                ) : (
                                    formatAPY(supplyAPY)
                                )}
                            </div>
                            <div className="text-right font-mono text-lg text-[#94a3b8] flex items-center justify-end">
                                {loading ? (
                                    <div className="w-16 h-5 bg-[#334155] animate-pulse rounded" />
                                ) : (
                                    formatUtilization(utilization)
                                )}
                            </div>
                            <div className="text-right font-mono text-lg font-semibold text-[#f8fafc] flex items-center justify-end">
                                {loading ? (
                                    <div className="w-20 h-5 bg-[#334155] animate-pulse rounded" />
                                ) : (
                                    formatTVL(marketData?.totalSupplyAssets)
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Rates;
