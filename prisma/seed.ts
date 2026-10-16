import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from '../src/lib/generated/prisma'
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

// Parse mysql://user:pass@host:port/database
const url = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database…");

  // ── Products ──────────────────────────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: "Terrain Sandstone",
        category: "floor",
        categoryLabel: "Floor Tiles",
        description: "Natural sandstone finish. Slip-resistant surface ideal for living areas and corridors.",
        sizes: "600×600mm & 800×800mm",
        badge: "Bestseller",
        gradient: "from-[#c8b89a] to-[#a0896e]",
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
        colors: JSON.stringify(["#c8b89a", "#7a6248", "#e0d5c5"]),
        useCase: "Living rooms, corridors, outdoor terraces",
        collection: "Terrain Series",
        featured: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: "Azure Metro",
        category: "wall",
        categoryLabel: "Wall Tiles",
        description: "Sleek subway-style wall tiles with a high-gloss glaze. Perfect for kitchens and bathrooms.",
        sizes: "300×600mm",
        badge: "New",
        gradient: "from-[#b0c4de] to-[#6a8fc8]",
        image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&q=80",
        colors: JSON.stringify(["#6a8fc8", "#ffffff", "#4a5568"]),
        useCase: "Kitchens, bathrooms, feature walls",
        collection: "Azure Collection",
        featured: false,
      },
    }),
    prisma.product.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: "Onyx Black Marble",
        category: "floor",
        categoryLabel: "Floor Tiles",
        description: "Luxurious polished porcelain with authentic marble veining. Makes any space feel premium.",
        sizes: "600×1200mm",
        badge: null,
        gradient: "from-[#2d2d2d] to-[#555555]",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80",
        colors: JSON.stringify(["#2d2d2d", "#888888"]),
        useCase: "Hotel lobbies, executive offices, premium residences",
        collection: "Onyx Prestige",
        featured: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 4 },
      update: {},
      create: {
        name: "Greenstone Exterior",
        category: "outdoor",
        categoryLabel: "Outdoor Tiles",
        description: "Heavy-duty tiles engineered for outdoor use. UV-resistant, frost-proof, and anti-slip.",
        sizes: "400×400mm & 600×600mm",
        badge: null,
        gradient: "from-[#5a8a5a] to-[#2d5a2d]",
        image: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=600&q=80",
        colors: JSON.stringify(["#5a8a5a", "#8B7355", "#666666"]),
        useCase: "Patios, driveways, pool surrounds, rooftops",
        collection: "Terrain Series",
        featured: false,
      },
    }),
    prisma.product.upsert({
      where: { id: 5 },
      update: {},
      create: {
        name: "Gold Metallic Series",
        category: "special",
        categoryLabel: "Special Finish",
        description: "Metallic-glazed decorative tiles that add a touch of elegance to accent walls and feature areas.",
        sizes: "300×300mm & 600×600mm",
        badge: "Premium",
        gradient: "from-[#d4af37] to-[#a0832a]",
        image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80",
        colors: JSON.stringify(["#d4af37", "#c0c0c0", "#b87333"]),
        useCase: "Accent walls, feature areas, luxury bathrooms",
        collection: "Gold & Ivory Classics",
        featured: true,
      },
    }),
    prisma.product.upsert({
      where: { id: 6 },
      update: {},
      create: {
        name: "Ivory Travertine",
        category: "wall",
        categoryLabel: "Wall Tiles",
        description: "Warm, natural-looking travertine-effect wall tiles. Brings timeless elegance to any room.",
        sizes: "300×600mm & 600×600mm",
        badge: null,
        gradient: "from-[#f5f0e8] to-[#ddd5c0]",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80",
        colors: JSON.stringify(["#f5f0e8", "#d2b48c"]),
        useCase: "Bathrooms, living areas, spa interiors",
        collection: "Gold & Ivory Classics",
        featured: false,
      },
    }),
  ]);

  console.log(`✅ ${products.length} products seeded`);

  // ── Collections ───────────────────────────────────────────────────────────
  const col1 = await prisma.collection.upsert({
    where: { name: "Terrain Series" },
    update: {},
    create: {
      name: "Terrain Series",
      description: "Natural earth-tone finishes inspired by rocky landscapes. Ideal for living spaces, corridors and outdoor areas.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
      featured: true,
    },
  });
  const col2 = await prisma.collection.upsert({
    where: { name: "Azure Collection" },
    update: {},
    create: {
      name: "Azure Collection",
      description: "Cool blues and clean whites — subway-style and metro tiles for kitchens, bathrooms, and feature walls.",
      image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=900&q=80",
      featured: false,
    },
  });
  const col3 = await prisma.collection.upsert({
    where: { name: "Onyx Prestige" },
    update: {},
    create: {
      name: "Onyx Prestige",
      description: "Dark, dramatic surfaces with authentic marble veining. For spaces that demand a premium statement.",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=900&q=80",
      featured: true,
    },
  });
  const col4 = await prisma.collection.upsert({
    where: { name: "Gold & Ivory Classics" },
    update: {},
    create: {
      name: "Gold & Ivory Classics",
      description: "Timeless warmth. Metallic glazes and travertine effects that bring elegance to any interior.",
      image: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=900&q=80",
      featured: false,
    },
  });

  // Link tiles to collections
  await prisma.collectionItem.createMany({
    data: [
      { collectionId: col1.id, productId: 1 },
      { collectionId: col1.id, productId: 4 },
      { collectionId: col2.id, productId: 2 },
      { collectionId: col3.id, productId: 3 },
      { collectionId: col4.id, productId: 5 },
      { collectionId: col4.id, productId: 6 },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Collections seeded");

  // ── Projects ──────────────────────────────────────────────────────────────
  const proj1 = await prisma.project.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: "Kigali Convention Centre Hotel",
      type: "Hospitality",
      description: "Supplied over 12,000 m² of premium floor and wall tiles for the iconic convention centre hotel complex.",
      gradient: "from-[#1a3a2a] to-[#2d6a4f]",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&q=80",
      large: true,
      location: "Kigali, Rwanda",
      area: "12,000 m²",
      year: "2022",
    },
  });
  const proj2 = await prisma.project.upsert({
    where: { id: 2 },
    update: {},
    create: {
      title: "Vision City Mall",
      type: "Commercial",
      description: "8,500 m² of large-format porcelain tiles for Rwanda's premier shopping destination.",
      gradient: "from-[#2c3e70] to-[#4a6fa5]",
      image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=80",
      large: false,
      location: "Kigali, Rwanda",
      area: "8,500 m²",
      year: "2021",
    },
  });
  const proj3 = await prisma.project.upsert({
    where: { id: 3 },
    update: {},
    create: {
      title: "Kimihurura Luxury Villas",
      type: "Residential",
      description: "Custom-designed tiles for 40+ premium villas in Kigali's most prestigious neighbourhood.",
      gradient: "from-[#5a3e1b] to-[#8b6330]",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80",
      large: false,
      location: "Kimihurura, Kigali",
      area: "4,200 m²",
      year: "2023",
    },
  });
  const proj4 = await prisma.project.upsert({
    where: { id: 4 },
    update: {},
    create: {
      title: "Kigali International Airport",
      type: "Infrastructure",
      description: "Heavy-duty floor tiles for Rwanda's flagship international gateway — durable, elegant, and easy to maintain.",
      gradient: "from-[#1a2a3a] to-[#2d4a6a]",
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80",
      large: false,
      location: "Kanombe, Kigali",
      area: "22,000 m²",
      year: "2020",
    },
  });
  const proj5 = await prisma.project.upsert({
    where: { id: 5 },
    update: {},
    create: {
      title: "King Faisal Hospital Expansion",
      type: "Healthcare",
      description: "Antibacterial, easy-clean tiles for clinical areas and patient wards across the hospital expansion.",
      gradient: "from-[#3a1a2a] to-[#6a2d4a]",
      image: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&q=80",
      large: false,
      location: "Kacyiru, Kigali",
      area: "3,800 m²",
      year: "2023",
    },
  });

  // Link tiles to projects
  await prisma.projectTile.createMany({
    data: [
      { projectId: proj1.id, productId: 3 },
      { projectId: proj1.id, productId: 5 },
      { projectId: proj2.id, productId: 1 },
      { projectId: proj2.id, productId: 3 },
      { projectId: proj3.id, productId: 5 },
      { projectId: proj3.id, productId: 6 },
      { projectId: proj4.id, productId: 1 },
      { projectId: proj4.id, productId: 4 },
      { projectId: proj5.id, productId: 2 },
      { projectId: proj5.id, productId: 6 },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Projects seeded");

  // ── Testimonials ──────────────────────────────────────────────────────────
  await prisma.testimonial.createMany({
    skipDuplicates: true,
    data: [
      { text: "MCC tiles transformed our hotel lobby completely. The quality is outstanding and the team was incredibly professional throughout the entire project. We'll never use another supplier.",                                                                                                          name: "Jean-Marie Nkurunziza", role: "CEO, Horizon Hospitality Group",            initials: "JM" },
      { text: "As an architect, I specify tiles for every project. MCC consistently delivers products that match the specs perfectly and arrive on time. Their range is also the best I've seen in East Africa.", name: "Amina Cyusa",            role: "Principal Architect, Cyusa & Associates", initials: "AC" },
      { text: "We used MCC tiles for our entire housing development — 120 units. Not a single quality complaint from any homeowner. The price-to-quality ratio is simply unbeatable in the region.",               name: "Patrick Kalisa",           role: "Director, Kalisa Property Developers",     initials: "PK" },
      { text: "Their design consultation service is a hidden gem. The consultant helped us choose a tile combination that made our restaurant look like it cost twice the budget. Highly recommend!",               name: "Grace Mutoni",             role: "Owner, Terrasse Restaurant, Kigali",       initials: "GM" },
    ],
  });

  console.log("✅ Testimonials seeded");
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
