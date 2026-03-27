import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';

function Header() {
  const navItems: { label: string; path: string }[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Credentials', path: '/credentials' },
    { label: 'Ask AI', path: '/ask-ai' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-4 md:px-8 md:py-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#3eddfd] to-white bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          style={{ fontFamily: '"Orbitron", sans-serif' }}
        >
          MadeInBear
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="text-sm font-medium text-[#cbd5e1] hover:text-[#3eddfd] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center">
          <ConnectButton />
        </div>
      </nav>
    </header>
  );
}

export default Header;