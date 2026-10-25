"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Testimonial } from "@/lib/api";

const avatarColors = [
  "from-primary to-[#8b6330]",
  "from-[#4a6fa5] to-[#2c3e70]",
  "from-[#5a8a5a] to-[#2d5a2d]",
  "from-[#8b5a5a] to-[#5a2d2d]",
];

export default function TestimonialsCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const total = testimonials.length;

  function goTo(index: number) {
    if (transitioning || total === 0) return;
    setTransitioning(true);
    setCurrent(index);
    setTimeout(() => setTransitioning(false), 500);
  }

  function next() {
    goTo((current + 1) % Math.max(total, 1));
  }

  function previous() {
    goTo(current === 0 ? Math.max(total - 1, 0) : current - 1);
  }

  useEffect(() => {
    if (total === 0) return;
    timerRef.current = setInterval(() => {
      setTransitioning(true);
      setCurrent((index) => (index + 1) % total);
      setTimeout(() => setTransitioning(false), 500);
    }, 7000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total]);

  useEffect(() => {
    if (total > 0 && current >= total) setCurrent(total - 1);
  }, [total, current]);

  if (total === 0) {
    return (
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 text-center text-sm">
          No testimonials yet.
        </div>
      </section>
    );
  }

  const testimonial = testimonials[current] ?? testimonials[0];

  return (
    <section className="overflow-hidden py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em]">
            <span className="gold-divider" />
            Testimonials
            <span className="gold-divider" />
          </span>
          <h2 className="font-playfair text-4xl font-bold md:text-5xl">
            What Our Clients Say
          </h2>
        </div>

        <div className="mx-auto max-w-4xl">
          <div
            className={`relative p-10 shadow-xl transition-opacity duration-500 motion-reduce:transition-none md:p-14 ${
              transitioning ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary to-[#a07830]" />
            <div className="pointer-events-none absolute right-10 top-6 font-playfair text-9xl leading-none">
              &rdquo;
            </div>
            <div className="mb-6 flex gap-1" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }, (_, index) => (
                <svg key={index} className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <p className="relative z-10 mb-10 font-light italic leading-relaxed text-foreground md:text-2xl">
              &ldquo;{testimonial.text}&rdquo;
            </p>
            <div className="relative z-10 flex items-center gap-4">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColors[current % avatarColors.length]} text-base font-bold`}
              >
                {testimonial.initials}
              </div>
              <div>
                <p className="text-base font-bold">{testimonial.name}</p>
                <p className="text-sm font-medium">{testimonial.role}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-2">
              {testimonials.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(index)}
                  aria-label={`Testimonial ${index + 1}`}
                  aria-current={index === current}
                  className={`h-2 rounded-full transition-all ${index === current ? "w-8 bg-primary" : "w-2 bg-muted-foreground/30"}`}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={previous} aria-label="Previous testimonial" className="flex h-11 w-11 items-center justify-center border border-border transition-colors hover:border-primary hover:text-primary motion-reduce:transition-none">
                <ChevronLeft aria-hidden="true" />
              </button>
              <button type="button" onClick={next} aria-label="Next testimonial" className="flex h-11 w-11 items-center justify-center border border-border transition-colors hover:border-primary hover:text-primary motion-reduce:transition-none">
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(index)}
              aria-label={`Show testimonial from ${item.name}`}
              aria-pressed={index === current}
              className={`p-5 text-left transition-all ${
                index === current
                  ? "border border-primary shadow-lg"
                  : "border border-border/60 hover:border-primary/50"
              }`}
            >
              <div className="mb-3 flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${avatarColors[index % avatarColors.length]} text-xs font-bold`}
                >
                  {item.initials}
                </div>
                <p className="text-xs font-semibold">{item.name}</p>
              </div>
              <p className="line-clamp-2 text-xs leading-relaxed">{item.text}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
