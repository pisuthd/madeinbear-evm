import Hero from '../components/home/Hero';
import KeyFeatures from '../components/home/KeyFeatures';   

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