import type { CreateAgentResponse } from '../types';

interface DeployAgentSuccessProps {
  agentData: CreateAgentResponse;
  onGoToDashboard: () => void;
}

function DeployAgentSuccess({ agentData, onGoToDashboard }: DeployAgentSuccessProps) {
  return (
    <div className="bg-[#1e293b]/80 backdrop-blur rounded-xl p-8 shadow-2xl border border-[#334155]">
      <div className="text-center mb-8">
        {/* Glow effect behind icon */}
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3eddfd] to-[#2dd4d4] opacity-20 blur-3xl rounded-full" />
          <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#3eddfd]/20 to-[#3eddfd]/5 rounded-2xl mb-4 border border-[#3eddfd]/30">
            <svg className="w-10 h-10 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-[#3eddfd] mb-2">Agent Deployed</h2>
        <p className="text-[#94a3b8]">Your institution is now approved by the <span className='text-[#3eddfd] font-semibold'>Bear Agent</span></p>
      </div>

      <div className="bg-[#3eddfd]/10 border border-[#3eddfd]/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-center gap-2 text-[#3eddfd] font-semibold mb-3">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>KYC Attestation Verified</span>
        </div>
        <p className="text-sm text-[#94a3b8] text-center leading-relaxed">
          Your agent is now ready to participate in negotiations. Please use the same device to access your agent dashboard. In production, OAuth authentication will replace this browser-based storage.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="bg-[#0f172a] rounded-lg p-4">
          <div className="text-sm text-[#94a3b8] mb-1">Slug</div>
          <div className="text-[#f8fafc] font-mono text-lg">{agentData.slug}</div>
        </div>

        <div className="bg-[#0f172a] rounded-lg p-4">
          <div className="text-sm text-[#94a3b8] mb-1">Wallet Address</div>
          <div className="text-[#f8fafc] font-mono break-all">{agentData.walletAddress}</div>
        </div>

        <div className="bg-[#0f172a] rounded-lg p-4">
          <div className="text-sm text-[#94a3b8] mb-1">Institution</div>
          <div className="text-[#f8fafc] font-mono text-lg">
            {agentData.institutionName} ({agentData.country})
          </div>
        </div>

        <div className="bg-[#0f172a] rounded-lg p-4">
          <div className="text-sm text-[#94a3b8] mb-1">KYC Level</div>
          <div className="text-[#f8fafc] font-mono text-lg">Level {agentData.kycLevel}</div>
        </div>

        <div className="bg-[#0f172a] rounded-lg p-4">
          <div className="text-sm text-[#94a3b8] mb-1">Attestation PDA</div>
          <div className="text-[#f8fafc] font-mono text-sm break-all">{agentData.attestationPda}</div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <a
          href={agentData.explorerUrls.wallet}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-[#1e293b] text-[#3eddfd] font-semibold py-3 px-6 rounded-lg transition-all hover:bg-[#334155] hover:shadow-[0_0_20px_rgba(62,223,223,0.2)] border border-[#3eddfd]/30 text-center"
        >
          View Wallet
        </a>
        <a
          href={agentData.explorerUrls.attestation}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 bg-[#3eddfd] text-[#0f172a] font-semibold py-3 px-6 rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_30px_rgba(62,223,223,0.4)] text-center"
        >
          View Attestation
        </a>
      </div>

      <button
        onClick={onGoToDashboard}
        className="w-full bg-[#1e293b] text-[#3eddfd] font-semibold py-3 px-6 rounded-lg transition-all hover:bg-[#334155] hover:shadow-[0_0_20px_rgba(62,223,223,0.2)] border border-[#3eddfd]/30"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

export default DeployAgentSuccess;