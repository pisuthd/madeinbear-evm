import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-[#1e293b] border-t border-[#334155]">
      <div className="max-w-7xl mx-auto   py-12">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">

          {/* Column 1: Logo & Description */}
          <div className="text-center col-span-2 md:text-left">
            <Link
              to="/"
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#3eddfd] to-white bg-clip-text text-transparent mb-4 inline-block hover:opacity-80 transition-opacity"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              MadeInBear
            </Link>
            <p className="text-[#94a3b8] text-sm leading-relaxed">
              Confidential Lending for Institutional Capital
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="text-[#f8fafc] font-semibold mb-4 text-lg">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className="text-[#94a3b8] hover:text-[#3eddfd] transition-colors text-sm"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/credentials"
                  className="text-[#94a3b8] hover:text-[#3eddfd] transition-colors text-sm"
                >
                  Credentials
                </Link>
              </li>
              <li>
                <Link
                  to="/ask-ai"
                  className="text-[#94a3b8] hover:text-[#3eddfd] transition-colors text-sm"
                >
                  Ask AI
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Social */}
          <div className="text-center md:text-left">
            <h3 className="text-[#f8fafc] font-semibold mb-4 text-lg">Contact</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:pisuth@tamagolabs.com"
                  className="text-[#94a3b8] hover:text-[#3eddfd] transition-colors text-sm flex items-center justify-center md:justify-start gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Us
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/pisuthd/madeinbear-evm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#94a3b8] hover:text-[#3eddfd] transition-colors text-sm flex items-center justify-center md:justify-start gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub Repo
                </a>
              </li>
              <li>
                <a
                  href="https://tamagolabs.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#94a3b8] hover:text-[#3eddfd] transition-colors text-sm flex items-center justify-center md:justify-start gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 0c2.5 2.5 4 6 4 10s-1.5 7.5-4 10m0-20C9.5 4.5 8 8 8 12s1.5 7.5 4 10m-9-10h18"
                    />
                  </svg>
                  Company Website
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#334155] mb-6"></div>

        {/* Bottom Row: Hackathon Badge & Copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
          <p className="text-[#94a3b8] text-sm">
            Made with ❤️ during Akindo Buildathon
          </p>
          <div className="text-center md:text-right">
            <p className="text-[#94a3b8] text-sm mb-1">
              © 2026
              {` `}
              <a
                href="https://tamagolabs.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3eddfd] hover:text-[#2dd4d4] transition-colors text-sm font-medium"
              >
                Tamago Labs Japan
              </a>
            </p>

          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;