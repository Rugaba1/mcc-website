import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import FeaturedCollections from "@/components/FeaturedCollections";
import CategoryShowcase from "@/components/CategoryShowcase";
import About from "@/components/About";
import Products from "@/components/Products";
import WhyUs from "@/components/WhyUs";
import Projects from "@/components/Projects";
import Testimonials from "@/components/Testimonials";
import Process from "@/components/Process";
import CtaBand from "@/components/CtaBand";
import Contact from "@/components/Contact";
import { TeamSection } from "@/components/team-section";
import { siteConfig } from "@/config/site.config";
import { createPageMetadata } from "@/lib/seo/metadata";
import type { Metadata } from "next";
import { connection } from "next/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return createPageMetadata({
    locale,
    path: "/",
    title: `Ceramic & Porcelain Tile Manufacturer in Rwanda | ${siteConfig.siteName}`,
    description:
      "Discover ceramic and porcelain floor, wall, and outdoor tiles manufactured in Rwanda by Mountain Ceramics Company.",
    image: "/logo.png",
  });
}

export default async function Home() {
  await connection();

  return (
    <>

      <main>
        <Hero />
        <Ticker />
        <FeaturedCollections />
        <CategoryShowcase />
        <About />
        <Products  />
        <WhyUs />
        <Projects />
        <Testimonials />
        <Process />
        <CtaBand />
        <TeamSection />
        <Contact />
      </main>
      
    </>
  );
}
