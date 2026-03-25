import Hero from '../components/home/Hero';
import HowItWorks from '../components/home/HowItWorks';
import WhyAgentToAgent from '../components/home/WhyAgentToAgent';
// import ComplianceStack from '../components/home/ComplianceStack';
import CTA from '../components/home/CTA';

interface HomeProps {
  onNavigate: (path: string) => void;
}

function Home({ onNavigate }: HomeProps) {
  return (
    <main className="min-h-screen bg-bg-primary">
      <Hero onNavigate={onNavigate} />
      <HowItWorks />
      <WhyAgentToAgent />
      {/* <ComplianceStack /> */}
      <CTA onNavigate={onNavigate} />
    </main>
  );
}

export default Home;