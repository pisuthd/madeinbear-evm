import { useEffect, useRef, useState } from 'react';
import type { BorrowRequest } from '../../types';

interface NegotiationMessage {
  type: 'lender' | 'borrower' | 'system';
  content: string;
  loanOffer?: number;
  rate?: number;
  round: number;
}

interface AINegotiationModalProps {
  show: boolean;
  request: BorrowRequest | null;
  messages: NegotiationMessage[];
  isNegotiating: boolean;
  result: any;
  isSubmitting: boolean;
  onClose: () => void;
  onAccept: (counterpartySlug: string) => void;
  onStart?: (config: LenderConfig) => void;
  counterpartyInput?: string;
  onCounterpartyChange?: (value: string) => void;
}

interface LenderConfig {
  startPercent: number;  // 60 - 80
  behavior: 'aggressive' | 'balanced' | 'conservative';
  maxRounds: number;  // 3 - 10
}

export function AINegotiationModal({
  show,
  request,
  messages,
  isNegotiating,
  result,
  isSubmitting,
  onClose,
  onAccept,
  onStart,
  counterpartyInput,
  onCounterpartyChange,
}: AINegotiationModalProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Lender configuration state
  const [config, setConfig] = useState<LenderConfig>({
    startPercent: 70,
    behavior: 'balanced',
    maxRounds: 6,
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isNegotiating]);

  // Reset config when modal opens
  useEffect(() => {
    if (show && messages.length === 0) {
      setConfig({ startPercent: 70, behavior: 'balanced', maxRounds: 6 });
    }
  }, [show, messages.length]);

  const handleStart = () => {
    if (onStart) {
      onStart(config);
    }
  };

  if (!show || !request) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e293b] rounded-2xl border border-[#334155] p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-[#f8fafc]">AI Negotiation</h2>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#f8fafc]">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Request Details */}
        <div className="bg-[#0f172a] rounded-lg p-4 mb-6">
          <div className="text-sm text-[#94a3b8] mb-2">Original Request</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-[#cbd5e1]">Collateral:</span> <span className="text-[#f8fafc]">{(request.collateralAmount / 1e8).toFixed(2)} mXAU</span>
            </div>
            <div>
              <span className="text-[#cbd5e1]">Requested:</span> <span className="text-[#f8fafc]">${(request.requestedUsdc / 1e6).toLocaleString()} USDC</span>
            </div>
            <div>
              <span className="text-[#cbd5e1]">Max Rate:</span> <span className="text-[#f8fafc]">{request.maxRateBps / 100}%</span>
            </div>
            <div>
              <span className="text-[#cbd5e1]">Duration:</span> <span className="text-[#f8fafc]">{request.durationSeconds / 86400} days</span>
            </div>
          </div>
        </div>

        {/* Lender Configuration */}
        {messages.length === 0 && !isNegotiating && (
          <div className="bg-[#0f172a] rounded-lg p-4 mb-6">
            <div className="text-sm text-[#94a3b8] mb-4">Lender Configuration</div>
            <div className="space-y-4">
              {/* Starting Rate */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#cbd5e1]">Starting Rate</span>
                  <span className="text-[#3eddfd] font-semibold">
                    {config.startPercent}% ({((request.maxRateBps / 100) * (config.startPercent / 100)).toLocaleString()}%)
                  </span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="80"
                  value={config.startPercent}
                  onChange={(e) => setConfig({ ...config, startPercent: parseInt(e.target.value) })}
                  className="w-full h-2 bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#3eddfd]"
                />
                <div className="flex justify-between text-xs text-[#64748b] mt-1">
                  <span>60% (Conservative)</span>
                  <span>70% (Balanced)</span>
                  <span>80% (Aggressive)</span>
                </div>
              </div>

              {/* Behavior Style */}
              <div>
                <div className="text-sm text-[#cbd5e1] mb-2">Negotiation Behavior</div>
                <div className="grid grid-cols-3 gap-2">
                  {(['aggressive', 'balanced', 'conservative'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setConfig({ ...config, behavior: style })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        config.behavior === style
                          ? style === 'aggressive'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : style === 'balanced'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-[#1e293b] text-[#94a3b8] border border-[#334155] hover:border-[#475569]'
                      }`}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </button>
                  ))}
                </div>
                {/* <div className="text-xs text-[#64748b] mt-2">
                  {config.behavior === 'aggressive' && 'Maximize profit, move slowly toward agreement'}
                  {config.behavior === 'balanced' && 'Professional, fair business approach'}
                  {config.behavior === 'conservative' && 'Build relationships, make reasonable concessions'}
                </div> */}
              </div>

              {/* Max Rounds */}
              {/* <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[#cbd5e1]">Max Negotiation Rounds</span>
                  <span className="text-[#3eddfd] font-semibold">{config.maxRounds}</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={config.maxRounds}
                  onChange={(e) => setConfig({ ...config, maxRounds: parseInt(e.target.value) })}
                  className="w-full h-2 bg-[#334155] rounded-lg appearance-none cursor-pointer accent-[#3eddfd]"
                />
                <div className="flex justify-between text-xs text-[#64748b] mt-1">
                  <span>3 rounds</span>
                  <span>6 rounds (recommended)</span>
                  <span>10 rounds</span>
                </div>
              </div> */}
            </div>
          </div>
        )}

        {/* Negotiation Messages */}
        <div className="bg-[#0f172a] rounded-lg p-4 mb-6 h-64 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#94a3b8]">
                {isNegotiating && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#3eddfd]"></div>
                )}
                {isNegotiating ? 'Negotiating...' : 'AI Negotiation Logic'}
              </div>
              
              {!isNegotiating && (
                <div className="text-sm text-[#cbd5e1]">
                  <div className="space-y-2 text-xs text-[#94a3b8]">
                    <p>• AI agents negotiate loan terms on your behalf</p>
                    <p>• Both parties work toward mutually acceptable amount & rate</p>
                    <p>• Messages appear in real-time as offers are exchanged</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg ${
                    msg.type === 'lender'
                      ? 'bg-purple-500/10 border border-purple-500/20'
                      : msg.type === 'borrower'
                      ? 'bg-blue-500/10 border border-blue-500/20'
                      : 'bg-gray-500/10 border border-gray-500/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold ${
                        msg.type === 'lender'
                          ? 'text-purple-400'
                          : msg.type === 'borrower'
                          ? 'text-blue-400'
                          : 'text-[#3eddfd]'
                      }`}
                    >
                      {msg.type === 'lender' ? 'Lender' : msg.type === 'borrower' ? 'Borrower' : 'Bear Agent'}
                    </span>
                    {msg.round > 0 && <span className="text-xs text-[#94a3b8]">Round {msg.round}</span>}
                  </div>
                  <p className="text-sm text-[#f8fafc]">{msg.content}</p>
                  {(msg.loanOffer !== undefined || msg.rate !== undefined) && (
                    <div className="mt-2 flex gap-3 text-sm">
                      {msg.loanOffer !== undefined && (
                        <span className="text-[#cbd5e1]">Offer: ${msg.loanOffer.toLocaleString()}</span>
                      )}
                      {msg.rate !== undefined && (
                        <span className="text-[#cbd5e1]">Rate: {msg.rate.toFixed(2)}%</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {isNegotiating && (
                <div className="p-3 rounded-lg bg-[#3eddfd]/10 border border-[#3eddfd]/20">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3eddfd]"></div>
                    <span className="text-sm text-[#3eddfd]">AI is thinking...</span>
                  </div>
                </div>
              )}
              {/* Invisible element to anchor auto-scroll */}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-4 mb-6">
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
              <div className="text-sm text-[#94a3b8] mb-2">✨ Agreed Terms</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[#cbd5e1]">Loan Amount:</span>{' '}
                  <span className="font-bold text-[#f8fafc]">${result.agreedLoan.toLocaleString()} USDC</span>
                </div>
                <div>
                  <span className="text-[#cbd5e1]">Rate:</span>{' '}
                  <span className="font-bold text-[#f8fafc]">{result.agreedRate.toFixed(2)}%</span>
                </div>
                <div>
                  <span className="text-[#cbd5e1]">LTV:</span>{' '}
                  <span className="font-bold text-[#f8fafc]">{result.ltv.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[#cbd5e1]">Status:</span>{' '}
                  <span className="font-bold text-green-400">{result.status}</span>
                </div>
              </div>
            </div>

            {/* Counterparty Slug Input */}
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Counterparty Slug
              </label>
              <input
                type="text"
                value={counterpartyInput || ''}
                onChange={(e) => onCounterpartyChange?.(e.target.value)}
                placeholder="Enter agent slug"
                disabled={isSubmitting}
                className="w-full px-4 py-2.5 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:border-[#3eddfd] disabled:opacity-50"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {result ? (
            <>
              <button
                onClick={() => onAccept(counterpartyInput || '')}
                disabled={isSubmitting || !counterpartyInput}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : 'Accept & Initiate Loan'}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#334155] text-[#f8fafc] font-semibold rounded-lg hover:bg-[#475569] transition-colors"
              >
                Reject
              </button>
            </>
          ) : messages.length === 0 && !isNegotiating ? (
            <>
              <button
                onClick={handleStart}
                className="flex-1 px-6 py-2.5 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg hover:bg-[#2dd4d4] transition-colors"
              >
                Start Negotiation
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-[#334155] text-[#f8fafc] font-semibold rounded-lg hover:bg-[#475569] transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              disabled={isNegotiating}
              className="w-full px-6 py-2.5 bg-[#334155] text-[#f8fafc] font-semibold rounded-lg hover:bg-[#475569] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}