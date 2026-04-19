 

export const DEPLOYMENTS = {
  11155111: { // Sepolia
    // Protocol contracts
    cMorpho: '0x86A4AC7ab176EDC7b99ba0506ca2Aa63A4F576eB',
    Oracle: '0x3201f68B1e49a4172C643dA716ced6E78F8E9672',
    IRM: '0xCeA7AaD606823924B5fA26b5B8dB493Fd7c7f0b9',
    
    // Confidential token markets
    cUSDT: '0x1B86F12280F4241312DE4bd80cE2e8A5B5D06A9F',
    cETH: '0xFFff2977Fa735b530989f1fa761E6d3fe14d352B',
    
    // Mock tokens (for faucet)
    MockUSDT: '0xAbda7A80cDc18bB577DeA3c102F35a75DBD37591',
    MockETH: '0x423df22BeD1528b84427A31BB0dfeDE760392e76',
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
// export const MARKET_METADATA = {
//   '0x71755D49cdd76d71A93a08223DA6Ea1c4D2814fc': { // cUSDT
//     symbol: 'cUSDT',
//     name: 'Confidential USDT',
//     underlying: 'USDT',
//     underlyingAddress: '0xd1b25f0a824d6fD22075399eD17bcc37dBA8B210',
//     decimals: 6, // Mock USDT uses 6 decimals
//     icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
//   },
//   '0x01F1b51Dcb6063847936B3A07E6FEF036800FDB3': { // cETH
//     symbol: 'cETH',
//     name: 'Confidential Wrapped ETH',
//     underlying: 'ETH',
//     underlyingAddress: '0x8972068C8DeE934A9d4dfBB7Bc1d131B11a4403D',
//     decimals: 6, // Mock ETH uses 6 decimals
//     icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
//   },
// } as const;

// export type MarketAddress = keyof typeof MARKET_METADATA;

// export function getMarketMetadata(address: string) {
//   return MARKET_METADATA[address as MarketAddress];
// }

// export function getAllMarkets(chainId: number) {
//   const deployment = getDeployment(chainId);
//   if (!deployment) return [];
  
//   return [deployment.cUSDT, deployment.cETH];
// }

// Mock token metadata for faucet
export const MOCK_TOKEN_METADATA = {
  '0xAbda7A80cDc18bB577DeA3c102F35a75DBD37591': {
    symbol: 'USDT',
    name: 'Mock USDT',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
    mintAmount: BigInt(10000) * BigInt(10 ** 6), // 10,000 tokens
  },
  '0x423df22BeD1528b84427A31BB0dfeDE760392e76': {
    symbol: 'ETH',
    name: 'Mock ETH',
    decimals: 6,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    mintAmount: BigInt(10) * BigInt(10 ** 6), // 10 tokens
  },
} as const;

export function getMockTokenMetadata(address: string) {
  return MOCK_TOKEN_METADATA[address as keyof typeof MOCK_TOKEN_METADATA];
}
