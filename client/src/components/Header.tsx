
interface HeaderProps {
  onNavigate: (path: string) => void;
}

function Header({ onNavigate }: HeaderProps) { 

  const navItems: { label: string; path: string }[] = [
    { label: 'Negotiation Board', path: '/board' },
    { label: 'Escrows', path: '/escrows' },
    { label: 'Dashboard', path: '/dashboard' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0f172a]/80 backdrop-blur-lg border-b border-[#334155] px-4 py-4 md:px-8 md:py-4">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/');
          }}
          className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#3eddfd] to-white bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          style={{ fontFamily: '"Orbitron", sans-serif' }}
        >
          MadeInBear
        </a>
 
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className="text-sm cursor-pointer font-medium text-[#cbd5e1] hover:text-[#3eddfd] transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
 
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/deploy-agent');
            }}
            className="px-6 py-2.5 cursor-pointer bg-[#3eddfd] text-[#0f172a] font-semibold rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_20px_rgba(62,223,223,0.3)]"
          >
            Deploy Agent
          </button>
        </div>
      </nav>
    </header>
  );
}

export default Header;