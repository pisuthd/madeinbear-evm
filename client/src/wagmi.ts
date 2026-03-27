import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'MadeInBear',
  projectId: 'WALLETCONNECT_PROJECT_ID', 
  chains: [sepolia],
  ssr: true, 
});