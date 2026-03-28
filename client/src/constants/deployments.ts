/**
 * Contract Deployments by Chain
 * 
 * Source: deployments.txt
 */

export const DEPLOYMENTS = {
  11155111: { // Sepolia
    // Underlying tokens
    WETH: '0xF834024dF747196803368523E1677328fD50415f',
    USDT: '0x2a003dd5ceFCA17767b103963C34fBD8d1E81dC9',
    
    // Protocol contracts
    Oracle: '0x4D64291037dCB365bc240CC49f232fCca8033c50',
    Comptroller: '0xf97d1232496D311aEBB30860998d0dEB79893c46',
    
    // Market cTokens
    ccWETH: '0x9123Fe9BE015b8562Bb91933D028D9aba9d2fF54',
    ccUSDT: '0x37Dd2f6335EF90272141156153EC879CDb8E3bB7',
  },
} as const;

export type ChainId = keyof typeof DEPLOYMENTS;

export function getDeployment(chainId: number) {
  return DEPLOYMENTS[chainId as ChainId];
}

export function isChainSupported(chainId: number): chainId is ChainId {
  return chainId in DEPLOYMENTS;
}

// Market metadata
export const MARKET_METADATA = {
  '0x9123Fe9BE015b8562Bb91933D028D9aba9d2fF54': { // ccWETH
    symbol: 'ccWETH',
    name: 'Confidential Wrapped ETH',
    underlying: 'WETH',
    underlyingAddress: '0xF834024dF747196803368523E1677328fD50415f',
    decimals: 18,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
  '0x37Dd2f6335EF90272141156153EC879CDb8E3bB7': { // ccUSDT
    symbol: 'ccUSDT',
    name: 'Confidential USDT',
    underlying: 'USDT',
    underlyingAddress: '0x2a003dd5ceFCA17767b103963C34fBD8d1E81dC9',
    decimals: 18,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
  },
} as const;

export type MarketAddress = keyof typeof MARKET_METADATA;

export function getMarketMetadata(address: string) {
  return MARKET_METADATA[address as MarketAddress];
}

export function getAllMarkets(chainId: number) {
  const deployment = getDeployment(chainId);
  if (!deployment) return [];
  
  return [deployment.ccWETH, deployment.ccUSDT];
}