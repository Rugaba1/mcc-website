"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  api,
  type Product,
  type Project,
  type Collection,
  type Testimonial,
  CATEGORY_OPTIONS,
  BADGE_OPTIONS,
  type Category,
  type Badge,
} from "@/lib/api";
import { useRef, type ChangeEvent } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
  canProducts: boolean;
  canCollections: boolean;
  canProjects: boolean;
  canTestimonials: boolean;
  canUsers: boolean;
}

type PortalSection = "home" | "products" | "collections" | "projects" | "testimonials" | "users";

// ─── Shared UI primitives (mirrors admin page) ────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-gray-500 tracking-widest uppercase mb-1.5">{children}</label>;
}
function Input({ className = "", ...p }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={`w-full border border-gray-200 focus:border-[#c9a84c] bg-white px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/20 transition-all ${className}`} />;
}
function Textarea({ className = "", ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...p} className={`w-full border border-gray-200 focus:border-[#c9a84c] bg-white px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/20 transition-all resize-none ${className}`} />;
}
function Select({ className = "", ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={`w-full border border-gray-200 focus:border-[#c9a84c] bg-white px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/20 transition-all ${className}`} />;
}

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Upload failed");
  }
  const { url } = await res.json();
  return url;
}

function ImageUploader({ value, onChange, label = "Image" }: { value: string; onChange: (u: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading,    setUploading]    = useState(false);
  const [uploadError,  setUploadError]  = useState<string | null>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setUploadError(null);
    try {
      const url = await uploadImage(f);
      onChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-3 items-start">
        <div
          className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-[#c9a84c] bg-gray-50"
          onClick={() => !uploading && ref.current?.click()}
        >
          {uploading ? (
            <svg className="w-6 h-6 text-[#c9a84c] animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          ) : value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
          )}
        </div>
        <div className="flex-1">
          <Input
            placeholder="Paste image URL…"
            value={value.startsWith("/uploads/") || value.startsWith("http") ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1.5">or</p>
          <button
            type="button"
            disabled={uploading}
            onClick={() => ref.current?.click()}
            className="mt-1 text-xs text-[#c9a84c] hover:underline font-semibold disabled:opacity-40"
          >
            {uploading ? "Uploading…" : "Upload from computer"}
          </button>
          {value && (value.startsWith("/uploads/") || value.startsWith("http")) && (
            <p className="text-[10px] text-gray-400 mt-1 truncate" title={value}>{value}</p>
          )}
          {uploadError && <p className="text-[10px] text-red-500 mt-1">{uploadError}</p>}
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
      </div>
    </div>
  );
}

// ─── Login screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (u: SessionUser) => void }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [pwShow,   setPwShow]   = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Login failed. Check your credentials.");
      } else {
        const user: SessionUser = await res.json();
        onLogin(user);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0c12] via-[#0f1117] to-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <Image src="/LOGO MOUNTAIN.png" alt="MCC" fill className="object-contain" sizes="48px" />
          </div>
          <h1 className="text-white text-xl font-bold tracking-wide">MCC Staff Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to manage content</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-7 shadow-2xl">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>Email address</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoFocus
                className="bg-white/10 border-white/20 text-white placeholder-gray-500 focus:border-[#c9a84c]"
              />
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={pwShow ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder-gray-500 focus:border-[#c9a84c] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setPwShow(!pwShow)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {pwShow
                    ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/></svg>
                    : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  }
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-3 py-2.5 rounded-lg">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/></svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg text-sm tracking-widest uppercase transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-5">
          <Link href="/" className="hover:text-gray-400 transition-colors">← Back to website</Link>
        </p>
      </div>
    </div>
  );
}

// ─── Portal dashboard ─────────────────────────────────────────────────────────

function PortalDashboard({ user, onLogout }: { user: SessionUser; onLogout: () => void }) {
  const isAdmin = user.role === "admin";

  const [section,      setSection]      = useState<PortalSection>("home");
  const [products,     setProducts]     = useState<Product[]>([]);
  const [collections,  setCollections]  = useState<Collection[]>([]);
  const [projects,     setProjects]     = useState<Project[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [toast,        setToast]        = useState<string | null>(null);
  const [sidebar,      setSidebar]      = useState(true);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const reload = async () => {
    setLoading(true);
    try {
      const [p, col, proj, test] = await Promise.all([
        (isAdmin || user.canProducts)     ? api.getProducts()     : Promise.resolve([]),
        (isAdmin || user.canCollections)  ? api.getCollections()  : Promise.resolve([]),
        (isAdmin || user.canProjects)     ? api.getProjects()     : Promise.resolve([]),
        (isAdmin || user.canTestimonials) ? api.getTestimonials() : Promise.resolve([]),
      ]);
      setProducts(p as Product[]);
      setCollections(col as Collection[]);
      setProjects(proj as Project[]);
      setTestimonials(test as Testimonial[]);
    } finally { setLoading(false); }
  };

  useEffect(() => { reload(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const logout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    onLogout();
  };

  const navItems: { id: PortalSection; label: string; icon: React.ReactNode; allowed: boolean }[] = [
    {
      id: "home", label: "Home", allowed: true,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>,
    },
    {
      id: "products", label: "Tiles / Products", allowed: isAdmin || user.canProducts,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z"/></svg>,
    },
    {
      id: "collections", label: "Collections", allowed: isAdmin || user.canCollections,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3"/></svg>,
    },
    {
      id: "projects", label: "Projects", allowed: isAdmin || user.canProjects,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m6.75 0V9.75m4.5 11.25V9.75m-4.5-7.5h4.5m-4.5 0v7.5m4.5-7.5v7.5M3 9h6m-6 3h6m-6 3h6"/></svg>,
    },
    {
      id: "testimonials", label: "Testimonials", allowed: isAdmin || user.canTestimonials,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"/></svg>,
    },
    {
      id: "users", label: "Users", allowed: isAdmin || user.canUsers,
      icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar ── */}
      <aside className={`${sidebar ? "w-60" : "w-16"} bg-[#0a0c12] flex-shrink-0 flex flex-col transition-all duration-300 fixed top-0 left-0 h-full z-40`}>
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10 flex-shrink-0">
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image src="/LOGO MOUNTAIN.png" alt="MCC" fill className="object-contain" sizes="32px" />
          </div>
          {sidebar && (
            <div className="min-w-0">
              <p className="font-bold text-white text-sm truncate">{isAdmin ? "Admin Portal" : "Staff Portal"}</p>
              <p className="text-[#c9a84c] text-[9px] tracking-widest uppercase truncate">{user.name}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.filter((n) => n.allowed).map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                section === item.id ? "bg-[#c9a84c] text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebar && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Role badge + logout */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {sidebar && (
            <div className="px-3 py-2 rounded-lg bg-white/5">
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
              <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${isAdmin ? "bg-[#c9a84c]/20 text-[#c9a84c]" : "bg-blue-500/20 text-blue-400"}`}>
                {user.role}
              </span>
            </div>
          )}
          <a href="/" target="_blank" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-all">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
            {sidebar && <span>View Site</span>}
          </a>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
            {sidebar && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className={`flex-1 flex flex-col ${sidebar ? "ml-60" : "ml-16"} transition-all duration-300 min-h-screen`}>
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebar(!sidebar)} className="text-gray-500 hover:text-gray-700 p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/></svg>
            </button>
            <h1 className="font-semibold text-gray-800 text-sm capitalize">
              {section === "home" ? (isAdmin ? "Admin Dashboard" : "Dashboard") : section}
            </h1>
            {isAdmin && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c9a84c]/15 text-[#a07830] uppercase tracking-wider">
                Full Access
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={reload} disabled={loading} className="text-xs text-gray-400 hover:text-[#c9a84c] font-semibold uppercase tracking-wider transition-colors disabled:opacity-40">
              {loading ? "Loading…" : "↺ Refresh"}
            </button>
          </div>
        </header>

        {/* Section content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {section === "home" && (
            <PortalHome user={user} isAdmin={isAdmin} products={products} collections={collections} projects={projects} testimonials={testimonials} setSection={setSection} />
          )}
          {section === "products"     && (isAdmin || user.canProducts)     && <PortalProductsSection    products={products}    reload={reload} showToast={showToast} />}
          {section === "collections"  && (isAdmin || user.canCollections)  && <PortalCollectionsSection collections={collections} products={products} reload={reload} showToast={showToast} isAdmin={isAdmin} />}
          {section === "projects"     && (isAdmin || user.canProjects)     && <PortalProjectsSection    projects={projects}    products={products} reload={reload} showToast={showToast} isAdmin={isAdmin} />}
          {section === "testimonials" && (isAdmin || user.canTestimonials) && <PortalTestimonialsSection testimonials={testimonials} reload={reload} showToast={showToast} />}
          {section === "users"        && (isAdmin || user.canUsers)        && <PortalUsersSection reload={reload} showToast={showToast} />}
          {/* Access denied fallback */}
          {section !== "home" && !navItems.find((n) => n.id === section)?.allowed && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
              </div>
              <p className="text-gray-700 font-bold text-lg">Access Restricted</p>
              <p className="text-gray-400 text-sm mt-1">You don't have permission to manage this section.</p>
              <p className="text-gray-400 text-xs mt-1">Contact your administrator to request access.</p>
            </div>
          )}
        </main>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0a0c12] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2">
          <svg className="w-4 h-4 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Portal home / dashboard ──────────────────────────────────────────────────

function PortalHome({ user, isAdmin, products, collections, projects, testimonials, setSection }: {
  user: SessionUser;
  isAdmin: boolean;
  products: Product[];
  collections: Collection[];
  projects: Project[];
  testimonials: Testimonial[];
  setSection: (s: PortalSection) => void;
}) {
  const stats = [
    { label: "Tiles",        value: products.length,     allowed: isAdmin || user.canProducts,     section: "products"     as PortalSection, color: "bg-blue-50 text-blue-600" },
    { label: "Collections",  value: collections.length,  allowed: isAdmin || user.canCollections,  section: "collections"  as PortalSection, color: "bg-amber-50 text-amber-600" },
    { label: "Projects",     value: projects.length,     allowed: isAdmin || user.canProjects,     section: "projects"     as PortalSection, color: "bg-emerald-50 text-emerald-600" },
    { label: "Testimonials", value: testimonials.length, allowed: isAdmin || user.canTestimonials, section: "testimonials" as PortalSection, color: "bg-purple-50 text-purple-600" },
    ...(isAdmin || user.canUsers ? [{ label: "Users", value: "—", allowed: true, section: "users" as PortalSection, color: "bg-rose-50 text-rose-600" }] : []),
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Welcome back, {user.name} 👋</h2>
        <p className="text-gray-500 text-sm mt-1">
          You are signed in as <span className={`font-bold ${user.role === "admin" ? "text-[#c9a84c]" : "text-blue-500"}`}>{user.role}</span>.
          {" "}Changes you make are saved immediately to the live site.
        </p>
      </div>

      {/* Permission overview */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-700 text-sm mb-3">Your Access</h3>
        {isAdmin ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-[#c9a84c]/10 rounded-xl border border-[#c9a84c]/20">
            <svg className="w-5 h-5 text-[#c9a84c] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
            <div>
              <p className="text-sm font-bold text-[#a07830]">Administrator — Full Access</p>
              <p className="text-xs text-[#c9a84c]/70 mt-0.5">You have unrestricted access to all sections and features.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: "Tiles",         key: "canProducts"     as keyof SessionUser },
              { label: "Collections",   key: "canCollections"  as keyof SessionUser },
              { label: "Projects",      key: "canProjects"     as keyof SessionUser },
              { label: "Testimonials",  key: "canTestimonials" as keyof SessionUser },
              { label: "Users",         key: "canUsers"        as keyof SessionUser },
            ].map((p) => (
              <div key={p.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold ${user[p.key] ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-400"}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${user[p.key] ? "bg-emerald-500" : "bg-gray-300"}`} />
                {p.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.filter((s) => s.allowed).map((s) => (
          <button key={s.label} onClick={() => setSection(s.section)}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#c9a84c]/30 transition-all text-left group">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${s.color} mb-3`}>
              <span className="text-base font-bold">{s.value}</span>
            </div>
            <p className="text-gray-500 text-xs font-semibold tracking-wide uppercase">{s.label}</p>
            <p className="text-gray-400 text-xs mt-0.5 group-hover:text-[#c9a84c] transition-colors">Manage →</p>
          </button>
        ))}
        {stats.filter((s) => !s.allowed).map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-2xl p-5 border border-dashed border-gray-200 opacity-50 cursor-not-allowed select-none">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 mb-3">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/></svg>
            </div>
            <p className="text-gray-400 text-xs font-semibold tracking-wide uppercase">{s.label}</p>
            <p className="text-gray-400 text-xs mt-0.5">No access</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Thin wrappers — reuse the same CRUD UI as admin but scoped to portal ─────
// Products
function PortalProductsSection({ products, reload, showToast }: { products: Product[]; reload: () => void; showToast: (m: string) => void }) {
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const blankProduct = (): Omit<Product, "id"> => ({
    name: "", category: "floor", categoryLabel: "Floor Tiles", description: "",
    sizes: "", badge: null, gradient: "from-gray-400 to-gray-600",
    image: "", colors: [], useCase: "", collection: "", featured: false,
  });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const { id, ...data } = editing;
      if (id) await api.updateProduct(id, data); else await api.createProduct(data);
      showToast(id ? "Product updated" : "Product created");
      setEditing(null); reload();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    setDeleting(id);
    try { await api.deleteProduct(id); showToast("Deleted"); reload(); }
    finally { setDeleting(null); }
  };

  const set = <K extends keyof Product>(k: K, v: Product[K]) =>
    setEditing((p) => p ? { ...p, [k]: v } : p);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Tiles / Products</h2>
        <button onClick={() => setEditing({ id: 0, ...blankProduct() })}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8943e] text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          New Tile
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50 text-left">
            <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
            <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Sizes</th>
            <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Badge</th>
            <th className="px-5 py-3"/>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/60 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-800">{p.name}</td>
                <td className="px-5 py-3 text-gray-500">{p.categoryLabel}</td>
                <td className="px-5 py-3 text-gray-500">{p.sizes}</td>
                <td className="px-5 py-3">{p.badge && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-md">{p.badge}</span>}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <button onClick={() => setEditing(p)} className="p-1.5 text-gray-400 hover:text-[#c9a84c] rounded-lg hover:bg-[#c9a84c]/10 transition-all">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                    </button>
                    <button onClick={() => del(p.id)} disabled={deleting === p.id} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all disabled:opacity-40">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">{editing.id ? "Edit Tile" : "New Tile"}</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name</Label><Input value={editing.name} onChange={(e) => set("name", e.target.value)}/></div>
                <div><Label>Category</Label>
                  <Select value={editing.category} onChange={(e) => { const opt = CATEGORY_OPTIONS.find((o) => o.value === e.target.value); set("category", opt!.value); set("categoryLabel", opt!.label); }}>
                    {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </Select>
                </div>
              </div>
              <div><Label>Description</Label><Textarea rows={2} value={editing.description} onChange={(e) => set("description", e.target.value)}/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Sizes</Label><Input value={editing.sizes} onChange={(e) => set("sizes", e.target.value)} placeholder="600×600mm"/></div>
                <div><Label>Badge</Label>
                  <Select value={editing.badge ?? ""} onChange={(e) => set("badge", (e.target.value || null) as Badge)}>
                    {BADGE_OPTIONS.map((o) => <option key={String(o.value)} value={o.value ?? ""}>{o.label}</option>)}
                  </Select>
                </div>
              </div>
              <ImageUploader value={editing.image} onChange={(u) => set("image", u)} />
              <div><Label>Use Case</Label><Input value={editing.useCase} onChange={(e) => set("useCase", e.target.value)}/></div>
              <div><Label>Collection tag</Label><Input value={editing.collection} onChange={(e) => set("collection", e.target.value)}/></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="pfeat" checked={editing.featured} onChange={(e) => set("featured", e.target.checked)} className="rounded"/>
                <label htmlFor="pfeat" className="text-sm text-gray-700">Featured on homepage</label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={save} disabled={saving || !editing.name}
                className="flex items-center gap-2 px-5 py-2 bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-40 text-white text-sm font-bold rounded-lg transition-all">
                {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Collections — full CRUD (same capability as admin)
function PortalCollectionsSection({ collections, products, reload, showToast }: { collections: Collection[]; products: Product[]; reload: () => void; showToast: (m: string) => void; isAdmin: boolean }) {
  const empty = (): Omit<Collection, "id"> => ({ name: "", description: "", image: "", tileIds: [], featured: false });
  const [editing,   setEditing]   = useState<Collection | null>(null);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState<Omit<Collection, "id">>(empty());
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState("");

  const setF = <K extends keyof Omit<Collection,"id">>(k: K, v: Omit<Collection,"id">[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTile = (id: number) => setForm((f) => ({ ...f, tileIds: f.tileIds.includes(id) ? f.tileIds.filter((t) => t !== id) : [...f.tileIds, id] }));

  function openNew()  { setEditing(null); setForm(empty()); setShowForm(true); }
  function openEdit(c: Collection) { setEditing(c); setForm({ ...c }); setShowForm(true); }
  function cancel()   { setEditing(null); setForm(empty()); setShowForm(false); }

  async function save() {
    if (!form.name.trim()) { showToast("Name required"); return; }
    setSaving(true);
    try {
      if (editing) { await api.updateCollection(editing.id, form); showToast("Collection updated ✓"); }
      else         { await api.createCollection(form);              showToast("Collection created ✓"); }
      await reload(); cancel();
    } catch { showToast("Save failed"); } finally { setSaving(false); }
  }
  async function remove(id: number) {
    if (!confirm("Delete this collection?")) return;
    try { await api.deleteCollection(id); await reload(); showToast("Deleted"); }
    catch { showToast("Delete failed"); }
  }

  const visible = search ? collections.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) : collections;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Collections</h2>
          <p className="text-gray-400 text-sm">{collections.length} in database</p>
        </div>
        <button onClick={openNew} className="bg-[#c9a84c] hover:bg-[#b8943e] text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Add Collection
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 text-base mb-5">{editing ? `Editing: ${editing.name}` : "Add Collection"}</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. Terrain Series" /></div>
            <div className="flex items-center gap-3 pt-5">
              <input id="pfeat-col" type="checkbox" checked={form.featured} onChange={(e) => setF("featured", e.target.checked)} className="w-4 h-4 accent-[#c9a84c]" />
              <label htmlFor="pfeat-col" className="text-sm font-medium text-gray-700">Featured on site</label>
            </div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setF("description", e.target.value)} placeholder="Describe this collection…" /></div>
            <div className="sm:col-span-2"><ImageUploader label="Cover Image" value={form.image} onChange={(u) => setF("image", u)} /></div>
            <div className="sm:col-span-2">
              <Label>Tiles in this collection</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto border border-gray-100 rounded-xl p-3 mt-1">
                {products.map((p) => {
                  const sel = form.tileIds.includes(p.id);
                  return (
                    <label key={p.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${sel ? "border-[#c9a84c] bg-[#c9a84c]/5" : "border-gray-100 hover:border-gray-200"}`}>
                      <input type="checkbox" checked={sel} onChange={() => toggleTile(p.id)} className="accent-[#c9a84c] w-4 h-4 flex-shrink-0" />
                      {p.image && <div className="w-8 h-8 overflow-hidden rounded flex-shrink-0"><img src={p.image} alt={p.name} className="w-full h-full object-cover" /></div>}
                      <div className="min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p><p className="text-[10px] text-gray-400">{p.categoryLabel}</p></div>
                    </label>
                  );
                })}
                {products.length === 0 && <p className="text-xs text-gray-400 col-span-3 p-2">Add tiles first.</p>}
              </div>
              {form.tileIds.length > 0 && <p className="text-xs text-[#c9a84c] font-semibold mt-2">{form.tileIds.length} selected</p>}
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
            <button onClick={save} disabled={saving} className="bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
              {saving ? "Saving…" : editing ? "Save Changes" : "Create Collection"}
            </button>
            <button onClick={cancel} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </div>
      )}

      <Input className="max-w-xs" placeholder="Search collections…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {/* Card grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400 text-sm">No collections yet. Click "Add Collection" to create one.</div>}
        {visible.map((col) => {
          const tiles = products.filter((p) => col.tileIds.includes(p.id));
          return (
            <div key={col.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
              <div className="h-44 bg-gray-100 relative overflow-hidden">
                {col.image
                  ? <img src={col.image} alt={col.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center"><svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg></div>
                }
                {col.featured && <span className="absolute top-3 left-0 bg-[#c9a84c] text-white text-[10px] font-bold px-3 py-1 uppercase">Featured</span>}
                <div className="absolute bottom-3 right-3 bg-[#0a0c12]/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{tiles.length} tiles</div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-1">{col.name}</h3>
                <p className="text-gray-500 text-xs line-clamp-2 mb-3">{col.description}</p>
                {tiles.length > 0 && (
                  <div className="flex gap-1.5 mb-3 flex-wrap">
                    {tiles.slice(0, 5).map((t) => <div key={t.id} className="w-7 h-7 overflow-hidden rounded border border-gray-100" title={t.name}><img src={t.image} alt={t.name} className="w-full h-full object-cover" /></div>)}
                    {tiles.length > 5 && <span className="text-[10px] text-gray-400 self-center">+{tiles.length - 5}</span>}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => openEdit(col)} className="flex-1 text-[#c9a84c] text-xs font-bold py-1.5 border border-[#c9a84c]/30 rounded-lg hover:bg-[#c9a84c]/10 transition-all">Edit</button>
                  <button onClick={() => remove(col.id)} className="flex-1 text-red-400 text-xs font-bold py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-all">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Projects — full CRUD (same capability as admin)
function PortalProjectsSection({ projects, products, reload, showToast }: { projects: Project[]; products: Product[]; reload: () => void; showToast: (m: string) => void; isAdmin: boolean }) {
  const empty = (): Omit<Project, "id"> => ({ title: "", type: "Residential", description: "", gradient: "from-[#1a3a2a] to-[#2d6a4f]", image: "", large: false, tileIds: [], location: "", area: "", year: "" });
  const [editing,  setEditing]  = useState<Project | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<Omit<Project, "id">>(empty());
  const [saving,   setSaving]   = useState(false);

  const setF = <K extends keyof Omit<Project,"id">>(k: K, v: Omit<Project,"id">[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTile = (id: number) => setForm((f) => ({ ...f, tileIds: f.tileIds.includes(id) ? f.tileIds.filter((t) => t !== id) : [...f.tileIds, id] }));

  function openNew()  { setEditing(null); setForm(empty()); setShowForm(true); }
  function openEdit(p: Project) { setEditing(p); setForm({ title: p.title, type: p.type, description: p.description, gradient: p.gradient, image: p.image, large: p.large, tileIds: p.tileIds ?? [], location: p.location, area: p.area, year: p.year }); setShowForm(true); }
  function cancel()   { setEditing(null); setForm(empty()); setShowForm(false); }

  async function save() {
    if (!form.title.trim()) { showToast("Title required"); return; }
    setSaving(true);
    try {
      if (editing) { await api.updateProject(editing.id, form); showToast("Project updated ✓"); }
      else         { await api.createProject(form);              showToast("Project created ✓"); }
      await reload(); cancel();
    } catch { showToast("Save failed"); } finally { setSaving(false); }
  }
  async function remove(id: number) {
    if (!confirm("Delete this project?")) return;
    try { await api.deleteProject(id); await reload(); showToast("Deleted"); }
    catch { showToast("Delete failed"); }
  }

  const types = ["Residential","Commercial","Industrial","Infrastructure","Hospitality","Healthcare","Education","Other"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Projects</h2>
          <p className="text-gray-400 text-sm">{projects.length} in database</p>
        </div>
        <button onClick={openNew} className="bg-[#c9a84c] hover:bg-[#b8943e] text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Add Project
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 text-base mb-5">{editing ? `Editing: ${editing.title}` : "Add Project"}</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setF("title", e.target.value)} placeholder="e.g. Kigali Convention Centre" /></div>
            <div><Label>Type</Label>
              <Select value={form.type} onChange={(e) => setF("type", e.target.value)}>
                {types.map((t) => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setF("location", e.target.value)} placeholder="e.g. Kigali, Rwanda" /></div>
            <div><Label>Area</Label><Input value={form.area} onChange={(e) => setF("area", e.target.value)} placeholder="e.g. 12,000 m²" /></div>
            <div><Label>Year</Label><Input value={form.year} onChange={(e) => setF("year", e.target.value)} placeholder="e.g. 2023" /></div>
            <div className="flex items-center gap-3 pt-5">
              <input id="plarge-portal" type="checkbox" checked={form.large} onChange={(e) => setF("large", e.target.checked)} className="w-4 h-4 accent-[#c9a84c]" />
              <label htmlFor="plarge-portal" className="text-sm font-medium text-gray-700">Hero card</label>
            </div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setF("description", e.target.value)} placeholder="Describe the project…" /></div>
            <div className="sm:col-span-2"><ImageUploader label="Project Image" value={form.image} onChange={(u) => setF("image", u)} /></div>
            <div className="sm:col-span-2">
              <Label>Tiles Used</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto border border-gray-100 rounded-xl p-3 mt-1">
                {products.map((p) => {
                  const sel = form.tileIds.includes(p.id);
                  return (
                    <label key={p.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer border transition-all ${sel ? "border-[#c9a84c] bg-[#c9a84c]/5" : "border-gray-100 hover:border-gray-200"}`}>
                      <input type="checkbox" checked={sel} onChange={() => toggleTile(p.id)} className="accent-[#c9a84c] w-4 h-4 flex-shrink-0" />
                      {p.image && <div className="w-8 h-8 overflow-hidden rounded flex-shrink-0"><img src={p.image} alt={p.name} className="w-full h-full object-cover" /></div>}
                      <div className="min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p><p className="text-[10px] text-gray-400">{p.categoryLabel}</p></div>
                    </label>
                  );
                })}
                {products.length === 0 && <p className="text-xs text-gray-400 col-span-3 p-2">Add tiles first.</p>}
              </div>
              {form.tileIds.length > 0 && <p className="text-xs text-[#c9a84c] font-semibold mt-2">{form.tileIds.length} tile{form.tileIds.length !== 1 ? "s" : ""} selected</p>}
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
            <button onClick={save} disabled={saving} className="bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Project"}
            </button>
            <button onClick={cancel} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* Card grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400 text-sm">No projects yet. Click "Add Project" to create one.</div>}
        {projects.map((p) => {
          const tiles = products.filter((t) => p.tileIds?.includes(t.id));
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
              <div className="h-40 bg-gray-100 relative overflow-hidden">
                {p.image && <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                <span className="absolute top-3 left-3 bg-[#c9a84c] text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider">{p.type}</span>
                {p.large && <span className="absolute top-3 right-3 bg-[#0a0c12] text-[#c9a84c] text-[10px] font-bold px-2.5 py-1">HERO</span>}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-0.5">{p.title}</h3>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mb-2">
                  {p.location && <span>{p.location}</span>}
                  {p.area && <span>{p.area}</span>}
                  {p.year && <span>{p.year}</span>}
                </div>
                {tiles.length > 0 && (
                  <div className="flex gap-1 mb-3">
                    {tiles.slice(0, 4).map((t) => <div key={t.id} className="w-6 h-6 overflow-hidden rounded border border-gray-100" title={t.name}><img src={t.image} alt={t.name} className="w-full h-full object-cover" /></div>)}
                    {tiles.length > 4 && <span className="text-[10px] text-gray-400 self-center ml-1">+{tiles.length - 4}</span>}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => openEdit(p)} className="flex-1 text-[#c9a84c] text-xs font-bold py-1.5 border border-[#c9a84c]/30 rounded-lg hover:bg-[#c9a84c]/10 transition-all">Edit</button>
                  <button onClick={() => remove(p.id)} className="flex-1 text-red-400 text-xs font-bold py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-all">Delete</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Testimonials — list + create + delete
function PortalTestimonialsSection({ testimonials, reload, showToast }: { testimonials: Testimonial[]; reload: () => void; showToast: (m: string) => void }) {
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);
  const blank = (): Testimonial => ({ id: 0, text: "", name: "", role: "", initials: "" });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const { id, ...data } = editing;
      if (id) await api.updateTestimonial(id, data); else await api.createTestimonial(data);
      showToast(id ? "Updated" : "Created"); setEditing(null); reload();
    } finally { setSaving(false); }
  };

  const set = <K extends keyof Testimonial>(k: K, v: Testimonial[K]) =>
    setEditing((t) => t ? { ...t, [k]: v } : t);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Testimonials</h2>
        <button onClick={() => setEditing(blank())} className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8943e] text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          New
        </button>
      </div>
      <div className="space-y-3">
        {testimonials.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#0f1117] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{t.initials}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 italic line-clamp-2">"{t.text}"</p>
              <p className="text-xs font-semibold text-gray-800 mt-1">{t.name} <span className="text-gray-400 font-normal">— {t.role}</span></p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => setEditing(t)} className="p-1.5 text-gray-400 hover:text-[#c9a84c] rounded-lg hover:bg-[#c9a84c]/10 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
              </button>
              <button onClick={async () => { await api.deleteTestimonial(t.id); showToast("Deleted"); reload(); }} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">{editing.id ? "Edit Testimonial" : "New Testimonial"}</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div><Label>Quote</Label><Textarea rows={3} value={editing.text} onChange={(e) => set("text", e.target.value)} placeholder="What the client said…"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Name</Label><Input value={editing.name} onChange={(e) => set("name", e.target.value)}/></div>
                <div><Label>Initials</Label><Input value={editing.initials} onChange={(e) => set("initials", e.target.value)} placeholder="AB" maxLength={3}/></div>
              </div>
              <div><Label>Role / Company</Label><Input value={editing.role} onChange={(e) => set("role", e.target.value)}/></div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={save} disabled={saving || !editing.text || !editing.name}
                className="flex items-center gap-2 px-5 py-2 bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-40 text-white text-sm font-bold rounded-lg">
                {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Users section (admin + canUsers) ────────────────────────────────────────

interface PortalUserRecord {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  canProducts: boolean;
  canCollections: boolean;
  canProjects: boolean;
  canTestimonials: boolean;
  canUsers: boolean;
  createdAt: string;
}

type EditingPortalUser = Omit<PortalUserRecord, "id" | "createdAt"> & { id?: number; password: string };

const PORTAL_PERM_LABELS: { key: keyof PortalUserRecord; label: string }[] = [
  { key: "canProducts",     label: "Tiles / Products" },
  { key: "canCollections",  label: "Collections"      },
  { key: "canProjects",     label: "Projects"         },
  { key: "canTestimonials", label: "Testimonials"     },
  { key: "canUsers",        label: "User Management"  },
];

function PortalToggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div onClick={() => onChange(!checked)} className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-[#c9a84c]" : "bg-gray-200"}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function PortalUsersSection({ reload, showToast }: { reload: () => void; showToast: (m: string) => void }) {
  const [users,    setUsers]    = useState<PortalUserRecord[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<EditingPortalUser | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [pwVisible,setPwVisible]= useState(false);

  const loadUsers = () => {
    setLoading(true);
    fetch("/api/users").then((r) => r.json()).then((d) => { setUsers(d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { loadUsers(); }, []);

  const openNew  = () => setEditing({ name: "", email: "", password: "", role: "staff", active: true, canProducts: true, canCollections: true, canProjects: true, canTestimonials: true, canUsers: false });
  const openEdit = (u: PortalUserRecord) => setEditing({ id: u.id, name: u.name, email: u.email, password: "", role: u.role, active: u.active, canProducts: u.canProducts, canCollections: u.canCollections, canProjects: u.canProjects, canTestimonials: u.canTestimonials, canUsers: u.canUsers });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const isNew = !editing.id;
      const body: Record<string, unknown> = { ...editing };
      if (!isNew && !body.password) delete body.password;
      const res = await fetch(isNew ? "/api/users" : `/api/users/${editing.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); showToast(e.error ?? "Save failed"); }
      else { showToast(isNew ? "User created" : "User updated"); setEditing(null); loadUsers(); reload(); }
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    setDeleting(id);
    try { await fetch(`/api/users/${id}`, { method: "DELETE" }); showToast("User deleted"); loadUsers(); reload(); }
    finally { setDeleting(null); }
  };

  const set = <K extends keyof EditingPortalUser>(k: K, v: EditingPortalUser[K]) =>
    setEditing((prev) => prev ? { ...prev, [k]: v } : prev);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create accounts and control section access for each user.</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8943e] text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          New User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm animate-pulse">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">No users yet. Click "New User" to create one.</div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-5 py-3"/>
            </tr></thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#0f1117] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.name.charAt(0).toUpperCase()}</div>
                      <div><p className="font-semibold text-gray-800">{u.name}</p><p className="text-xs text-gray-400">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${u.role === "admin" ? "bg-[#c9a84c]/15 text-[#a07830]" : "bg-blue-50 text-blue-600"}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${u.active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active ? "bg-emerald-500" : "bg-red-400"}`} />
                      {u.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {PORTAL_PERM_LABELS.filter((p) => u[p.key]).map((p) => (
                        <span key={p.key} className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">{p.label}</span>
                      ))}
                      {PORTAL_PERM_LABELS.filter((p) => u[p.key]).length === 0 && <span className="text-gray-400 text-xs italic">No access</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-[#c9a84c] rounded-lg hover:bg-[#c9a84c]/10 transition-all">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"/></svg>
                      </button>
                      <button onClick={() => remove(u.id)} disabled={deleting === u.id} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all disabled:opacity-40">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-base">{editing.id ? "Edit User" : "Create User"}</h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input value={editing.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Smith"/></div>
                <div><Label>Role</Label>
                  <Select value={editing.role} onChange={(e) => set("role", e.target.value)}>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
              </div>
              <div><Label>Email</Label><Input type="email" value={editing.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@company.com"/></div>
              <div>
                <Label>{editing.id ? "New Password (leave blank to keep)" : "Password"}</Label>
                <div className="relative">
                  <Input type={pwVisible ? "text" : "password"} value={editing.password} onChange={(e) => set("password", e.target.value)} placeholder={editing.id ? "••••••••" : "Min 8 characters"} className="pr-10"/>
                  <button type="button" onClick={() => setPwVisible(!pwVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <PortalToggle checked={editing.active} onChange={(v) => set("active", v)} label="Account active (can log in)" />
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {PORTAL_PERM_LABELS.map((p) => (
                    <div key={p.key} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-700">{p.label}</span>
                      <PortalToggle checked={!!editing[p.key as keyof EditingPortalUser]} onChange={(v) => set(p.key as keyof EditingPortalUser, v as never)} label="" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={save} disabled={saving || !editing.name || !editing.email || (!editing.id && !editing.password)}
                className="flex items-center gap-2 px-5 py-2 bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-40 text-white text-sm font-bold rounded-lg">
                {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
                {saving ? "Saving…" : editing.id ? "Save Changes" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function PortalPage() {
  const [user,    setUser]    = useState<SessionUser | null>(null);
  const [checked, setChecked] = useState(false); // prevent flash on load

  // Try to restore session from cookie on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((u) => { if (u) setUser(u); })
      .finally(() => setChecked(true));
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center">
        <div className="text-white/30 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!user) return <LoginScreen onLogin={setUser} />;

  return <PortalDashboard user={user} onLogout={() => setUser(null)} />;
}

