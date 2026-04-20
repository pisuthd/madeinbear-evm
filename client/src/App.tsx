import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
// import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Credentials from './pages/Credentials';
import AskAI from './pages/AskAI';
import Earn from './pages/Earn';
import Borrow from './pages/Borrow';
import SupplyUSDT from './pages/SupplyUSDT';
import BorrowUSDT from './pages/BorrowUSDT';
import { CoFHEProvider } from './context/CoFHEContext';

function App() {
  return (
    <CoFHEProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0f172a]">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            <Route path="/earn" element={<Earn />} />
            <Route path="/earn/usdt" element={<SupplyUSDT />} />
            <Route path="/borrow" element={<Borrow />} />
            <Route path="/borrow/usdt" element={<BorrowUSDT />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/credentials" element={<Credentials />} />
            <Route path="/ask-ai" element={<AskAI />} />
          </Routes>
          <Footer />
        </div>
      </BrowserRouter>
    </CoFHEProvider>
  );
}

export default App;