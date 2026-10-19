"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { stats } from "@/lib/data";
import { Button } from "./ui/button";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1800&q=85",
    tag: "Premium Porcelain",
    heading: "Crafting Surfaces\nThat Define Spaces",
    sub: "Premium ceramic & porcelain tiles engineered for beauty, durability, and the demands of modern Rwandan architecture.",
  },
  {
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1800&q=85",
    tag: "Floor Collections",
    heading: "Elegance Beneath\nEvery Footstep",
    sub: "From natural stone finishes to glossy large-format porcelain — tiles that transform any floor into a statement.",
  },
  {
    image: "https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=1800&q=85",
    tag: "Made in Rwanda",
    heading: "Built with Pride\nIn the Heart of Africa",
    sub: "Manufactured in Muhanga since 2025 using European technology and locally sourced materials. 500+ projects delivered.",
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const animatingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function goTo(idx: number) {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setCurrent(idx);
    setTimeout(() => {
      animatingRef.current = false;
    }, 1000);
  }

  function next() {
    goTo((current + 1) % slides.length);
  }

  // Auto-advance with stable interval
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrent((c) => {
        const nextIdx = (c + 1) % slides.length;
        animatingRef.current = true;
        setTimeout(() => {
          animatingRef.current = false;
        }, 1000);
        return nextIdx;
      });
    }, 6000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const slide = slides[current];
  const lines = slide.heading.split("\n");

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-end overflow-hidden text-white"
    >
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
        >
          <Image
            src={s.image}
            alt={s.tag}
            fill
            priority={i === 0}
            className={`object-cover ${i === current ? "animate-hero-zoom" : ""}`}
            sizes="100vw"
            unoptimized
          />
          {/* Overlay: darker overall + extra darkening on the left behind the text */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-6 pb-28 pt-48 w-full">
        {/* Tag */}
        <div key={`tag-${current}`} className="animate-fade-up mb-5">
          <span className="inline-flex items-center gap-2 bg-primary/20 border border-primary/50 text-white text-xs font-bold tracking-[0.2em] uppercase px-5 py-2 rounded-full backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {slide.tag}
          </span>
        </div>

        {/* Heading */}
        <h1
          key={`h-${current}`}
          className="font-playfair text-white text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] mb-6 max-w-4xl animate-fade-up delay-100"
        >
          {lines[0]}
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#f0d080]">
            {lines[1]}
          </span>
        </h1>

        {/* Sub */}
        <p
          key={`p-${current}`}
          className="text-white/80 text-lg max-w-2xl mb-10 leading-relaxed animate-fade-up delay-200"
        >
          {slide.sub}
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 mb-20 animate-fade-up delay-300">
          <a
            href="#products"
            className="group bg-primary hover:bg-[#f0d080] text-white hover:text-black font-bold px-9 py-4 transition-all duration-300 shadow-lg shadow-primary/30 flex items-center gap-3 text-sm tracking-widest uppercase"
          >
            Explore Products
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="#contact"
            className="border border-white/50 hover:border-primary bg-white/5 hover:bg-primary/10 text-white font-bold px-9 py-4 transition-all duration-300 text-sm tracking-widest uppercase backdrop-blur-sm"
          >
            Get a Quote
          </a>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 border border-white/10 w-fit">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="px-8 py-5 bg-black/30 backdrop-blur-md text-center animate-fade-up"
              style={{ animationDelay: `${300 + i * 100}ms` }}
            >
              <div className="text-3xl font-bold text-white font-playfair">{s.num}</div>
              <div className="text-white/70 text-xs tracking-wider uppercase mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        {slides.map((_, i) => (
          <Button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            className={`p-0 rounded-none transition-all duration-500 ${i === current
                ? "w-10 h-1 bg-primary hover:bg-primary"
                : "w-4 h-1 bg-white/40 hover:bg-white/70"
              }`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-6 right-8 z-30 text-white/60 text-xs tracking-widest font-mono">
        {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>

      {/* Next arrow */}
      <Button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-none text-white bg-transparent border border-white/30 hover:border-primary hover:bg-primary flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Button>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-8 z-30 hidden md:flex flex-col items-center gap-2 text-white/60 text-xs tracking-[0.2em] uppercase">
        <span>Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-primary to-transparent animate-bounce-y" />
      </div>
    </section>
  );
}