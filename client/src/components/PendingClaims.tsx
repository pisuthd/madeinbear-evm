import { useAccount } from 'wagmi';
import { usePendingClaims, useCToken, type Claim } from '../hooks/useCToken';
import { useCoFHE } from '../context/CoFHEContext';
import { useState } from 'react';

const TOKENS: Record<string, { icon: string; name: string; cTokenAddress: `0x${string}` }> = {
  cWETH: {
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
    name: 'Wrapped ETH',
    cTokenAddress: '0xc80c4805fb463975dA194Bac8D3739479E7a78F8' as const,
  },
  cUSDT: {
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
    name: 'Tether USD',
    cTokenAddress: '0x014476bA75E5BAd792a9C91537B408df7e903F1d' as const,
  },
};

export default function PendingClaims() {
  const { address } = useAccount();
  const { pendingClaims, allClaims } = usePendingClaims(address);
  const { claim } = useCToken();
  const { client: cofheClient } = useCoFHE();
  const [claiming, setClaiming] = useState<Record<string, boolean>>({});
  const [claimError, setClaimError] = useState<string | null>(null);

  const formatBalance = (balance: bigint, decimals = 18, isConfidential = true) => {
    // Convert confidential amount to ERC20 amount if needed
    const erc20Amount = isConfidential ? balance * BigInt(10 ** 12) : balance;
    
    const divisor = BigInt(10 ** decimals);
    const whole = erc20Amount / divisor;
    const fraction = erc20Amount % divisor;
    return `${Number(whole)}.${fraction.toString().padStart(decimals, '0').slice(0, 6)}`;
  };

  const handleClaim = async (claimData: Claim) => {
    if (!cofheClient) {
      setClaimError('CoFHE client not connected');
      return;
    }

    if (!claimData.token) {
      setClaimError('Token information missing');
      return;
    }

    setClaiming(prev => ({ ...prev, [claimData.ctHash]: true }));
    setClaimError(null);

    try {
      console.log("Claiming with data:", claimData);

      // Step 1: Decrypt the ciphertext hash to get the plaintext and signature
      console.log("Decrypting ctHash:", claimData.ctHash);
      const decryptResult = await cofheClient
        .decryptForTx(claimData.ctHash)
        .withoutPermit()
        .execute();

      console.log("Decrypt result:", decryptResult);

      if (!decryptResult) {
        throw new Error('Decryption failed - no result returned');
      }

      const { decryptedValue, signature } = decryptResult;

      if (!decryptedValue || decryptedValue === 0n) {
        throw new Error('Decryption returned zero amount. Please try again.');
      }

      if (!signature) {
        throw new Error('Decryption failed - no signature returned');
      }

      console.log("Before claim - decryptedValue:", decryptedValue, "signature:", signature);

      // Step 2: Claim the unshielded tokens on-chain
      const tokenInfo = TOKENS[claimData.token];
      await claim(
        tokenInfo.cTokenAddress,
        claimData.ctHash,
        decryptedValue,
        signature as `0x${string}`
      );

      console.log("Claim successful");

      // Success! The claim has been processed
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim';
      setClaimError(errorMessage);
      console.error('Claim error:', error);
    } finally {
      setClaiming(prev => ({ ...prev, [claimData.ctHash]: false }));
    }
  };

  if (!address) {
    return (
      <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">Pending Claims</h3>
        <p className="text-[#94a3b8]">Connect your wallet to view pending claims</p>
      </div>
    );
  }

  if (pendingClaims.length === 0) {
    return (
      <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">Pending Claims</h3>
        <p className="text-[#94a3b8]">No pending claims</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-[#f8fafc] mb-4">Pending Claims</h3>

      {claimError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">{claimError}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#3eddfd]/10">
              <th className="text-left py-3 px-4 text-sm font-medium text-[#94a3b8]">Token</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-[#94a3b8]">Amount</th> 
              <th className="text-center py-3 px-4 text-sm font-medium text-[#94a3b8]">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingClaims.map((claim) => {
              const tokenInfo = TOKENS[claim.token];
              if (!tokenInfo) return null;

              const isReadyToClaim = !claim.claimed;
              const isClaiming = claiming[claim.ctHash];

              return (
                <tr key={claim.ctHash} className="border-b border-[#3eddfd]/10 hover:bg-[#0f172a]/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={tokenInfo.icon}
                        alt={claim.token}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-[#f8fafc]">{claim.token}</div>
                        <div className="text-xs text-[#94a3b8]">{tokenInfo.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className="text-lg font-semibold text-[#f8fafc]">
                      {formatBalance(claim.requestedAmount)}
                    </span>
                  </td> 
                  <td className="text-center py-4 px-4">
                    {isReadyToClaim ? (
                      <button
                        onClick={() => handleClaim(claim)}
                        disabled={isClaiming}
                        className="px-4 py-2 bg-[#3eddfd] hover:bg-[#3eddfd]/80 disabled:bg-[#3eddfd]/50 disabled:cursor-not-allowed text-[#0f172a] font-medium rounded-lg transition-all text-sm"
                      >
                        {isClaiming ? 'Claiming...' : 'Claim'}
                      </button>
                    ) : (
                      <span className="text-sm text-[#94a3b8]">Not ready</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
 
    </div>
  );
}