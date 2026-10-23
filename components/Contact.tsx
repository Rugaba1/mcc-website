"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "@/lib/api";
import {
  MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon,
  FacebookIcon, InstagramIcon, LinkedInIcon, XIcon,
} from "./Icons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PhoneInput } from "./ui/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const contactDetails = [
  { icon: "pin", title: "Head Office & Factory", lines: ["MH 7 Ave, Muhanga Industrial Zone", "Muhanga, Rwanda"] },
  { icon: "phone", title: "Phone", lines: ["+250 785 210 005", "+250 780 765 548"] },
  { icon: "envelope", title: "Email", lines: ["info@mountainceramic.com", "sales@mountainceramic.com"] },
  { icon: "clock", title: "Working Hours", lines: ["Monday – Sunday 24/7"] },
];

const socials = [
  { label: "Facebook", icon: FacebookIcon, href: "#" },
  { label: "Instagram", icon: InstagramIcon, href: "#" },
  { label: "LinkedIn", icon: LinkedInIcon, href: "#" },
  { label: "X / Twitter", icon: XIcon, href: "#" },
];

const icons = { pin: MapPinIcon, phone: PhoneIcon, envelope: EnvelopeIcon, clock: ClockIcon };

const field =
  "w-full  border border-input bg-muted px-4 py-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
const label = "mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground";

export default function Contact() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [phone, setPhone] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    if (phone && !isValidPhoneNumber(phone)) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    setSending(true);
    try {
      const result = await api.sendContact({
        firstName: String(f.get("fname") ?? ""),
        lastName: String(f.get("lname") ?? ""),
        email: String(f.get("email") ?? ""),
        phone,
        projectType: String(f.get("project") ?? ""),
        message: String(f.get("message") ?? ""),
        website: String(f.get("website") ?? ""),
      });
      form.reset();
      setPhone("");
      setSent(result.confirmationSent);
      if (!result.confirmationSent) {
        toast.warning(
          "Your message was received, but we couldn't deliver the confirmation email right now. We'll respond to your message; contact us by phone if it's urgent.",
        );
      }
      setTimeout(() => setSent(false), 8000);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not send your message. Please try again."));
    } finally {
      setSending(false);
    }
  }

  return (
    <section id="contact" className="bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid items-start gap-16 lg:grid-cols-2">
          {/* Info side */}
          <div>
            <span className="mb-6 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-primary">
              <span className="gold-divider" />
              Get In Touch
            </span>
            <h2 className="mb-6 font-playfair text-4xl font-bold leading-tight md:text-5xl">
              Let&apos;s Build Something
              <br />
              <span className="text-primary">Great Together</span>
            </h2>
            <p className="mb-12 text-lg leading-relaxed text-muted-foreground">
              Whether you&apos;re an architect, developer, contractor, or homeowner, our team is ready to help you find the perfect tiles for your project.
            </p>

            <div className="mb-12 space-y-6">
              {contactDetails.map((item) => {
                const Icon = icons[item.icon as keyof typeof icons];
                return (
                  <div key={item.title} className="group flex items-start gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-primary/20 bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-semibold">{item.title}</p>
                      {item.lines.map((line) => (
                        <p key={line} className="text-sm text-muted-foreground">{line}</p>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <p className="mb-4 text-xs uppercase tracking-widest text-muted-foreground">Follow Us</p>
              <div className="flex gap-3">
                {socials.map(({ label: l, icon: Icon, href }) => (
                  <a key={l} href={href} aria-label={l} className="flex h-11 w-11 items-center justify-center border border-border transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Form side */}
          <div className="border border-border bg-background p-8 shadow-2xl md:p-10">
            <h3 className="mb-2 font-playfair text-2xl font-bold">Send Us a Message</h3>
            <p className="mb-8 text-sm text-muted-foreground">
              Fill in the form below and we&apos;ll get back to you within 24 hours.
            </p>

            {sent && (
              <div role="status" className="mb-6 flex items-center gap-2 border-l-4 border-emerald-500 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                Message sent! Check your email for a confirmation.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Honeypot: hidden from people, filled by bots */}
              <Input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="fname" className={label}>First Name *</label>
                  <Input id="fname" name="fname" required maxLength={80} placeholder="John" autoComplete="given-name" className={field} />
                </div>
                <div>
                  <label htmlFor="lname" className={label}>Last Name *</label>
                  <Input id="lname" name="lname" required maxLength={80} placeholder="Doe" autoComplete="family-name" className={field} />
                </div>
              </div>

              <div>
                <label htmlFor="email" className={label}>Email Address *</label>
                <Input id="email" name="email" type="email" required maxLength={254} placeholder="john@example.com" autoComplete="email" className={field} />
              </div>

              <div>
                <label htmlFor="phone" className={label}>Phone Number</label>
                <PhoneInput
                  id="phone"
                  name="phone"
                  international
                  defaultCountry="RW"
                  countryCallingCodeEditable={false}
                  autoComplete="tel"
                  placeholder="Enter phone number"
                  className={field}
                  value={phone}
                  onChange={setPhone}
                />
              </div>

              <div>
                <label htmlFor="project" className={label}>Project Type</label>
                <Select name="project" defaultValue="">
                  <SelectTrigger id="project" className={field}>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Residential">Residential</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                    <SelectItem value="Industrial">Industrial</SelectItem>
                    <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label htmlFor="message" className={label}>Message *</label>
                <textarea id="message" name="message" rows={4} required minLength={10} maxLength={5000} placeholder="Tell us about your project..." className={`${field} resize-none`} />
              </div>

              <Button
                type="submit"
                disabled={sending}
                className="mt-2 flex w-full items-center justify-center gap-3 bg-primary py-4 text-sm font-bold uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {sending ? "Sending…" : "Send Message"}
                {!sending && <ArrowRight className="h-4 w-4" />}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                We typically respond within 24 hours on business days.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}