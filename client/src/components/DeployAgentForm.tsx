import type { CreateAgentRequest } from '../types';

const KYC_LEVELS = [
  {
    value: 1,
    label: 'Level 1 - Basic',
    description: 'Standard identity verification. Perfect for getting started.',
    available: true,
    badge: '✓ Available '
  },
  {
    value: 2,
    label: 'Level 2 - Enhanced',
    description: 'Enhanced due diligence. Chat with Bear Agent to upgrade.',
    available: false,
    badge: '🔒 Contact Bear Agent'
  },
  {
    value: 3,
    label: 'Level 3 - Advanced',
    description: 'Full institutional verification. Chat with Bear Agent to upgrade.',
    available: false,
    badge: '🔒 Contact Bear Agent'
  },
];

const COUNTRY_CODES = [
  { code: 'TH', name: 'Thailand' },
  { code: 'US', name: 'United States' },
  { code: 'SG', name: 'Singapore' },
  { code: 'JP', name: 'Japan' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AU', name: 'Australia' },
];

interface DeployAgentFormProps {
  isDeploying: boolean;
  errors: Record<string, string>;
  formData: CreateAgentRequest;
  onDeploy: (data: CreateAgentRequest) => Promise<void>;
  onCancel: () => void;
  onFormDataChange: (data: CreateAgentRequest) => void;
}

function DeployAgentForm({
  isDeploying,
  errors,
  formData,
  onDeploy,
  onCancel,
  onFormDataChange
}: DeployAgentFormProps) {
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate institution name
    if (!formData.institutionName.trim()) {
      newErrors.institutionName = 'Institution name is required';
    } else if (formData.institutionName.length > 12) {
      newErrors.institutionName = 'Institution name must be 12 characters or less';
    }

    return Object.keys(newErrors).length === 0;
  };

  const generateSlugFromName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    
    // Generate slug from institution name
    const generatedSlug = generateSlugFromName(formData.institutionName);
    const formDataWithSlug = { ...formData, slug: generatedSlug };
    
    await onDeploy(formDataWithSlug);
  };

  const handleInputChange = (field: keyof CreateAgentRequest, value: string | number) => {
    // If institution name changes, update slug as well
    if (field === 'institutionName' && typeof value === 'string') {
      const generatedSlug = generateSlugFromName(value);
      onFormDataChange({ ...formData, [field]: value, slug: generatedSlug });
    } else {
      onFormDataChange({ ...formData, [field]: value });
    }
  };

  return (
    <div className="bg-[#1e293b]/80 backdrop-blur rounded-xl p-8 shadow-2xl border border-[#334155]">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Institution Identity */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#3eddfd]/20 flex items-center justify-center border border-[#3eddfd]/30">
              <span className="text-[#3eddfd] font-bold">1</span>
            </div>
            <h2 className="text-xl font-semibold text-[#f8fafc]">Your Institution Identity</h2>
          </div>

          {/* Institution Identity Fields */}
          <div className="space-y-4">
            <div>
              <label htmlFor="institutionName" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Institution Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="institutionName"
                value={formData.institutionName}
                onChange={(e) => handleInputChange('institutionName', e.target.value)}
                placeholder="e.g., Bear Bank"
                maxLength={12}
                className={`w-full px-4 py-3 bg-[#0f172a] border rounded-lg text-[#f8fafc] placeholder-[#64748b] transition-colors ${errors.institutionName ? 'border-red-500 focus:border-red-500' : 'border-[#334155] focus:border-[#3eddfd]'
                  } focus:outline-none focus:ring-2 focus:ring-[#3eddfd]/20`}
              />
              {errors.institutionName && <p className="mt-1 text-sm text-red-400">{errors.institutionName}</p>}
              <p className="mt-1 text-xs text-[#64748b]">Maximum 12 characters. Your agent slug will be auto-generated from this name.</p>
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Country <span className="text-red-400">*</span>
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#3eddfd]/20 transition-colors"
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} ({country.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: KYC Attestation Level */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#3eddfd]/20 flex items-center justify-center border border-[#3eddfd]/30">
              <span className="text-[#3eddfd] font-bold">2</span>
            </div>
            <h2 className="text-xl font-semibold text-[#f8fafc]">KYC Attestation Level</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {KYC_LEVELS.map((level) => (
              <div
                key={level.value}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all text-center ${formData.kycLevel === level.value && level.available
                    ? 'border-[#3eddfd] bg-[#3eddfd]/10'
                    : level.available
                      ? 'border-[#334155] hover:border-[#64748b] cursor-pointer'
                      : 'border-[#334155] opacity-50 cursor-not-allowed'
                  } ${!level.available ? 'pointer-events-none' : ''}`}
                onClick={() => level.available && handleInputChange('kycLevel', level.value)}
              >
                <div className="flex flex-col items-center flex-1">
                  <div className="flex-shrink-0 mb-3">
                    {level.available ? (
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${formData.kycLevel === level.value
                          ? 'border-[#3eddfd] bg-[#3eddfd]'
                          : 'border-[#475569]'
                        }`}>
                        {formData.kycLevel === level.value && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </div>
                    ) : (
                      <svg className="w-4 h-4 text-[#f59e0b]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col items-center gap-2 mb-1">
                      <span className={`font-medium ${level.available ? 'text-[#f8fafc]' : 'text-[#64748b]'}`}>
                        {level.label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${level.available
                          ? 'bg-[#3eddfd]/20 text-[#3eddfd]'
                          : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                        }`}>
                        {level.badge}
                      </span>
                    </div>
                    <div className={`text-sm ${level.available ? 'text-[#94a3b8]' : 'text-[#64748b]'}`}>
                      {level.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isDeploying}
            className="flex-1 bg-[#3eddfd] text-[#0f172a] font-semibold py-3 px-6 rounded-lg transition-all hover:bg-[#2dd4d4] hover:shadow-[0_0_30px_rgba(62,223,223,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeploying ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#0f172a]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deploying Agent...
              </span>
            ) : (
              'Deploy Agent'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-[#475569] text-[#f8fafc] rounded-lg hover:bg-[#475569] transition-all"
          >
            Cancel
          </button>
        </div>

        {errors.submit && (
          <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}
      </form>
    </div>
  );
}

export default DeployAgentForm;