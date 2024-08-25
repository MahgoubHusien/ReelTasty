import type { NextPage } from 'next';
import Hero from '@/components/hero';
import Navbar from '@/components/ui/navbar';
const Home: NextPage = () => {
  return (
    <>
      <Navbar />
      <Hero />
    </>
  );
};

export default Home;
