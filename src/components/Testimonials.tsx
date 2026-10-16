"use client";

import { useState, useEffect, useRef } from "react";
import { api, type Testimonial } from "@/lib/api";

const avatarColors = [
  "from-primary to-[#8b6330]",
  "from-[#4a6fa5] to-[#2c3e70]",
  "from-[#5a8a5a] to-[#2d5a2d]",
  "from-[#8b5a5a] to-[#5a2d2d]",
];

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setMounted(true);
    api.getTestimonials().then(setTestimonials).catch(console.error);
  }, []);

  const total = testimonials.length;

  function goTo(idx: number) {
    if (transitioning || total === 0) return;
    setTransitioning(true);
    setCurrent(idx);
    setTimeout(() => setTransitioning(false), 500);
  }

  function next() { goTo((current + 1) % Math.max(total, 1)); }
  function prev() { goTo(current === 0 ? Math.max(total - 1, 0) : current - 1); }

  // Auto-advance
  useEffect(() => {
    if (total === 0) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => {
        setTransitioning(true);
        setTimeout(() => setTransitioning(false), 500);
        return (c + 1) % total;
      });
    }, 7000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [total]);

  // Clamp index when list shrinks
  useEffect(() => {
    if (total > 0 && current >= total) setCurrent(total - 1);
  }, [total, current]);

  if (!mounted) return null;

  if (total === 0) {
    return (
      <section className="py-24 ">
        <div className="max-w-7xl mx-auto px-6 text-center  text-sm">
          No testimonials yet.
        </div>
      </section>
    );
  }

  const t = testimonials[current] ?? testimonials[0];

  return (
    <section className="py-24  overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
            <span className="gold-divider" />
            Testimonials
            <span className="gold-divider" />
          </span>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold ">
            What Our Clients Say
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className={` shadow-xl p-10 md:p-14 relative transition-opacity duration-500 ${transitioning ? "opacity-0" : "opacity-100"}`}>
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-[#a07830]" />
            <div className="font-playfair text-9xl /15 leading-none absolute top-6 right-10 select-none pointer-events-none">&rdquo;</div>

            <div className="flex gap-1 mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className="w-5 h-5 " viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>

            <p className="text-foreground text-xl md:text-2xl leading-relaxed font-light mb-10 relative z-10 italic">
              &ldquo;{t.text}&rdquo;
            </p>

            <div className="flex items-center gap-4 relative z-10">
              <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${avatarColors[current % avatarColors.length]} flex items-center justify-center  font-bold text-base flex-shrink-0`}>
                {t.initials}
              </div>
              <div>
                <p className="font-bold  text-base">{t.name}</p>
                <p className=" text-sm font-medium">{t.role}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} aria-label={`Testimonial ${i + 1}`}
                  className={`transition-all duration-300 h-1 ${i === current ? "w-10 bg-primary" : "w-4 bg-muted hover:bg-muted"}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={prev} aria-label="Previous"
                className="w-12 h-12  -gray-300 hover:-primary hover:bg-primary   flex items-center justify-center transition-all duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={next} aria-label="Next"
                className="w-12 h-12  -gray-300 hover:-primary hover:bg-primary   flex items-center justify-center transition-all duration-200">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mini strip */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
          {testimonials.map((item, i) => (
            <button key={item.id} onClick={() => goTo(i)}
              className={`text-left p-5  transition-all duration-200 ${i === current ? "-primary  shadow-lg" : "-gray-200 /60 hover:-primary/50 hover:"}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center  text-xs font-bold`}>
                  {item.initials}
                </div>
                <p className="font-semibold  text-xs">{item.name}</p>
              </div>
              <p className=" text-xs leading-relaxed line-clamp-2">{item.text}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
