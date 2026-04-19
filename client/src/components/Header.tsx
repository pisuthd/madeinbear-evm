import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useCoFHE } from '../context/CoFHEContext';

function Header() {
  const { connected, connecting, error } = useCoFHE();
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMoreDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Earn', path: '/earn' },
    { label: 'Borrow', path: '/borrow' },
    { label: 'Portfolio', path: '/portfolio' },
  ];

  const moreDropdownItems = [
    { 
      label: 'GitHub', 
      href: 'https://github.com/pisuthd/madeinbear-evm',
      external: true,
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
      )
    },
    { 
      label: 'View Rates', 
      path: '/credentials',
      external: false,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      label: 'Ask AI', 
      path: '/ask-ai',
      external: false,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-4 md:px-8 md:py-4">
      <nav className="max-w-7xl mx-auto flex">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#3eddfd] to-white bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            style={{ fontFamily: '"Orbitron", sans-serif' }}
          >
            MadeInBear
          </Link>

          <div className="hidden ml-4 md:flex items-center space-x-3 gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-medium text-[#cbd5e1] hover:text-[#3eddfd] transition-colors "
              >
                {item.label}
              </Link>
            ))}

            {/* More Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                className="flex items-center gap-1 text-sm font-medium text-[#cbd5e1] hover:text-[#3eddfd] transition-colors"
              >
                More
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${showMoreDropdown ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showMoreDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#1e293b] border border-[#334155] rounded-lg shadow-xl py-2 z-50">
                  {moreDropdownItems.map((item, index) => (
                    <div key={index}>
                      {item.external ? (
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#cbd5e1] hover:text-[#3eddfd] hover:bg-[#334155]/50 transition-colors"
                          onClick={() => setShowMoreDropdown(false)}
                        >
                          {item.icon}
                          {item.label}
                        </a>
                      ) : item.path ? (
                        <Link
                          to={item.path}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#cbd5e1] hover:text-[#3eddfd] hover:bg-[#334155]/50 transition-colors"
                          onClick={() => setShowMoreDropdown(false)}
                        >
                          {item.icon}
                          {item.label}
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CoFHE Status Badge */}
        <div className="ml-auto flex">
          <div className="hidden my-auto sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300"
            style={{
              backgroundColor: error
                ? 'rgba(239, 68, 68, 0.1)'
                : connected
                  ? 'rgba(34, 197, 94, 0.1)'
                  : connecting
                    ? 'rgba(251, 191, 36, 0.1)'
                    : 'rgba(148, 163, 184, 0.1)',
              borderColor: error
                ? 'rgba(239, 68, 68, 0.3)'
                : connected
                  ? 'rgba(34, 197, 94, 0.3)'
                  : connecting
                    ? 'rgba(251, 191, 36, 0.3)'
                    : 'rgba(148, 163, 184, 0.3)'
            }}
          >
            <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${error
              ? 'bg-red-400 animate-pulse'
              : connected
                ? 'bg-green-400'
                : connecting
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-slate-400'
              }`} />
            <span className={`text-xs font-medium ${error
              ? 'text-red-400'
              : connected
                ? 'text-green-400'
                : connecting
                  ? 'text-yellow-400'
                  : 'text-slate-400'
              }`}>
              {error
                ? 'Fhenix Error'
                : connected
                  ? 'Fhenix Connected'
                  : connecting
                    ? 'Connecting...'
                    : 'Fhenix Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex px-2 ml-2 items-center">
          <ConnectButton />
        </div>
      </nav>
    </header>
  );
}

export default Header;
