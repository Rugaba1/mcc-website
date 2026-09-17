"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import Image from "next/image";
import {
  api,
  CATEGORY_OPTIONS,
  BADGE_OPTIONS,
  type Product,
  type Project,
  type Collection,
  type Testimonial,
  type CatalogueDoc,
  type Category,
  type Badge,
} from "@/lib/api";

const ADMIN_PASSWORD = "mcc@admin2024";

const nextId = (arr: { id: number }[]) =>
  arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1;

function fileToDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
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

type Section = "dashboard" | "products" | "projects" | "collections" | "testimonials" | "users" | "catalogue" | "catalogues";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard",    label: "Dashboard",       icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
  { id: "products",     label: "Tiles / Products", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" /></svg> },
  { id: "collections",  label: "Collections",     icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg> },
  { id: "projects",     label: "Projects",        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m6.75 0V9.75m4.5 11.25V9.75m-4.5-7.5h4.5m-4.5 0v7.5m4.5-7.5v7.5M3 9h6m-6 3h6m-6 3h6" /></svg> },
  { id: "testimonials", label: "Testimonials",    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg> },
  { id: "users",        label: "Users",           icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg> },
  { id: "catalogue",    label: "Tile Catalogue",  icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg> },
  { id: "catalogues",   label: "Brochures / PDFs", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
];

// ─── UI primitives ────────────────────────────────────────────────────────────
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

function ImageUploader({ value, onChange, label = "Image" }: { value: string; onChange: (u: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
          className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-[#c9a84c] bg-gray-50 relative"
          onClick={() => !uploading && ref.current?.click()}
        >
          {uploading ? (
            <svg className="w-6 h-6 text-[#c9a84c] animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
          ) : value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
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

// ─── Main admin page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed,   setAuthed]   = useState(false);
  const [pw,       setPw]       = useState("");
  const [pwError,  setPwError]  = useState("");
  const [section,  setSection]  = useState<Section>("dashboard");
  const [sidebar,  setSidebar]  = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [catalogues, setCatalogues] = useState<CatalogueDoc[]>([]);
  const [toast,    setToast]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { if (sessionStorage.getItem("mcc_admin_auth") === "1") setAuthed(true); }, []);

  const reload = async () => {
    setLoading(true);
    try {
      const [p, pr, c, t, cats] = await Promise.all([
        api.getProducts(), api.getProjects(), api.getCollections(), api.getTestimonials(), api.getCatalogues(),
      ]);
      setProducts(p); setProjects(pr); setCollections(c); setTestimonials(t); setCatalogues(cats);
    } catch (e) { console.error(e); showToast("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (authed) reload(); }, [authed]);

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) { sessionStorage.setItem("mcc_admin_auth", "1"); setAuthed(true); }
    else setPwError("Incorrect password.");
  }
  function logout() { sessionStorage.removeItem("mcc_admin_auth"); setAuthed(false); setPw(""); }

  if (!authed) return (
    <div className="min-h-screen bg-[#0a0c12] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-[#0a0c12] p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="relative w-10 h-10"><Image src="/LOGO MOUNTAIN.png" alt="MCC" fill className="object-contain" sizes="40px" /></div>
            <div className="text-left"><p className="font-bold text-white text-sm">Mountain Ceramics</p><p className="text-[#c9a84c] text-[10px] tracking-[0.2em] uppercase">Admin Portal</p></div>
          </div>
        </div>
        <form onSubmit={login} className="p-8 space-y-5">
          <div>
            <Label>Password</Label>
            <input type="password" value={pw} onChange={(e) => { setPw(e.target.value); setPwError(""); }} placeholder="Enter admin password" autoFocus className="w-full border border-gray-200 focus:border-[#c9a84c] bg-gray-50 px-4 py-3 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c9a84c]/20 transition-all" />
            {pwError && <p className="text-red-500 text-xs mt-2">{pwError}</p>}
          </div>
          <button type="submit" className="w-full bg-[#c9a84c] hover:bg-[#a07830] text-white font-bold py-3 rounded-lg text-sm tracking-widest uppercase transition-all">Sign In</button>
          <p className="text-center text-gray-400 text-xs">Admin access only. <a href="/" className="text-[#c9a84c] hover:underline">← Back to website</a></p>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebar ? "w-64" : "w-16"} bg-[#0a0c12] flex-shrink-0 flex flex-col transition-all duration-300 fixed top-0 left-0 h-full z-40`}>
        <div className="h-16 flex items-center gap-3 px-4 border-b border-white/10 flex-shrink-0">
          <div className="relative w-8 h-8 flex-shrink-0"><Image src="/LOGO MOUNTAIN.png" alt="MCC" fill className="object-contain" sizes="32px" /></div>
          {sidebar && <div><p className="font-bold text-white text-sm truncate">MCC Admin</p><p className="text-[#c9a84c] text-[9px] tracking-widest uppercase">Portal</p></div>}
        </div>
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV.map((item) => (
            <button key={item.id} onClick={() => setSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${section === item.id ? "bg-[#c9a84c] text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}>
              <span className="flex-shrink-0">{item.icon}</span>
              {sidebar && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-2">
          <a href="/" target="_blank" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm transition-all">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
            {sidebar && <span>View Site</span>}
          </a>
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
            {sidebar && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={`flex-1 flex flex-col ${sidebar ? "ml-64" : "ml-16"} transition-all duration-300`}>
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebar(!sidebar)} className="text-gray-500 hover:text-gray-700 p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <h1 className="font-semibold text-gray-800 text-sm capitalize">{section}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={reload} disabled={loading} className="text-xs text-gray-400 hover:text-[#c9a84c] font-semibold uppercase tracking-wider transition-colors disabled:opacity-40">
              {loading ? "Loading…" : "↺ Refresh"}
            </button>
            <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />DB Connected</span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {section === "dashboard"    && <DashboardSection products={products} projects={projects} collections={collections} testimonials={testimonials} setSection={setSection} />}
          {section === "products"     && <ProductsSection    products={products}    reload={reload} showToast={showToast} />}
          {section === "collections"  && <CollectionsSection collections={collections} products={products} reload={reload} showToast={showToast} />}
          {section === "projects"     && <ProjectsSection    projects={projects}    products={products} reload={reload} showToast={showToast} />}
          {section === "testimonials" && <TestimonialsSection testimonials={testimonials} reload={reload} showToast={showToast} />}
          {section === "users"        && <UsersSection reload={reload} showToast={showToast} />}
          {section === "catalogue"    && <CatalogueSection products={products} reload={reload} showToast={showToast} />}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0a0c12] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-up">
          <svg className="w-4 h-4 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardSection({ products, projects, collections, testimonials, setSection }: { products: Product[]; projects: Project[]; collections: Collection[]; testimonials: Testimonial[]; setSection: (s: Section) => void }) {
  const stats = [
    { label: "Total Tiles",  value: products.length,     color: "bg-blue-50 text-blue-600",       section: "products"     as Section },
    { label: "Collections",  value: collections.length,  color: "bg-amber-50 text-amber-600",     section: "collections"  as Section },
    { label: "Projects",     value: projects.length,     color: "bg-emerald-50 text-emerald-600", section: "projects"     as Section },
    { label: "Testimonials", value: testimonials.length, color: "bg-purple-50 text-purple-600",   section: "testimonials" as Section },
  ];
  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-bold text-gray-800 mb-1">Welcome back 👋</h2><p className="text-gray-500 text-sm">All changes save to the database and are reflected on the public site immediately.</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <button key={s.label} onClick={() => setSection(s.section)} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md hover:border-[#c9a84c]/30 transition-all text-left group">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${s.color} mb-4`}><span className="text-lg font-bold">{s.value}</span></div>
            <p className="text-gray-500 text-xs font-semibold tracking-wide uppercase">{s.label}</p>
            <p className="text-gray-400 text-xs mt-1 group-hover:text-[#c9a84c] transition-colors">Manage →</p>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-bold text-gray-700 text-sm mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          {[
            { label: "Add Tile",        section: "products"     as Section, color: "bg-blue-500"    },
            { label: "Add Collection",  section: "collections"  as Section, color: "bg-amber-500"   },
            { label: "Add Project",     section: "projects"     as Section, color: "bg-emerald-500" },
            { label: "Add Testimonial", section: "testimonials" as Section, color: "bg-purple-500"  },
          ].map((q) => (
            <button key={q.label} onClick={() => setSection(q.section)} className={`${q.color} hover:opacity-90 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              {q.label}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-700 text-sm">Recent Tiles</h3><button onClick={() => setSection("products")} className="text-[#c9a84c] text-xs hover:underline font-semibold">View all →</button></div>
        <div className="space-y-3">
          {products.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">{p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}</div>
              <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p><p className="text-gray-400 text-xs">{p.categoryLabel} · {p.collection || "No collection"}</p></div>
              {p.badge && <span className="text-[10px] font-bold px-2 py-0.5 bg-[#c9a84c]/10 text-[#a07830] rounded-full flex-shrink-0">{p.badge}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Products section ─────────────────────────────────────────────────────────
function ProductsSection({ products, reload, showToast }: { products: Product[]; reload: () => void; showToast: (m: string) => void }) {
  const empty = (): Omit<Product, "id"> => ({ name: "", category: "floor", categoryLabel: "Floor Tiles", description: "", sizes: "", badge: null, gradient: "from-[#c8b89a] to-[#a0896e]", image: "", colors: [], useCase: "", collection: "", featured: false });
  const [editing, setEditing] = useState<Product | null>(null);
  const [form,    setForm]    = useState<Omit<Product, "id">>(empty());
  const [search,  setSearch]  = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [saving,  setSaving]  = useState(false);

  const setF = <K extends keyof Omit<Product,"id">>(k: K, v: Omit<Product,"id">[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.name.trim()) return alert("Name required.");
    setSaving(true);
    try {
      if (editing) { await api.updateProduct(editing.id, form); showToast("Tile updated ✓"); }
      else         { await api.createProduct(form);              showToast("Tile created ✓"); }
      await reload(); cancel();
    } catch { showToast("Save failed"); } finally { setSaving(false); }
  }
  async function remove(id: number) {
    if (!confirm("Delete this tile?")) return;
    try { await api.deleteProduct(id); await reload(); showToast("Tile deleted"); }
    catch { showToast("Delete failed"); }
  }
  function cancel() { setEditing(null); setForm(empty()); }

  const visible = products.filter((p) => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || p.collection.toLowerCase().includes(search.toLowerCase());
    const mc = filterCat === "all" || p.category === filterCat;
    return ms && mc;
  });
  const colList = [...new Set(products.map((p) => p.collection).filter(Boolean))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-xl font-bold text-gray-800">Tiles / Products</h2><p className="text-gray-400 text-sm">{products.length} tiles in database</p></div>
        <button onClick={() => { cancel(); setForm(empty()); setEditing(null); }} className="bg-[#c9a84c] hover:bg-[#a07830] text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Add Tile
        </button>
      </div>

      {/* Form */}
      {(editing !== null || form.name !== "" || form.image !== "") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 text-base mb-5">{editing ? `Editing: ${editing.name}` : "Add New Tile"}</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div><Label>Tile Name *</Label><Input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. Terrain Sandstone" /></div>
            <div><Label>Collection</Label><Input value={form.collection} onChange={(e) => setF("collection", e.target.value)} placeholder="e.g. Terrain Series" list="col-list" /><datalist id="col-list">{colList.map((c) => <option key={c} value={c} />)}</datalist></div>
            <div><Label>Category</Label>
              <Select value={form.category} onChange={(e) => { const cat = e.target.value as Category; setF("category", cat); setF("categoryLabel", CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? ""); }}>
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
            <div><Label>Badge</Label><Select value={form.badge ?? ""} onChange={(e) => setF("badge", (e.target.value || null) as Badge)}>{BADGE_OPTIONS.map((o) => <option key={String(o.value)} value={o.value ?? ""}>{o.label}</option>)}</Select></div>
            <div><Label>Sizes</Label><Input value={form.sizes} onChange={(e) => setF("sizes", e.target.value)} placeholder="e.g. 600×600mm" /></div>
            <div><Label>Use Case</Label><Input value={form.useCase} onChange={(e) => setF("useCase", e.target.value)} placeholder="e.g. Living rooms, corridors" /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setF("description", e.target.value)} placeholder="Describe this tile…" /></div>
            <div className="sm:col-span-2"><ImageUploader label="Tile Image" value={form.image} onChange={(u) => setF("image", u)} /></div>
            <div><Label>Colors (comma hex)</Label><Input value={form.colors.join(", ")} onChange={(e) => setF("colors", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="#c8b89a, #7a6248" /></div>
            <div className="flex items-center gap-3 pt-5"><input id="feat" type="checkbox" checked={form.featured} onChange={(e) => setF("featured", e.target.checked)} className="w-4 h-4 accent-[#c9a84c]" /><label htmlFor="feat" className="text-sm font-medium text-gray-700">Featured</label></div>
          </div>
          <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
            <button onClick={save} disabled={saving} className="bg-[#c9a84c] hover:bg-[#a07830] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all">{saving ? "Saving…" : editing ? "Save Changes" : "Add Tile"}</button>
            <button onClick={cancel} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Input className="max-w-xs" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="max-w-[180px]" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50">
            <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase w-16">Img</th>
            <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Name</th>
            <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase hidden md:table-cell">Category</th>
            <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase hidden lg:table-cell">Collection</th>
            <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">Badge</th>
            <th className="text-right px-5 py-3 text-xs font-bold text-gray-500 uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {visible.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400 text-sm">No tiles found.</td></tr>}
            {visible.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3"><div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">{p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}</div></td>
                <td className="px-5 py-3 font-semibold text-gray-800">{p.name}</td>
                <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{p.categoryLabel}</td>
                <td className="px-5 py-3 text-gray-500 hidden lg:table-cell">{p.collection || "—"}</td>
                <td className="px-5 py-3">{p.badge && <span className="text-[10px] font-bold px-2 py-0.5 bg-[#c9a84c]/10 text-[#a07830] rounded-full">{p.badge}</span>}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => { setEditing(p); setForm({ ...p }); }} className="text-[#c9a84c] text-xs font-bold px-3 py-1.5 border border-[#c9a84c]/30 rounded-lg hover:bg-[#c9a84c]/10 transition-all">Edit</button>
                    <button onClick={() => remove(p.id)} className="text-red-400 text-xs font-bold px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-all">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Collections section ──────────────────────────────────────────────────────
function CollectionsSection({ collections, products, reload, showToast }: { collections: Collection[]; products: Product[]; reload: () => void; showToast: (m: string) => void }) {
  const empty = (): Omit<Collection, "id"> => ({ name: "", description: "", image: "", tileIds: [], featured: false });
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form,    setForm]    = useState<Omit<Collection, "id">>(empty());
  const [saving,  setSaving]  = useState(false);
  const [search,  setSearch]  = useState("");

  const setF = <K extends keyof Omit<Collection,"id">>(k: K, v: Omit<Collection,"id">[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTile = (id: number) => setForm((f) => ({ ...f, tileIds: f.tileIds.includes(id) ? f.tileIds.filter((t) => t !== id) : [...f.tileIds, id] }));

  async function save() {
    if (!form.name.trim()) return alert("Name required.");
    setSaving(true);
    try {
      if (editing) { await api.updateCollection(editing.id, form); showToast("Collection updated ✓"); }
      else         { await api.createCollection(form);              showToast("Collection created ✓"); }
      await reload(); cancel();
    } catch { showToast("Save failed"); } finally { setSaving(false); }
  }
  async function remove(id: number) {
    if (!confirm("Delete?")) return;
    try { await api.deleteCollection(id); await reload(); showToast("Deleted"); }
    catch { showToast("Delete failed"); }
  }
  function cancel() { setEditing(null); setForm(empty()); }

  const visible = search ? collections.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())) : collections;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-xl font-bold text-gray-800">Collections</h2><p className="text-gray-400 text-sm">{collections.length} in database</p></div>
        <button onClick={() => { cancel(); }} className="bg-[#c9a84c] hover:bg-[#a07830] text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Add Collection
        </button>
      </div>

      {(editing !== null || form.name !== "" || form.image !== "") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 text-base mb-5">{editing ? `Editing: ${editing.name}` : "Add Collection"}</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div><Label>Name *</Label><Input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. Terrain Series" /></div>
            <div className="flex items-center gap-3 pt-5"><input id="cfeat" type="checkbox" checked={form.featured} onChange={(e) => setF("featured", e.target.checked)} className="w-4 h-4 accent-[#c9a84c]" /><label htmlFor="cfeat" className="text-sm font-medium text-gray-700">Featured</label></div>
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
              </div>
              {form.tileIds.length > 0 && <p className="text-xs text-[#c9a84c] font-semibold mt-2">{form.tileIds.length} selected</p>}
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
            <button onClick={save} disabled={saving} className="bg-[#c9a84c] hover:bg-[#a07830] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all">{saving ? "Saving…" : editing ? "Save" : "Create"}</button>
            <button onClick={cancel} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </div>
      )}

      <Input className="max-w-xs" placeholder="Search collections…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400 text-sm">No collections yet.</div>}
        {visible.map((col) => {
          const tiles = products.filter((p) => col.tileIds.includes(p.id));
          return (
            <div key={col.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
              <div className="h-44 bg-gray-100 relative overflow-hidden">
                {col.image ? <img src={col.image} alt={col.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center"><svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg></div>}
                {col.featured && <span className="absolute top-3 left-0 bg-[#c9a84c] text-white text-[10px] font-bold px-3 py-1 uppercase">Featured</span>}
                <div className="absolute bottom-3 right-3 bg-[#0a0c12]/80 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{tiles.length} tiles</div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-1">{col.name}</h3>
                <p className="text-gray-500 text-xs line-clamp-2 mb-3">{col.description}</p>
                {tiles.length > 0 && <div className="flex gap-1.5 mb-3 flex-wrap">{tiles.slice(0, 5).map((t) => <div key={t.id} className="w-7 h-7 overflow-hidden rounded border border-gray-100" title={t.name}><img src={t.image} alt={t.name} className="w-full h-full object-cover" /></div>)}{tiles.length > 5 && <span className="text-[10px] text-gray-400 self-center">+{tiles.length - 5}</span>}</div>}
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(col); setForm({ ...col }); }} className="flex-1 text-[#c9a84c] text-xs font-bold py-1.5 border border-[#c9a84c]/30 rounded-lg hover:bg-[#c9a84c]/10 transition-all">Edit</button>
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

// ─── Projects section ─────────────────────────────────────────────────────────
function ProjectsSection({ projects, products, reload, showToast }: { projects: Project[]; products: Product[]; reload: () => void; showToast: (m: string) => void }) {
  const empty = (): Omit<Project, "id"> => ({ title: "", type: "Residential", description: "", gradient: "from-[#1a3a2a] to-[#2d6a4f]", image: "", large: false, tileIds: [], location: "", area: "", year: "" });
  const [editing, setEditing] = useState<Project | null>(null);
  const [form,    setForm]    = useState<Omit<Project, "id">>(empty());
  const [saving,  setSaving]  = useState(false);

  const setF = <K extends keyof Omit<Project,"id">>(k: K, v: Omit<Project,"id">[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggleTile = (id: number) => setForm((f) => ({ ...f, tileIds: f.tileIds.includes(id) ? f.tileIds.filter((t) => t !== id) : [...f.tileIds, id] }));

  async function save() {
    if (!form.title.trim()) return alert("Title required.");
    setSaving(true);
    try {
      if (editing) { await api.updateProject(editing.id, form); showToast("Project updated ✓"); }
      else         { await api.createProject(form);              showToast("Project created ✓"); }
      await reload(); cancel();
    } catch { showToast("Save failed"); } finally { setSaving(false); }
  }
  async function remove(id: number) {
    if (!confirm("Delete?")) return;
    try { await api.deleteProject(id); await reload(); showToast("Deleted"); }
    catch { showToast("Delete failed"); }
  }
  function cancel() { setEditing(null); setForm(empty()); }

  const types = ["Residential","Commercial","Industrial","Infrastructure","Hospitality","Healthcare","Education","Other"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-xl font-bold text-gray-800">Projects</h2><p className="text-gray-400 text-sm">{projects.length} in database</p></div>
        <button onClick={cancel} className="bg-[#c9a84c] hover:bg-[#a07830] text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Add Project
        </button>
      </div>

      {(editing !== null || form.title !== "" || form.image !== "") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 text-base mb-5">{editing ? `Editing: ${editing.title}` : "Add Project"}</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div><Label>Title *</Label><Input value={form.title} onChange={(e) => setF("title", e.target.value)} placeholder="e.g. Kigali Convention Centre" /></div>
            <div><Label>Type</Label><Select value={form.type} onChange={(e) => setF("type", e.target.value)}>{types.map((t) => <option key={t} value={t}>{t}</option>)}</Select></div>
            <div><Label>Location</Label><Input value={form.location} onChange={(e) => setF("location", e.target.value)} placeholder="e.g. Kigali, Rwanda" /></div>
            <div><Label>Area</Label><Input value={form.area} onChange={(e) => setF("area", e.target.value)} placeholder="e.g. 12,000 m²" /></div>
            <div><Label>Year</Label><Input value={form.year} onChange={(e) => setF("year", e.target.value)} placeholder="e.g. 2023" /></div>
            <div className="flex items-center gap-3 pt-5"><input id="plarge" type="checkbox" checked={form.large} onChange={(e) => setF("large", e.target.checked)} className="w-4 h-4 accent-[#c9a84c]" /><label htmlFor="plarge" className="text-sm font-medium text-gray-700">Hero card</label></div>
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
            <button onClick={save} disabled={saving} className="bg-[#c9a84c] hover:bg-[#a07830] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all">{saving ? "Saving…" : editing ? "Save" : "Add"}</button>
            <button onClick={cancel} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.length === 0 && <div className="col-span-3 text-center py-16 text-gray-400 text-sm">No projects yet.</div>}
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
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 mb-2">{p.location && <span>{p.location}</span>}{p.area && <span>{p.area}</span>}{p.year && <span>{p.year}</span>}</div>
                {tiles.length > 0 && <div className="flex gap-1 mb-3">{tiles.slice(0, 4).map((t) => <div key={t.id} className="w-6 h-6 overflow-hidden rounded border border-gray-100" title={t.name}><img src={t.image} alt={t.name} className="w-full h-full object-cover" /></div>)}{tiles.length > 4 && <span className="text-[10px] text-gray-400 self-center ml-1">+{tiles.length - 4}</span>}</div>}
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(p); setForm({ title: p.title, type: p.type, description: p.description, gradient: p.gradient, image: p.image, large: p.large, tileIds: p.tileIds ?? [], location: p.location, area: p.area, year: p.year }); }} className="flex-1 text-[#c9a84c] text-xs font-bold py-1.5 border border-[#c9a84c]/30 rounded-lg hover:bg-[#c9a84c]/10 transition-all">Edit</button>
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

// ─── Testimonials section ─────────────────────────────────────────────────────
function TestimonialsSection({ testimonials, reload, showToast }: { testimonials: Testimonial[]; reload: () => void; showToast: (m: string) => void }) {
  const empty = (): Omit<Testimonial, "id"> => ({ text: "", name: "", role: "", initials: "" });
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form,    setForm]    = useState<Omit<Testimonial, "id">>(empty());
  const [saving,  setSaving]  = useState(false);

  const setF = <K extends keyof Omit<Testimonial,"id">>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function handleName(name: string) {
    setForm((f) => ({
      ...f,
      name,
      initials: name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join(""),
    }));
  }

  async function save() {
    if (!form.text.trim() || !form.name.trim()) return alert("Text and Name required.");
    setSaving(true);
    try {
      if (editing) { await api.updateTestimonial(editing.id, form); showToast("Updated ✓"); }
      else         { await api.createTestimonial(form);              showToast("Created ✓"); }
      await reload(); cancel();
    } catch { showToast("Save failed"); } finally { setSaving(false); }
  }
  async function remove(id: number) {
    if (!confirm("Delete?")) return;
    try { await api.deleteTestimonial(id); await reload(); showToast("Deleted"); }
    catch { showToast("Delete failed"); }
  }
  function cancel() { setEditing(null); setForm(empty()); }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-xl font-bold text-gray-800">Testimonials</h2><p className="text-gray-400 text-sm">{testimonials.length} in database</p></div>
        <button onClick={cancel} className="bg-[#c9a84c] hover:bg-[#a07830] text-white text-sm font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>Add Testimonial
        </button>
      </div>

      {(editing !== null || form.name !== "" || form.text !== "") && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-800 text-base mb-5">{editing ? `Editing: ${editing.name}` : "Add Testimonial"}</h3>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2"><Label>Review Text *</Label><Textarea rows={4} value={form.text} onChange={(e) => setF("text", e.target.value)} placeholder="What did the client say?" /></div>
            <div><Label>Client Name *</Label><Input value={form.name} onChange={(e) => handleName(e.target.value)} placeholder="e.g. Jean-Marie Nkurunziza" /></div>
            <div><Label>Role / Company</Label><Input value={form.role} onChange={(e) => setF("role", e.target.value)} placeholder="e.g. CEO, Horizon Group" /></div>
            <div><Label>Initials</Label><Input value={form.initials} onChange={(e) => setF("initials", e.target.value)} placeholder="e.g. JM" maxLength={3} /></div>
          </div>
          <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
            <button onClick={save} disabled={saving} className="bg-[#c9a84c] hover:bg-[#a07830] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all">{saving ? "Saving…" : editing ? "Save" : "Add"}</button>
            <button onClick={cancel} className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {testimonials.length === 0 && <div className="col-span-2 text-center py-16 text-gray-400 text-sm">No testimonials yet.</div>}
        {testimonials.map((t) => (
          <div key={t.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#a07830] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{t.initials}</div>
              <div><p className="font-bold text-gray-800 text-sm">{t.name}</p><p className="text-[#c9a84c] text-xs">{t.role}</p></div>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button onClick={() => { setEditing(t); setForm({ text: t.text, name: t.name, role: t.role, initials: t.initials }); }} className="flex-1 text-[#c9a84c] text-xs font-bold py-1.5 border border-[#c9a84c]/30 rounded-lg hover:bg-[#c9a84c]/10 transition-all">Edit</button>
              <button onClick={() => remove(t.id)} className="flex-1 text-red-400 text-xs font-bold py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition-all">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ─── Users section ────────────────────────────────────────────────────────────

interface UserRecord {
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

const PERM_LABELS: { key: keyof UserRecord; label: string }[] = [
  { key: "canProducts",     label: "Tiles / Products" },
  { key: "canCollections",  label: "Collections"      },
  { key: "canProjects",     label: "Projects"         },
  { key: "canTestimonials", label: "Testimonials"     },
  { key: "canUsers",        label: "User Management"  },
];

const emptyUser = (): Omit<UserRecord, "id" | "createdAt"> & { password: string } => ({
  name: "", email: "", password: "", role: "staff", active: true,
  canProducts: true, canCollections: true, canProjects: true,
  canTestimonials: true, canUsers: false,
});

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? "bg-[#c9a84c]" : "bg-gray-200"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <span className="text-sm text-gray-700 group-hover:text-gray-900">{label}</span>
    </label>
  );
}

type EditingUser = Omit<UserRecord, "id" | "createdAt"> & { id?: number; password: string };

function UsersSection({ reload, showToast }: { reload: () => void; showToast: (m: string) => void }) {
  const [users,   setUsers]   = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingUser | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [pwVisible, setPwVisible] = useState(false);

  const load = () => {
    setLoading(true);
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew  = () => setEditing({ ...emptyUser() });
  const openEdit = (u: UserRecord) => setEditing({
    id: u.id, name: u.name, email: u.email, password: "",
    role: u.role, active: u.active,
    canProducts: u.canProducts, canCollections: u.canCollections,
    canProjects: u.canProjects, canTestimonials: u.canTestimonials,
    canUsers: u.canUsers,
  });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const isNew = !editing.id;
      const url    = isNew ? "/api/users" : `/api/users/${editing.id}`;
      const method = isNew ? "POST" : "PUT";

      const body: Record<string, unknown> = { ...editing };
      if (!isNew && !body.password) delete body.password; // don't overwrite if blank

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        showToast(err.error ?? "Save failed");
      } else {
        showToast(isNew ? "User created" : "User updated");
        setEditing(null);
        load();
        reload();
      }
    } finally { setSaving(false); }
  };

  const remove = async (id: number) => {
    setDeleting(id);
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      showToast("User deleted");
      load();
      reload();
    } finally { setDeleting(null); }
  };

  const set = <K extends keyof EditingUser>(k: K, v: EditingUser[K]) =>
    setEditing((prev) => prev ? { ...prev, [k]: v } : prev);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">User Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Create staff accounts and control what each user can access.</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8943e] text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm animate-pulse">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-semibold">No users yet</p>
            <p className="text-gray-400 text-xs mt-1">Click "New User" to create the first staff account.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Permissions</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c9a84c] to-[#0f1117] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${u.role === "admin" ? "bg-[#c9a84c]/15 text-[#a07830]" : "bg-blue-50 text-blue-600"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${u.active ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.active ? "bg-emerald-500" : "bg-red-400"}`} />
                      {u.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {PERM_LABELS.filter((p) => u[p.key]).map((p) => (
                        <span key={p.key} className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {p.label}
                        </span>
                      ))}
                      {PERM_LABELS.filter((p) => u[p.key]).length === 0 && (
                        <span className="text-gray-400 text-xs italic">No access</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => openEdit(u)}
                        className="p-1.5 text-gray-400 hover:text-[#c9a84c] rounded-lg hover:bg-[#c9a84c]/10 transition-all"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => remove(u.id)}
                        disabled={deleting === u.id}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all disabled:opacity-40"
                        title="Delete"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer / modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-base">
                {editing.id ? "Edit User" : "Create User"}
              </h3>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={editing.name} onChange={(e) => set("name", e.target.value)} placeholder="Jane Smith" />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={editing.role} onChange={(e) => set("role", e.target.value)}>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Email</Label>
                <Input type="email" value={editing.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@company.com" />
              </div>

              <div>
                <Label>{editing.id ? "New Password (leave blank to keep)" : "Password"}</Label>
                <div className="relative">
                  <Input
                    type={pwVisible ? "text" : "password"}
                    value={editing.password}
                    onChange={(e) => set("password", e.target.value)}
                    placeholder={editing.id ? "••••••••" : "Min 8 characters"}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setPwVisible(!pwVisible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {pwVisible
                      ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    }
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Toggle
                  checked={editing.active}
                  onChange={(v) => set("active", v)}
                  label="Account active (can log in)"
                />
              </div>

              {/* Permissions */}
              <div>
                <Label>Permissions — what this user can manage</Label>
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
                  {PERM_LABELS.map((p) => (
                    <div key={p.key} className="flex items-center justify-between px-4 py-3">
                      <span className="text-sm text-gray-700">{p.label}</span>
                      <Toggle
                        checked={!!editing[p.key as keyof typeof editing]}
                        onChange={(v) => set(p.key as keyof typeof editing, v as never)}
                        label=""
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Staff with a permission can view and edit that section in the portal. Admins always have full access.
                </p>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving || !editing.name || !editing.email || (!editing.id && !editing.password)}
                className="flex items-center gap-2 px-5 py-2 bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-all"
              >
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

// ─── Catalogue section ────────────────────────────────────────────────────────
function CatalogueSection({ products, reload, showToast }: { products: Product[]; reload: () => void; showToast: (m: string) => void }) {
  const [search,     setSearch]     = useState("");
  const [filterCat,  setFilterCat]  = useState("all");
  const [filterBadge,setFilterBadge]= useState("all");
  const [editing,    setEditing]    = useState<Product | null>(null);

  const filtered = products.filter((p) => {
    const mc = filterCat   === "all" || p.category === filterCat;
    const mb = filterBadge === "all" || p.badge === filterBadge;
    const ms = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return mc && mb && ms;
  });

  const toggleFeatured = async (p: Product) => {
    try {
      await api.updateProduct(p.id, { ...p, featured: !p.featured });
      await reload();
      showToast(p.featured ? "Removed from featured" : "Added to featured ✓");
    } catch { showToast("Update failed"); }
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this tile from the catalogue?")) return;
    try { await api.deleteProduct(id); await reload(); showToast("Tile deleted"); }
    catch { showToast("Delete failed"); }
  };

  const featuredCount = products.filter((p) => p.featured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Catalogue Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {products.length} tiles · {featuredCount} featured ·{" "}
            <a href="/catalogue" target="_blank" className="text-[#c9a84c] hover:underline font-semibold">
              View public catalogue →
            </a>
          </p>
        </div>
        <button
          onClick={() => setEditing({ id: 0, name: "", category: "floor", categoryLabel: "Floor Tiles", description: "", sizes: "", badge: null, gradient: "", image: "", colors: [], useCase: "", collection: "", featured: false })}
          className="flex items-center gap-2 bg-[#c9a84c] hover:bg-[#b8943e] text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/></svg>
          Add to Catalogue
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "All",           key: "all",     count: products.length },
          { label: "Floor",         key: "floor",   count: products.filter((p) => p.category === "floor").length },
          { label: "Wall",          key: "wall",    count: products.filter((p) => p.category === "wall").length },
          { label: "Outdoor",       key: "outdoor", count: products.filter((p) => p.category === "outdoor").length },
          { label: "Special",       key: "special", count: products.filter((p) => p.category === "special").length },
        ].map((s) => (
          <button key={s.key} onClick={() => setFilterCat(s.key)}
            className={`p-3 rounded-xl text-left transition-all border ${filterCat === s.key ? "bg-[#0f1117] border-[#0f1117] text-white" : "bg-white border-gray-100 text-gray-700 hover:border-[#c9a84c]/30"}`}>
            <p className="text-xl font-bold">{s.count}</p>
            <p className="text-xs font-semibold uppercase tracking-wider mt-0.5 opacity-70">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>
          <input type="text" placeholder="Search tiles…" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#c9a84c] bg-gray-50" />
        </div>
        <select value={filterBadge} onChange={(e) => setFilterBadge(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#c9a84c] text-gray-600">
          <option value="all">All badges</option>
          <option value="Bestseller">Bestseller</option>
          <option value="New">New</option>
          <option value="Premium">Premium</option>
        </select>
        <p className="self-center text-xs text-gray-400 flex-shrink-0">{filtered.length} results</p>
      </div>

      {/* Tile grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden group">
            {/* Image */}
            <div className="relative h-40 bg-gray-100 overflow-hidden">
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/></svg>
                </div>
              )}
              {/* Featured star */}
              <button
                onClick={() => toggleFeatured(p)}
                title={p.featured ? "Remove from featured" : "Mark as featured"}
                className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center shadow transition-all ${p.featured ? "bg-[#c9a84c] text-white" : "bg-white/80 text-gray-400 hover:bg-[#c9a84c] hover:text-white"}`}
              >
                <svg className="w-3.5 h-3.5" fill={p.featured ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"/>
                </svg>
              </button>
              {p.badge && (
                <span className={`absolute top-2 left-0 text-[8px] font-bold px-2.5 py-0.5 ${
                  p.badge === "New" ? "bg-emerald-500 text-white"
                  : p.badge === "Premium" ? "bg-[#0f1117] text-[#c9a84c]"
                  : "bg-[#c9a84c] text-white"
                }`}>{p.badge}</span>
              )}
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="text-[#c9a84c] text-[9px] font-bold uppercase tracking-widest mb-0.5">{p.categoryLabel}</p>
              <p className="font-bold text-gray-800 text-sm truncate">{p.name}</p>
              <p className="text-gray-400 text-xs mt-0.5">{p.sizes}</p>
              {p.collection && <p className="text-gray-400 text-[10px] mt-0.5 truncate">Collection: {p.collection}</p>}

              {/* Color swatches */}
              <div className="flex gap-1 mt-2">
                {p.colors.slice(0, 5).map((c, i) => (
                  <span key={i} title={c} className="w-3 h-3 rounded-full border border-gray-200" style={{ background: c }} />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="px-3 pb-3 flex gap-2">
              <button
                onClick={() => setEditing(p)}
                className="flex-1 py-1.5 text-xs font-bold text-gray-600 border border-gray-200 hover:border-[#c9a84c] hover:text-[#c9a84c] rounded-lg transition-all"
              >
                Edit
              </button>
              <a
                href={`/visualizer?tile=${p.id}&autoApply=1`}
                target="_blank"
                className="flex-1 py-1.5 text-xs font-bold text-center text-gray-600 border border-gray-200 hover:border-blue-400 hover:text-blue-500 rounded-lg transition-all"
              >
                Preview
              </a>
              <button
                onClick={() => remove(p.id)}
                className="w-8 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 border border-gray-200 hover:border-red-200 rounded-lg transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          {search || filterCat !== "all" || filterBadge !== "all" ? "No tiles match your filters." : "No tiles in catalogue yet."}
        </div>
      )}

      {/* Edit / Create modal */}
      {editing !== null && (
        <CatalogueEditModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={async () => { await reload(); setEditing(null); showToast(editing.id > 0 ? "Tile updated ✓" : "Tile added to catalogue ✓"); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function CatalogueEditModal({ product, onClose, onSaved, showToast }: {
  product: Product;
  onClose: () => void;
  onSaved: () => void;
  showToast: (m: string) => void;
}) {
  const isNew = product.id === 0;
  const [form, setForm] = useState<Omit<Product, "id">>({
    name: product.name, category: product.category, categoryLabel: product.categoryLabel,
    description: product.description, sizes: product.sizes, badge: product.badge,
    gradient: product.gradient, image: product.image, colors: product.colors,
    useCase: product.useCase, collection: product.collection, featured: product.featured,
  });
  const [saving, setSaving] = useState(false);
  const setF = <K extends keyof Omit<Product, "id">>(k: K, v: Omit<Product, "id">[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { showToast("Name is required"); return; }
    setSaving(true);
    try {
      if (!isNew) await api.updateProduct(product.id, form);
      else        await api.createProduct(form);
      onSaved();
    } catch { showToast("Save failed"); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-800 text-base">{isNew ? "Add to Catalogue" : `Edit: ${product.name}`}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tile Name</Label>
              <Input value={form.name} onChange={(e) => setF("name", e.target.value)} placeholder="e.g. Calacatta Marble" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={form.category} onChange={(e) => {
                const opt = CATEGORY_OPTIONS.find((o) => o.value === e.target.value);
                setF("category", opt!.value); setF("categoryLabel", opt!.label);
              }}>
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sizes</Label>
              <Input value={form.sizes} onChange={(e) => setF("sizes", e.target.value)} placeholder="e.g. 600×600mm, 300×600mm" />
            </div>
            <div>
              <Label>Badge</Label>
              <Select value={form.badge ?? ""} onChange={(e) => setF("badge", (e.target.value || null) as Product["badge"])}>
                {BADGE_OPTIONS.map((o) => <option key={String(o.value)} value={o.value ?? ""}>{o.label}</option>)}
              </Select>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setF("description", e.target.value)} placeholder="Short description of the tile…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Collection tag</Label>
              <Input value={form.collection} onChange={(e) => setF("collection", e.target.value)} placeholder="e.g. Marble Series" />
            </div>
            <div>
              <Label>Use Case</Label>
              <Input value={form.useCase} onChange={(e) => setF("useCase", e.target.value)} placeholder="e.g. Living rooms, lobbies" />
            </div>
          </div>
          <ImageUploader label="Tile Image" value={form.image} onChange={(u) => setF("image", u)} />
          <div>
            <Label>Colors (comma-separated hex)</Label>
            <Input
              value={form.colors.join(", ")}
              onChange={(e) => setF("colors", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="#c8b89a, #7a6248"
            />
            <div className="flex gap-2 mt-2">
              {form.colors.map((c, i) => (
                <span key={i} className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ background: c }} title={c} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input id="cat-feat" type="checkbox" checked={form.featured} onChange={(e) => setF("featured", e.target.checked)} className="w-4 h-4 accent-[#c9a84c]" />
            <label htmlFor="cat-feat" className="text-sm text-gray-700 font-medium">Show as <span className="text-[#c9a84c] font-bold">Featured</span> on the catalogue page</label>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-all">Cancel</button>
          <button onClick={save} disabled={saving || !form.name.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-[#c9a84c] hover:bg-[#b8943e] disabled:opacity-40 text-white text-sm font-bold rounded-lg transition-all">
            {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
            {saving ? "Saving…" : isNew ? "Add to Catalogue" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
