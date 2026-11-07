import Image from "next/image";
import { COMPANY } from "@/lib/company";

export default function CtaBand({
  projectCount,
  collectionCount,
}: {
  projectCount: number | null;
  collectionCount: number | null;
}) {
  return (
    <section className="relative overflow-hidden py-28 text-foreground">
      {/* Background image */}
      <Image
        src="https://images.unsplash.com/photo-1617806118233-18e1de247200?w=1800&q=80"
        alt="Luxury tile installation"
        fill
        className="object-cover"
        sizes="100vw"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-background/95 via-background/60 to-background/60"
      />

      {/* Tile grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(201,168,76,1) 60px), repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(201,168,76,1) 60px)",
        }}
      />

      {/* Gold  top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-primary to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">

          <span className="mb-6 inline-flex items-center gap-3 text-xs font-bold tracking-[0.25em] uppercase">
            <span className="gold-divider" />
            Get Started Today
            <span className="gold-divider" />
          </span>

          <h2 className="mb-6 font-playfair text-4xl leading-tight font-bold md:text-6xl">
            Ready to Transform<br />
            <span>Your Space?</span>
          </h2>

          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
            Get a free quote and expert consultation from Rwanda&apos;s leading tile specialists. We&apos;ll help you choose the perfect tiles for any budget and design vision.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="/contact"
              className="group bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-10 py-4 transition-all duration-300 shadow-xl shadow-primary/20 flex items-center gap-3 text-sm tracking-widest uppercase"
            >
              Get Free Quote
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
            <a
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-3 border border-foreground/40 bg-background/50 px-10 py-4 text-sm font-bold tracking-widest text-foreground uppercase transition-all duration-300 hover:border-primary hover:bg-accent"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Call Now
            </a>
          </div>

          {/* Trust row */}
          <div className="mt-14 flex flex-wrap justify-center gap-8 border-t border-foreground/20 pt-10">
            {[
              { num: String(projectCount ?? "—"), label: "Projects in Portfolio" },
              { num: String(collectionCount ?? "—"), label: "Collections" },
              { num: String(COMPANY.foundedYear), label: "Established" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-playfair text-3xl font-bold text-foreground">{s.num}</div>
                <div className="mt-1 text-xs tracking-wider text-muted-foreground uppercase">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
