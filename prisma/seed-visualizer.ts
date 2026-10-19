import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "../lib/generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { ALL_ROOM_SCENES } from "../src/data/scenes";

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

// Base 33 Authentic Mountain Ceramic Tile Products
const MCC_TILES = [
  {
    name: "Agape Beige",
    slug: "agape-beige",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Porcelain",
    colors: ["#d9cbba", "#8c7a6b"],
    image: "/tiles/agape-beige.jpg",
    useCase: "Living rooms, hallways, bathrooms",
    collection: "Agape Collection",
    sizes: "600×600mm & 300×600mm",
    description: "Refined porcelain tile with soft beige tones, subtle veining and durable finish for high-traffic elegance.",
    badge: "Bestseller",
    featured: true,
    variants: [
      { size: "60x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 24000, pricePerBox: 34560, sku: "MCC-AGAPE-BG-6060" },
      { size: "30x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 22000, pricePerBox: 31680, sku: "MCC-AGAPE-BG-3060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 28000, pricePerBox: 40320, sku: "MCC-AGAPE-BG-60120" },
    ],
  },
  {
    name: "Agape Grey",
    slug: "agape-grey",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Porcelain",
    colors: ["#a3a3a3", "#525252"],
    image: "/tiles/agape-grey.jpg",
    useCase: "Living rooms, commercial, bathrooms",
    collection: "Agape Collection",
    sizes: "600×600mm & 600×1200mm",
    description: "Contemporary cool grey porcelain with delicate mineral variations, providing an understated modern backdrop.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 23000, pricePerBox: 33120, sku: "MCC-AGAPE-GR-6060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 27000, pricePerBox: 38880, sku: "MCC-AGAPE-GR-60120" },
    ],
  },
  {
    name: "Apollo Grey",
    slug: "apollo-grey",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Porcelain",
    colors: ["#808080", "#333333"],
    image: "/tiles/apollo-grey.jpg",
    useCase: "Offices, modern living rooms",
    collection: "Apollo Series",
    sizes: "600×600mm",
    description: "Industrial-inspired concrete aesthetic with subtle tonal movement for minimalist architecture.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 21000, pricePerBox: 30240, sku: "MCC-APOLLO-GR-6060" },
    ],
  },
  {
    name: "Aquaria Brown",
    slug: "aquaria-brown",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Natural Stone Look",
    colors: ["#7a5230", "#c29b74"],
    image: "/tiles/aquaria-brown.jpg",
    useCase: "Terraces, kitchens, dining rooms",
    collection: "Aquaria Series",
    sizes: "600×600mm & 300×600mm",
    description: "Deep earthy stone texture blending warm browns and bronze mineral streaks.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "textured", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 23500, pricePerBox: 33840, sku: "MCC-AQUARIA-BR-6060" },
      { size: "30x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 21500, pricePerBox: 30960, sku: "MCC-AQUARIA-BR-3060" },
    ],
  },
  {
    name: "Aquaria Grey",
    slug: "aquaria-grey",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Natural Stone Look",
    colors: ["#70757a", "#3c4043"],
    image: "/tiles/aquaria-grey.jpg",
    useCase: "Bathrooms, living spaces",
    collection: "Aquaria Series",
    sizes: "600×600mm & 600×1200mm",
    description: "Cool slate and river-stone textures with natural stone depth and slip-resistant surface.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 23000, pricePerBox: 33120, sku: "MCC-AQUARIA-GR-6060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 28000, pricePerBox: 40320, sku: "MCC-AQUARIA-GR-60120" },
    ],
  },
  {
    name: "Ash Grey",
    slug: "ash-grey",
    category: "wall",
    categoryLabel: "Wall Tiles",
    material: "Ceramic",
    colors: ["#9e9e9e", "#e0e0e0"],
    image: "/tiles/ash-grey.jpg",
    useCase: "Kitchen walls, bathrooms",
    collection: "Ash Collection",
    sizes: "300×600mm",
    description: "Soft grey ceramic tile crafted specifically for wall cladding with easy-clean glossy and satin options.",
    badge: null,
    featured: false,
    variants: [
      { size: "30x60", finish: "glossy", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 19500, pricePerBox: 28080, sku: "MCC-ASH-GR-3060" },
      { size: "60x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 21000, pricePerBox: 30240, sku: "MCC-ASH-GR-6060" },
    ],
  },
  {
    name: "Ash White",
    slug: "ash-white",
    category: "wall",
    categoryLabel: "Wall Tiles",
    material: "Ceramic",
    colors: ["#f5f5f5", "#cccccc"],
    image: "/tiles/ash-white.jpg",
    useCase: "Kitchens, shower walls, feature walls",
    collection: "Ash Collection",
    sizes: "300×600mm",
    description: "Pristine white ceramic tile with subtle ash undertones, maximizing light in smaller interiors.",
    badge: "Bestseller",
    featured: true,
    variants: [
      { size: "30x60", finish: "glossy", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 19500, pricePerBox: 28080, sku: "MCC-ASH-WH-3060" },
      { size: "60x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 22000, pricePerBox: 31680, sku: "MCC-ASH-WH-6060" },
    ],
  },
  {
    name: "Borgo Beige",
    slug: "borgo-beige",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Porcelain",
    colors: ["#dfd3c3", "#a69580"],
    image: "/tiles/borgo-beige.jpg",
    useCase: "Living rooms, bedrooms",
    collection: "Borgo Series",
    sizes: "600×600mm & 600×1200mm",
    description: "Tuscan-inspired limestone effect bringing timeless Mediterranean warmth to residential floors.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 23500, pricePerBox: 33840, sku: "MCC-BORGO-BG-6060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 27500, pricePerBox: 39600, sku: "MCC-BORGO-BG-60120" },
    ],
  },
  {
    name: "Borgo Brown",
    slug: "borgo-brown",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Porcelain",
    colors: ["#6f4e37", "#a67b5b"],
    image: "/tiles/borgo-brown.jpg",
    useCase: "Corridors, lounges, dining areas",
    collection: "Borgo Series",
    sizes: "600×600mm",
    description: "Rich terracotta-brown stone with rustic edging and high slip resistance.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 22500, pricePerBox: 32400, sku: "MCC-BORGO-BR-6060" },
    ],
  },
  {
    name: "Borgo Grey",
    slug: "borgo-grey",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Porcelain",
    colors: ["#616161", "#9e9e9e"],
    image: "/tiles/borgo-grey.jpg",
    useCase: "Hotels, modern homes, lobbies",
    collection: "Borgo Series",
    sizes: "600×600mm & 600×1200mm",
    description: "Aged architectural stone with gentle mottling, harmonizing with both modern wood and metal accents.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 24000, pricePerBox: 34560, sku: "MCC-BORGO-GR-6060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 28500, pricePerBox: 41040, sku: "MCC-BORGO-GR-60120" },
    ],
  },
  {
    name: "Calacatta Beige",
    slug: "calacatta-beige",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Marble Look Porcelain",
    colors: ["#f7f4ee", "#c4b59d"],
    image: "/tiles/calacatta-beige.jpg",
    useCase: "Bathrooms, luxury living rooms, entries",
    collection: "Calacatta Marble",
    sizes: "600×600mm & 600×1200mm",
    description: "Supreme Italian Calacatta recreation with striking gold-beige ribbons across a warm cream porcelain body.",
    badge: "Premium",
    featured: true,
    variants: [
      { size: "60x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 26000, pricePerBox: 37440, sku: "MCC-CAL-BG-6060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 31000, pricePerBox: 44640, sku: "MCC-CAL-BG-60120" },
      { size: "30x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 24000, pricePerBox: 34560, sku: "MCC-CAL-BG-3060" },
    ],
  },
  {
    name: "Calacatta Grey",
    slug: "calacatta-grey",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Marble Look Porcelain",
    colors: ["#ffffff", "#757575"],
    image: "/tiles/calacatta-grey.jpg",
    useCase: "Luxury master bath, hotel lobbies",
    collection: "Calacatta Marble",
    sizes: "600×600mm & 600×1200mm",
    description: "Classic white marble with high-contrast charcoal veining, mirror-polish reflective sheen.",
    badge: "Bestseller",
    featured: true,
    variants: [
      { size: "60x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 26000, pricePerBox: 37440, sku: "MCC-CAL-GR-6060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 31000, pricePerBox: 44640, sku: "MCC-CAL-GR-60120" },
      { size: "30x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 24000, pricePerBox: 34560, sku: "MCC-CAL-GR-3060" },
    ],
  },
  {
    name: "Calacatta Pink",
    slug: "calacatta-pink",
    category: "special",
    categoryLabel: "Special Finish",
    material: "Marble Look Porcelain",
    colors: ["#fce4ec", "#d81b60"],
    image: "/tiles/calacatta-pink.jpg",
    useCase: "Feature walls, vanity backsplash, boutique spaces",
    collection: "Calacatta Marble",
    sizes: "600×1200mm & 300×600mm",
    description: "Exclusive blush pink marble veining designed to make bold architectural statements in luxury projects.",
    badge: "New",
    featured: true,
    variants: [
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 33000, pricePerBox: 47520, sku: "MCC-CAL-PK-60120" },
      { size: "30x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 27000, pricePerBox: 38880, sku: "MCC-CAL-PK-3060" },
    ],
  },
  {
    name: "Classic Black",
    slug: "classic-black",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Porcelain",
    colors: ["#121212", "#424242"],
    image: "/tiles/classic-black.jpg",
    useCase: "Executive offices, modern baths, statement floors",
    collection: "Prestige Series",
    sizes: "600×600mm & 600×1200mm",
    description: "High-density solid jet black porcelain with micro-crystalline mirror shine.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 25000, pricePerBox: 36000, sku: "MCC-BLK-6060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 30000, pricePerBox: 43200, sku: "MCC-BLK-60120" },
    ],
  },
  {
    name: "Cremino Brown",
    slug: "cremino-brown",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Marble Look",
    colors: ["#5d4037", "#d7ccc8"],
    image: "/tiles/cremino-brown.jpg",
    useCase: "Dining rooms, reception areas",
    collection: "Cremino Collection",
    sizes: "600×600mm & 600×1200mm",
    description: "Warm mocha and cocoa marble blend with soft caramel crystal veins.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 24500, pricePerBox: 35280, sku: "MCC-CREM-BR-6060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 29500, pricePerBox: 42480, sku: "MCC-CREM-BR-60120" },
    ],
  },
  {
    name: "Elm Yellow Wood",
    slug: "elm-yellow-wood",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Wood Look Porcelain",
    colors: ["#c68b59", "#dfba8f"],
    image: "/tiles/elm_yellow_wood.jpg",
    useCase: "Bedrooms, living rooms, studios",
    collection: "Timber Wood Series",
    sizes: "200×1200mm & 300×600mm",
    description: "Warm elm timber reproduction with lifelike wood grain ridges and knot detailing without warping.",
    badge: "New",
    featured: true,
    variants: [
      { size: "20x120", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 6, pricePerSqm: 25000, pricePerBox: 36000, sku: "MCC-WOOD-ELM-20120" },
      { size: "30x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 22000, pricePerBox: 31680, sku: "MCC-WOOD-ELM-3060" },
    ],
  },
  {
    name: "Flam Wood Grey",
    slug: "flam-wood-grey",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Wood Look Porcelain",
    colors: ["#787878", "#a8a8a8"],
    image: "/tiles/flam-wood-grey.jpg",
    useCase: "Modern Scandinavian interiors, bedrooms",
    collection: "Timber Wood Series",
    sizes: "200×1200mm",
    description: "Weathered grey oak plank porcelain tile, perfect for sleek contemporary styling.",
    badge: null,
    featured: false,
    variants: [
      { size: "20x120", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 6, pricePerSqm: 25000, pricePerBox: 36000, sku: "MCC-WOOD-FLAM-20120" },
    ],
  },
  {
    name: "Ganga Stone",
    slug: "ganga-stone",
    category: "outdoor",
    categoryLabel: "Outdoor Tiles",
    material: "Stone Look Porcelain",
    colors: ["#546e7a", "#b0bec5"],
    image: "/tiles/ganga-stone.jpg",
    useCase: "Patios, pool surrounds, outdoor corridors",
    collection: "Nature Stone Series",
    sizes: "600×600mm & 400×400mm",
    description: "Rugged riverbed stone texture engineered for all-weather outdoor durability and R11 slip rating.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "textured", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 22000, pricePerBox: 31680, sku: "MCC-GANGA-6060" },
      { size: "30x60", finish: "textured", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 20000, pricePerBox: 28800, sku: "MCC-GANGA-3060" },
    ],
  },
  {
    name: "Gemini Beige",
    slug: "gemini-beige",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Ceramic",
    colors: ["#e6d5b8", "#a89474"],
    image: "/tiles/gemini-beige.jpg",
    useCase: "Residential living, kitchens",
    collection: "Gemini Collection",
    sizes: "600×600mm",
    description: "Soft travertine look with balanced beige and cream gradients.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 20500, pricePerBox: 29520, sku: "MCC-GEMINI-BG-6060" },
    ],
  },
  {
    name: "Gemini Brown",
    slug: "gemini-brown",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Ceramic",
    colors: ["#6d4c41", "#bcaaa4"],
    image: "/tiles/gemini-brown.jpg",
    useCase: "Warm living spaces, corridors",
    collection: "Gemini Collection",
    sizes: "600×600mm",
    description: "Deep chestnut ceramic tile with rich undertones and hard-wearing glaze.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 20500, pricePerBox: 29520, sku: "MCC-GEMINI-BR-6060" },
    ],
  },
  {
    name: "Kruk Stone White",
    slug: "kruk-stone-white",
    category: "wall",
    categoryLabel: "Wall Tiles",
    material: "Stone Look",
    colors: ["#fafafa", "#9e9e9e"],
    image: "/tiles/kruk-stone-white.jpg",
    useCase: "Bathrooms, exterior facades, accent walls",
    collection: "Krukstone Collection",
    sizes: "300×600mm",
    description: "Textured white limestone look offering architectural tactile depth.",
    badge: null,
    featured: false,
    variants: [
      { size: "30x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 21500, pricePerBox: 30960, sku: "MCC-KRUK-WH-3060" },
    ],
  },
  {
    name: "Krukstone Grey",
    slug: "krukstone-grey",
    category: "outdoor",
    categoryLabel: "Outdoor Tiles",
    material: "Stone Look",
    colors: ["#424242", "#757575"],
    image: "/tiles/krukstone-grey.jpg",
    useCase: "Terraces, walkways, parking zones",
    collection: "Krukstone Collection",
    sizes: "600×600mm",
    description: "Heavy granite aggregate pattern suited for high load bearing and exterior exposure.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "textured", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 22500, pricePerBox: 32400, sku: "MCC-KRUK-GR-6060" },
    ],
  },
  {
    name: "Milano Grey",
    slug: "milano-grey",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Porcelain",
    colors: ["#616161", "#e0e0e0"],
    image: "/tiles/milano-grey.jpg",
    useCase: "Living rooms, retail showrooms",
    collection: "Milano Collection",
    sizes: "600×600mm & 600×1200mm",
    description: "Polished Italian grey terrazzo aesthetic with fine white quartz speckles.",
    badge: "Bestseller",
    featured: true,
    variants: [
      { size: "60x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 25000, pricePerBox: 36000, sku: "MCC-MIL-GR-6060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 29500, pricePerBox: 42480, sku: "MCC-MIL-GR-60120" },
    ],
  },
  {
    name: "Narmanda Brown",
    slug: "narmanda-brown",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Natural Stone Look",
    colors: ["#4e342e", "#8d6e63"],
    image: "/tiles/narmanda-brown.jpg",
    useCase: "Spacious lounges, hotel entrances",
    collection: "Narmanda Series",
    sizes: "600×600mm & 600×1200mm",
    description: "Deep brown marble with gold and quartz fissure veins for an opulent floor finish.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 24500, pricePerBox: 35280, sku: "MCC-NARM-BR-6060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 29000, pricePerBox: 41760, sku: "MCC-NARM-BR-60120" },
    ],
  },
  {
    name: "Oliver Wood",
    slug: "oliver-wood",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Wood Look Porcelain",
    colors: ["#8d5524", "#c68642"],
    image: "/tiles/oliver-wood.jpg",
    useCase: "Living rooms, corridors, home offices",
    collection: "Timber Wood Series",
    sizes: "200×1200mm",
    description: "Golden honey oak plank tile offering the warmth of natural hardwood with porcelain ease.",
    badge: null,
    featured: false,
    variants: [
      { size: "20x120", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 6, pricePerSqm: 25000, pricePerBox: 36000, sku: "MCC-WOOD-OLV-20120" },
    ],
  },
  {
    name: "Rubino Grey",
    slug: "rubino-grey",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Porcelain",
    colors: ["#4a4a4a", "#878787"],
    image: "/tiles/rubino-grey.jpg",
    useCase: "Modern interiors, open-plan homes",
    collection: "Rubino Series",
    sizes: "600×600mm & 600×1200mm",
    description: "Smoky grey cloud marble pattern with subtle pearlescent crystallization.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 24000, pricePerBox: 34560, sku: "MCC-RUB-GR-6060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 28500, pricePerBox: 41040, sku: "MCC-RUB-GR-60120" },
    ],
  },
  {
    name: "Silk Grey",
    slug: "silk-grey",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Silk Finish Porcelain",
    colors: ["#b0bec5", "#eceff1"],
    image: "/tiles/silk-grey.jpg",
    useCase: "Master bedrooms, living rooms",
    collection: "Silk Luxury Series",
    sizes: "600×600mm & 600×1200mm",
    description: "Ultra-smooth satin silk glaze that feels warm underfoot with soft light diffusion.",
    badge: "Premium",
    featured: true,
    variants: [
      { size: "60x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 27000, pricePerBox: 38880, sku: "MCC-SILK-GR-6060" },
      { size: "60x120", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 32000, pricePerBox: 46080, sku: "MCC-SILK-GR-60120" },
    ],
  },
  {
    name: "Silk Brown",
    slug: "silk-brown",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Silk Finish Porcelain",
    colors: ["#795548", "#d7ccc8"],
    image: "/tiles/silk-brown.jpg",
    useCase: "Bedrooms, elegant dining rooms",
    collection: "Silk Luxury Series",
    sizes: "600×600mm",
    description: "Gentle chocolate and caramel satin porcelain with soft touch texture.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 27000, pricePerBox: 38880, sku: "MCC-SILK-BR-6060" },
    ],
  },
  {
    name: "Stone White",
    slug: "stone-white",
    category: "wall",
    categoryLabel: "Wall Tiles",
    material: "Natural Stone Look",
    colors: ["#ffffff", "#cfd8dc"],
    image: "/tiles/stone-white.jpg",
    useCase: "Kitchen backsplash, bathroom walls",
    collection: "Nature Stone Series",
    sizes: "300×600mm",
    description: "Pure white crystallized limestone appearance for clean and luminous vertical surfaces.",
    badge: null,
    featured: false,
    variants: [
      { size: "30x60", finish: "glossy", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 20000, pricePerBox: 28800, sku: "MCC-STONE-WH-3060" },
      { size: "60x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 22000, pricePerBox: 31680, sku: "MCC-STONE-WH-6060" },
    ],
  },
  {
    name: "Tik Wood Brown",
    slug: "tik-wood-brown",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Wood Look Porcelain",
    colors: ["#5c4033", "#8b5a2b"],
    image: "/tiles/tik-wood-brown.jpg",
    useCase: "Living rooms, bedrooms, verandas",
    collection: "Timber Wood Series",
    sizes: "200×1200mm",
    description: "Authentic teak wood planking with rich grain contrast and warm natural patina.",
    badge: "Bestseller",
    featured: true,
    variants: [
      { size: "20x120", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 6, pricePerSqm: 25500, pricePerBox: 36720, sku: "MCC-TIK-BR-20120" },
    ],
  },
  {
    name: "Tik Wood Red",
    slug: "tik-wood-red",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Wood Look Porcelain",
    colors: ["#800000", "#a52a2a"],
    image: "/tiles/tik-wood-red.jpg",
    useCase: "Feature flooring, restaurants, lounges",
    collection: "Timber Wood Series",
    sizes: "200×1200mm",
    description: "Warm African mahogany and red teak tones with deep wood grain embossing.",
    badge: null,
    featured: false,
    variants: [
      { size: "20x120", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 6, pricePerSqm: 25500, pricePerBox: 36720, sku: "MCC-TIK-RD-20120" },
    ],
  },
  {
    name: "Travinto Green",
    slug: "travinto-green",
    category: "special",
    categoryLabel: "Special Finish",
    material: "Travertine Porcelain",
    colors: ["#2e7d32", "#a5d6a7"],
    image: "/tiles/travinto-green.jpg",
    useCase: "Luxury bathrooms, boutique hotels, feature walls",
    collection: "Travinto Series",
    sizes: "600×1200mm & 600×600mm",
    description: "Unique forest green onyx and travertine composite with emerald and jade translucency.",
    badge: "New",
    featured: true,
    variants: [
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 32000, pricePerBox: 46080, sku: "MCC-TRAV-GN-60120" },
      { size: "60x60", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 27000, pricePerBox: 38880, sku: "MCC-TRAV-GN-6060" },
    ],
  },
  {
    name: "Travinto Grey",
    slug: "travinto-grey",
    category: "floor",
    categoryLabel: "Floor Tiles",
    material: "Travertine Porcelain",
    colors: ["#616161", "#bdbdbd"],
    image: "/tiles/travinto-grey.jpg",
    useCase: "Contemporary living, lobbies",
    collection: "Travinto Series",
    sizes: "600×600mm & 600×1200mm",
    description: "Silver travertine with linear cross-cut striations offering subtle architectural rhythm.",
    badge: null,
    featured: false,
    variants: [
      { size: "60x60", finish: "matt", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 24000, pricePerBox: 34560, sku: "MCC-TRAV-GR-6060" },
      { size: "60x120", finish: "polished", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 29000, pricePerBox: 41760, sku: "MCC-TRAV-GR-60120" },
    ],
  },
];

