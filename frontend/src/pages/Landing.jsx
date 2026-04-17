import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Hero from "../components/landing/Hero";
import Features from "../components/landing/Features";
import HowItWorks from "../components/landing/HowItWorks";
import Stats from "../components/landing/Stats";
import CTA from "../components/landing/CTA";

const Landing = () => {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing;
