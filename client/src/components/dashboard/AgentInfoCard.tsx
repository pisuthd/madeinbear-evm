import { useState } from 'react';
import type { AgentApiResponse } from '../../types';

interface AgentInfoCardProps {
  agentData: AgentApiResponse;
}

export default function AgentInfoCard({ agentData }: AgentInfoCardProps) {
  const [showWallet, setShowWallet] = useState(false);

  const expiryDate = new Date(agentData.expiry * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-[#334155] p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-[#f8fafc] mb-2">
          {agentData.institutionName}
        </h2>
        <div className="flex items-center gap-4 text-sm text-[#94a3b8]">
          <span>{agentData.country}</span>
          <span className="px-2 py-0.5 rounded bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">
            KYC Level {agentData.kycLevel}
          </span>
        </div>
      </div>

      {/* KYC Attestation Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-[#0f172a] rounded-lg">
        <div>
          <div className="text-xs text-[#94a3b8] mb-1">Slug</div>
          <div className="text-sm font-mono text-[#3eddfd]">{agentData.slug}</div>
        </div>
        <div>
          <div className="text-xs text-[#94a3b8] mb-1">Expires</div>
          <div className="text-sm text-[#f8fafc]">{expiryDate}</div>
        </div>
        <div>
          <div className="text-xs text-[#94a3b8] mb-1">Credential PDA</div>
          <div className="text-xs font-mono text-[#94a3b8] truncate">{agentData.credentialPda}</div>
        </div>
        <div>
          <div className="text-xs text-[#94a3b8] mb-1">Attestation PDA</div>
          <div className="text-xs font-mono text-[#94a3b8] truncate">{agentData.attestationPda}</div>
        </div>
      </div>

      {/* Wallet Address */}
      <div className="border-t border-[#334155] pt-4">
        <button
          onClick={() => setShowWallet(!showWallet)}
          className="flex items-center gap-2 text-sm text-[#64748b] hover:text-[#f8fafc] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
          {showWallet ? 'Hide' : 'Show'} Wallet Address
        </button>
        {showWallet && (
          <div className="mt-3 bg-[#0f172a] rounded-lg p-3 font-mono text-sm text-[#3eddfd] break-all">
            {agentData.walletAddress}
          </div>
        )}
      </div>
    </div>
  );
}