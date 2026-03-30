import { useState, useRef, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { erc20Abi } from 'viem';
import { useCToken } from '../hooks/useCToken';
import { getBalance } from '../utils/confidentialBalances';

type Token = 'WETH' | 'USDT';
type Tab = 'wrap' | 'unwrap';

interface TokenInfo {
  symbol: string;
  name: string;
  erc20Address: `0x${string}`;
  cTokenAddress: `0x${string}`;
  decimals: number;
  icon: string;
}

const TOKENS: Record<Token, TokenInfo> = {
  WETH: {
    symbol: 'WETH',
    name: 'Wrapped ETH',
    erc20Address: '0xF834024dF747196803368523E1677328fD50415f' as const,
    cTokenAddress: '0xc80c4805fb463975dA194Bac8D3739479E7a78F8' as const,
    decimals: 18,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    erc20Address: '0x2a003dd5ceFCA17767b103963C34fBD8d1E81dC9' as const,
    cTokenAddress: '0x014476bA75E5BAd792a9C91537B408df7e903F1d' as const,
    decimals: 18,
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
  },
};

export default function WrapUnwrap() {
  const { address } = useAccount();
  const [tab, setTab] = useState<Tab>('wrap');
  const [selectedToken, setSelectedToken] = useState<Token>('WETH');
  const [amount, setAmount] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [balanceKey, setBalanceKey] = useState(0); // Force re-render of balance
  const dropdownRef = useRef<HTMLDivElement>(null);

  const tokenInfo = TOKENS[selectedToken];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch ERC-20 balance
  const { data: erc20Balance } = useReadContract({
    address: tokenInfo.erc20Address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  }) as { data: bigint | undefined };

  // Get confidential balance from localStorage (already in confidential units)
  // For WETH/USDT (18 decimals), confidential units = ERC20 / 10^12
  // The stored value is already correct, just multiply for display
  const rawConfidentialBalance = address ? getBalance(address, tokenInfo.cTokenAddress) : 0n;

  // Convert confidential amount to ERC20 amount for display
  // For 18-decimal tokens: display = confidential * 10^12
  const confidentialBalance = rawConfidentialBalance * BigInt(10 ** 12);

  const { wrap, unwrap, loading } = useCToken();

  const formatBalance = (balance: bigint | undefined, decimals: number) => {
    if (!balance) return '0.00';
    const divisor = BigInt(10 ** decimals);
    const whole = balance / divisor;
    const fraction = balance % divisor;
    return `${Number(whole)}.${fraction.toString().padStart(decimals, '0').slice(0, 6)}`;
  };

  const parseAmount = (value: string) => {
    if (!value) return 0n;
    const decimals = tokenInfo.decimals;
    const [whole, fraction = '0'] = value.split('.');
    const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction || '0');
  };

  const setMaxAmount = () => {
    const maxBalance = tab === 'wrap' ? erc20Balance : confidentialBalance;
    if (maxBalance) {
      const formatted = formatBalance(maxBalance, tokenInfo.decimals);
      setAmount(formatted);
    }
  };

  const handleWrap = async () => {
    setSuccessMessage('');
    setErrorMessage('');

    if (!address || !amount) return;

    try {
      const amountInWei = parseAmount(amount);
      await wrap(tokenInfo.cTokenAddress, amountInWei, address);
      setSuccessMessage(`Successfully wrapped ${amount} ${tokenInfo.symbol}!`);
      setAmount('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to wrap tokens');
    }
  };

  const handleUnwrap = async () => {
    setSuccessMessage('');
    setErrorMessage('');

    if (!address || !amount) return;

    try {
      const amountInWei = parseAmount(amount); // This is ERC20 amount (18 decimals)

      // Check if we have enough balance by comparing with stored confidential amount
      // Need to convert stored confidential amount to ERC20 for fair comparison
      const storedBalanceAsERC20 = rawConfidentialBalance * BigInt(10 ** 12);

      if (storedBalanceAsERC20 < amountInWei) {
        setErrorMessage('Insufficient confidential balance');
        return;
      }

      // Calculate the confidential amount (will be rounded down)
      const confidentialAmount = amountInWei / BigInt(10 ** 12);

      // Pass the ERC20 amount to subtract from localStorage directly
      // This way we subtract exactly what the user entered, not the rounded confidential amount
      // We need to handle this in the hook, so we pass extra data
      await unwrap(tokenInfo.cTokenAddress, confidentialAmount, address, amountInWei);

      // Force re-render to show updated balance
      setBalanceKey(prev => prev + 1);

      setSuccessMessage(`Successfully initiated unwrap of ${amount} ${tokenInfo.symbol}.`);
      setAmount('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to unwrap tokens');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    if (tab === 'wrap') {
      await handleWrap();
    } else {
      await handleUnwrap();
    }
  };

  const balance = tab === 'wrap' ? erc20Balance : confidentialBalance;
  const buttonText = () => {
    if (loading) return tab === 'wrap' ? 'Wrapping...' : 'Unwrapping...';
    return tab === 'wrap' ? 'Wrap' : 'Unwrap';
  };

  return (
    <div className="space-y-6">
      {/* Main Wrap/Unwrap Card */}
      <div className="bg-[#1e293b]/50 backdrop-blur-sm border border-[#3eddfd]/10 rounded-lg p-6">
        {/* Title */}
        <h3 className="text-xl font-semibold text-[#f8fafc] mb-6">Wrap / Unwrap</h3>

        {/* Full-width Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('wrap')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium ${tab === 'wrap'
              ? 'bg-[#3eddfd] text-[#0f172a]'
              : 'bg-[#0f172a] text-[#94a3b8]'
              }`}
          >
            Wrap
          </button>
          <button
            onClick={() => setTab('unwrap')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium ${tab === 'unwrap'
              ? 'bg-[#3eddfd] text-[#0f172a]'
              : 'bg-[#0f172a] text-[#94a3b8]'
              }`}
          >
            Unwrap
          </button>
        </div>

        {/* Input Section - Token Selector + Input on Same Row */}
        <div className="bg-[#0f172a]/50 rounded-lg border border-[#3eddfd]/20 p-4 mb-4">
          <div className="flex gap-4 mb-4">
            {/* Token Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 px-4 py-3 bg-[#1e293b] border border-[#3eddfd]/20 rounded-lg min-w-[160px]"
              >
                <img
                  src={tokenInfo.icon}
                  alt={tokenInfo.symbol}
                  className="w-8 h-8 rounded-full"
                />
                <span className="font-medium text-[#f8fafc]">{tokenInfo.symbol}</span>
                <svg className="w-4 h-4 text-[#94a3b8] ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute top-full left-0 mt-2 bg-[#1e293b] border border-[#3eddfd]/20 rounded-lg shadow-xl z-50 w-full">
                  {(Object.keys(TOKENS) as Token[]).map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => {
                        setSelectedToken(token);
                        setShowDropdown(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-[#3eddfd]/10 last:border-b-0 ${selectedToken === token ? 'bg-[#3eddfd]/10' : ''
                        }`}
                    >
                      <img
                        src={TOKENS[token].icon}
                        alt={TOKENS[token].symbol}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="text-left">
                        <div className="font-medium text-[#f8fafc]">{TOKENS[token].symbol}</div>
                        <div className="text-xs text-[#94a3b8]">{TOKENS[token].name}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Amount Input */}
            <div className="flex-1">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.000001"
                className="w-full bg-transparent text-4xl font-semibold text-[#f8fafc] placeholder-[#64748b] focus:outline-none"
              />
            </div>

            {/* MAX Button */}
            <button
              type="button"
              onClick={setMaxAmount}
              className="px-4 py-2 text-sm font-medium text-[#3eddfd] bg-[#3eddfd]/10 rounded-lg"
            >
              MAX
            </button>
          </div>

          {/* Balance Display */}
          <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
            <span>{tab === 'wrap' ? 'Available Balance:' : 'Confidential Balance:'}</span>
            <span className="font-semibold text-[#f8fafc]">
              {formatBalance(balance, tokenInfo.decimals)} {tokenInfo.symbol}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <form onSubmit={handleSubmit}>
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0 || loading}
            className="w-full px-6 py-4 bg-[#3eddfd] disabled:bg-[#3eddfd]/30 disabled:cursor-not-allowed text-[#0f172a] font-bold text-lg rounded-xl flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-6 w-6 text-[#0f172a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {buttonText()}
              </>
            ) : (
              <>{buttonText()}</>
            )}
          </button>
        </form>

        {/* Messages */}
        {successMessage && (
          <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* {address && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Clear all confidential balance data? This will reset tracked balances.')) {
                  clearAllBalances(address);
                  window.location.reload();
                }
              }}
              className="text-xs text-[#64748b] hover:text-[#94a3b8] underline"
            >
              Reset Balance Data
            </button>
          </div>
        )} */}
      </div>

    </div>
  );
}
