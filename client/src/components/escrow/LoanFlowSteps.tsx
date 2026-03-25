import React from 'react';

export function LoanFlowSteps() {
  const steps = [ 
    { number: 1, label: '(Borrower) Lock Collateral' },
    { number: 2, label: '(Lender) Fund Loan' },
    { number: 3, label: '(Borrower) Repay' },
    { number: 4, label: '(Lender) Settle' },
  ];

  return (
    <div className="bg-[#1e293b] rounded-2xl border border-[#334155] p-6 mb-8">
      <h2 className="text-xl font-semibold text-[#f8fafc] mb-4">Lending Flow Steps</h2>
      <div className="flex items-center justify-between flex-wrap gap-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#3eddfd] flex items-center justify-center text-[#0f172a] font-bold text-sm">
                {step.number}
              </div>
              <span className="text-[#cbd5e1]">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="flex-1 h-1 bg-[#334155] hidden md:block"></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
