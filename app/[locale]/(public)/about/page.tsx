import { Breadcrumbs } from "@/components/breadcrumbs";
import { FactoryIcon } from "@/components/Icons";
import { seoConfig } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";
import { absolutizeUrl } from "@/lib/absolutize";
import { generateAlternateLinks } from "@/lib/alternates";
import { Metadata } from "next";
import Image from "next/image";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>;
}): Promise<Metadata> {
    const { locale } = await params;


    const title = `Rwanda's Most Trusted Tile Manufacturer | ${siteConfig.siteName}`;
    const description = `From classic ceramics to modern large-format porcelain — covering every design vision.`;
    const url = `${seoConfig.siteUrl}${`/${locale}`}/about-us/ `;

    const thumb = absolutizeUrl(`/logo.png`)
    const image = thumb ?? `${seoConfig.siteUrl}/logo.png`;

    return {
        title,
        description,
        openGraph: {
            title, description, url, siteName: seoConfig.siteName, locale: locale.replace("-", "_"), type: "website",
            images: [{ url: image, width: 1200, height: 630, alt: title }],
        },
        twitter: { card: "summary_large_image", title, description, images: [image] },
        alternates: { canonical: url, languages: generateAlternateLinks(locale, `/products`) },
        robots: { index: true, follow: true },
    };
}


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
        <section id="about" className="py-0  overflow-hidden">
            <Breadcrumbs items={[
                { label: "Home", href: "/" },
                { label: "About", href: "/about" },

            ]} />
            <div className="max-w-7xl mx-auto text-center py-5">
                <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
                    <span className="w-8 h-px bg-primary" />
                    About MCC
                    <span className="w-8 h-px bg-primary" />
                </span>
                <h1 className="font-bold text-4xl md:text-5xl  leading-tight">
                    Rwanda&apos;s Most Trusted<br />Tile Manufacturer
                </h1>
                <p className=" text-lg max-w-2xl mx-auto">
                    From classic ceramics to modern large-format porcelain — covering every design vision.
                </p>
            </div>


            <div className="grid lg:grid-cols-2 min-h-170 pt-10">

                {/* ── Left: Image panel ───────────────────────── */}
                <div className="relative min-h-125 lg:min-h-full">
                    <Image
                        src="https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=1000&q=85"
                        alt="MCC ceramic tile manufacturing facility in Kigali"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        unoptimized />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-linear-to-r from-black/20 to-black/5 lg:bg-linear-to-br lg:from-black/30 lg:via-transparent lg:to-transparent" />

                    {/* Est. badge */}
                    <div className="absolute top-8 right-8 bg-primary text-center px-6 py-4 shadow-2xl">
                        <p className="/80 text-[10px] uppercase tracking-[0.25em] font-semibold">Est.</p>
                        <p className=" text-5xl font-bold font-playfair leading-none">2009</p>
                        <p className="/70 text-xs tracking-widest mt-1">Kigali, Rwanda</p>
                    </div>

                    {/* Factory card */}
                    <div className="absolute bottom-8 left-8 /95 backdrop-blur-sm shadow-2xl flex items-center gap-4 px-5 py-4 max-w-57.5">
                        <div className="w-11 h-11 bg-primary/15 flex items-center justify-center  shrink-0">
                            <FactoryIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-bold  text-sm leading-tight">Production Facility</p>
                            <p className=" text-xs mt-0.5">Kicukiro Industrial Zone</p>
                        </div>
                    </div>

                    {/* 50+ Collections badge */}
                    <div className="absolute bottom-8 right-8 bg-accent/90 backdrop-blur-sm text-center px-5 py-4 shadow-xl">
                        <p className=" text-3xl font-bold font-playfair">50+</p>
                        <p className=" text-xs tracking-wider uppercase mt-1">Collections</p>
                    </div>
                </div>

                {/* ── Right: Content panel ────────────────────── */}
                <div className="flex flex-col justify-center px-10 lg:px-16 py-20 ">

                    <p className=" text-lg leading-relaxed mb-4">
                        Founded in 2009 in Kigali, Mountain Ceramics Company has grown to become Rwanda&apos;s foremost ceramic tile producer, supplying high-quality tiles across East Africa.
                    </p>
                    <p className=" leading-relaxed mb-10">
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
                                <div className="w-7 h-7 bg-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200">
                                    <svg className="w-3.5 h-3.5 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold  text-sm mb-0.5">{f.title}</p>
                                    <p className=" text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Certification badges */}
                    <div className="flex flex-wrap gap-2 mb-10">
                        {badges.map((b) => (
                            <span
                                key={b}
                                className=" -primary/40 text-primary text-xs font-semibold px-4 py-1.5 tracking-wide"
                            >
                                {b}
                            </span>
                        ))}
                    </div>

                    <a
                        href="#contact"
                        className="self-start group bg-accent hover:bg-primary  font-bold px-9 py-4 transition-all duration-300 shadow-lg flex items-center gap-3 text-sm tracking-widest uppercase"
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
