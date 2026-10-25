import { MotionConfig } from "framer-motion";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import ProfessionalBanner from "./components/ProfessionalBanner.jsx";
import Stats from "./components/Stats.jsx";
import About from "./components/About.jsx";
import Works from "./components/Works.jsx";
import Skills from "./components/Skills.jsx";
import Experience from "./components/Experience.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <a href="#about" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-cream focus:px-4 focus:py-2 focus:text-ink">
        Skip to content
      </a>
      <Navbar />
      <main>
        <Hero />
        <ProfessionalBanner />
        <Stats />
        <About />
        <Works />
        <Skills />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </MotionConfig>
  );
}
