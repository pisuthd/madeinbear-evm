import Hero from '../components/home/Hero';
import KeyFeatures from '../components/home/KeyFeatures';
import DevelopmentLog from '../components/home/DevelopmentLog';
import CTA from '../components/home/CTA';

function Home() {
  return (
    <main className="min-h-screen bg-bg-primary">
      <Hero />
      <KeyFeatures />
      <DevelopmentLog />
      <CTA />
    </main>
  );
}

export default Home;