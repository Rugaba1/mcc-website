import Image from "next/image";
import { FacebookIcon, InstagramIcon, LinkedInIcon, XIcon } from "./Icons";

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
    <footer className="w-full border-t-0">



      {/* Main footer */}
      <div className=" px-6 pt-16 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-14">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-start ">
              <div className="flex flex-col gap-3 group">
                <a href="#home" className="flex flex-wrap items-center gap-2">
                  <div className="relative h-10 w-10 shrink-0">
                    <Image
                      src="/logo.png"
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
              </div>
              <div className=" flex flex-col md:flex-row items-center  gap-1">

                <a
                  href="/contact"
                  className="bg-primary hover:bg-[#f0d080] hover:  text-xs font-bold px-8 py-3 tracking-widest uppercase transition-all duration-300"
                >
                  Get Free Quote
                </a>
              </div>
            </div>



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
                      <span className="w-1 h-1 bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
                      {item}
                    </a>
                  </li>
                ))}
              </ul>

            </div>
          ))}

        </div>

        {/* Gold divider */}
        <div className="h-px bg-linear-to-r from-transparent via-primary/30 to-transparent mb-8" />

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
