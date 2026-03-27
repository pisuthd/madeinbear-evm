import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'MadeInBear',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // Replace with your WalletConnect project ID
  chains: [sepolia],
  ssr: true, // Set to false if your app does not use server-side rendering
});