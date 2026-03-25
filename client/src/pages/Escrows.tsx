import { useState, useEffect } from 'react';
import { useAgent } from '../context/AgentContext';
import { getLoans, lockCollateral, fundLoan, repayLoan, settleLoan } from '../services/api';
import type { Loan } from '../types';
import { LoanFlowSteps, LoanRow, LoanActionModal } from '../components/escrow';
import { getAgent } from '../services/api';

interface EscrowsProps {
  onNavigate: (path: string) => void;
}

function Escrows({ onNavigate }: EscrowsProps) {
  const { agent } = useAgent();
  const [agentData, setAgentData] = useState<any>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [actionModal, setActionModal] = useState<'lock' | 'fund' | 'repay' | 'settle' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [counterpartyInput, setCounterpartyInput] = useState('');
  
  useEffect(() => {
    fetchLoans();
  }, []);

  // Fetch agent data from API on mount
    useEffect(() => {
      const fetchAgentData = async () => {
        const slug = agent?.organization?.slug;
        if (!slug) {
          console.log('No slug available, skipping API fetch');
          return;
        }
  
        try {
          const data = await getAgent(slug);
          if (data && data.balances) {
            setAgentData(data);
          }
        } catch (error) {
          console.error('Failed to fetch agent data:', error);
        } 
      };
  
      fetchAgentData();
    }, [agent?.organization?.slug]);

  const fetchLoans = async () => {
    setIsLoading(true);
    try {
      const data = await getLoans();
      setLoans(data.loans || []);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
      showNotification('error', 'Failed to fetch loans');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleLockCollateral = (loan: Loan) => {
    setSelectedLoan(loan);
    setActionModal('lock');
    setCounterpartyInput('');
  };

  const handleFundLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setActionModal('fund');
    setCounterpartyInput('');
  };

  const handleRepayLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setActionModal('repay');
    setCounterpartyInput('');
  };

  const handleSettleLoan = (loan: Loan) => {
    setSelectedLoan(loan);
    setActionModal('settle');
    setCounterpartyInput('');
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent || !selectedLoan || !actionModal) return;

    setIsSubmitting(true);
    try {
      switch (actionModal) {
        case 'lock':
          await lockCollateral({
            lenderAddress: selectedLoan.lender,
            borrowerSlug: agent.organization.slug || '',
          });
          showNotification('success', 'Collateral locked successfully!');
          break;
        case 'fund':
          await fundLoan({
            lenderSlug: agent.organization.slug || '',
            borrowerAddress: selectedLoan.borrower,
          });
          showNotification('success', 'Loan funded successfully!');
          break;
        case 'repay':
          await repayLoan({
            lenderAddress: selectedLoan.lender,
            borrowerSlug: counterpartyInput || agent.organization.slug || '',
          });
          showNotification('success', 'Loan repaid successfully!');
          break;
        case 'settle':
          await settleLoan({
            lenderSlug: counterpartyInput || agent.organization.slug || '',
            borrowerAddress: selectedLoan.borrower,
          });
          showNotification('success', 'Loan settled successfully!');
          break;
      }
      setActionModal(null);
      setSelectedLoan(null);
      setCounterpartyInput('');
      fetchLoans();
    } catch (error: any) {
      showNotification('error', error.message || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setActionModal(null);
    setSelectedLoan(null);
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
          <p className="text-[#94a3b8] mb-6">Please deploy an agent to access escrow management</p>
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#f8fafc] tracking-tight">
          Escrows
        </h1>
        <p className="text-lg text-[#cbd5e1]">
          Manage active agreements, assets, and settlements
        </p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg border ${
          notification.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Flow Steps */}
      <LoanFlowSteps />

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={fetchLoans}
          className="px-6 py-2.5 bg-[#1e293b] text-[#f8fafc] font-semibold rounded-lg border border-[#334155] hover:bg-[#334155] transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Loans Table */}
      <div className="bg-[#1e293b] rounded-2xl border border-[#334155] overflow-hidden">
        <div className="p-6 border-b border-[#334155]">
          <h2 className="text-xl font-semibold text-[#f8fafc]">Active Escrows</h2>
        </div>
        {isLoading ? (
          <div className="p-12 text-center text-[#94a3b8]">Loading...</div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center text-[#94a3b8]">
            <p className="mb-4">No active loans found.</p>
            <p className="text-sm">Go to the Negotiation Board to create and negotiate loans.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0f172a]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Lender</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Borrower</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Rate</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Maturity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-[#cbd5e1]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
                  <LoanRow
                    key={loan.address}
                    loan={loan}
                    userWalletAddress={agentData?.walletAddress}
                    onLockCollateral={handleLockCollateral}
                    onFundLoan={handleFundLoan}
                    onRepayLoan={handleRepayLoan}
                    onSettleLoan={handleSettleLoan}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      <LoanActionModal
        isOpen={!!actionModal}
        action={actionModal}
        loan={selectedLoan}
        counterpartyInput={counterpartyInput}
        onCounterpartyChange={setCounterpartyInput}
        onSubmit={handleActionSubmit}
        onClose={closeModal}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default Escrows;