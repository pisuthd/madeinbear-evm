import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useCoFHE } from '../context/CoFHEContext';

function Header() {
  const { connected, connecting, error } = useCoFHE();

  const navItems: { label: string; path: string }[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Credentials', path: '/credentials' },
    { label: 'Ask AI', path: '/ask-ai' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-4 md:px-8 md:py-4">
      <nav className="max-w-7xl mx-auto flex ">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#3eddfd] to-white bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            style={{ fontFamily: '"Orbitron", sans-serif' }}
          >
            MadeInBear
          </Link>

          <div className="hidden ml-4 md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm  font-medium text-[#cbd5e1] hover:text-[#3eddfd] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>


        </div>
        {/* CoFHE Status Badge */}
        <div className='ml-auto flex'>
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