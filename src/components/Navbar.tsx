"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const links = [
  { label: "Home",        href: "#home" },
  { label: "About",       href: "#about" },
  { label: "Products",    href: "#products" },
  { label: "Collections", href: "/collections" },
  { label: "Projects",    href: "/projects" },
  { label: "Visualizer",  href: "/visualizer/panorama" },
  { label: "Why Us",      href: "#why-us" },
  { label: "Contact",     href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("#home");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      // Update active section
      const sections = links.map((l) => l.href.replace("#", ""));
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActive(`#${id}`);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0a0c12]/97 backdrop-blur-lg shadow-2xl shadow-black/40 py-0"
          : "bg-transparent py-2"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-20">

        {/* Logo */}
        <a href="#home" className="flex items-center gap-3 group flex-shrink-0">
          <div className="relative h-10 w-10 flex-shrink-0">
            <Image
              src="/LOGO MOUNTAIN.png"
              alt="Mountain Ceramics Company"
              fill
              className="object-contain"
              priority
              sizes="40px"
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-white text-[15px] tracking-wide">Mountain Ceramics</span>
            <span className="text-[#c9a84c] text-[10px] tracking-[0.25em] uppercase">Company · Rwanda</span>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => {
            const isExternal = !l.href.startsWith("#");
            const cls = `relative px-4 py-2 text-sm font-medium transition-colors duration-200 group ${
              active === l.href ? "text-[#c9a84c]" : "text-gray-300 hover:text-white"
            }`;
            const underline = (
              <span className={`absolute bottom-0 left-4 right-4 h-px bg-[#c9a84c] transition-all duration-300 ${
                active === l.href ? "opacity-100" : "opacity-0 group-hover:opacity-60"
              }`} />
            );
            return isExternal ? (
              <Link key={l.href} href={l.href} className={cls}>
                {l.label}
                {underline}
              </Link>
            ) : (
              <a key={l.href} href={l.href} className={cls}>
                {l.label}
                {underline}
              </a>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="hidden lg:flex items-center gap-4">
          <a
            href="tel:+250785210005"
            className="flex items-center gap-2 text-gray-400 hover:text-[#c9a84c] text-sm transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            +250 785 210 005
          </a>
          <a
            href="#contact"
            className="bg-[#c9a84c] hover:bg-[#f0d080] hover:text-[#0f1117] text-white text-sm font-bold px-6 py-2.5 transition-all duration-300 tracking-widest uppercase"
          >
            Get Quote
          </a>
        </div>

        {/* Hamburger */}
        <button
          className="lg:hidden flex flex-col gap-[5px] p-2 z-50"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span className={`block w-6 h-[2px] bg-white transition-all duration-300 ${open ? "rotate-45 translate-y-[7px]" : ""}`} />
          <span className={`block w-4 h-[2px] bg-[#c9a84c] transition-all duration-300 ${open ? "opacity-0 w-6" : ""}`} />
          <span className={`block w-6 h-[2px] bg-white transition-all duration-300 ${open ? "-rotate-45 -translate-y-[7px]" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden bg-[#0a0c12]/99 backdrop-blur-xl overflow-hidden transition-all duration-400 ${
          open ? "max-h-[600px] border-t border-white/10" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col px-6 py-6 gap-1">
          {links.map((l) => {
            const isExternal = !l.href.startsWith("#");
            const cls = `flex items-center justify-between py-3.5 border-b border-white/8 text-base font-medium transition-colors ${
              active === l.href ? "text-[#c9a84c]" : "text-gray-300"
            }`;
            const arrow = (
              <svg className="w-4 h-4 text-[#c9a84c]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            );
            return isExternal ? (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className={cls}>
                {l.label}{arrow}
              </Link>
            ) : (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={cls}>
                {l.label}{arrow}
              </a>
            );
          })}
          <a href="#contact"
            onClick={() => setOpen(false)}
            className="mt-4 bg-[#c9a84c] text-white text-sm font-bold px-5 py-4 text-center tracking-widest uppercase"
          >
            Get a Free Quote
          </a>
        </nav>
      </div>
    </header>
  );
}
