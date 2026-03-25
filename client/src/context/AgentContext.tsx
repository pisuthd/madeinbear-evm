import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Agent, Organization } from '../types';

interface AgentContextType {
  agent: Agent | null;
  hasAgent: boolean;
  deployAgent: (organization: Organization) => void;
  clearAgent: () => void;
  updateBalance: (amount: number) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

const STORAGE_KEY = 'madeinbear_agent';
const WALLETS_KEY = 'madeinbear_wallets';

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<any>(null);
  const [hasAgent, setHasAgent] = useState(false);

  // Load agent from localStorage on mount
  useEffect(() => {
    const savedAgent = localStorage.getItem(STORAGE_KEY);
    if (savedAgent) {
      try {
        const parsedAgent = JSON.parse(savedAgent);
        parsedAgent.createdAt = new Date(parsedAgent.createdAt);
        setAgent(parsedAgent);
        setHasAgent(true);
      } catch (error) {
        console.error('Failed to parse saved agent:', error);
      }
    }
  }, []);

  const deployAgent = (organization: Organization) => {
    const newAgent = {
      id: organization.slug,
      organization: organization
    }

    setAgent(newAgent);
    setHasAgent(true);

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAgent));
  };

  const clearAgent = () => {
    setAgent(null);
    setHasAgent(false);
    localStorage.removeItem(STORAGE_KEY);

    // Optionally remove wallet
    if (agent) {
      const wallets = JSON.parse(localStorage.getItem(WALLETS_KEY) || '{}');
      delete wallets[agent.walletAddress];
      localStorage.setItem(WALLETS_KEY, JSON.stringify(wallets));
    }
  };

  const updateBalance = (amount: number) => {
    if (!agent) return;

    const updatedAgent = { ...agent, balance: amount };
    setAgent(updatedAgent);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAgent));
  };

  return (
    <AgentContext.Provider
      value={{
        agent,
        hasAgent,
        deployAgent,
        clearAgent,
        updateBalance,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}