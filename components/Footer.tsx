import Image from "next/image";
import { Link } from "@/app/i18n/routing";
import { COMPANY } from "@/lib/company";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { siteConfig } from "@/config/site.config";
import CookieConsent from "./cookie-consent";

const footerLinks = [
  {
    title: "Products",
    items: [
      { label: "Floor Tiles", href: { pathname: "/catalogue", query: { category: "floor" } } },
      { label: "Wall Tiles", href: { pathname: "/catalogue", query: { category: "wall" } } },
      { label: "Outdoor Tiles", href: { pathname: "/catalogue", query: { category: "outdoor" } } },
      { label: "Special Finish", href: { pathname: "/catalogue", query: { category: "special" } } },
      { label: "Custom Orders", href: "/contact" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About Us", href: "/about" },
      { label: "Projects", href: "/projects" },
      { label: "Why Choose MCC", href: "/why-us" },
      { label: "Careers", href: "/contact" },
      { label: "News & Media", href: "/blog" },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Get a Quote", href: "/contact" },
      { label: "Design Consultation", href: "/contact" },
      { label: "Installation Guide", href: "/contact" },
      { label: "Warranty Claims", href: "/contact" },
      { label: "Dealer Programme", href: "/contact" },
    ],
  },
] as const;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t-0 bg-inverse text-inverse-foreground">
      <div className="px-6 pt-16 pb-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-12 mb-14">

          {/* Brand */}
          <div className="lg:col-span-2 gap-2">
            <div className="flex flex-wrap items-start ">
              <div className="flex flex-col  group">
                <div className="flex flex-row items-center gap-2 flex-wrap">
                  <div className="relative h-10 w-10 shrink-0">
                    <Image
                      src="/logo.png"
                      alt="Mountain Ceramics Company"
                      fill
                      className="object-contain"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <div className="flex flex-col leading-none">
                      <span className="font-bold text-[15px] tracking-wide">Mountain Ceramics</span>
                      <span className="text-[10px] tracking-[0.25em] uppercase">Company · Rwanda</span>
                    </div>


                    {/* <Link
                        href="/contact"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold px-8 py-3 tracking-widest uppercase transition-all duration-300"
                      >
                        Get Free Quote
                      </Link> */}

                  </div>

                </div>
                <div className="flex flex-wrap gap-1 items-center">
                  <a href={`tel:${COMPANY.phone}`} className="text-[10px] tracking-[0.25em] uppercase">{COMPANY.phone}</a> | <a className="text-[10px] tracking-[0.25em] uppercase" href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
                </div>




                <p className="mb-6 max-w-xs text-sm leading-relaxed text-inverse-foreground/80">
                  Rwanda&apos;s ceramic tile manufacturer since 2009. Building better spaces, one tile at a time.
                </p>
                <NewsletterSignup />
              </div>

            </div>





            {/* Certs */}
            <div className="flex flex-wrap gap-2">
              {["ISO 9001", "RSB Certified", "Made in Rwanda"].map((cert) => (
                <span
                  key={cert}
                  className="border border-inverse-border px-3 py-1 text-xs tracking-wide text-inverse-foreground/80"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map(({ title, items }) => (
            <div key={title}>
              <h4 className="mb-5 text-xs font-bold tracking-[0.2em] uppercase">{title}</h4>
              <ul className="space-y-3">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="group flex items-center gap-2 text-sm text-inverse-foreground/75 transition-colors duration-200 hover:text-inverse-foreground"
                    >
                      <span className="h-1 w-1 shrink-0 bg-primary/40 transition-colors group-hover:bg-primary" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>

            </div>
          ))}

        </div>

        {/* Gold divider */}
        <div className="h-px bg-linear-to-r from-transparent via-primary/30 to-transparent mb-8" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <p className="text-center text-xs text-inverse-foreground/70 sm:text-left">
              © {year} Mountain Ceramics Company (MCC). All rights reserved. · {COMPANY.address}
            </p>
            <CookieConsent
              analyticsId={siteConfig.googleAnalyticsId}

            /></div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <Link href="/legal/terms-and-conditions" className="text-xs text-inverse-foreground/75 transition-colors hover:text-inverse-foreground">
              Terms and Conditions
            </Link>
            <Link href="/legal/terms-of-service" className="text-xs text-inverse-foreground/75 transition-colors hover:text-inverse-foreground">
              Terms of Service
            </Link>
            <Link href="/legal/privacy-policy" className="text-xs text-inverse-foreground/75 transition-colors hover:text-inverse-foreground">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
