import { useEffect } from "react";
import AOS from "aos";
import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import ProblemSolution from "@/components/problem-solution";
import Features from "@/components/features";
import Prototype from "@/components/prototype";
import Impact from "@/components/impact";
import Contact from "@/components/contact";
import Footer from "@/components/footer";

export default function Home() {
  useEffect(() => {
    // Initialize AOS
    AOS.init({
      duration: 800,
      once: true,
      offset: 100
    });

    // Cleanup function to refresh AOS when component unmounts
    return () => {
      AOS.refresh();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ProblemSolution />
      <Features />
      <Prototype />
      <Impact />
      <Contact />
      <Footer />
    </div>
  );
}
