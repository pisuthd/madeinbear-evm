interface CTAProps {
  onNavigate: (path: string) => void;
}

function CTA({ onNavigate }: CTAProps) {
  return (
    <section className=" py-16 md:py-24  px-4 md:px-8 bg-gradient-to-b   from-[#0f172a] to-[#1e293b]">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-[#f8fafc]">
          Ready to get started?
        </h2>
        <p className="text-base md:text-lg text-[#94a3b8] mb-8 max-w-2xl mx-auto">
          Deploy your institutional agent and start negotiating today
        </p>
        <div className="flex mb-8 flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onNavigate('/deploy-agent')}
            className="px-8 py-3 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg hover:bg-[#2dd4d4] transition-colors"
          >
            Deploy Agent
          </button>
          <button
            onClick={() => onNavigate('/board')}
            className="px-8 py-3 bg-transparent border border-[#3eddfd]/30 text-[#3eddfd] font-semibold rounded-lg hover:border-[#3eddfd] hover:bg-[#3eddfd]/5 transition-all"
          >
            View Board
          </button>
        </div>
      </div>
    </section>
  );
}

export default CTA;