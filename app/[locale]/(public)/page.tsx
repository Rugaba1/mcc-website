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
import { getHomepageMetrics } from "@/lib/homepage-metrics";
import type { HomepageMetrics } from "@/lib/homepage-metrics";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Link } from "@/app/i18n/routing";

async function loadHomepageMetrics() {
  await connection();
  return getHomepageMetrics();
}

function HomeSectionFallback({
  id,
  title,
  description,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  description: string;
  href?: "/" | "/about" | "/collections" | "/products" | "/projects";
  linkLabel?: string;
}) {
  return (
    <section id={id} className="py-16" aria-labelledby={`${id}-title`}>
      <div className="mx-auto max-w-7xl px-6 text-center">
        <h2
          id={`${id}-title`}
          className="font-playfair text-3xl font-bold md:text-4xl"
        >
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted-foreground">
          {description}
        </p>
        {href && linkLabel && (
          <Link
            href={href}
            className="mt-5 inline-flex font-semibold underline underline-offset-4"
          >
            {linkLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

async function HeroWithMetrics({
  metrics,
}: {
  metrics: Promise<HomepageMetrics>;
}) {
  return <Hero {...(await metrics)} />;
}

async function AboutWithMetrics({
  metrics,
}: {
  metrics: Promise<HomepageMetrics>;
}) {
  const { collectionCount } = await metrics;
  return <About collectionCount={collectionCount} />;
}

async function CtaBandWithMetrics({
  metrics,
}: {
  metrics: Promise<HomepageMetrics>;
}) {
  const { projectCount, collectionCount } = await metrics;
  return (
    <CtaBand
      projectCount={projectCount}
      collectionCount={collectionCount}
    />
  );
}

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
    image: "/images/mcc-factory.jpg",
  });
}

export default function Home() {
  const metrics = loadHomepageMetrics();
  return (
    <>
      <div>
        <Suspense
          fallback={
            <Hero projectCount={null} productCount={null} collectionCount={null} />
          }
        >
          <HeroWithMetrics metrics={metrics} />
        </Suspense>
        <Ticker />
        <Suspense
          fallback={
            <HomeSectionFallback
              id="collections-home"
              title="Curated Tile Collections"
              description="Explore expertly grouped ceramic and porcelain tiles for residential, commercial, and outdoor spaces."
              href="/collections"
              linkLabel="View all collections"
            />
          }
        >
          <FeaturedCollections />
        </Suspense>
        <Suspense
          fallback={
            <HomeSectionFallback
              id="categories"
              title="Find Your Perfect Tile"
              description="Browse ceramic and porcelain tiles by category, finish, and use."
              href="/products"
              linkLabel="Browse tiles"
            />
          }
        >
          <CategoryShowcase />
        </Suspense>
        <Suspense fallback={<About collectionCount={null} />}>
          <AboutWithMetrics metrics={metrics} />
        </Suspense>
        <Suspense
          fallback={
            <HomeSectionFallback
              id="products"
              title="Tiles for Every Space and Style"
              description="Discover ceramic and porcelain floor, wall, outdoor, and specialty tiles manufactured in Rwanda."
              href="/products"
              linkLabel="Browse all tiles"
            />
          }
        >
          <Products />
        </Suspense>
        <WhyUs />
        <Suspense
          fallback={
            <HomeSectionFallback
              id="projects"
              title="Featured Projects"
              description="See residential, hospitality, commercial, and infrastructure projects featuring Mountain Ceramics tiles."
              href="/projects"
              linkLabel="View all projects"
            />
          }
        >
          <Projects />
        </Suspense>
        <Suspense
          fallback={
            <HomeSectionFallback
              id="testimonials"
              title="What Our Customers Say"
              description="Read customer feedback about Mountain Ceramics products and service."
            />
          }
        >
          <Testimonials />
        </Suspense>
        <Process />
        <Suspense
          fallback={<CtaBand projectCount={null} collectionCount={null} />}
        >
          <CtaBandWithMetrics metrics={metrics} />
        </Suspense>
        <Suspense
          fallback={
            <HomeSectionFallback
              id="team"
              title="Meet our staff"
              description="Meet the people behind Mountain Ceramics Company."
              href="/about"
              linkLabel="Learn more about us"
            />
          }
        >
          <TeamSection />
        </Suspense>
        <Contact />
      </div>
    </>
  );
}
