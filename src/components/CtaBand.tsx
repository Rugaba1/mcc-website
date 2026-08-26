import Image from "next/image";

export default function CtaBand() {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1800&q=80"
        alt="Luxury tile installation"
        fill
        className="object-cover"
        sizes="100vw"
      />
      {/* Dark + gold overlay */}
      <div className="absolute inset-0 bg-[#0a0c12]/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#c9a84c]/10 to-transparent" />

      {/* Tile grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(201,168,76,1) 60px), repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(201,168,76,1) 60px)",
        }}
      />

      {/* Gold border top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">

          <span className="inline-flex items-center gap-3 text-[#c9a84c] text-xs font-bold tracking-[0.25em] uppercase mb-6">
            <span className="gold-divider" />
            Get Started Today
            <span className="gold-divider" />
          </span>

          <h2 className="font-playfair text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Transform<br />
            <span className="text-[#c9a84c]">Your Space?</span>
          </h2>

          <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-12 max-w-2xl mx-auto">
            Get a free quote and expert consultation from Rwanda&apos;s leading tile specialists. We&apos;ll help you choose the perfect tiles for any budget and design vision.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="#contact"
              className="group bg-[#c9a84c] hover:bg-[#f0d080] hover:text-[#0f1117] text-white font-bold px-10 py-4 transition-all duration-300 shadow-xl shadow-[#c9a84c]/20 flex items-center gap-3 text-sm tracking-widest uppercase"
            >
              Get Free Quote
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <a
              href="tel:+250788000000"
              className="border border-white/40 hover:border-[#c9a84c] bg-white/5 hover:bg-[#c9a84c]/10 text-white font-bold px-10 py-4 transition-all duration-300 flex items-center gap-3 text-sm tracking-widest uppercase backdrop-blur-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Call Now
            </a>
          </div>

          {/* Trust row */}
          <div className="flex flex-wrap justify-center gap-8 mt-14 pt-10 border-t border-white/10">
            {[
              { num: "500+", label: "Projects Done" },
              { num: "15+", label: "Years Experience" },
              { num: "1000+", label: "Happy Clients" },
              { num: "24h", label: "Response Time" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-playfair text-3xl font-bold text-[#c9a84c]">{s.num}</div>
                <div className="text-gray-400 text-xs tracking-wider uppercase mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
