"use client";

import { useEffect, useState } from "react";
import {
  api, type Product,
  type Project,
  type Collection,
  type Testimonial,
  type CatalogueDoc
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Loader2, User } from "lucide-react";
import Link from "next/link";

 
 

type Section = "dashboard" | "products" | "projects" | "collections" | "testimonials" | "users" | "catalogue" | "catalogues";


 
 

// ─── Main admin page ──────────────────────────────────────────────────────────
export default function AdminPage() {
 
  const [products, setProducts] = useState<Product[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [catalogues, setCatalogues] = useState<CatalogueDoc[]>([]);
  const [loading, setLoading] = useState(false);



  const reload = async () => {
    setLoading(true);
    try {
      const [p, pr, c, t, cats] = await Promise.all([
        api.getProducts(), api.getProjects(), api.getCollections(), api.getTestimonials(), api.getCatalogues(),
      ]);
      setProducts(p.products); setProjects(pr); setCollections(c); setTestimonials(t); setCatalogues(cats);
    } catch (e) { console.error(e); toast.error("Failed to load data"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{reload},[])



  return (
    <div className="min-h-screen  flex">



      {/* Main */}
        
      {loading ? <Loader2 className="animate-spin" /> : <main className="flex-1 p-6 overflow-y-auto">
        <DashboardSection products={products} projects={projects} collections={collections} testimonials={testimonials}   />
      </main>}
      </div>

     
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardSection({ products, projects, collections, testimonials }: { products: Product[]; projects: Project[]; collections: Collection[]; testimonials: Testimonial[];   }) {
  const stats = [
    { label: "Total Tiles", value: products.length, color: "bg-blue-50 text-blue-600", section: "products" as Section },
    { label: "Collections", value: collections.length, color: "bg-primary/10 text-primary/60", section: "collections" as Section },
    { label: "Projects", value: projects.length, color: "bg-emerald-50 text-emerald-600", section: "projects" as Section },
    { label: "Testimonials", value: testimonials.length, color: "bg-purple-50 text-purple-600", section: "testimonials" as Section },
  ];
  const { user } = useAuth();
  return (
    <div className="space-y-8">
      <div><h2 className="text-2xl font-bold text-foreground mb-1">Welcome back {user?.lastName} 👋</h2><p className=" text-sm">All changes save to the database and are reflected on the public site immediately.</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <div key={s.label}  className="  p-6   shadow-sm hover:shadow-md hover:-primary/30 transition-all text-left group">
            <div className={`inline-flex items-center justify-center w-10 h-10   ${s.color} mb-4`}><span className="text-lg font-bold">{s.value}</span></div>
            <p className=" text-xs font-semibold tracking-wide uppercase">{s.label}</p>
            <p className=" text-xs mt-1 group-hover: transition-colors">Manage →</p>
          </div>
        ))}
      </div>
      <div className="   shadow-sm p-6">
        <h3 className="font-bold text-foreground text-sm mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          {[
            { label: "Add Tile", section: "products" as Section, color: "bg-blue-500" },
            { label: "Add Collection", section: "collections" as Section, color: "bg-primary" },
            { label: "Add Project", section: "projects" as Section, color: "bg-emerald-500" },
            { label: "Add Testimonial", section: "testimonials" as Section, color: "bg-purple-500" },
          ].map((q) => (
            <Link key={q.label} href={`/admin/${q.section}`} className={`${q.color} hover:opacity-90  text-sm font-bold py-3 px-4  transition-all flex items-center justify-center gap-2`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              {q.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="  shadow-sm p-6">
        <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-foreground text-sm">Recent Tiles</h3><Link href={"/admin/products"} className=" text-xs hover:underline font-semibold">View all →</Link></div>
        <div className="space-y-3">
          {products.slice(0, 5).map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="w-10 h-10   overflow-hidden  flex-shrink-0">{p.image && <img src={p.image} alt={p.name} className="w-full h-full object-cover" />}</div>
              <div className="flex-1 min-w-0"><p className="font-semibold text-foreground text-sm truncate">{p.name}</p><p className=" text-xs">{p.categoryLabel} · {p.collection || "No collection"}</p></div>
              {p.badge && <span className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary  flex-shrink-0">{p.badge}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

 
 
 

 
 
 