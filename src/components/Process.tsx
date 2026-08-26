import { processSteps } from "@/lib/data";
import { ProcessIcon } from "@/components/Icons";

export default function Process() {
  return (
    <section className="py-24 bg-[#0a0c12] relative overflow-hidden">

      {/* Background subtle tile grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 79px,rgba(201,168,76,1) 80px), repeating-linear-gradient(90deg,transparent,transparent 79px,rgba(201,168,76,1) 80px)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-20">
          <span className="inline-flex items-center gap-3 text-[#c9a84c] text-xs font-bold tracking-[0.25em] uppercase mb-4">
            <span className="gold-divider" />
            How It Works
            <span className="gold-divider" />
          </span>
          <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white">
            From Concept to Completion
          </h2>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">

          {/* Connector line — desktop */}
          <div className="hidden lg:block absolute top-[52px] left-[14%] right-[14%] h-px z-0">
            <div className="h-full bg-gradient-to-r from-transparent via-[#c9a84c]/50 to-transparent" />
            {/* Dashes */}
            <div className="absolute inset-0 flex items-center">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="flex-1 h-px border-t border-dashed border-[#c9a84c]/20" />
              ))}
            </div>
          </div>

          {processSteps.map((step, i) => (
            <div key={step.num} className="relative z-10 flex flex-col items-center text-center group">

              {/* Step circle */}
              <div className="relative mb-6">
                <div className="w-[104px] h-[104px] border border-[#c9a84c]/20 group-hover:border-[#c9a84c]/60 flex items-center justify-center transition-all duration-300 relative">
                  <div className="w-[80px] h-[80px] bg-[#c9a84c]/10 group-hover:bg-[#c9a84c] flex items-center justify-center text-[#c9a84c] group-hover:text-white transition-all duration-300">
                    <ProcessIcon icon={step.icon} className="w-8 h-8" />
                  </div>
                  {/* Corner accents */}
                  <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-[#c9a84c]" />
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-[#c9a84c]" />
                  <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-[#c9a84c]" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-[#c9a84c]" />
                </div>
                {/* Step number */}
                <span className="absolute -top-3 -right-3 w-7 h-7 bg-[#c9a84c] text-white text-xs font-bold font-mono flex items-center justify-center">
                  {step.num}
                </span>
              </div>

              <h3 className="font-bold text-white text-base mb-3 group-hover:text-[#c9a84c] transition-colors duration-200">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <a
            href="#contact"
            className="group inline-flex items-center gap-3 bg-[#c9a84c] hover:bg-[#f0d080] hover:text-[#0f1117] text-white font-bold px-10 py-4 transition-all duration-300 text-sm tracking-widest uppercase shadow-lg shadow-[#c9a84c]/20"
          >
            Start Your Project Today
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
