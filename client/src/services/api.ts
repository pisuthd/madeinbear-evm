const API_BASE_URL = "https://madeinbear.vercel.app"

/**
 * API client for MadeInBear backend
 */

/**
 * Create a new agent
 */
export async function createAgent(data: {
  slug: string;
  institutionName: string;
  country: string;
  kycLevel: 1 | 2 | 3;
}) {
  const response = await fetch(`${API_BASE_URL}/api/agents/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to create agent');
  }

  return response.json();
}

/**
 * Get agent information by slug
 */
export async function getAgent(slug: string) { 
  
  const response = await fetch(`${API_BASE_URL}/api/agents/${encodeURIComponent(slug)}`);

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to get agent');
  }

  return response.json();
}

/**
 * Verify agent's KYC attestation
 */
export async function verifyAgent(slug: string) {
  const response = await fetch(`${API_BASE_URL}/api/agents/${encodeURIComponent(slug)}/verify`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to verify agent');
  }

  return response.json();
}

/**
 * Request USDC from faucet
 */
export async function requestUSDC(slug: string) {
  const response = await fetch(`${API_BASE_URL}/api/faucet/usdc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ slug }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to request USDC');
  }

  return response.json();
}

/**
 * Request mXAU from faucet
 */
export async function requestMXAU(slug: string) {
  const response = await fetch(`${API_BASE_URL}/api/faucet/mxau`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ slug }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to request mXAU');
  }

  return response.json();
}

/**
 * Format wallet address for display
 */
export function formatWalletAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 8)}...${address.slice(-4)}`;
}

/**
 * Copy wallet address to clipboard
 */
export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

/**
 * LENDING API ENDPOINTS
 */

/**
 * Get current lending prices from Pyth Oracle
 */
export async function getLendingPrices() {
  const response = await fetch(`${API_BASE_URL}/api/lending/prices`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to fetch lending prices');
  }

  return response.json();
}

/**
 * Get all borrow requests
 */
export async function getBorrowRequests() {
  const response = await fetch(`${API_BASE_URL}/api/lending/borrow-requests`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to fetch borrow requests');
  }

  return response.json();
}

/**
 * Post a new borrow request
 */
export async function postBorrowRequest(data: {
  slug: string;
  collateralAmount: number;
  requestedUsdc: number;
  maxRateBps: number;
  durationDays: number;
}) {
  const response = await fetch(`${API_BASE_URL}/api/lending/borrow-request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to post borrow request');
  }

  return response.json();
}

/**
 * Stream AI negotiation between lender and borrower
 * Uses Server-Sent Events (SSE) for real-time updates
 */
export async function streamNegotiation(
  data: {
    borrowRequestId: string;
    lenderSlug: string;
    maxRounds?: number;
    lenderStartPercent?: number;  // 0.6 - 0.8 (60% - 80%)
    lenderBehavior?: 'aggressive' | 'balanced' | 'conservative';
  },
  onMessage: (message: any) => void,
  onError?: (error: any) => void,
  onComplete?: (result: any) => void
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/lending/negotiate/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to start negotiation');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get response stream');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let eventType = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
          continue;
        }
        if (line.startsWith('data:')) {
          const data = JSON.parse(line.slice(5).trim());
          
          if (eventType === 'message') {
            onMessage(data);
          } else if (eventType === 'result') {
            if (onComplete) onComplete(data);
          } else if (eventType === 'error') {
            if (onError) onError(data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Negotiate loan (initiate loan accounts)
 */
export async function negotiateLoan(data: {
  lenderSlug: string;
  borrowerAddress: string;
  agreedUsdc: number;
  agreedRateBps: number;
}) {
  const response = await fetch(`${API_BASE_URL}/api/lending/negotiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to negotiate loan');
  }

  return response.json();
}

/**
 * Lock collateral
 */
export async function lockCollateral(data: {
  lenderAddress: string;
  borrowerSlug: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/lending/lock-collateral`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to lock collateral');
  }

  return response.json();
}

/**
 * Fund loan
 */
export async function fundLoan(data: {
  lenderSlug: string;
  borrowerAddress: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/lending/fund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to fund loan');
  }

  return response.json();
}

/**
 * Repay loan
 */
export async function repayLoan(data: {
  lenderAddress: string;
  borrowerSlug: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/lending/repay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to repay loan');
  }

  return response.json();
}

/**
 * Settle loan
 */
export async function settleLoan(data: {
  lenderSlug: string;
  borrowerAddress: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/lending/settle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to settle loan');
  }

  return response.json();
}

/**
 * Get all loans
 */
export async function getLoans() {
  const response = await fetch(`${API_BASE_URL}/api/lending/loans`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || error.error || 'Failed to fetch loans');
  }

  return response.json();
}