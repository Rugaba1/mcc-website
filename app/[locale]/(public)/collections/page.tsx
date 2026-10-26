
import Image from "next/image";
import Link from "next/link";
import { api, serverApi, type Collection, type Product } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
const PAGE_SIZE = 12
export default async function CollectionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ search?: string; category?: string, page?: string; viewMode?: string; sort?: string, badgeFilter?: string }>;
}) {
  let totalPages = 1;
  const { search, badgeFilter, category, page: pageParam, viewMode, sort, } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1", PAGE_SIZE) || 1);
  let collections = null
  let products: Product[] = []
  try {

    collections = (await serverApi.getCollections())

    const ps = collections.map((p) => p.items?.flatMap((p => p.product)))

    ps.forEach((p) => {
      if (p) products = [...products, ...p]
    })

  } catch (error) {

  }
  if (!collections) {
    return (
      <div className="min-h-screen  flex items-center justify-center">
        <div className="text-center">
          <p className=" font-semibold text-lg">collections not found</p>
          <Link href="/catalogue" className=" hover:underline text-sm mt-2 inline-block">
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }


  const featuredCollections = collections.filter((c) => c.featured);
  const regularCollections = collections.filter((c) => !c.featured);

  return (
    <div className="min-h-screen ">



      <div className="max-w-7xl mx-auto text-center py-5">
        <span className="inline-flex items-center gap-3  text-xs font-bold tracking-[0.25em] uppercase mb-4">
          <span className="w-8 h-px bg-primary" />
          Our Collections
          <span className="w-8 h-px bg-primary" />
        </span>
        <h1 className="font-bold text-4xl md:text-5xl  leading-tight">
          Browse by Collection
        </h1>
        <p className=" text-lg max-w-2xl mx-auto">
          Each collection brings together tiles with a shared design language.
          Select any collection to explore its tiles and visualize them in a real room.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 space-y-20">

        {/* ── Featured collections ─────────────────────────────── */}
        {featuredCollections.length > 0 && (
          <div>
            <h2 className="font-playfair text-3xl font-bold  mb-8">
              Featured Collections
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredCollections.map((col) => (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  products={products}
                  large
                />
              ))}
            </div>
          </div>
        )}

        {/* ── All collections ───────────────────────────────────── */}
        {regularCollections.length > 0 && (
          <div>
            <h2 className="font-playfair text-3xl font-bold  mb-8">
              All Collections
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularCollections.map((col) => (
                <CollectionCard
                  key={col.id}
                  collection={col}
                  products={products}
                />
              ))}
            </div>
          </div>
        )}

        {collections.length === 0 && (
          <div className="text-center py-24 ">
            <p className="text-lg mb-3">No collections yet.</p>
            <Link href="/admin" className=" hover:underline text-sm font-semibold">
              Add collections in the Admin Portal →
            </Link>
          </div>
        )}
      </div>


    </div>
  );
}

// ─── Collection card ──────────────────────────────────────────────────────────

function CollectionCard({
  collection,
  products,
  large = false,
}: {
  collection: Collection;
  products: Product[];
  large?: boolean;
}) {
  const tiles = products.filter((p) => collection.tileIds.includes(p.id));
  const wallTiles = tiles.filter((p) => p.category === "wall" || p.category === "special");
  const floorTiles = tiles.filter((p) => p.category === "floor" || p.category === "outdoor");

  // Build visualizer URLs
  const firstTile = tiles[0];
  const surface = firstTile?.category === "wall" || firstTile?.category === "special" ? "wall" : "floor";
  const visualizerUrl = firstTile
    ? `/visualizer?collection=${encodeURIComponent(collection.name)}&tile=${firstTile.id}&surface=${surface}&autoApply=1`
    : `/visualizer?collection=${encodeURIComponent(collection.name)}`;

  return (
    <div id={`collection-${collection.id}`} className={` group overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col ${large ? "md:flex-row" : ""}`}>

      {/* Image */}
      <div className={`relative overflow-hidden ${large ? "md:w-1/2 min-h-70" : "min-h-55"}`}>
        <Image
          src={collection.image}
          alt={collection.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes={large ? "(max-width: 768px) 100vw, 50vw" : "33vw"}

        />
        <div className="absolute inset-0 bg-linear-to-t from-overlay/60 via-transparent to-transparent" />
        {collection.featured && (
          <Badge className="absolute left-0 top-4 h-auto rounded-none px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest">
            Featured
          </Badge>
        )}
        {/* Tile count badge */}
        <Badge
          variant="outline"
          className="absolute bottom-4 left-4 h-auto border-inverse-border bg-inverse/80 px-3 py-1.5 text-xs font-bold text-inverse-foreground backdrop-blur-sm"
        >
          {tiles.length} tile{tiles.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Content */}
      <div className={`flex flex-col justify-between p-6 ${large ? "md:w-1/2" : ""}`}>
        <div>
          <span className=" text-[10px] font-bold tracking-[0.25em] uppercase mb-2 block">
            Collection
          </span>
          <h3 className="font-playfair text-2xl font-bold  mb-3 group-hover: transition-colors duration-200">
            {collection.name}
          </h3>
          <p className=" text-sm leading-relaxed mb-5">
            {collection.description}
          </p>

          {/* Surface badges */}
          <div className="flex flex-wrap gap-2 mb-5">
            {wallTiles.length > 0 && (
              <Badge variant="outline" className="h-auto gap-1.5 bg-accent/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
                </svg>
                Wall ({wallTiles.length})
              </Badge>
            )}
            {floorTiles.length > 0 && (
              <Badge variant="outline" className="h-auto gap-1.5 bg-accent/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5h16.5" />
                </svg>
                Floor ({floorTiles.length})
              </Badge>
            )}
          </div>

          {/* Tile thumbnails */}
          {tiles.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {tiles.slice(0, 5).map((t) => (
                <div key={t.id} className="relative w-10 h-10 overflow-hidden -2  hover:-primary transition-colors" title={t.name}>
                  <Image
                    src={t.image}
                    alt={t.name}
                    fill
                    className="object-cover"
                    sizes="40px"

                  />
                </div>
              ))}
              {tiles.length > 5 && (
                <div className="w-10 h-10 -2  flex items-center justify-center text-[10px] font-bold ">
                  +{tiles.length - 5}
                </div>
              )}
            </div>
          )}
        </div>


        {/* CTAs */}
        <div className="flex flex-col gap-2">
          <Link
            href={visualizerUrl}
            className="group/btn w-full bg-accent text-accent-foreground hover:bg-background hover:text-foreground font-bold py-3 text-xs tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2.5 border border-border/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Room Visualizer
          </Link>
        </div>
      </div>
    </div>
  );
}
