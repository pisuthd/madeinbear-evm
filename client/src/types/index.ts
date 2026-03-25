// Organization (for deploy agent form - matches SAS schema)
export interface Organization {
  slug?: string;            // Unique identifier for the agent
  institutionName: string;  // max 12 chars
  country: string;          // max 12 chars
  kycLevel: 1 | 2 | 3;      // from SAS schema
}

// Agent (generated wallet)
export interface Agent {
  id: string;              
  organization: Organization;
  walletAddress: string;
  publicKey: string;
  privateKey: string;
  balance: number;         
  createdAt: Date;
  status: 'active' | 'inactive';
}

// Categories (multi-category support)
export type DealCategory = 'lending' | 'payments' | 'trading' | 'derivatives';

// Escrow Status
export type EscrowStatus = 'Active' | 'Completed' | 'Cancelled';

// Intent (from smart contract)
export interface Intent {
  id: string;
  lender: string;
  institutionName: string;
  amount: number;
  rateBps: number;
  durationSeconds: number;
  category: DealCategory;
  status: 'Open' | 'Matched' | 'Cancelled';
  createdAt: Date;
}

// Escrow (from smart contract)
export interface Escrow {
  id: string;
  lender: string;
  borrower: string;
  amount: number;
  rateBps: number;
  durationSeconds: number;
  category: DealCategory;
  startTime: Date;
  status: 'Active' | 'Completed' | 'Cancelled';
  maturityDate: Date;
  interest: number;
  totalRepayment: number;
  travelRuleMemo?: {
    originator: string;
    beneficiary: string;
    purpose: string;
  };
}

// Dashboard Stats
export interface DashboardStats {
  totalDeals: number;
  openIntents: number;
  activeEscrows: number;
  totalFundsLocked: number;
  categories: {
    lending: number;
    payments: number;
    trading: number;
    derivatives: number;
  };
}

// API Response Types
export interface AgentApiResponse {
  slug: string;
  walletAddress: string;
  institutionName: string;
  country: string;
  kycLevel: number;
  credentialPda: string;
  schemaPda: string;
  attestationPda: string;
  expiry: number;
  createdAt: number;
  updatedAt: number;
  balances?: TokenBalances;
  status?: AgentStatus;
  explorerUrls?: {
    wallet: string;
    attestation: string;
  };
}

export interface TokenBalances {
  sol: number;
  usdc: number;
  mxau: number;
}

export interface AgentStatus {
  verified: boolean;
  expired: boolean;
  expiresAt?: string;
}

export interface CreateAgentRequest {
  slug: string;
  institutionName: string;
  country: string;
  kycLevel: 1 | 2 | 3;
}

export interface CreateAgentResponse {
  slug: string;
  walletAddress: string;
  institutionName: string;
  country: string;
  kycLevel: number;
  credentialPda: string;
  schemaPda: string;
  attestationPda: string;
  expiry: number;
  createdAt: number;
  updatedAt: number;
  explorerUrls: {
    wallet: string;
    attestation: string;
  };
}

export interface FaucetResponse {
  success: boolean;
  amount: number;
  token: string;
  recipient: string;
  transactionId: string;
  explorerUrl: string;
}

// Lending Types
export type BorrowRequestStatus = 'Open' | 'Negotiating' | 'Locked' | 'Funded' | 'Completed';

export interface BorrowRequest {
  address: string;
  borrower: string;
  collateralAmount: number;
  collateralUsdValue: number;
  requestedUsdc: number;
  maxRateBps: number;
  durationSeconds: number;
  status: BorrowRequestStatus | Record<string, any>;
  createdAt: string | number;
  ltv?: number;
}

export interface Loan {
  address: string;
  lender: string;
  borrower: string;
  collateralMint: string;
  collateralAmount: number;
  collateralUsdValue: number;
  loanAmount: number;
  rateBps: number;
  durationSeconds: number;
  startTime: string | number;
  ltv: number;
  status: string | Record<string, any>;
}

export interface PriceData {
  symbol: string;
  price: number;
  confidence: number;
  timestamp: Date;
  fallback?: boolean;
}

export interface LendingPricesResponse {
  fetchedAt: string;
  XAU_USD: PriceData;
  SOL_USD: PriceData;
}

export interface PostBorrowRequestRequest {
  slug: string;
  collateralAmount: number;
  requestedUsdc: number;
  maxRateBps: number;
  durationDays: number;
}

export interface PostBorrowRequestResponse {
  borrowRequest: BorrowRequest;
  borrower: string;
  tx: string;
  details: {
    collateralAmount: number;
    collateralUsdValue: number;
    requestedUsdc: number;
    maxRateBps: number;
    ltv: number;
    durationDays: number;
    xauPrice: number;
  };
  explorerUrl: string;
}

export interface NegotiateLoanRequest {
  lenderSlug: string;
  borrowerAddress: string;
  agreedUsdc: number;
  agreedRateBps: number;
}

export interface NegotiateLoanResponse {
  loan: Loan;
  lender: string;
  borrower: string;
  tx: string;
  terms: {
    loanAmount: number;
    rateBps: number;
    apr: string;
  };
  explorerUrl: string;
}