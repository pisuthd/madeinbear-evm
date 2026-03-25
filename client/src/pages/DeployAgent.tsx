import { useState, useEffect } from 'react';
import DeployAgentForm from '../components/DeployAgentForm';
import DeployAgentSuccess from '../components/DeployAgentSuccess';
import { createAgent } from '../services/api';
import type { CreateAgentRequest, CreateAgentResponse } from '../types';
import { useAgent } from '../context/AgentContext';
import type { Organization } from '../types';

interface DeployAgentProps {
  onNavigate: (path: string) => void;
}

function DeployAgent({ onNavigate }: DeployAgentProps) {
  const { agent, deployAgent: deployToContext, clearAgent } = useAgent();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedAgent, setDeployedAgent] = useState<CreateAgentResponse | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExistingAgent, setShowExistingAgent] = useState(false);

  const [formData, setFormData] = useState<CreateAgentRequest>({
    slug: '',
    institutionName: '',
    country: 'JP',
    kycLevel: 1,
  });

  // Check if agent already exists from context
  useEffect(() => {
    const checkExistingAgent = async () => {
      // If user already has an agent, show the existing agent warning
      if (agent?.organization?.slug) {
        setShowExistingAgent(true);
      } else if (agent?.id) {
        setShowExistingAgent(true);
      }
    };
    checkExistingAgent();
  }, [agent]);

  const handleDeploy = async (data: CreateAgentRequest) => {
    setIsDeploying(true);
    setErrors({});

    try {
      const result = await createAgent(data);
      setDeployedAgent(result);
      
      const organization: Organization = {
        slug: result.slug,
        institutionName: result.institutionName,
        country: result.country,
        kycLevel: result.kycLevel as 1 | 2 | 3,
      };
      
      // Store minimal info to trigger hasAgent = true
      // The real data will be fetched from API using the slug
      deployToContext(organization);
      setShowExistingAgent(false);
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleGoToDashboard = () => {
    onNavigate('/dashboard');
  };

  const handleCancel = () => {
    onNavigate('/dashboard');
  };

  const handleClearAgent = () => {
    clearAgent();
    setShowExistingAgent(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a]">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.1]">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(62, 223, 223, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(62, 223, 223, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="container mx-auto px-4 py-12 pt-24 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-[#f8fafc] mb-4">Deploy Your Institution Agent</h1>
            <p className="text-[#94a3b8] text-lg max-w-2xl mx-auto">
              Deploy your institution agent with SAS-verified KYC attestation
            </p>
          </div>

          {/* Development Notice */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 mb-8">
            <p className="text-[#3eddfd] text-sm text-center leading-relaxed">
              MadeInBear is currently at an early stage of development. Agent wallet and its credentials will be deployed on Solana Devnet with KYC level 1 automatically approved.
            </p>
          </div>

          {/* Existing Agent Warning Alert */}
          {showExistingAgent && !deployedAgent && (
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 mb-8">
              <div className="flex items-start gap-4">
                 
                <div className="flex-1">
                  <h3 className="font-semibold text-[#f8fafc] text-lg mb-2">Agent Already Deployed</h3>
                  
                  <p className="text-sm text-[#94a3b8] mb-6 leading-relaxed">
                    You've already deployed an agent. You can view your dashboard, or clear your current agent.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onNavigate('/dashboard')}
                      className="px-5 py-2.5 bg-[#3eddfd] text-[#0f172a] text-sm font-semibold rounded-lg hover:bg-[#2dd4d4] transition-all hover:shadow-[0_0_15px_rgba(62,223,223,0.3)]"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      onClick={handleClearAgent}
                      className="px-5 py-2.5 bg-transparent border border-[#475569] text-[#f8fafc] text-sm font-semibold rounded-lg hover:bg-[#475569] transition-colors"
                    >
                      Remove Agent
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form - Always shown unless deployedAgent exists */}
          {!deployedAgent ? (
            <DeployAgentForm
              isDeploying={isDeploying}
              errors={errors}
              formData={formData}
              onDeploy={handleDeploy}
              onCancel={handleCancel}
              onFormDataChange={setFormData}
            />
          ) : (
            <DeployAgentSuccess
              agentData={deployedAgent}
              onGoToDashboard={handleGoToDashboard}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default DeployAgent;