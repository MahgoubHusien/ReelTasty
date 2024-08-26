import type { NextPage } from 'next';
import Hero from '@/components/hero';
import Navbar from '@/components/ui/navbar';

const Home: NextPage = () => {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      {/* Light mode background color */}
      <div className="absolute inset-0 bg-background dark:hidden"></div>
      {/* Dark mode gradient background */}
      <div className="absolute inset-0 hidden dark:block bg-gradient-to-b from-[#121212] via-[#1e1e1e] to-[#121212] opacity-100"></div>
      <Navbar />
      <Hero />
    </div>
  );
};

export default Home;
