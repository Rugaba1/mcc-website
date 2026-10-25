// ─── Project detail drawer ────────────────────────────────────────────────────
"use client"
import Image from "next/image";
import { Product, Project } from "@/lib/api";
import { Button } from "./ui/button";
import { Link } from "@/app/i18n/routing";
import { Sheet, SheetContent, SheetHeader } from "./ui/sheet";
import { useRouter } from "next/navigation";
function typeColor(type: string) {
    return type
        ? "bg-secondary text-secondary-foreground"
        : "bg-muted text-muted-foreground";
}
export default function ProjectDrawer({
    project,
    products,
}: {
    project: Project;
    products: Product[];
}) {
    const tiles = products
    const wallTiles = tiles.filter((p) => p.category === "wall" || p.category === "special");
    const floorTiles = tiles.filter((p) => p.category === "floor" || p.category === "outdoor");
    const router = useRouter()
    return (
        <Sheet open onOpenChange={(open) => {
            if (!open) router.back()
        }}>
            <SheetContent side="right" className="w-full sm:max-w-2xl">

                <SheetHeader>
                    {/* Header */}
                    <div className="relative h-56 shrink-0">
                        <Image
                            src={project?.image}
                            alt={project?.title}
                            fill
                            className="object-cover"
                            sizes="580px"
                            unoptimized
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-overlay/80 via-overlay/20 to-transparent" />
                        
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                            <span className={`inline-block ${typeColor(project.type)} text-[10px] font-bold px-3 py-1 uppercase tracking-widest mb-2`}>
                                {project.type}
                            </span>
                            <h2 className="font-playfair  font-bold text-2xl leading-tight">{project.title}</h2>
                        </div>
                    </div>
                </SheetHeader>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-7">

                    {/* Meta */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: "Location", val: project.location || "—" },
                            { label: "Area", val: project.area || "—" },
                            { label: "Year", val: project.year || "—" },
                        ].map((m) => (
                            <div key={m.label} className=" p-3 text-center">
                                <p className="text-[10px]  uppercase tracking-widest font-bold mb-1">{m.label}</p>
                                <p className="text-sm font-bold ">{m.val}</p>
                            </div>
                        ))}
                    </div>

                    {/* Description */}
                    <div>
                        <p className=" text-sm leading-relaxed">{project.description}</p>
                    </div>

                    {/* Tiles used */}
                    {tiles.length > 0 ? (
                        <div>
                            <h3 className="text-xs font-bold tracking-[0.2em] uppercase  mb-4">
                                Tiles Used in This Project
                            </h3>

                            {/* Wall tiles */}
                            {wallTiles.length > 0 && (
                                <div className="mb-5">
                                    <p className="text-[10px] font-bold  uppercase tracking-widest mb-2">
                                        Wall Tiles
                                    </p>
                                    <div className="space-y-2">
                                        {wallTiles.map((tile) => (
                                            <TileRow key={tile.id} tile={tile} surface="wall" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Floor tiles */}
                            {floorTiles.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold  uppercase tracking-widest mb-2">
                                        Floor Tiles
                                    </p>
                                    <div className="space-y-2">
                                        {floorTiles.map((tile) => (
                                            <TileRow key={tile.id} tile={tile} surface="floor" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className=" text-sm italic">No tiles linked to this project yet.</p>
                    )}

                    {/* Visualize all tiles CTA */}
                    {tiles.length > 0 && (
                        <div className="pt-2 space-y-2">
                            <p className="text-xs  text-center">See how these tiles look in a room</p>
                            <Link
                                href={`/visualizer?tile=${tiles[0].id}&surface=${tiles[0].category === "wall" || tiles[0].category === "special" ? "wall" : "floor"}&autoApply=1`}
                                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-3.5 text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Visualize These Tiles
                            </Link>
                            <Link
                                href="/contact"
                                className="w-full bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground font-bold py-3.5 text-xs tracking-widest uppercase transition-colors flex items-center justify-center gap-2"
                            >
                                Request Similar Tiles
                            </Link>
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

function TileRow({ tile, surface }: { tile: Product; surface: "wall" | "floor" }) {
    return (
        <div className="flex items-center gap-3  p-2.5 group">
            <div className="relative w-12 h-12 shrink-0 overflow-hidden">
                <Image
                    src={tile?.image}
                    alt={tile?.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold  text-sm truncate">{tile.name}</p>
                <p className=" text-xs">{tile.sizes} · {tile.categoryLabel}</p>
            </div>
            <Link
                href={`/visualizer?tile=${tile.id}&surface=${surface}&autoApply=1`}
                className="shrink-0 bg-accent text-accent-foreground group-hover:bg-primary group-hover:text-primary-foreground text-[9px] font-bold px-3 py-1.5 uppercase tracking-wider transition-colors"
            >
                Try it
            </Link>
        </div>
    );
}