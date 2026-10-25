
import Image from "next/image";
import Link from "next/link";
import { serverApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/pagination-controls";
import ProjectDrawer from "@/components/project-drawer";
import { Product } from "@/lib/generated/prisma";
const PAGE_SIZE = 12
function typeColor(type: string) {
  return type
    ? "bg-secondary text-secondary-foreground"
    : "bg-muted text-muted-foreground";
}

export default async function ProjectsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string, search?: string; page?: string; activeType: string; selectedProject: string }>;
}) {
  const { category, page: pageParam, search, activeType, selectedProject } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", PAGE_SIZE) || 1);
  let totalPages = 1;
  let projects = null
  try {

    projects = await serverApi.getProjects({ activeType: activeType, selectedProject });




  } catch (error) {

  }

  if (!projects) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <p className=" font-semibold text-lg">Projects not found</p>
          <Link href="/catalogue" className=" hover:underline text-sm mt-2 inline-block">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }




  const types = ["All", ...Array.from(new Set(projects.map((p) => p.type)))];
  const filtered = projects

  return (
    <div className="min-h-screen ">



      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="bg-inverse px-6">

        <div className="max-w-7xl mx-auto text-center py-5">
          <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
            <span className="w-8 h-px bg-primary" />
            Our Work
            <span className="w-8 h-px bg-primary" />
          </span>
          <h1 className="font-bold text-4xl md:text-5xl  leading-tight">
            Project Portfolio
          </h1>
          <p className=" text-lg max-w-2xl mx-auto">
            Tiles shaping Rwanda&apos;s most iconic spaces. Click any project to see
            which tiles were used — and visualize them in your own space.
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-10 mt-12">
          {[
            { num: projects.length, label: "Projects" },
            { num: types.length - 1, label: "Sectors" },
            {
              num: projects.reduce((products, project) => {
                if (project?.products !== undefined)
                  return products.concat(project.products as any)
                return products
              }, []).length, label: "Tile Designs"
            },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-playfair text-4xl font-bold ">{s.num}+</div>
              <div className=" text-xs tracking-widest uppercase mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ── Filter tabs ──────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-10">
          {types.map((t, idx) => (
            <Link href={`?activeType=${t}`} key={idx}>
              <Button
                key={t}
                className={`px-5 py-2 text-xs font-bold tracking-widest uppercase transition-all duration-200 ${activeType === t
                  ? "bg-accent text-accent-foreground"
                  : "bg-background text-foreground border border-border hover:bg-muted"
                  }`}
              >
                {t}
              </Button></Link>
          ))}
        </div>

        {/* ── Project grid ────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 ">
            <p className="text-lg mb-3">No projects yet.</p>
            <Link href="/admin" className=" hover:underline text-sm font-semibold">
              Add projects in the Admin Portal →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((proj) => {
              const tiles = proj.products?.map(p => p.product)
              return (
                tiles &&
                <Link href={`?selectedProject=${proj.id}`} key={proj.id}>
                  <button
                    key={proj.id}
                    className=" text-left group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col cursor-pointer"
                  >
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden">
                      <Image
                        src={proj.image}
                        alt={proj.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        unoptimized
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-overlay/70 via-transparent to-transparent" />
                      {/* Type badge */}
                      <span className={`absolute top-4 left-0 ${typeColor(proj.type)} text-[10px] font-bold px-4 py-1.5 uppercase tracking-widest`}>
                        {proj.type}
                      </span>
                      {/* Tile thumbnails on hover */}
                      {tiles.length > 0 && (
                        <div className="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {tiles.slice(0, 3).map((t) => (
                            <div key={t.id} className="w-8 h-8 overflow-hidden rounded-sm border border-border/60">
                              <Image src={t.image} alt={t.name} width={32} height={32} className="object-cover" unoptimized />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-playfair text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                        {proj.title}
                      </h3>
                      <p className=" text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
                        {proj.description}
                      </p>
                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border">
                        {proj.location && (
                          <span className="flex items-center gap-1 text-xs ">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                            </svg>
                            {proj.location}
                          </span>
                        )}
                        {proj.area && (
                          <span className="text-xs ">{proj.area}</span>
                        )}
                        {proj.year && (
                          <span className="text-xs ">{proj.year}</span>
                        )}
                        {tiles.length > 0 && (
                          <span className="ml-auto text-xs font-bold ">
                            {tiles.length} tile{tiles.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </Link>
              );
            })}


          </div>
        )}
      </div>



      {/* ── Project detail drawer ─────────────────────────────── */}
      {selectedProject && (
        <ProjectDrawer
          project={projects.filter(p => p.id == parseInt(selectedProject))[0]}
          products={projects.filter(p => p.id == parseInt(selectedProject))[0]?.products?.map(p => p.product) || []} />
      )}
    </div>
  );
}
