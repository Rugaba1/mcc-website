"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import type Hls from "hls.js";
import { COMPANY } from "@/lib/company";
import type { HomepageMetrics } from "@/lib/homepage-metrics";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const HERO_VIDEO = "/hero/playlist.m3u8";

const slides = [
  {
    tag: "Premium Porcelain",
    heading: "Crafting Surfaces\nThat Define Spaces",
    sub: "Premium ceramic & porcelain tiles engineered for beauty, durability, and the demands of modern Rwandan architecture.",
  },
  {
    tag: "Floor Collections",
    heading: "Elegance Beneath\nEvery Footstep",
    sub: "From natural stone finishes to glossy large-format porcelain — tiles that transform any floor into a statement.",
  },
  {
    tag: "Made in Rwanda",
    heading: "Built with Pride\nIn the Heart of Africa",
    sub: "Manufactured in Muhanga since 2025 using European technology and locally sourced materials.",
  },
];

export default function Hero({
  projectCount,
  productCount,
  collectionCount,
}: HomepageMetrics) {
  const [current, setCurrent] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const animatingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // HLS background video
  useEffect(() => {
    let hls: Hls | null = null;
    let cancelled = false;
    let startTimer: number | undefined;

    const startVideo = () => {
      const video = videoRef.current;
      if (
        cancelled ||
        !video ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = HERO_VIDEO;
        video.play().catch(() => {});
      } else {
        void import("hls.js").then(({ default: HlsLib }) => {
          if (cancelled || !HlsLib.isSupported()) return;
          hls = new HlsLib();
          hls.loadSource(HERO_VIDEO);
          hls.attachMedia(video);
          hls.on(HlsLib.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
          });
        });
      }
    };

    const scheduleVideo = () => {
      startTimer = window.setTimeout(startVideo, 5000);
    };

    if (document.readyState === "complete") {
      scheduleVideo();
    } else {
      window.addEventListener("load", scheduleVideo, { once: true });
    }

    return () => {
      cancelled = true;
      window.removeEventListener("load", scheduleVideo);
      if (startTimer !== undefined) window.clearTimeout(startTimer);
      hls?.destroy();
    };
  }, []);

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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
  const stats = [
    { num: String(projectCount ?? "—"), label: "Projects in Portfolio" },
    { num: String(productCount ?? "—"), label: "Active Products" },
    { num: String(collectionCount ?? "—"), label: "Collections" },
    { num: String(COMPANY.foundedYear), label: "Established" },
  ];

  return (
    <section
      id="home"
      className="relative flex min-h-[calc(100svh-4rem)] min-h-[calc(100dvh-4rem)] flex-col justify-end overflow-hidden text-overlay-foreground sm:min-h-screen sm:min-h-dvh"
    >
      {/* Background video (HLS) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/mcc-factory.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center] sm:object-center"
        />
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover object-[62%_center] transition-opacity duration-700 sm:object-center ${
            videoPlaying ? "opacity-100" : "opacity-0"
          }`}
          muted
          loop
          playsInline
          preload="none"
          onPlaying={() => setVideoPlaying(true)}
          aria-hidden="true"
        />
        {/* Overlay: darker overall + extra darkening on the left behind the text */}
        <div className="absolute inset-0 bg-gradient-to-t from-overlay/70 via-overlay/60 to-overlay/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-overlay/60 via-overlay/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto w-full max-w-7xl -translate-y-8 px-4 pb-20 pt-24 sm:translate-y-0 sm:px-6 sm:pb-28 sm:pt-48 max-[280px]:pt-16">
        {/* Tag */}
        <div key={`tag-${current}`} className="animate-fade-up mb-4 max-[280px]:hidden sm:mb-5">
          <Badge
            variant="outline"
            className="h-auto gap-2 border-primary/50 bg-primary/20 px-5 py-2 text-xs font-bold tracking-[0.2em] text-overlay-foreground uppercase backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            {slide.tag}
          </Badge>
        </div>

        {/* Heading */}
        <h1
          key={`h-${current}`}
          className="mb-4 max-w-4xl font-playfair text-3xl font-bold leading-[1.05] text-overlay-foreground sm:mb-6 sm:text-6xl lg:text-7xl xl:text-8xl max-[280px]:text-2xl motion-reduce:animate-none"
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
          className="mb-6 max-w-2xl text-sm leading-relaxed text-overlay-foreground/80 sm:mb-10 sm:text-lg max-[480px]:line-clamp-3 motion-reduce:animate-none"
        >
          {slide.sub}
        </p>

        {/* CTAs */}
        <div className="mb-8 flex flex-wrap gap-3 sm:mb-20 sm:gap-4 motion-reduce:animate-none">
          <a
            href="#products"
            className="group flex min-h-11 items-center gap-3 bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:bg-primary/90 sm:px-9 sm:py-4 sm:text-sm"
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
            href="/contact"
            className="min-h-11 border border-overlay-foreground/50 bg-card/5 px-5 py-3 text-xs font-bold uppercase tracking-widest text-overlay-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-primary/10 sm:px-9 sm:py-4 sm:text-sm"
          >
            Get a Quote
          </a>
        </div>

        {/* Stats row */}
        <div className="grid w-full grid-cols-2 gap-px border border-overlay-foreground/10 bg-card/10 sm:w-fit sm:grid-cols-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="bg-overlay/30 px-3 py-4 text-center text-overlay-foreground backdrop-blur-md sm:px-8 sm:py-5 motion-reduce:animate-none"
              style={{ animationDelay: `${300 + i * 100}ms` }}
            >
              <div className="font-playfair text-2xl font-bold text-overlay-foreground sm:text-3xl">{s.num}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-overlay-foreground/70 sm:text-xs">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 sm:bottom-8 sm:gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Slide ${i + 1}`}
            aria-current={i === current ? "true" : undefined}
            className="flex h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span
              aria-hidden="true"
              className={`h-1 rounded-full transition-all duration-500 ${
                i === current
                  ? "w-8 bg-primary"
                  : "w-4 bg-card/60 hover:bg-card"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute bottom-6 right-3 z-30 font-mono text-xs tracking-widest text-overlay-foreground/60 sm:right-8">
        {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>

      {/* Next arrow */}
      <Button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 z-30 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-none border border-overlay-foreground/30 bg-transparent text-overlay-foreground backdrop-blur-sm transition-all duration-300 hover:border-primary hover:bg-primary sm:flex sm:right-6 sm:h-12 sm:w-12"
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
      <div className="absolute bottom-8 left-8 z-30 hidden md:flex flex-col items-center gap-2 text-overlay-foreground/60 text-xs tracking-[0.2em] uppercase">
        <span>Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-primary to-transparent animate-bounce-y" />
      </div>
    </section>
  );
}