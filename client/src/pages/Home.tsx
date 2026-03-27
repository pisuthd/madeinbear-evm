import Hero from '../components/home/Hero';
import KeyFeatures from '../components/home/KeyFeatures';
import HowItWorks from '../components/home/HowItWorks';
import WhyAgentToAgent from '../components/home/WhyAgentToAgent';
// import ComplianceStack from '../components/home/ComplianceStack';
import CTA from '../components/home/CTA';

function Home() {
  return (
    <main className="min-h-screen bg-bg-primary">
      <Hero />
      <KeyFeatures />
      {/* <HowItWorks />
      <WhyAgentToAgent /> */}
      {/* <ComplianceStack /> */}
      {/* <CTA /> */}
    </main>
  );
}

export default Home;