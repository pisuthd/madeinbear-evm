/**
 * Contract Deployments by Chain
 * 
 * Source: deployments.txt
 */

export const DEPLOYMENTS = {
  11155111: { // Sepolia
    // Underlying tokens
    WETH: '0x4C143F18881a1D75c3458df023802f129a590Dc3',
    USDT: '0x1e94972F3EEc3848297e9c9ad84a4f8aB7AC55EE',
    
    // Protocol contracts
    Oracle: '0x3dd3B893fb992E59A6536AF01C496F52aD897F9f',
    Comptroller: '0x9286e7a1f66b6f99dB85A345117a330ED5ED79F1',
    
    // Confidential cTokens
    ccWETH: '0x707628799Dc723285391950eEF4a2778DFF4a902',
    ccUSDT: '0x489e403Bc8D3Eb681240E991ae2Cf672F93e843C',
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
  '0x707628799Dc723285391950eEF4a2778DFF4a902': { // ccWETH
    symbol: 'ccWETH',
    name: 'Confidential Wrapped ETH',
    underlying: 'WETH',
    underlyingAddress: '0x4C143F18881a1D75c3458df023802f129a590Dc3',
    decimals: 18,
    icon: '⟠',
  },
  '0x489e403Bc8D3Eb681240E991ae2Cf672F93e843C': { // ccUSDT
    symbol: 'ccUSDT',
    name: 'Confidential USDT',
    underlying: 'USDT',
    underlyingAddress: '0x1e94972F3EEc3848297e9c9ad84a4f8aB7AC55EE',
    decimals: 18,
    icon: '₮',
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