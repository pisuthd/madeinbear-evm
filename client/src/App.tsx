import { useState, useEffect } from 'react';
import { AgentProvider } from './context/AgentContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import NegotiationBoard from './pages/NegotiationBoard';
import Escrows from './pages/Escrows';
import DeployAgent from './pages/DeployAgent';
import Dashboard from './pages/Dashboard';

const currentPageToComponent: Record<string, React.ElementType> = {
  '/': Home,
  '/board': NegotiationBoard,
  '/escrows': Escrows,
  '/deploy-agent': DeployAgent,
  '/dashboard': Dashboard,
};

function App() {
  const [currentPage, setCurrentPage] = useState('/');

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      setCurrentPage(hash);
    };

    // Initial load
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    // Cleanup
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (path: string) => {
    setCurrentPage(path);
    window.location.hash = path;
  };

  const CurrentPageComponent = currentPageToComponent[currentPage] || Home;

  return (
    <AgentProvider>
      <div className="min-h-screen bg-[#0f172a]">
        <Header onNavigate={handleNavigate} />
        <CurrentPageComponent onNavigate={handleNavigate} />
        <Footer onNavigate={handleNavigate} />
      </div>
    </AgentProvider>
  );
}

export default App;
