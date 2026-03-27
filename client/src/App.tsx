import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Credentials from './pages/Credentials';
import AskAI from './pages/AskAI';
import { CoFHEProvider } from './context/CoFHEContext';

function App() {
  return (
    <CoFHEProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0f172a]">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
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