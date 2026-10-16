import Image from "next/image";
import { FacebookIcon, InstagramIcon, LinkedInIcon, XIcon } from "@/components/Icons";

const footerLinks = {
  Products: ["Floor Tiles", "Wall Tiles", "Outdoor Tiles", "Special Finish", "Custom Orders"],
  Company: ["About Us", "Projects", "Why Choose MCC", "Careers", "News & Media"],
  Support: ["Get a Quote", "Design Consultation", "Installation Guide", "Warranty Claims", "Dealer Programme"],
};

const socials = [
  { label: "Facebook", icon: FacebookIcon, href: "#" },
  { label: "Instagram", icon: InstagramIcon, href: "#" },
  { label: "LinkedIn", icon: LinkedInIcon, href: "#" },
  { label: "X", icon: XIcon, href: "#" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#06070b] ">

      {/* Top band */}
      <div className="-b /8">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <svg className="w-5 h-5 " fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            <span className=" font-semibold text-sm">Questions? Call us: <a href="tel:+250785210005" className=" hover:underline">+250 785 210 005</a></span>
          </div>
          <a
            href="#contact"
            className="bg-primary hover:bg-[#f0d080] hover:  text-xs font-bold px-8 py-3 tracking-widest uppercase transition-all duration-300"
          >
            Get Free Quote
          </a>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-14">

          {/* Brand */}
          <div className="lg:col-span-2">
            <a href="#home" className="flex items-center gap-3 mb-6 group">
              <div className="relative h-10 w-10 flex-shrink-0">
                <Image
                  src="/LOGO MOUNTAIN.png"
                  alt="Mountain Ceramics Company"
                  fill
                  className="object-contain"
                  sizes="40px"
                  unoptimized />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold  text-[15px] tracking-wide">Mountain Ceramics</span>
                <span className=" text-[10px] tracking-[0.25em] uppercase">Company · Rwanda</span>
              </div>
            </a>
            <p className=" text-sm leading-relaxed mb-6 max-w-xs">
              Rwanda&apos;s leading ceramic tile manufacturer since 2025. Building better spaces, one tile at a time.
            </p>

            {/* Social icons */}
            <div className="flex gap-2 mb-8">
              {socials.map(({ label, icon: Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9  /10 hover:-primary hover:bg-primary   flex items-center justify-center transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Certs */}
            <div className="flex flex-wrap gap-2">
              {["ISO 9001", "RSB Certified", "Made in Rwanda"].map((cert) => (
                <span
                  key={cert}
                  className="text-xs  -primary/30 /80 px-3 py-1 tracking-wide"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, items]) => (
            <div key={title}>
              <h4 className=" font-bold mb-5 text-xs tracking-[0.2em] uppercase">{title}</h4>
              <ul className="space-y-3">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#contact"
                      className=" hover: text-sm transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-1 h-1 bg-primary/40 group-hover:bg-primary transition-colors flex-shrink-0" />
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Gold divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className=" text-xs text-center sm:text-left">
            © {year} Mountain Ceramics Company (MCC). All rights reserved. · Kigali, Rwanda
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Use", "Sitemap"].map((l) => (
              <a key={l} href="#" className=" hover: text-xs transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
