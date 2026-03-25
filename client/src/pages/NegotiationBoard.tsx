import { useState, useEffect } from 'react';
import { useAgent } from '../context/AgentContext';
import { formatWalletAddress, streamNegotiation, negotiateLoan } from '../services/api';
import { getLendingPrices, getBorrowRequests, postBorrowRequest } from '../services/api';
import type { BorrowRequest, PriceData } from '../types';
import { BorrowRequestForm } from '../components/negotiation/BorrowRequestForm';
import { PriceCards } from '../components/negotiation/PriceCards';
import { BorrowRequestsTable } from '../components/negotiation/BorrowRequestsTable';
import { AINegotiationModal } from '../components/negotiation/AINegotiationModal';
import { ManualNegotiationModal } from '../components/negotiation/ManualNegotiationModal';

interface NegotiationMessage {
  type: 'lender' | 'borrower' | 'system';
  content: string;
  loanOffer?: number;
  rate?: number;
  round: number;
}

interface NegotiationBoardProps {
  onNavigate: (path: string) => void;
}

function NegotiationBoard({ onNavigate }: NegotiationBoardProps) {
  const { agent } = useAgent();
  const [prices, setPrices] = useState<{ XAU_USD: PriceData; SOL_USD: PriceData } | null>(null);
  const [borrowRequests, setBorrowRequests] = useState<BorrowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // AI Negotiation state
  const [isAINegotiating, setIsAINegotiating] = useState(false);
  const [negotiationMessages, setNegotiationMessages] = useState<NegotiationMessage[]>([]);
  const [negotiationResult, setNegotiationResult] = useState<any>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [counterpartyInput, setCounterpartyInput] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    collateralAmount: '',
    requestedUsdc: '',
    maxRateBps: '',
    durationDays: '',
  });

  // Negotiation form state
  const [negotiateData, setNegotiateData] = useState({
    agreedUsdc: '',
    agreedRateBps: '',
  });

  // Categories
  const categories = [
    { value: 'lending', label: 'Lending' },
    { value: 'payments', label: 'Payments' },
    { value: 'trading', label: 'Trading' },
    { value: 'derivatives', label: 'Derivatives' },
  ];

  const [selectedCategory, setSelectedCategory] = useState('lending');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [pricesData, requestsData] = await Promise.all([
        getLendingPrices(),
        getBorrowRequests(),
      ]);
      setPrices(pricesData);
      setBorrowRequests(requestsData.requests || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      showNotification('error', 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handlePostRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent) {
      showNotification('error', 'Please deploy an agent first');
      return;
    }

    setIsSubmitting(true);
    try {
      await postBorrowRequest({
        slug: agent.organization.slug || '',
        collateralAmount: parseFloat(formData.collateralAmount),
        requestedUsdc: parseFloat(formData.requestedUsdc),
        maxRateBps: Math.round(parseFloat(formData.maxRateBps) * 100), // Convert % to basis points
        durationDays: parseInt(formData.durationDays),
      });
      showNotification('success', 'Borrow request posted successfully!');
      setShowForm(false);
      setFormData({ collateralAmount: '', requestedUsdc: '', maxRateBps: '', durationDays: '' });
      fetchData();
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to post request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNegotiate = (request: BorrowRequest) => {
    setSelectedRequest(request);
    setNegotiateData({ agreedUsdc: request.requestedUsdc.toString(), agreedRateBps: request.maxRateBps.toString() });
  };

  const handleAINegotiate = async (request: BorrowRequest) => {
    if (!agent) return;

    // Only open the modal, don't start negotiating yet
    setSelectedRequest(request);
    setShowAIModal(true);
    setNegotiationMessages([]);
    setNegotiationResult(null);
    setIsAINegotiating(false);
    setCounterpartyInput('');
  };

  const handleStartAINegotiation = async (config: {
    startPercent: number;
    behavior: 'aggressive' | 'balanced' | 'conservative';
    maxRounds: number;
  }) => {
    if (!agent || !selectedRequest) return;

    setIsAINegotiating(true);

    try {
      setNegotiationMessages(prev => [...prev, {
        type: 'system',
        content: 'Starting AI negotiation between lender and borrower agents...',
        round: 0
      }]);

      await streamNegotiation(
        {
          borrowRequestId: String(selectedRequest.address),
          lenderSlug: agent.organization.slug || '',
          maxRounds: config.maxRounds,
          lenderStartPercent: config.startPercent / 100,
          lenderBehavior: config.behavior,
        },
        (message) => {
          setNegotiationMessages(prev => [...prev, message]);
        },
        (error) => {
          showNotification('error', `Negotiation failed: ${error.message}`);
          setIsAINegotiating(false);
        },
        (result) => {
          setNegotiationResult(result);
          setIsAINegotiating(false);
          showNotification('success', 'AI negotiation completed successfully!');
        }
      );
    } catch (error: any) {
      console.error('AI negotiation error:', error);
      showNotification('error', error.message || 'Failed to start AI negotiation');
      setIsAINegotiating(false);
    }
  };

  const handleAcceptAIResult = async (counterpartySlug: string) => {
    if (!agent || !selectedRequest || !negotiationResult) return;

    setIsSubmitting(true);
    try {
      await negotiateLoan({
        lenderSlug: String(agent.organization.slug),
        borrowerAddress: counterpartySlug,
        agreedUsdc: negotiationResult.agreedLoan,
        agreedRateBps: negotiationResult.agreedRateBps,
      });
      showNotification('success', 'Loan initiated successfully! View in Escrows tab.');
      setShowAIModal(false);
      setNegotiationMessages([]);
      setNegotiationResult(null);
      setSelectedRequest(null);
      setCounterpartyInput('');
      fetchData();
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to initiate loan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNegotiateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent || !selectedRequest) return;

    setIsSubmitting(true);
    try {
      await negotiateLoan({
        lenderSlug: agent.organization.slug || '',
        borrowerAddress: String(selectedRequest.borrower),
        agreedUsdc: parseFloat(negotiateData.agreedUsdc),
        agreedRateBps: parseInt(negotiateData.agreedRateBps),
      });
      showNotification('success', 'Loan initiated successfully! View in Escrows tab.');
      setSelectedRequest(null);
      setNegotiateData({ agreedUsdc: '', agreedRateBps: '' });
      fetchData();
    } catch (error: any) {
      showNotification('error', error.message || 'Failed to negotiate');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseManualModal = () => {
    setSelectedRequest(null);
    setNegotiateData({ agreedUsdc: '', agreedRateBps: '' });
  };

  const handleCloseAIModal = () => {
    setShowAIModal(false);
    setNegotiationMessages([]);
    setNegotiationResult(null);
    setSelectedRequest(null);
    setCounterpartyInput('');
  };

  if (!agent) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 pt-24">
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#3eddfd]/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-[#3eddfd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#f8fafc] mb-3">Agent Required</h1>
          <p className="text-[#94a3b8] mb-6">Please deploy an agent to access the negotiation board</p>
          <button
            onClick={() => onNavigate('/deploy-agent')}
            className="px-6 py-2.5 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg hover:bg-[#2dd4d4] transition-colors"
          >
            Deploy Agent
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 pt-24">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#f8fafc] tracking-tight">
          Negotiation Board
        </h1>
        <p className="text-lg text-[#cbd5e1]">
         Create financial requests and negotiate agreements with real-time pricing
        </p>
      </div>

      {notification && (
        <div className={`mb-6 p-4 rounded-lg border ${notification.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
          {notification.message}
        </div>
      )}

      <div className="mb-8">
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === cat.value
                  ? 'bg-[#3eddfd] text-[#0f172a]'
                  : 'bg-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc]'
                }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {selectedCategory !== 'lending' && (
          <p className="mt-4 text-[#94a3b8] text-sm">
            {categories.find(c => c.value === selectedCategory)?.label} is coming soon.
            Only Lending is currently implemented.
          </p>
        )}
      </div>



      <div className="flex gap-4 flex-row mb-6">
        <div className='my-auto'>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-2.5 bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg hover:bg-[#2dd4d4] transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Borrow Request
          </button>
          
        </div>
        <div className='my-auto'>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 bg-[#1e293b] text-[#f8fafc] font-semibold rounded-lg border border-[#334155] hover:bg-[#334155] transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        <div className='ml-auto'>
          <PriceCards prices={prices} />
        </div>

      </div>

      <BorrowRequestForm
        show={showForm}
        isLoading={isSubmitting}
        formData={formData}
        prices={prices}
        onSubmit={handlePostRequest}
        onCancel={() => setShowForm(false)}
        onChange={setFormData}
      />

      <BorrowRequestsTable
        isLoading={isLoading}
        requests={borrowRequests}
        userWalletAddress={agent.walletAddress}
        onNegotiate={handleNegotiate}
        onAINegotiate={handleAINegotiate}
        formatWalletAddress={formatWalletAddress}
      />

      <AINegotiationModal
        show={showAIModal}
        request={selectedRequest}
        messages={negotiationMessages}
        isNegotiating={isAINegotiating}
        result={negotiationResult}
        isSubmitting={isSubmitting}
        onClose={handleCloseAIModal}
        onAccept={handleAcceptAIResult}
        onStart={handleStartAINegotiation}
        counterpartyInput={counterpartyInput}
        onCounterpartyChange={setCounterpartyInput}
      />

      <ManualNegotiationModal
        show={selectedRequest !== null && !showAIModal}
        request={selectedRequest}
        agreedUsdc={negotiateData.agreedUsdc}
        agreedRateBps={negotiateData.agreedRateBps}
        isSubmitting={isSubmitting}
        onSubmit={handleNegotiateSubmit}
        onClose={handleCloseManualModal}
        onChange={(usdc, rate) => setNegotiateData({ agreedUsdc: usdc, agreedRateBps: rate })}
      />
    </div>
  );
}

export default NegotiationBoard;