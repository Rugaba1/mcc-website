import Image from "next/image";
import { FactoryIcon } from "@/components/Icons";

const features = [
  {
    title: "ISO 9001 Certified Manufacturing",
    desc: "Our production facility meets international quality standards at every step of the manufacturing process.",
  },
  {
    title: "Eco-Friendly Production",
    desc: "Committed to sustainable practices — reducing emissions, recycling waste, and minimising our environmental footprint.",
  },
  {
    title: "East Africa Distribution",
    desc: "Nationwide delivery across Rwanda and exports to Uganda, Kenya, Burundi & DRC.",
  },
];

const badges = ["ISO 9001", "RSB Certified", "Made in Rwanda", "10-Yr Warranty"];

export default function About() {
  return (
    <section id="about" className="py-0 bg-white overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[680px]">

        {/* ── Left: Image panel ───────────────────────── */}
        <div className="relative min-h-[500px] lg:min-h-full">
          <Image
            src="https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=1000&q=85"
            alt="MCC ceramic tile manufacturing facility in Kigali"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/5 lg:bg-gradient-to-br lg:from-black/30 lg:via-transparent lg:to-transparent" />

          {/* Est. badge */}
          <div className="absolute top-8 right-8 bg-[#c9a84c] text-center px-6 py-4 shadow-2xl">
            <p className="text-white/80 text-[10px] uppercase tracking-[0.25em] font-semibold">Est.</p>
            <p className="text-white text-5xl font-bold font-playfair leading-none">2009</p>
            <p className="text-white/70 text-xs tracking-widest mt-1">Kigali, Rwanda</p>
          </div>

          {/* Factory card */}
          <div className="absolute bottom-8 left-8 bg-white/95 backdrop-blur-sm shadow-2xl flex items-center gap-4 px-5 py-4 max-w-[230px]">
            <div className="w-11 h-11 bg-[#c9a84c]/15 flex items-center justify-center text-[#c9a84c] flex-shrink-0">
              <FactoryIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-[#0f1117] text-sm leading-tight">Production Facility</p>
              <p className="text-gray-500 text-xs mt-0.5">Kicukiro Industrial Zone</p>
            </div>
          </div>

          {/* 50+ Collections badge */}
          <div className="absolute bottom-8 right-8 bg-[#0f1117]/90 backdrop-blur-sm text-center px-5 py-4 shadow-xl">
            <p className="text-[#c9a84c] text-3xl font-bold font-playfair">50+</p>
            <p className="text-gray-400 text-xs tracking-wider uppercase mt-1">Collections</p>
          </div>
        </div>

        {/* ── Right: Content panel ────────────────────── */}
        <div className="flex flex-col justify-center px-10 lg:px-16 py-20 bg-white">

          <span className="inline-flex items-center gap-3 text-[#c9a84c] text-xs font-bold tracking-[0.25em] uppercase mb-5">
            <span className="gold-divider" />
            About MCC
          </span>

          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-[#0f1117] leading-tight mb-6">
            Rwanda&apos;s Most Trusted<br />Tile Manufacturer
          </h2>

          <p className="text-gray-600 text-lg leading-relaxed mb-4">
            Founded in 2009 in Kigali, Mountain Ceramics Company has grown to become Rwanda&apos;s foremost ceramic tile producer, supplying high-quality tiles across East Africa.
          </p>
          <p className="text-gray-500 leading-relaxed mb-10">
            We combine modern European manufacturing technology with locally sourced raw materials to produce tiles that meet international standards while reflecting the rich aesthetic culture of the Great Lakes region.
          </p>

          {/* Features */}
          <div className="space-y-4 mb-10">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="flex gap-4 items-start group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="w-7 h-7 bg-[#c9a84c] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-[#0f1117] text-sm mb-0.5">{f.title}</p>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Certification badges */}
          <div className="flex flex-wrap gap-2 mb-10">
            {badges.map((b) => (
              <span
                key={b}
                className="border border-[#c9a84c]/40 text-[#a07830] text-xs font-semibold px-4 py-1.5 tracking-wide"
              >
                {b}
              </span>
            ))}
          </div>

          <a
            href="#contact"
            className="self-start group bg-[#0f1117] hover:bg-[#c9a84c] text-white font-bold px-9 py-4 transition-all duration-300 shadow-lg flex items-center gap-3 text-sm tracking-widest uppercase"
          >
            Work With Us
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
