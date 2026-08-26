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

type Section = "dashboard" | "products" | "projects" | "collections" | "testimonials";

const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard",    label: "Dashboard",       icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
  { id: "products",     label: "Tiles / Products", icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 01-1.125-1.125v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z" /></svg> },
  { id: "collections",  label: "Collections",     icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0l-5.571 3-5.571-3" /></svg> },
  { id: "projects",     label: "Projects",        icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m6.75 0V9.75m4.5 11.25V9.75m-4.5-7.5h4.5m-4.5 0v7.5m4.5-7.5v7.5M3 9h6m-6 3h6m-6 3h6" /></svg> },
  { id: "testimonials", label: "Testimonials",    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg> },
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
  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    onChange(await fileToDataURL(f));
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-3 items-start">
        <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-[#c9a84c] bg-gray-50" onClick={() => ref.current?.click()}>
          {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>}
        </div>
        <div className="flex-1">
          <Input placeholder="Paste image URL…" value={value.startsWith("data:") ? "" : value} onChange={(e) => onChange(e.target.value)} />
          <p className="text-xs text-gray-400 mt-1.5">or</p>
          <button type="button" onClick={() => ref.current?.click()} className="mt-1 text-xs text-[#c9a84c] hover:underline font-semibold">Upload from computer</button>
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
  const [toast,    setToast]    = useState<string | null>(null);
  const [loading,  setLoading]  = useState(false);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { if (sessionStorage.getItem("mcc_admin_auth") === "1") setAuthed(true); }, []);

  const reload = async () => {
    setLoading(true);
    try {
      const [p, pr, c, t] = await Promise.all([
        api.getProducts(), api.getProjects(), api.getCollections(), api.getTestimonials(),
      ]);
      setProducts(p); setProjects(pr); setCollections(c); setTestimonials(t);
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
