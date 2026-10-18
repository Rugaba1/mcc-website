import Image from "next/image";
import { whyUs } from "../lib/data";
import { WhyUsIcon } from "./Icons";

export default function WhyUs() {
  return (
    <section id="why-us" className="py-0 bg-dark overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[700px]">

        {/* ── Left: Image with overlay stats ──────────── */}
        <div className="relative min-h-[400px] lg:min-h-full order-2 lg:order-1">
          <Image
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&q=85"
            alt="Premium tile showroom"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            unoptimized />
          <div className="absolute inset-0 bg-gradient-to-r from-dark/20 to-dark/60 lg:bg-gradient-to-l lg:from-dark/70 lg:to-transparent" />

          {/* Award card */}
          <div className="absolute bottom-8 left-8 right-8 bg-dark/90 backdrop-blur-sm  -primary/30 p-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary/15  -primary/30 flex items-center justify-center  flex-shrink-0">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
                </svg>
              </div>
              <div>
                <p className=" font-bold text-sm tracking-wide">RSB Excellence Award</p>
                <p className=" text-xs mt-0.5">Rwanda Standards Board — 2 consecutive years</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Cards ─────────────────────────────── */}
        <div className="flex flex-col justify-center px-10 lg:px-16 py-20 order-1 lg:order-2">

          <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-5">
            <span className="gold-divider" />
            Why Choose MCC
          </span>

          <h2 className="font-playfair text-4xl md:text-5xl font-bold  leading-tight mb-12">
            Built on Quality.<br />
            <span className="">Trusted by Rwanda.</span>
          </h2>

          <div className="grid sm:grid-cols-2 gap-5">
            {whyUs.map((item, i) => (
              <div
                key={item.title}
                className="group p-5  /8 hover:-primary/50 /3 hover:bg-primary/5 transition-all duration-300 cursor-default"
              >
                <div className="w-11 h-11 bg-primary/10 group-hover:bg-primary flex items-center justify-center  group- transition-all duration-300 mb-4">
                  <WhyUsIcon icon={item.icon} className="w-5 h-5" />
                </div>
                <h3 className=" font-bold text-sm mb-2 group-hover: transition-colors leading-snug">
                  {item.title}
                </h3>
                <p className=" text-xs leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
