import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import CategoryShowcase from "@/components/CategoryShowcase";
import About from "@/components/About";
import Products from "@/components/Products";
import WhyUs from "@/components/WhyUs";
import Projects from "@/components/Projects";
import Testimonials from "@/components/Testimonials";
import Process from "@/components/Process";
import CtaBand from "@/components/CtaBand";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Ticker />
        <CategoryShowcase />
        <About />
        <Products />
        <WhyUs />
        <Projects />
        <Testimonials />
        <Process />
        <CtaBand />
        <Contact />
      </main>
      <Footer />
      <BackToTop />
    </>
  );
}