async function main() {
  console.log("🌱 Populating Real Tiles & Visualizer Scenes in Database...");

  // 1. Seed or Update the 6 initial products with variants and inventory
  const initialVariants = [
    { productId: 1, sku: "MCC-TS-6060", size: "60x60", finish: "matt", color: "Sandstone", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 22000, pricePerBox: 31680 },
    { productId: 1, sku: "MCC-TS-8080", size: "80x80", finish: "matt", color: "Sandstone", sqmPerBox: 1.28, piecesPerBox: 2, pricePerSqm: 26000, pricePerBox: 33280 },
    { productId: 2, sku: "MCC-AM-3060", size: "30x60", finish: "glossy", color: "Azure Blue", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 21000, pricePerBox: 30240 },
    { productId: 3, sku: "MCC-OBM-60120", size: "60x120", finish: "polished", color: "Onyx Black", sqmPerBox: 1.44, piecesPerBox: 2, pricePerSqm: 32000, pricePerBox: 46080 },
    { productId: 4, sku: "MCC-GE-4040", size: "40x40", finish: "textured", color: "Greenstone", sqmPerBox: 1.44, piecesPerBox: 9, pricePerSqm: 20000, pricePerBox: 28800 },
    { productId: 4, sku: "MCC-GE-6060", size: "60x60", finish: "textured", color: "Greenstone", sqmPerBox: 1.44, piecesPerBox: 4, pricePerSqm: 23000, pricePerBox: 33120 },
    { productId: 5, sku: "MCC-GMS-3030", size: "30x30", finish: "metallic", color: "Gold Metallic", sqmPerBox: 1.08, piecesPerBox: 12, pricePerSqm: 35000, pricePerBox: 37800 },
    { productId: 6, sku: "MCC-IT-3060", size: "30x60", finish: "matt", color: "Ivory", sqmPerBox: 1.44, piecesPerBox: 8, pricePerSqm: 22000, pricePerBox: 31680 },
  ];

  for (const v of initialVariants) {
    const existing = await prisma.productVariant.findUnique({ where: { sku: v.sku } });
    if (!existing) {
      const prod = await prisma.product.findUnique({ where: { id: v.productId } });
      if (prod) {
        const variant = await prisma.productVariant.create({
          data: {
            productId: v.productId,
            sku: v.sku,
            size: v.size,
            finish: v.finish,
            color: v.color,
            sqmPerBox: v.sqmPerBox,
            piecesPerBox: v.piecesPerBox,
            pricePerSqm: v.pricePerSqm,
            pricePerBox: v.pricePerBox,
            currency: "RWF",
            image: prod.image,
            textureUrl: prod.image,
            active: true,
          },
        });
        await prisma.inventory.upsert({
          where: { variantId: variant.id },
          update: { onHandBoxes: 200 },
          create: { variantId: variant.id, onHandBoxes: 200, reservedBoxes: 0, reorderLevel: 20 },
        });
      }
    }
  }

  // 2. Insert or update the 33 authentic Mountain Ceramic tile collections
  for (const tile of MCC_TILES) {
    let product = await prisma.product.findFirst({ where: { slug: tile.slug } });
    if (!product) {
      product = await prisma.product.create({
        data: {
          name: tile.name,
          slug: tile.slug,
          category: tile.category,
          categoryLabel: tile.categoryLabel,
          description: tile.description,
          sizes: tile.sizes,
          badge: tile.badge,
          gradient: "from-[#2d2d2d] to-[#555555]",
          image: tile.image,
          colors: JSON.stringify(tile.colors),
          useCase: tile.useCase,
          collection: tile.collection,
          material: tile.material,
          featured: tile.featured,
          status: "ACTIVE",
        },
      });
    } else {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          image: tile.image,
          sizes: tile.sizes,
          material: tile.material,
          status: "ACTIVE",
        },
      });
    }

    // Variants for this product
    for (const v of tile.variants) {
      const existingVariant = await prisma.productVariant.findUnique({ where: { sku: v.sku } });
      let variantId: number;
      if (!existingVariant) {
        const createdVariant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: v.sku,
            size: v.size,
            finish: v.finish,
            color: tile.name,
            sqmPerBox: v.sqmPerBox,
            piecesPerBox: v.piecesPerBox,
            pricePerSqm: v.pricePerSqm,
            pricePerBox: v.pricePerBox,
            currency: "RWF",
            image: tile.image,
            textureUrl: tile.image,
            active: true,
          },
        });
        variantId = createdVariant.id;
      } else {
        await prisma.productVariant.update({
          where: { id: existingVariant.id },
          data: {
            image: tile.image,
            textureUrl: tile.image,
            pricePerSqm: v.pricePerSqm,
            pricePerBox: v.pricePerBox,
          },
        });
        variantId = existingVariant.id;
      }

      await prisma.inventory.upsert({
        where: { variantId },
        update: { onHandBoxes: 350 },
        create: {
          variantId,
          onHandBoxes: 350,
          reservedBoxes: 0,
          reorderLevel: 25,
        },
      });
    }
  }
  console.log("✅ Seeded 33 MCC tile products with variants & inventory!");

  // 3. Seed the 15 Visualizer Scenes into the database
  for (let i = 0; i < ALL_ROOM_SCENES.length; i++) {
    const s = ALL_ROOM_SCENES[i];
    const sceneId = i + 1;
    const roomType = s.id.split("_")[0] || "other";

    await prisma.visualizerScene.upsert({
      where: { id: sceneId },
      update: {
        name: s.name,
        roomType: roomType,
        image: s.baseImage,
        thumbnail: s.baseImage,
        surfaces: JSON.stringify(s.surfaces),
        sortOrder: i,
        active: true,
      },
      create: {
        id: sceneId,
        name: s.name,
        roomType: roomType,
        image: s.baseImage,
        thumbnail: s.baseImage,
        surfaces: JSON.stringify(s.surfaces),
        sortOrder: i,
        active: true,
      },
    });
  }
  console.log(`✅ Seeded ${ALL_ROOM_SCENES.length} visualizer room scenes into database!`);

  const prodCount = await prisma.product.count();
  const varCount = await prisma.productVariant.count();
  const sceneCount = await prisma.visualizerScene.count();
  console.log({
    totalProductsInDB: prodCount,
    totalVariantsInDB: varCount,
    totalScenesInDB: sceneCount,
  });
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
