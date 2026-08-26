"use client";

import { useState, FormEvent } from "react";
import {
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from "@/components/Icons";

const contactDetails = [
  {
    icon: "pin",
    title: "Head Office & Factory",
    lines: ["MH 7 Ave, Muhanga Industrial Zone", "Muhanga, Rwanda"],
  },
  {
    icon: "phone",
    title: "Phone",
    lines: ["+250 785 210 005", "+250 780 765 548"],
  },
  {
    icon: "envelope",
    title: "Email",
    lines: ["info@mountainceramic.com", "sales@mountainceramic.com"],
  },
  {
    icon: "clock",
    title: "Working Hours",
    lines: ["Monday – Sunday 24/7 "],
  },
];

const socials = [
  { label: "Facebook", icon: FacebookIcon, href: "#" },
  { label: "Instagram", icon: InstagramIcon, href: "#" },
  { label: "LinkedIn", icon: LinkedInIcon, href: "#" },
  { label: "X / Twitter", icon: XIcon, href: "#" },
];

function DetailIcon({ icon }: { icon: string }) {
  const cls = "w-5 h-5 text-[#c9a84c]";
  switch (icon) {
    case "pin":      return <MapPinIcon className={cls} />;
    case "phone":    return <PhoneIcon className={cls} />;
    case "envelope": return <EnvelopeIcon className={cls} />;
    case "clock":    return <ClockIcon className={cls} />;
    default:         return null;
  }
}

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("success");
    (e.target as HTMLFormElement).reset();
    setTimeout(() => setStatus("idle"), 5000);
  };

  return (
    <section id="contact" className="py-0 bg-[#0a0c12]">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* ── Info side ─────────────────────────────── */}
          <div>
            <span className="inline-flex items-center gap-3 text-[#c9a84c] text-xs font-bold tracking-[0.25em] uppercase mb-6">
              <span className="gold-divider" />
              Get In Touch
            </span>
            <h2 className="font-playfair text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              Let&apos;s Build Something<br />
              <span className="text-[#c9a84c]">Great Together</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-12">
              Whether you&apos;re an architect, developer, contractor, or homeowner — our team is ready to help you find the perfect tiles for your project.
            </p>

            {/* Contact details */}
            <div className="space-y-6 mb-12">
              {contactDetails.map((item) => (
                <div key={item.title} className="flex gap-5 items-start group">
                  <div className="w-12 h-12 bg-[#c9a84c]/10 border border-[#c9a84c]/20 group-hover:bg-[#c9a84c] group-hover:border-[#c9a84c] flex items-center justify-center flex-shrink-0 transition-all duration-200">
                    <DetailIcon icon={item.icon} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm mb-1">{item.title}</p>
                    {item.lines.map((line) => (
                      <p key={line} className="text-gray-400 text-sm">{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Socials */}
            <div>
              <p className="text-gray-500 text-xs tracking-widest uppercase mb-4">Follow Us</p>
              <div className="flex gap-3">
                {socials.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-11 h-11 border border-white/10 hover:border-[#c9a84c] hover:bg-[#c9a84c] text-gray-400 hover:text-white flex items-center justify-center transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Form side ─────────────────────────────── */}
          <div className="bg-white p-8 md:p-10 shadow-2xl">
            <h3 className="font-playfair text-2xl font-bold text-[#0f1117] mb-2">Send Us a Message</h3>
            <p className="text-gray-500 text-sm mb-8">Fill in the form below and we&apos;ll get back to you within 24 hours.</p>

            {status === "success" && (
              <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 text-sm font-medium flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Message sent! We&apos;ll get back to you within 24 hours.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="fname" className="block text-xs font-bold text-gray-600 mb-2 tracking-wider uppercase">
                    First Name <span className="text-[#c9a84c]">*</span>
                  </label>
                  <input
                    id="fname" name="fname" type="text" required placeholder="John"
                    className="w-full border-b-2 border-gray-200 focus:border-[#c9a84c] bg-gray-50 px-4 py-3 text-sm focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="lname" className="block text-xs font-bold text-gray-600 mb-2 tracking-wider uppercase">
                    Last Name <span className="text-[#c9a84c]">*</span>
                  </label>
                  <input
                    id="lname" name="lname" type="text" required placeholder="Doe"
                    className="w-full border-b-2 border-gray-200 focus:border-[#c9a84c] bg-gray-50 px-4 py-3 text-sm focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-bold text-gray-600 mb-2 tracking-wider uppercase">
                  Email Address <span className="text-[#c9a84c]">*</span>
                </label>
                <input
                  id="email" name="email" type="email" required placeholder="john@example.com"
                  className="w-full border-b-2 border-gray-200 focus:border-[#c9a84c] bg-gray-50 px-4 py-3 text-sm focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-gray-600 mb-2 tracking-wider uppercase">
                  Phone Number
                </label>
                <input
                  id="phone" name="phone" type="tel" placeholder="+250 7XX XXX XXX"
                  className="w-full border-b-2 border-gray-200 focus:border-[#c9a84c] bg-gray-50 px-4 py-3 text-sm focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="project" className="block text-xs font-bold text-gray-600 mb-2 tracking-wider uppercase">
                  Project Type
                </label>
                <select
                  id="project" name="project"
                  className="w-full border-b-2 border-gray-200 focus:border-[#c9a84c] bg-gray-50 px-4 py-3 text-sm focus:outline-none transition-colors text-gray-700"
                >
                  <option value="">Select project type</option>
                  <option>Residential</option>
                  <option>Commercial</option>
                  <option>Industrial</option>
                  <option>Infrastructure</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-bold text-gray-600 mb-2 tracking-wider uppercase">
                  Message <span className="text-[#c9a84c]">*</span>
                </label>
                <textarea
                  id="message" name="message" rows={4} required
                  placeholder="Tell us about your project..."
                  className="w-full border-b-2 border-gray-200 focus:border-[#c9a84c] bg-gray-50 px-4 py-3 text-sm focus:outline-none transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#0f1117] hover:bg-[#c9a84c] text-white font-bold py-4 transition-all duration-300 flex items-center justify-center gap-3 text-sm tracking-widest uppercase mt-2"
              >
                Send Message
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>

              <p className="text-center text-gray-400 text-xs">
                We typically respond within 24 hours on business days.
              </p>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
