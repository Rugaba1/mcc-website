export interface TileSizeOption {
  id: number;
  size: string;
  sku: string;
  ratio: string;
  specifier: string;
  swatchUrl?: string | null;
  pricePerBox?: number;
  pricePerSqm?: number;
  variantId?: number;
  containerPricePerSqm?: number | null;
  sqmPerContainer?: number | null;
}

export interface TileProduct {
  id: number;
  name: string;
  color: string;
  sku: string;
  specifier: string;
  size: string;
  ratio: string;
  material: string;
  colorCategory: string;
  swatchUrl: string;
  pricePerBox?: number;
  pricePerSqm?: number;
  category?: string;
  description?: string;
  availableSizes: TileSizeOption[];
  containerPricePerSqm?: number | null;
  sqmPerContainer?: number | null;
}

export interface PaintProduct {
  id: number;
  name: string;
  color: string;
  sku: string;
  specifier: string;
  family: string;
  swatchUrl: string;
}

export interface CounterProduct {
  id: number;
  name: string;
  color: string;
  sku: string;
  specifier: string;
  finish: string;
  swatchUrl: string;
}

export interface CabinetProduct {
  id: number;
  name: string;
  color: string;
  sku: string;
  specifier: string;
  swatchUrl: string;
}

export interface GroutColor {
  id: number;
  brand: string;
  color: string;
  sku: string;
  specifier: string;
}

export interface TilePattern {
  id: number;
  name: string;
  ratio: string;
}

export const TILES_CATALOG: TileProduct[] = [
  // {
  //   "id": 2468708,
  //   "name": "Bambusa",
  //   "color": "Beige",
  //   "sku": "^309440",
  //   "specifier": "Best_Tile\\Products\\Bambusa\\Beige_12x24_Fascia()",
  //   "size": "12x24",
  //   "ratio": "1x2",
  //   "material": "PORCELAIN",
  //   "colorCategory": "Beige",
  //   "swatchUrl": "/swatches/8f77e9a7b361c1d198919dc102d552b4.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 2468708,
  //       "size": "12x24",
  //       "sku": "^309440",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Beige_12x24_Fascia()",
  //       "swatchUrl": "/swatches/8f77e9a7b361c1d198919dc102d552b4.jpg"
  //     },
  //     {
  //       "id": 2468709,
  //       "size": "12x24",
  //       "sku": "^309434",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Beige_12x24()",
  //       "swatchUrl": "/swatches/bb31fb2926e696c81c57435747734257.jpg"
  //     },
  //     {
  //       "id": 2468710,
  //       "size": "24x24",
  //       "sku": "^309446",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Beige_Intarsio()",
  //       "swatchUrl": "/swatches/2acc4b29cddf35a9dde03527c23f3995.jpg"
  //     },
  //     {
  //       "id": 2468711,
  //       "size": "2x2 Mosaic",
  //       "sku": "^309458",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Beige_2x2()",
  //       "swatchUrl": "/swatches/740839e2bdc5c4211e4c96ce84c6427e.jpg"
  //     },
  //     {
  //       "id": 2468712,
  //       "size": "9.5x11",
  //       "sku": "^309452",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Beige_Hex()",
  //       "swatchUrl": "/swatches/05cc180fdeaa3a18714d3913a706d5fd.jpg"
  //     },
  //     {
  //       "id": 2468713,
  //       "size": "Losanga Mosaic",
  //       "sku": "^309943",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Beige_Losanga()",
  //       "swatchUrl": "/swatches/e3fc8efdddfdf0a720743b76d4138741.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 2468714,
  //   "name": "Bambusa",
  //   "color": "Bianco",
  //   "sku": "^309441",
  //   "specifier": "Best_Tile\\Products\\Bambusa\\Bianco_12x24_Fascia()",
  //   "size": "12x24",
  //   "ratio": "1x2",
  //   "material": "PORCELAIN",
  //   "colorCategory": "White",
  //   "swatchUrl": "/swatches/a5301b11a26c74ff0beddfe4f5aafe5f.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 2468714,
  //       "size": "12x24",
  //       "sku": "^309441",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Bianco_12x24_Fascia()",
  //       "swatchUrl": "/swatches/a5301b11a26c74ff0beddfe4f5aafe5f.jpg"
  //     },
  //     {
  //       "id": 2468715,
  //       "size": "12x24",
  //       "sku": "^309435",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Bianco_12x24()",
  //       "swatchUrl": "/swatches/9c0d72be8cc0171e2a409fe1aaa2bffd.jpg"
  //     },
  //     {
  //       "id": 2468716,
  //       "size": "24x24",
  //       "sku": "^309447",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Bianco_Intarsio()",
  //       "swatchUrl": "/swatches/c9e7f932c99598f095642c6fb5d39685.jpg"
  //     },
  //     {
  //       "id": 2468717,
  //       "size": "2x2 Mosaic",
  //       "sku": "^309459",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Bianco_2x2()",
  //       "swatchUrl": "/swatches/907555b8525fe2cde68d209942f0807f.jpg"
  //     },
  //     {
  //       "id": 2468718,
  //       "size": "9.5x11",
  //       "sku": "^309453",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Bianco_Hex()",
  //       "swatchUrl": "/swatches/1044db4c9cc5056c966a0aaf317e92c9.jpg"
  //     },
  //     {
  //       "id": 2468719,
  //       "size": "Losanga Mosaic",
  //       "sku": "^309944",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Bianco_Losanga()",
  //       "swatchUrl": "/swatches/fa8fadd0b500ed81ff4aeef258ebf19c.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 2468720,
  //   "name": "Bambusa",
  //   "color": "Crema",
  //   "sku": "^309442",
  //   "specifier": "Best_Tile\\Products\\Bambusa\\Crema_Fascia()",
  //   "size": "12x24",
  //   "ratio": "1x2",
  //   "material": "PORCELAIN",
  //   "colorCategory": "Beige",
  //   "swatchUrl": "/swatches/ffd7c235267f42b5d826401689424811.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 2468720,
  //       "size": "12x24",
  //       "sku": "^309442",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Crema_Fascia()",
  //       "swatchUrl": "/swatches/ffd7c235267f42b5d826401689424811.jpg"
  //     },
  //     {
  //       "id": 2468721,
  //       "size": "12x24",
  //       "sku": "^309436",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Crema_12x24()",
  //       "swatchUrl": "/swatches/3f7331c1126b94ba38814f3288bb487a.jpg"
  //     },
  //     {
  //       "id": 2468722,
  //       "size": "24x24",
  //       "sku": "^309448",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Crema_Intarsio()",
  //       "swatchUrl": "/swatches/40760957d0a005dc4ea3a041fd3de1f2.jpg"
  //     },
  //     {
  //       "id": 2468723,
  //       "size": "2x2 Mosaic",
  //       "sku": "^309460",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Crema_2x2()",
  //       "swatchUrl": "/swatches/a916bdb914ffe92d1172f522d51344ab.jpg"
  //     },
  //     {
  //       "id": 2468724,
  //       "size": "9.5x11",
  //       "sku": "^309454",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Crema__Hex()",
  //       "swatchUrl": "/swatches/1bc5872c8e0f354c1c9ee8aa02822962.jpg"
  //     },
  //     {
  //       "id": 2468725,
  //       "size": "Losanga Mosaic",
  //       "sku": "^309945",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Crema_Losanga()",
  //       "swatchUrl": "/swatches/2aaf5a163c6371e2d37a0515c4457e8d.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 2468726,
  //   "name": "Bambusa",
  //   "color": "Grigio",
  //   "sku": "^309443",
  //   "specifier": "Best_Tile\\Products\\Bambusa\\Grigio_Fascia()",
  //   "size": "12x24",
  //   "ratio": "1x2",
  //   "material": "PORCELAIN",
  //   "colorCategory": "Grey",
  //   "swatchUrl": "/swatches/6fe84c0809c0a6afa5a675daec8bf64c.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 2468726,
  //       "size": "12x24",
  //       "sku": "^309443",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Grigio_Fascia()",
  //       "swatchUrl": "/swatches/6fe84c0809c0a6afa5a675daec8bf64c.jpg"
  //     },
  //     {
  //       "id": 2468727,
  //       "size": "12x24",
  //       "sku": "^309437",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Grigio_12x24()",
  //       "swatchUrl": "/swatches/74812ea135c0e31885383bfe5a178998.jpg"
  //     },
  //     {
  //       "id": 2468728,
  //       "size": "24x24",
  //       "sku": "^309449",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Grigio_Intarsio()",
  //       "swatchUrl": "/swatches/6250671a66039b65188e8e288eea1bd0.jpg"
  //     },
  //     {
  //       "id": 2468729,
  //       "size": "2x2 Mosaic",
  //       "sku": "^309461",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Grigio_2x2()",
  //       "swatchUrl": "/swatches/ff5c9f1686d39170e43c1459c98c2851.jpg"
  //     },
  //     {
  //       "id": 2468730,
  //       "size": "9.5x11",
  //       "sku": "^309455",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Grigio_Hex()",
  //       "swatchUrl": "/swatches/d5145a6536684faab51a14adb85ff44d.jpg"
  //     },
  //     {
  //       "id": 2468731,
  //       "size": "Losanga Mosaic",
  //       "sku": "^309946",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Grigio_Losanga()",
  //       "swatchUrl": "/swatches/afec1caad7cad51335516a5e3241a170.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 2468732,
  //   "name": "Bambusa",
  //   "color": "Tortora",
  //   "sku": "^309444",
  //   "specifier": "Best_Tile\\Products\\Bambusa\\Tortora_Fascia()",
  //   "size": "12x24",
  //   "ratio": "1x2",
  //   "material": "PORCELAIN",
  //   "colorCategory": "Brown",
  //   "swatchUrl": "/swatches/d1307c2cc608726f97378186e2618c3a.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 2468732,
  //       "size": "12x24",
  //       "sku": "^309444",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Tortora_Fascia()",
  //       "swatchUrl": "/swatches/d1307c2cc608726f97378186e2618c3a.jpg"
  //     },
  //     {
  //       "id": 2468733,
  //       "size": "12x24",
  //       "sku": "^309438",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Tortora_12x24()",
  //       "swatchUrl": "/swatches/4ebdee1d719b05a225d2cf78a2c128aa.jpg"
  //     },
  //     {
  //       "id": 2468734,
  //       "size": "24x24",
  //       "sku": "^309450",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Tortora_Intarsio()",
  //       "swatchUrl": "/swatches/7a69e6941820d161140c0973a5b370b7.jpg"
  //     },
  //     {
  //       "id": 2468735,
  //       "size": "2x2 Mosaic",
  //       "sku": "^309462",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Tortora_2x2()",
  //       "swatchUrl": "/swatches/5ac8d0a0808ad6d5addf0535b73f5429.jpg"
  //     },
  //     {
  //       "id": 2468736,
  //       "size": "9.5x11",
  //       "sku": "^309456",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Tortora_Hex()",
  //       "swatchUrl": "/swatches/3bbd5adb861cc7423cab0827c823098a.jpg"
  //     },
  //     {
  //       "id": 2468737,
  //       "size": "Losanga Mosaic",
  //       "sku": "^309947",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Tortora_Losanga()",
  //       "swatchUrl": "/swatches/6ba60f8c1ea640c8c4ffd77fe2c31e14.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 2468742,
  //   "name": "Bambusa",
  //   "color": "Wenge",
  //   "sku": "^309457",
  //   "specifier": "Best_Tile\\Products\\Bambusa\\Wenge_Hex()",
  //   "size": "9.5x11",
  //   "ratio": "Mosaic",
  //   "material": "PORCELAIN",
  //   "colorCategory": "Black",
  //   "swatchUrl": "/swatches/75aec41c575b6f5512d2b3d5e85b178e.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 2468738,
  //       "size": "12x24",
  //       "sku": "^309445",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Wenge_Fascia()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 2468739,
  //       "size": "12x24",
  //       "sku": "^309439",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Wenge_12x24()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 2468740,
  //       "size": "24x24",
  //       "sku": "^309451",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Wenge_Intarsio()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 2468741,
  //       "size": "2x2 Mosaic",
  //       "sku": "^309463",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Wenge_2x2()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 2468742,
  //       "size": "9.5x11",
  //       "sku": "^309457",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Wenge_Hex()",
  //       "swatchUrl": "/swatches/75aec41c575b6f5512d2b3d5e85b178e.jpg"
  //     },
  //     {
  //       "id": 2468743,
  //       "size": "Losanga Mosaic",
  //       "sku": "^309948",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\Bambusa\\Wenge_Losanga()",
  //       "swatchUrl": "/swatches/5135513dca3626b7d31549f54d69266c.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 2707810,
  //   "name": "Atenas",
  //   "color": "Beige",
  //   "sku": "^285984",
  //   "specifier": "Best_Tile\\Products\\Atenas\\Beige_9x48()",
  //   "size": "9x48",
  //   "ratio": "3x16",
  //   "material": "PORCELAIN",
  //   "colorCategory": "Beige",
  //   "swatchUrl": "/swatches/7839fd66ebb9a08f9e276b87a19d29f6.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 2707810,
  //       "size": "9x48",
  //       "sku": "^285984",
  //       "ratio": "3x16",
  //       "specifier": "Best_Tile\\Products\\Atenas\\Beige_9x48()",
  //       "swatchUrl": "/swatches/7839fd66ebb9a08f9e276b87a19d29f6.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 2707812,
  //   "name": "Atenas",
  //   "color": "Gris",
  //   "sku": "^285988",
  //   "specifier": "Best_Tile\\Products\\Atenas\\Gris_9x48()",
  //   "size": "9x48",
  //   "ratio": "3x16",
  //   "material": "PORCELAIN",
  //   "colorCategory": "Grey",
  //   "swatchUrl": "/swatches/a7836c06a09529ecb5f6861aaf3fb53f.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 2707812,
  //       "size": "9x48",
  //       "sku": "^285988",
  //       "ratio": "3x16",
  //       "specifier": "Best_Tile\\Products\\Atenas\\Gris_9x48()",
  //       "swatchUrl": "/swatches/a7836c06a09529ecb5f6861aaf3fb53f.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 2707814,
  //   "name": "Atenas",
  //   "color": "Taupe",
  //   "sku": "^285986",
  //   "specifier": "Best_Tile\\Products\\Atenas\\Taupe_9x48()",
  //   "size": "9x48",
  //   "ratio": "3x16",
  //   "material": "PORCELAIN",
  //   "colorCategory": "Taupe",
  //   "swatchUrl": "/swatches/ab367e6a9a46aceea8cbac0661872d12.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 2707814,
  //       "size": "9x48",
  //       "sku": "^285986",
  //       "ratio": "3x16",
  //       "specifier": "Best_Tile\\Products\\Atenas\\Taupe_9x48()",
  //       "swatchUrl": "/swatches/ab367e6a9a46aceea8cbac0661872d12.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 5668372,
  //   "name": "Aria",
  //   "color": "Beige",
  //   "sku": "ECWAIABEI03",
  //   "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIABEI03()",
  //   "size": "24x24",
  //   "ratio": "1x1",
  //   "material": "Porcelain",
  //   "colorCategory": "Beige",
  //   "swatchUrl": "/swatches/dcb0187606707319d39f603e9c8a475e.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 5668370,
  //       "size": "12x24",
  //       "sku": "ECWAIABEI01",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIABEI01()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 5668371,
  //       "size": "12x24",
  //       "sku": "ECWAIABEI02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIABEI02()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 5668372,
  //       "size": "24x24",
  //       "sku": "ECWAIABEI03",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIABEI03()",
  //       "swatchUrl": "/swatches/dcb0187606707319d39f603e9c8a475e.jpg"
  //     },
  //     {
  //       "id": 5668373,
  //       "size": "24x48",
  //       "sku": "ECWAIABEI04",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIABEI04()",
  //       "swatchUrl": "/swatches/0310722fcb2fc1e0f6964545391059ef.jpg"
  //     },
  //     {
  //       "id": 5668374,
  //       "size": "3.3x3.8",
  //       "sku": "ECWAIABEI05",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIABEI05()",
  //       "swatchUrl": "/swatches/a4512cca50414e1d5a298225c3657056.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 5668377,
  //   "name": "Aria",
  //   "color": "Black",
  //   "sku": "ECWAIABLK03",
  //   "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIABLK03()",
  //   "size": "24x24",
  //   "ratio": "1x1",
  //   "material": "Porcelain",
  //   "colorCategory": "Black",
  //   "swatchUrl": "/swatches/f339088858e1b6cbc53f4f64b14945da.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 5668375,
  //       "size": "12x24",
  //       "sku": "ECWAIABLK01",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIABLK01()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 5668376,
  //       "size": "12x24",
  //       "sku": "ECWAIABLK02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIABLK02()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 5668377,
  //       "size": "24x24",
  //       "sku": "ECWAIABLK03",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIABLK03()",
  //       "swatchUrl": "/swatches/f339088858e1b6cbc53f4f64b14945da.jpg"
  //     },
  //     {
  //       "id": 5668378,
  //       "size": "24x48",
  //       "sku": "ECWAIABLK04",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIABLK04()",
  //       "swatchUrl": "/swatches/19f77680d420bc334e79d793d891f9b9.jpg"
  //     },
  //     {
  //       "id": 5668379,
  //       "size": "3.3x3.8",
  //       "sku": "ECWAIABLK05",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIABLK05()",
  //       "swatchUrl": "/swatches/31f11f558c3b84abe290f4f457b60940.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 5668382,
  //   "name": "Aria",
  //   "color": "Grey",
  //   "sku": "ECWAIAGRY03",
  //   "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAGRY03()",
  //   "size": "24x24",
  //   "ratio": "1x1",
  //   "material": "Porcelain",
  //   "colorCategory": "Grey",
  //   "swatchUrl": "/swatches/fbc3d0aeafdebc12422d5315362db545.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 5668380,
  //       "size": "12x24",
  //       "sku": "ECWAIAGRY01",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAGRY01()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 5668381,
  //       "size": "12x24",
  //       "sku": "ECWAIAGRY02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAGRY02()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 5668382,
  //       "size": "24x24",
  //       "sku": "ECWAIAGRY03",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAGRY03()",
  //       "swatchUrl": "/swatches/fbc3d0aeafdebc12422d5315362db545.jpg"
  //     },
  //     {
  //       "id": 5668383,
  //       "size": "24x48",
  //       "sku": "ECWAIAGRY04",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAGRY04()",
  //       "swatchUrl": "/swatches/c1c5d424dcebaa841f98179bd9f61704.jpg"
  //     },
  //     {
  //       "id": 5668384,
  //       "size": "3.3x3.8",
  //       "sku": "ECWAIAGRY05",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAGRY05()",
  //       "swatchUrl": "/swatches/910a7956435f49d27014127461e005ac.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 5668385,
  //   "name": "Aria",
  //   "color": "Mix",
  //   "sku": "ECWAIAMIX06",
  //   "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAMIX06()",
  //   "size": "1x5.25 Picket Mosaic",
  //   "ratio": "Mosaic",
  //   "material": "Porcelain",
  //   "colorCategory": "Neutral",
  //   "swatchUrl": "/swatches/ddff8fae01e0f9a8b943bbd045581643.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 5668385,
  //       "size": "1x5.25 Picket Mosaic",
  //       "sku": "ECWAIAMIX06",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAMIX06()",
  //       "swatchUrl": "/swatches/ddff8fae01e0f9a8b943bbd045581643.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 5668389,
  //   "name": "Aria",
  //   "color": "White",
  //   "sku": "ECWAIAWHT03",
  //   "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAWHT03()",
  //   "size": "24x24",
  //   "ratio": "1x1",
  //   "material": "Porcelain",
  //   "colorCategory": "White",
  //   "swatchUrl": "/swatches/5f4fec0ab5e192d3e12f1087a327eb6b.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 5668386,
  //       "size": "12x24",
  //       "sku": "ECWAIAWHT01",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAWHT01()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 5668388,
  //       "size": "12x24",
  //       "sku": "ECWAIAWHT02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAWHT02()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 5668389,
  //       "size": "24x24",
  //       "sku": "ECWAIAWHT03",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAWHT03()",
  //       "swatchUrl": "/swatches/5f4fec0ab5e192d3e12f1087a327eb6b.jpg"
  //     },
  //     {
  //       "id": 5668390,
  //       "size": "24x48",
  //       "sku": "ECWAIAWHT04",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAWHT04()",
  //       "swatchUrl": "/swatches/b1eb5f054f1fc185a44f7fc06fa54de8.jpg"
  //     },
  //     {
  //       "id": 5668391,
  //       "size": "3.3x3.8",
  //       "sku": "ECWAIAWHT05",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_April_2025\\ECWAIAWHT05()",
  //       "swatchUrl": "/swatches/4284fd88944a6371f4363646da216ff1.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293445,
  //   "name": "Sagrada",
  //   "color": "Ghiaccio",
  //   "sku": "ECWSAGWHT02",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWSAGWHT02()",
  //   "size": "12x24",
  //   "ratio": "1x2",
  //   "material": "Porcelain",
  //   "colorCategory": "White",
  //   "swatchUrl": "/swatches/c462f5874c72e02fe9306c9be3b58aaf.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293443,
  //       "size": "Mosaic",
  //       "sku": "ECWSAGWHT05",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWSAGWHT05()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 6293444,
  //       "size": "12x12",
  //       "sku": "ECWSAGWHT01",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWSAGWHT01()",
  //       "swatchUrl": null
  //     },
  //     {
  //       "id": 6293445,
  //       "size": "12x24",
  //       "sku": "ECWSAGWHT02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWSAGWHT02()",
  //       "swatchUrl": "/swatches/c462f5874c72e02fe9306c9be3b58aaf.jpg"
  //     },
  //     {
  //       "id": 6293446,
  //       "size": "18x18",
  //       "sku": "ECWSAGWHT03",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWSAGWHT03()",
  //       "swatchUrl": "/swatches/b0d945e4a368c132ddd461ef744c0d10.jpg"
  //     },
  //     {
  //       "id": 6293447,
  //       "size": "Mosaic",
  //       "sku": "ECWSAGWHT04",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWSAGWHT04()",
  //       "swatchUrl": "/swatches/f6b2fa0e73ad869be01dcb2bdde05524.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293448,
  //   "name": "Sagrada",
  //   "color": "Moro",
  //   "sku": "ECWSAGBLK05",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWSAGBLK05()",
  //   "size": "Mosaic",
  //   "ratio": "Mosaic",
  //   "material": "Porcelain",
  //   "colorCategory": "Black",
  //   "swatchUrl": "/swatches/8ff57d2049dbf859124d6a658c56bced.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293448,
  //       "size": "Mosaic",
  //       "sku": "ECWSAGBLK05",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWSAGBLK05()",
  //       "swatchUrl": "/swatches/8ff57d2049dbf859124d6a658c56bced.jpg"
  //     },
  //     {
  //       "id": 6293449,
  //       "size": "12x12",
  //       "sku": "ECWSAGBLK01",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWSAGBLK01()",
  //       "swatchUrl": "/swatches/3aa8d0417fb48f2366a85b99e078c0c7.jpg"
  //     },
  //     {
  //       "id": 6293450,
  //       "size": "12x24",
  //       "sku": "ECWSAGBLK02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWSAGBLK02()",
  //       "swatchUrl": "/swatches/3dda1ef84f8afe0482ee59eaae18e75d.jpg"
  //     },
  //     {
  //       "id": 6293451,
  //       "size": "18x18",
  //       "sku": "ECWSAGBLK03",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWSAGBLK03()",
  //       "swatchUrl": "/swatches/6583baa13868ce16bcf9ed0feb86feb5.jpg"
  //     },
  //     {
  //       "id": 6293452,
  //       "size": "Mosaic",
  //       "sku": "ECWSAGBLK04",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWSAGBLK04()",
  //       "swatchUrl": "/swatches/ddd5d130fa1d4776a4c812460a14f45b.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293453,
  //   "name": "Wellfleet",
  //   "color": "Abyss",
  //   "sku": "ECWWELABY01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELABY01()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Black",
  //   "swatchUrl": "/swatches/a70ada393ebacefe2b12c2344040cb9a.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293453,
  //       "size": "2x6.5",
  //       "sku": "ECWWELABY01",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELABY01()",
  //       "swatchUrl": "/swatches/a70ada393ebacefe2b12c2344040cb9a.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293454,
  //   "name": "Wellfleet",
  //   "color": "Azure",
  //   "sku": "ECWWELAZU01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELAZU01()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Blue",
  //   "swatchUrl": "/swatches/775f88ccffbe574c4405533363e18216.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293454,
  //       "size": "2x6.5",
  //       "sku": "ECWWELAZU01",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELAZU01()",
  //       "swatchUrl": "/swatches/775f88ccffbe574c4405533363e18216.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293455,
  //   "name": "Wellfleet",
  //   "color": "Blanc",
  //   "sku": "ECWWELBNC04",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELBNC04()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "White",
  //   "swatchUrl": "/swatches/9998f19f6e51bdf2de6b37a91b6d9bdb.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293455,
  //       "size": "2x6.5",
  //       "sku": "ECWWELBNC04",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELBNC04()",
  //       "swatchUrl": "/swatches/9998f19f6e51bdf2de6b37a91b6d9bdb.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293456,
  //   "name": "Wellfleet",
  //   "color": "Cityscape",
  //   "sku": "ECWWELCTY04",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELCTY04()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Blue, Green, Grey",
  //   "swatchUrl": "/swatches/67cfad2a971dc72d8b7127864075081a.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293456,
  //       "size": "2x6.5",
  //       "sku": "ECWWELCTY04",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELCTY04()",
  //       "swatchUrl": "/swatches/67cfad2a971dc72d8b7127864075081a.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293457,
  //   "name": "Wellfleet",
  //   "color": "Claytone",
  //   "sku": "ECWWELCLY01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELCLY01()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Orange",
  //   "swatchUrl": "/swatches/234ac7cab3bf98ba9ebd98c0a2d76646.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293457,
  //       "size": "2x6.5",
  //       "sku": "ECWWELCLY01",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELCLY01()",
  //       "swatchUrl": "/swatches/234ac7cab3bf98ba9ebd98c0a2d76646.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293458,
  //   "name": "Wellfleet",
  //   "color": "Dune",
  //   "sku": "ECWWELDUN04",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELDUN04()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Ivory",
  //   "swatchUrl": "/swatches/9260e3d06233dfadbe7d5a09a78be057.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293458,
  //       "size": "2x6.5",
  //       "sku": "ECWWELDUN04",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELDUN04()",
  //       "swatchUrl": "/swatches/9260e3d06233dfadbe7d5a09a78be057.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293459,
  //   "name": "Wellfleet",
  //   "color": "Earth",
  //   "sku": "ECWWELEAR04",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELEAR04()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Orange",
  //   "swatchUrl": "/swatches/3edc2f573482c7d2af471f2ceee913ea.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293459,
  //       "size": "2x6.5",
  //       "sku": "ECWWELEAR04",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELEAR04()",
  //       "swatchUrl": "/swatches/3edc2f573482c7d2af471f2ceee913ea.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293460,
  //   "name": "Wellfleet",
  //   "color": "Fog",
  //   "sku": "ECWWELFOG04",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELFOG04()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Grey",
  //   "swatchUrl": "/swatches/2e137a883c6a727505ac3c5b74b56e33.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293460,
  //       "size": "2x6.5",
  //       "sku": "ECWWELFOG04",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELFOG04()",
  //       "swatchUrl": "/swatches/2e137a883c6a727505ac3c5b74b56e33.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293461,
  //   "name": "Wellfleet",
  //   "color": "Forest",
  //   "sku": "ECWWELFOR01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELFOR01()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Green",
  //   "swatchUrl": "/swatches/449e2528b99f04ecc6b64876371823a0.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293461,
  //       "size": "2x6.5",
  //       "sku": "ECWWELFOR01",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELFOR01()",
  //       "swatchUrl": "/swatches/449e2528b99f04ecc6b64876371823a0.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293462,
  //   "name": "Wellfleet",
  //   "color": "Garden",
  //   "sku": "ECWWELGAR04",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELGAR04()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Green",
  //   "swatchUrl": "/swatches/c9952f8ff6d43c5f558e8b13a260975c.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293462,
  //       "size": "2x6.5",
  //       "sku": "ECWWELGAR04",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELGAR04()",
  //       "swatchUrl": "/swatches/c9952f8ff6d43c5f558e8b13a260975c.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293463,
  //   "name": "Wellfleet",
  //   "color": "Ivory Glow",
  //   "sku": "ECWWELIVR01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELIVR01()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Ivory",
  //   "swatchUrl": "/swatches/565f255362a369d1667bfc52ca0a60cf.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293463,
  //       "size": "2x6.5",
  //       "sku": "ECWWELIVR01",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELIVR01()",
  //       "swatchUrl": "/swatches/565f255362a369d1667bfc52ca0a60cf.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293464,
  //   "name": "Wellfleet",
  //   "color": "Jade",
  //   "sku": "ECWWELJAD01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELJAD01()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Green",
  //   "swatchUrl": "/swatches/4c50189b0335615b087fab396dcb0e37.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293464,
  //       "size": "2x6.5",
  //       "sku": "ECWWELJAD01",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELJAD01()",
  //       "swatchUrl": "/swatches/4c50189b0335615b087fab396dcb0e37.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293465,
  //   "name": "Wellfleet",
  //   "color": "Midnight",
  //   "sku": "ECWWELMID04",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELMID04()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Black",
  //   "swatchUrl": "/swatches/00377cd4265431805363913a60e5b9db.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293465,
  //       "size": "2x6.5",
  //       "sku": "ECWWELMID04",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELMID04()",
  //       "swatchUrl": "/swatches/00377cd4265431805363913a60e5b9db.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293466,
  //   "name": "Wellfleet",
  //   "color": "Mint",
  //   "sku": "ECWWELMNT01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELMNT01()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Green",
  //   "swatchUrl": "/swatches/8bcb2c315a6264f21f9036fae130ad2e.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293466,
  //       "size": "2x6.5",
  //       "sku": "ECWWELMNT01",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELMNT01()",
  //       "swatchUrl": "/swatches/8bcb2c315a6264f21f9036fae130ad2e.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293467,
  //   "name": "Wellfleet",
  //   "color": "Ocean",
  //   "sku": "ECWWELOCN04",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELOCN04()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Blue",
  //   "swatchUrl": "/swatches/33d76c22f4f74d731b80cf74d3959653.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293467,
  //       "size": "2x6.5",
  //       "sku": "ECWWELOCN04",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELOCN04()",
  //       "swatchUrl": "/swatches/33d76c22f4f74d731b80cf74d3959653.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293468,
  //   "name": "Wellfleet",
  //   "color": "Ocean Mist",
  //   "sku": "ECWWELOCM04",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELOCM04()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Green",
  //   "swatchUrl": "/swatches/9a68a0fb0d34615f7e296465c92b7d3d.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293468,
  //       "size": "2x6.5",
  //       "sku": "ECWWELOCM04",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELOCM04()",
  //       "swatchUrl": "/swatches/9a68a0fb0d34615f7e296465c92b7d3d.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293469,
  //   "name": "Wellfleet",
  //   "color": "Oxide",
  //   "sku": "ECWWELOXI04",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELOXI04()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Red",
  //   "swatchUrl": "/swatches/22f48ae12a6901876881ffb6e04844e1.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293469,
  //       "size": "2x6.5",
  //       "sku": "ECWWELOXI04",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELOXI04()",
  //       "swatchUrl": "/swatches/22f48ae12a6901876881ffb6e04844e1.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293470,
  //   "name": "Wellfleet",
  //   "color": "Sea Glass",
  //   "sku": "ECWWELSGL04",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELSGL04()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Green",
  //   "swatchUrl": "/swatches/4910530de52e80f8a4bf0c71e3a9d934.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293470,
  //       "size": "2x6.5",
  //       "sku": "ECWWELSGL04",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELSGL04()",
  //       "swatchUrl": "/swatches/4910530de52e80f8a4bf0c71e3a9d934.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293471,
  //   "name": "Wellfleet",
  //   "color": "Vivid Ruby",
  //   "sku": "ECWWELVRB01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELVRB01()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Red",
  //   "swatchUrl": "/swatches/74da4de4777911812ed9bda35104124d.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293471,
  //       "size": "2x6.5",
  //       "sku": "ECWWELVRB01",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELVRB01()",
  //       "swatchUrl": "/swatches/74da4de4777911812ed9bda35104124d.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293472,
  //   "name": "Wellfleet",
  //   "color": "Water",
  //   "sku": "ECWWELWAT04",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELWAT04()",
  //   "size": "2x6.5",
  //   "ratio": "1x3",
  //   "material": "Ceramic",
  //   "colorCategory": "Blue",
  //   "swatchUrl": "/swatches/e0b4d680adcb54bcc5fd2bb0e2c58ee5.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293472,
  //       "size": "2x6.5",
  //       "sku": "ECWWELWAT04",
  //       "ratio": "1x3",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWWELWAT04()",
  //       "swatchUrl": "/swatches/e0b4d680adcb54bcc5fd2bb0e2c58ee5.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293473,
  //   "name": "Majestic",
  //   "color": "Caramel",
  //   "sku": "ECWMAJBEI01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJBEI01()",
  //   "size": "12x12",
  //   "ratio": "1x1",
  //   "material": "Porcelain",
  //   "colorCategory": "Beige",
  //   "swatchUrl": "/swatches/7cc6f21ea38c09c37a897dd2c2df3943.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293473,
  //       "size": "12x12",
  //       "sku": "ECWMAJBEI01",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJBEI01()",
  //       "swatchUrl": "/swatches/7cc6f21ea38c09c37a897dd2c2df3943.jpg"
  //     },
  //     {
  //       "id": 6293474,
  //       "size": "12x24",
  //       "sku": "ECWMAJBEI02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJBEI02()",
  //       "swatchUrl": "/swatches/248971559251770e44208a843e32ec5a.jpg"
  //     },
  //     {
  //       "id": 6293475,
  //       "size": "24x48",
  //       "sku": "ECWMAJBEI03",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJBEI03()",
  //       "swatchUrl": "/swatches/ac838d74d5499d0c810b7754f5fb8b2b.jpg"
  //     },
  //     {
  //       "id": 6293476,
  //       "size": "24x48",
  //       "sku": "ECWMAJBEI04",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJBEI04()",
  //       "swatchUrl": "/swatches/7f76496c47a05338db9f1502b9abeaf4.jpg"
  //     },
  //     {
  //       "id": 6293477,
  //       "size": "Mosaic",
  //       "sku": "ECWMAJBEI05",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJBEI05()",
  //       "swatchUrl": "/swatches/53aed02352d41766717ca5a55ef11e91.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293478,
  //   "name": "Majestic",
  //   "color": "Cotton",
  //   "sku": "ECWMAJWHT01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJWHT01()",
  //   "size": "12x12",
  //   "ratio": "1x1",
  //   "material": "Porcelain",
  //   "colorCategory": "White",
  //   "swatchUrl": "/swatches/e37f02313c4a2b97ece0d4440d101c1f.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293478,
  //       "size": "12x12",
  //       "sku": "ECWMAJWHT01",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJWHT01()",
  //       "swatchUrl": "/swatches/e37f02313c4a2b97ece0d4440d101c1f.jpg"
  //     },
  //     {
  //       "id": 6293479,
  //       "size": "12x24",
  //       "sku": "ECWMAJWHT02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJWHT02()",
  //       "swatchUrl": "/swatches/0654776c7882f4c09c1ec4ec3db0ec89.jpg"
  //     },
  //     {
  //       "id": 6293480,
  //       "size": "24x48",
  //       "sku": "ECWMAJWHT03",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJWHT03()",
  //       "swatchUrl": "/swatches/40416420e9bad0dbb814ab8ba90879d3.jpg"
  //     },
  //     {
  //       "id": 6293481,
  //       "size": "24x48",
  //       "sku": "ECWMAJWHT04",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJWHT04()",
  //       "swatchUrl": "/swatches/6ba4656acb92b40374b30807ab9d6867.jpg"
  //     },
  //     {
  //       "id": 6293482,
  //       "size": "Mosaic",
  //       "sku": "ECWMAJWHT05",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJWHT05()",
  //       "swatchUrl": "/swatches/3fc7c62f50a1f55167422b00e4a4d13e.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293483,
  //   "name": "Majestic",
  //   "color": "Mix",
  //   "sku": "ECWMAJMIX05",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJMIX05()",
  //   "size": "Mosaic",
  //   "ratio": "Mosaic",
  //   "material": "Porcelain",
  //   "colorCategory": "Beige, White, Grey",
  //   "swatchUrl": "/swatches/a7fba8037334212aa515e1876709a22e.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293483,
  //       "size": "Mosaic",
  //       "sku": "ECWMAJMIX05",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJMIX05()",
  //       "swatchUrl": "/swatches/a7fba8037334212aa515e1876709a22e.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293484,
  //   "name": "Majestic",
  //   "color": "Pearl",
  //   "sku": "ECWMAJGRY01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJGRY01()",
  //   "size": "12x12",
  //   "ratio": "1x1",
  //   "material": "Porcelain",
  //   "colorCategory": "Grey",
  //   "swatchUrl": "/swatches/28172ab8e0b1f6a9318174276d48f6ee.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293484,
  //       "size": "12x12",
  //       "sku": "ECWMAJGRY01",
  //       "ratio": "1x1",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJGRY01()",
  //       "swatchUrl": "/swatches/28172ab8e0b1f6a9318174276d48f6ee.jpg"
  //     },
  //     {
  //       "id": 6293485,
  //       "size": "12x24",
  //       "sku": "ECWMAJGRY02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJGRY02()",
  //       "swatchUrl": "/swatches/ca137de1ce399cc5a12dc7a7a873534f.jpg"
  //     },
  //     {
  //       "id": 6293486,
  //       "size": "24x48",
  //       "sku": "ECWMAJGRY03",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJGRY03()",
  //       "swatchUrl": "/swatches/9c82a455dd586f37b623d7d308662739.jpg"
  //     },
  //     {
  //       "id": 6293487,
  //       "size": "24x48",
  //       "sku": "ECWMAJGRY04",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJGRY04()",
  //       "swatchUrl": "/swatches/ca38393ce67b47852c6d53a4060b494f.jpg"
  //     },
  //     {
  //       "id": 6293488,
  //       "size": "Mosaic",
  //       "sku": "ECWMAJGRY05",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWMAJGRY05()",
  //       "swatchUrl": "/swatches/9854884ab30def6adf0a128c65b2199a.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293489,
  //   "name": "Haven",
  //   "color": "Earth",
  //   "sku": "ECWHAVBRN01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVBRN01()",
  //   "size": "12x24",
  //   "ratio": "1x2",
  //   "material": "Porcelain",
  //   "colorCategory": "Brown",
  //   "swatchUrl": "/swatches/19e0a6507eacc46ee51efeaee029faf6.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293489,
  //       "size": "12x24",
  //       "sku": "ECWHAVBRN01",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVBRN01()",
  //       "swatchUrl": "/swatches/19e0a6507eacc46ee51efeaee029faf6.jpg"
  //     },
  //     {
  //       "id": 6293490,
  //       "size": "24x48",
  //       "sku": "ECWHAVBRN02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVBRN02()",
  //       "swatchUrl": "/swatches/41a73190d4fc7ca8be06a138d18c73c8.jpg"
  //     },
  //     {
  //       "id": 6293491,
  //       "size": "2x2",
  //       "sku": "ECWHAVBRN03",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVBRN03()",
  //       "swatchUrl": "/swatches/d23363c95f5e8d0b8a299594cae78a61.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293492,
  //   "name": "Haven",
  //   "color": "Milk",
  //   "sku": "ECWHAVWHT01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVWHT01()",
  //   "size": "12x24",
  //   "ratio": "1x2",
  //   "material": "Porcelain",
  //   "colorCategory": "White",
  //   "swatchUrl": "/swatches/6da9ea81a92c87506b66863ac84cc298.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293492,
  //       "size": "12x24",
  //       "sku": "ECWHAVWHT01",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVWHT01()",
  //       "swatchUrl": "/swatches/6da9ea81a92c87506b66863ac84cc298.jpg"
  //     },
  //     {
  //       "id": 6293493,
  //       "size": "24x48",
  //       "sku": "ECWHAVWHT02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVWHT02()",
  //       "swatchUrl": "/swatches/3d58cf80ad38e7982e9e55ce2b306f32.jpg"
  //     },
  //     {
  //       "id": 6293494,
  //       "size": "2x2",
  //       "sku": "ECWHAVWHT03",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVWHT03()",
  //       "swatchUrl": "/swatches/8785f4f1fc80f02ce9893d7e601fab92.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293495,
  //   "name": "Haven",
  //   "color": "Oat",
  //   "sku": "ECWHAVBEI01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVBEI01()",
  //   "size": "12x24",
  //   "ratio": "1x2",
  //   "material": "Porcelain",
  //   "colorCategory": "Beige",
  //   "swatchUrl": "/swatches/cfb1976fab5eeb93075a85c5fe56315e.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293495,
  //       "size": "12x24",
  //       "sku": "ECWHAVBEI01",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVBEI01()",
  //       "swatchUrl": "/swatches/cfb1976fab5eeb93075a85c5fe56315e.jpg"
  //     },
  //     {
  //       "id": 6293496,
  //       "size": "24x48",
  //       "sku": "ECWHAVBEI02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVBEI02()",
  //       "swatchUrl": "/swatches/75a56fc0bcf085323d97ea774969aa69.jpg"
  //     },
  //     {
  //       "id": 6293497,
  //       "size": "2x2",
  //       "sku": "ECWHAVBEI03",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVBEI03()",
  //       "swatchUrl": "/swatches/b7badecdb774840fe01435832a3b1380.jpg"
  //     }
  //   ]
  // },
  // {
  //   "id": 6293498,
  //   "name": "Haven",
  //   "color": "Shale",
  //   "sku": "ECWHAVGRY01",
  //   "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVGRY01()",
  //   "size": "12x24",
  //   "ratio": "1x2",
  //   "material": "Porcelain",
  //   "colorCategory": "Grey",
  //   "swatchUrl": "/swatches/18cddcb06299196c7d346a9222c05ec4.jpg",
  //   "availableSizes": [
  //     {
  //       "id": 6293498,
  //       "size": "12x24",
  //       "sku": "ECWHAVGRY01",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVGRY01()",
  //       "swatchUrl": "/swatches/18cddcb06299196c7d346a9222c05ec4.jpg"
  //     },
  //     {
  //       "id": 6293499,
  //       "size": "24x48",
  //       "sku": "ECWHAVGRY02",
  //       "ratio": "1x2",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVGRY02()",
  //       "swatchUrl": "/swatches/8308880297abd98dbc48f78ce7c30fa2.jpg"
  //     },
  //     {
  //       "id": 6293500,
  //       "size": "2x2",
  //       "sku": "ECWHAVGRY03",
  //       "ratio": "Mosaic",
  //       "specifier": "Best_Tile\\Products\\_July_2026\\ECWHAVGRY03()",
  //       "swatchUrl": "/swatches/27cb1aac7af999821b4608f2fb544fa0.jpg"
  //     }
  //   ]
  // }
];
export const PAINTS_CATALOG: PaintProduct[] = [
  {
    "id": 1020634,
    "name": "Abalone Shell",
    "color": "Abalone Shell",
    "sku": "SW 6050",
    "specifier": "COLOR(RGB(219,199,189))",
    "family": "Purple",
    "swatchUrl": "/swatches/aa6dea63d6ad465bf76c4763dbe567a2.jpg"
  },
  {
    "id": 1023186,
    "name": "Acacia Haze",
    "color": "Acacia Haze",
    "sku": "SW 9132",
    "specifier": "COLOR(RGB(150,156,146))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/869f82f4564b9864ab794a9d4730c857.jpg"
  },
  {
    "id": 1020295,
    "name": "Acanthus",
    "color": "Acanthus",
    "sku": "SW 0029",
    "specifier": "COLOR(RGB(205,205,180))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/0e77144323faec46c8b231bd57025ec8.jpg"
  },
  {
    "id": 1022321,
    "name": "Accessible Beige",
    "color": "Accessible Beige",
    "sku": "SW 7036",
    "specifier": "COLOR(RGB(209,199,184))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/45f824fdcf8181ae860f327d98316c0e.jpg"
  },
  {
    "id": 1023262,
    "name": "Acier",
    "color": "Acier",
    "sku": "SW 9170",
    "specifier": "COLOR(RGB(158,153,145))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/82d07bf6fcb5a475beaff46912c9b95f.jpg"
  },
  {
    "id": 1022355,
    "name": "Adaptive Shade",
    "color": "Adaptive Shade",
    "sku": "SW 7053",
    "specifier": "COLOR(RGB(134,126,112))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/cb53c64aec8cff0c0b4b02522abef3de.jpg"
  },
  {
    "id": 1022022,
    "name": "Adriatic Sea",
    "color": "Adriatic Sea",
    "sku": "SW 6790",
    "specifier": "COLOR(RGB(1,96,129))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/19ae31e112098aac1429391613cd2bc6.jpg"
  },
  {
    "id": 1022637,
    "name": "Adrift",
    "color": "Adrift",
    "sku": "SW 7608",
    "specifier": "COLOR(RGB(135,170,185))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/5b95876d0a81f04c02e0829098e3724c.jpg"
  },
  {
    "id": 1021772,
    "name": "Adventure Orange",
    "color": "Adventure Orange",
    "sku": "SW 6655",
    "specifier": "COLOR(RGB(230,159,95))",
    "family": "Oranges Warm",
    "swatchUrl": "/swatches/74db936615015cc1af08d5ce12e865f2.jpg"
  },
  {
    "id": 1022319,
    "name": "Aesthetic White",
    "color": "Aesthetic White",
    "sku": "SW 7035",
    "specifier": "COLOR(RGB(227,221,211))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/0f5c55076928be8b1f854b8966bcaaab.jpg"
  },
  {
    "id": 1023246,
    "name": "African Gray",
    "color": "African Gray",
    "sku": "SW 9162",
    "specifier": "COLOR(RGB(147,152,153))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/bc672a64b191426548c1f5299d1819be.jpg"
  },
  {
    "id": 1022229,
    "name": "African Violet",
    "color": "African Violet",
    "sku": "SW 6982",
    "specifier": "COLOR(RGB(102,83,133))",
    "family": "Purple",
    "swatchUrl": "/swatches/362764a6d36ce9d82525bbb44d612108.jpg"
  },
  {
    "id": 1023015,
    "name": "After the Rain",
    "color": "After the Rain",
    "sku": "SW 9047",
    "specifier": "COLOR(RGB(139,196,209))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/499e93ab9666bf735af97d1f293b8e89.jpg"
  },
  {
    "id": 1021796,
    "name": "Afterglow",
    "color": "Afterglow",
    "sku": "SW 6667",
    "specifier": "COLOR(RGB(246,205,142))",
    "family": "Yellows Warm",
    "swatchUrl": "/swatches/283239356558f26f815cb9d3a3c23eb1.jpg"
  },
  {
    "id": 1021812,
    "name": "Afternoon",
    "color": "Afternoon",
    "sku": "SW 6675",
    "specifier": "COLOR(RGB(251,203,120))",
    "family": "Yellows Warm",
    "swatchUrl": "/swatches/748319b0a14349c4b4b753a60f47ae7b.jpg"
  },
  {
    "id": 1023054,
    "name": "Agapanthus",
    "color": "Agapanthus",
    "sku": "SW 9066",
    "specifier": "COLOR(RGB(187,197,222))",
    "family": "Purple",
    "swatchUrl": "/swatches/d773e9ef9f3bf91d9276bbbd47283aaf.jpg"
  },
  {
    "id": 1022901,
    "name": "Agate Green",
    "color": "Agate Green",
    "sku": "SW 7742",
    "specifier": "COLOR(RGB(142,164,134))",
    "family": "Greens Cool",
    "swatchUrl": "/swatches/83a667c408f58e8fb08c7a1ea9862c3d.jpg"
  },
  {
    "id": 1023282,
    "name": "Aged White",
    "color": "Aged White",
    "sku": "SW 9180",
    "specifier": "COLOR(RGB(232,222,205))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/22535b8a281aa717ec973a5e2764128c.jpg"
  },
  {
    "id": 1021122,
    "name": "Aged Wine",
    "color": "Aged Wine",
    "sku": "SW 6299",
    "specifier": "COLOR(RGB(137,84,96))",
    "family": "Purple",
    "swatchUrl": "/swatches/4b8d2c8e2d18538c59fa18c1f8c1a8a9.jpg"
  },
  {
    "id": 1022307,
    "name": "Agreeable Gray",
    "color": "Agreeable Gray",
    "sku": "SW 7029",
    "specifier": "COLOR(RGB(209,203,193))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/72bd383ed8a698b8d44d26067848461c.jpg"
  },
  {
    "id": 1023028,
    "name": "Agua Fria",
    "color": "Agua Fria",
    "sku": "SW 9053",
    "specifier": "COLOR(RGB(159,197,204))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/46c9ae15f73cc408495ab2ce4fd38166.jpg"
  },
  {
    "id": 1022265,
    "name": "Alabaster",
    "color": "Alabaster",
    "sku": "SW 7008",
    "specifier": "COLOR(RGB(237,234,224))",
    "family": "Whites",
    "swatchUrl": "/swatches/09536265d2b23bc9e9070c035f05ce4f.jpg"
  },
  {
    "id": 1022585,
    "name": "Alaea",
    "color": "Alaea",
    "sku": "SW 7579",
    "specifier": "COLOR(RGB(129,88,91))",
    "family": "Reds Warm",
    "swatchUrl": "/swatches/6ec19378f2446465f5a5c991be56582f.jpg"
  },
  {
    "id": 1021308,
    "name": "Alchemy",
    "color": "Alchemy",
    "sku": "SW 6395",
    "specifier": "COLOR(RGB(201,158,83))",
    "family": "Yellows Warm",
    "swatchUrl": "/swatches/0939131e051902b7bee892a8c356b295.jpg"
  },
  {
    "id": 1021016,
    "name": "Aleutian",
    "color": "Aleutian",
    "sku": "SW 6241",
    "specifier": "COLOR(RGB(152,169,183))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/34337b411aab5d51ea1df8efde613cbf.jpg"
  },
  {
    "id": 1020357,
    "name": "Alexandrite",
    "color": "Alexandrite",
    "sku": "SW 0060",
    "specifier": "COLOR(RGB(89,140,116))",
    "family": "Greens Cool",
    "swatchUrl": "/swatches/331fe41e6f2f52fc1b88e09d86916944.jpg"
  },
  {
    "id": 1021204,
    "name": "Alluring White",
    "color": "Alluring White",
    "sku": "SW 6343",
    "specifier": "COLOR(RGB(239,225,210))",
    "family": "Whites",
    "swatchUrl": "/swatches/4636ab8635f39aea721e8caf45eda76b.jpg"
  },
  {
    "id": 1023132,
    "name": "Almond Roca",
    "color": "Almond Roca",
    "sku": "SW 9105",
    "specifier": "COLOR(RGB(167,131,97))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/368e6b20702e9a61b6ee605a76efaabd.jpg"
  },
  {
    "id": 1021444,
    "name": "Aloe",
    "color": "Aloe",
    "sku": "SW 6464",
    "specifier": "COLOR(RGB(172,202,188))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/286e97970f0537b4bc0c930890f3d9c1.jpg"
  },
  {
    "id": 1020928,
    "name": "Aloof Gray",
    "color": "Aloof Gray",
    "sku": "SW 6197",
    "specifier": "COLOR(RGB(201,201,192))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/7c0832927a531531c543f552558db189.jpg"
  },
  {
    "id": 1022293,
    "name": "Alpaca",
    "color": "Alpaca",
    "sku": "SW 7022",
    "specifier": "COLOR(RGB(204,197,189))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/aa80ddf26851c161bb5259b3a42b69a0.jpg"
  },
  {
    "id": 1021668,
    "name": "Alyssum",
    "color": "Alyssum",
    "sku": "SW 6589",
    "specifier": "COLOR(RGB(242,213,215))",
    "family": "Reds Warm",
    "swatchUrl": "/swatches/e3b1db80ed4e18f4b04e796838de6a64.jpg"
  },
  {
    "id": 1022008,
    "name": "Amalfi",
    "color": "Amalfi",
    "sku": "SW 6783",
    "specifier": "COLOR(RGB(1,110,133))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/39c3c0d0034e3ffbcb3f466d901260e9.jpg"
  },
  {
    "id": 1021672,
    "name": "Amaryllis",
    "color": "Amaryllis",
    "sku": "SW 6591",
    "specifier": "COLOR(RGB(237,147,157))",
    "family": "Reds Warm",
    "swatchUrl": "/swatches/23ff74e41821d264e5ecfda48ddf6b54.jpg"
  },
  {
    "id": 1022337,
    "name": "Amazing Gray",
    "color": "Amazing Gray",
    "sku": "SW 7044",
    "specifier": "COLOR(RGB(190,181,169))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/be047f1a5a523c0eedb000d13a6ccbfc.jpg"
  },
  {
    "id": 1021776,
    "name": "Amber Wave",
    "color": "Amber Wave",
    "sku": "SW 6657",
    "specifier": "COLOR(RGB(210,130,64))",
    "family": "Oranges Warm",
    "swatchUrl": "/swatches/2556a38918f44aebd96a60f0c0c6adf6.jpg"
  },
  {
    "id": 1021250,
    "name": "Ambitious Amber",
    "color": "Ambitious Amber",
    "sku": "SW 6366",
    "specifier": "COLOR(RGB(240,203,151))",
    "family": "Oranges Warm",
    "swatchUrl": "/swatches/ddd8585a452f1887b9ba0feb669ae3c0.jpg"
  },
  {
    "id": 1022351,
    "name": "Analytical Gray",
    "color": "Analytical Gray",
    "sku": "SW 7051",
    "specifier": "COLOR(RGB(191,182,167))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/67dd8263d08f86e0a9ed55e212a81597.jpg"
  },
  {
    "id": 1021332,
    "name": "Ancestral Gold",
    "color": "Ancestral Gold",
    "sku": "SW 6407",
    "specifier": "COLOR(RGB(221,205,166))",
    "family": "Greens Cool",
    "swatchUrl": "/swatches/2007466cd35d116cfcc9041d35c1a066.jpg"
  },
  {
    "id": 1023280,
    "name": "Anchors Aweigh",
    "color": "Anchors Aweigh",
    "sku": "SW 9179",
    "specifier": "COLOR(RGB(43,52,65))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/5664285b4ffa43341ecbbdbaab26af2d.jpg"
  },
  {
    "id": 1020858,
    "name": "Ancient Marble",
    "color": "Ancient Marble",
    "sku": "SW 6162",
    "specifier": "COLOR(RGB(209,204,185))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/485c1a64f622c4956d129b56372f8d8e.jpg"
  },
  {
    "id": 1020882,
    "name": "Andiron",
    "color": "Andiron",
    "sku": "SW 6174",
    "specifier": "COLOR(RGB(66,64,54))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/90fdd8768e1d924e664e3c6db08fba3d.jpg"
  },
  {
    "id": 1022309,
    "name": "Anew Gray",
    "color": "Anew Gray",
    "sku": "SW 7030",
    "specifier": "COLOR(RGB(191,182,170))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/7d4f3c8050a6c5cf491ba4f8fe83daac.jpg"
  },
  {
    "id": 1020606,
    "name": "Angora",
    "color": "Angora",
    "sku": "SW 6036",
    "specifier": "COLOR(RGB(209,197,190))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/1847f8904386d4d40ce44fc974edab00.jpg"
  },
  {
    "id": 1021280,
    "name": "Anjou Pear",
    "color": "Anjou Pear",
    "sku": "SW 6381",
    "specifier": "COLOR(RGB(221,172,109))",
    "family": "Yellows Warm",
    "swatchUrl": "/swatches/38c2f861bf0659c56c4bb74b6b93f083.jpg"
  },
  {
    "id": 1022341,
    "name": "Anonymous",
    "color": "Anonymous",
    "sku": "SW 7046",
    "specifier": "COLOR(RGB(129,122,110))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/93bfbadfcbb8e23c737872552e93418b.jpg"
  },
  {
    "id": 1020327,
    "name": "Antiquarian Brown",
    "color": "Antiquarian Brown",
    "sku": "SW 0045",
    "specifier": "COLOR(RGB(148,102,68))",
    "family": "Reds Warm",
    "swatchUrl": "/swatches/1320bb492a87b6ec3f9595811eb81dcc.jpg"
  },
  {
    "id": 1022599,
    "name": "Antique Red",
    "color": "Antique Red",
    "sku": "SW 7587",
    "specifier": "COLOR(RGB(159,68,66))",
    "family": "Reds Warm",
    "swatchUrl": "/swatches/5c2f588e18f23f8ec0ded82f0b75daa6.jpg"
  },
  {
    "id": 1020772,
    "name": "Antique White",
    "color": "Antique White",
    "sku": "SW 6119",
    "specifier": "COLOR(RGB(232,220,198))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/a4c656fa464073ce6c6c83c5f9ba5c92.jpg"
  },
  {
    "id": 1021322,
    "name": "Antiquity",
    "color": "Antiquity",
    "sku": "SW 6402",
    "specifier": "COLOR(RGB(194,164,98))",
    "family": "Greens Cool",
    "swatchUrl": "/swatches/0abd9726d7e80181f3f586ac589e9385.jpg"
  },
  {
    "id": 1023144,
    "name": "Antler Velvet",
    "color": "Antler Velvet",
    "sku": "SW 9111",
    "specifier": "COLOR(RGB(192,173,150))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/ccad429263c08559c5564d969071d0b4.jpg"
  },
  {
    "id": 1020389,
    "name": "Appleblossom",
    "color": "Appleblossom",
    "sku": "SW 0076",
    "specifier": "COLOR(RGB(218,181,180))",
    "family": "Reds Warm",
    "swatchUrl": "/swatches/9ab0245df0257389f2829f6ea8f5324d.jpg"
  },
  {
    "id": 1021980,
    "name": "Aquarium",
    "color": "Aquarium",
    "sku": "SW 6767",
    "specifier": "COLOR(RGB(58,169,174))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/2d4d5a5c9bcd7acae3d527facafe2481.jpg"
  },
  {
    "id": 1022647,
    "name": "Aqua-Sphere",
    "color": "Aqua-Sphere",
    "sku": "SW 7613",
    "specifier": "COLOR(RGB(156,176,179))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/254cdc6fc6b3da2304eb3ea49f3f9ecc.jpg"
  },
  {
    "id": 1023007,
    "name": "Aquastone",
    "color": "Aquastone",
    "sku": "SW 9043",
    "specifier": "COLOR(RGB(137,198,183))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/222829c205a27cecbfc41bb6e1c1143d.jpg"
  },
  {
    "id": 1023024,
    "name": "Aquaverde",
    "color": "Aquaverde",
    "sku": "SW 9051",
    "specifier": "COLOR(RGB(163,192,189))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/0ef6e3ff9ff3b85f9c555414f67ae340.jpg"
  },
  {
    "id": 1021964,
    "name": "Aqueduct",
    "color": "Aqueduct",
    "sku": "SW 6758",
    "specifier": "COLOR(RGB(161,213,203))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/005bb14d210d8aa87a1d13b4903856ba.jpg"
  },
  {
    "id": 1023036,
    "name": "Aquitaine",
    "color": "Aquitaine",
    "sku": "SW 9057",
    "specifier": "COLOR(RGB(136,171,180))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/e3ac197d9f738795b0ba797e21f6e9d0.jpg"
  },
  {
    "id": 1022417,
    "name": "Arcade White",
    "color": "Arcade White",
    "sku": "SW 7100",
    "specifier": "COLOR(RGB(243,238,231))",
    "family": "Whites",
    "swatchUrl": "/swatches/4f542f1f97923ac936f0416fc35219de.jpg"
  },
  {
    "id": 1022379,
    "name": "Argos",
    "color": "Argos",
    "sku": "SW 7065",
    "specifier": "COLOR(RGB(189,189,183))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/55102873f5e6b7feb292113ebf3017d1.jpg"
  },
  {
    "id": 1021944,
    "name": "Argyle",
    "color": "Argyle",
    "sku": "SW 6747",
    "specifier": "COLOR(RGB(52,138,93))",
    "family": "Greens Cool",
    "swatchUrl": "/swatches/2e16c10b839ab092eb4e64a7d2de4898.jpg"
  },
  {
    "id": 1020291,
    "name": "Aristocrat Peach",
    "color": "Aristocrat Peach",
    "sku": "SW 0027",
    "specifier": "COLOR(RGB(236,206,185))",
    "family": "Reds Warm",
    "swatchUrl": "/swatches/1835746a4493bd49950fc035f048bdd4.jpg"
  },
  {
    "id": 1023242,
    "name": "Armadillo",
    "color": "Armadillo",
    "sku": "SW 9160",
    "specifier": "COLOR(RGB(158,144,137))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/917d7a2c3af934b9f4e4c53329f1d247.jpg"
  },
  {
    "id": 1021226,
    "name": "Armagnac",
    "color": "Armagnac",
    "sku": "SW 6354",
    "specifier": "COLOR(RGB(195,128,88))",
    "family": "Oranges Warm",
    "swatchUrl": "/swatches/6cc15dc5f3f4dff7bc1391b9cc0bc767.jpg"
  },
  {
    "id": 1020602,
    "name": "Arresting Auburn",
    "color": "Arresting Auburn",
    "sku": "SW 6034",
    "specifier": "COLOR(RGB(90,53,50))",
    "family": "Purple",
    "swatchUrl": "/swatches/9ddac0c99bb3bbfa8521d1bdd8449b6c.jpg"
  },
  {
    "id": 1020892,
    "name": "Artichoke",
    "color": "Artichoke",
    "sku": "SW 6179",
    "specifier": "COLOR(RGB(127,130,102))",
    "family": "Greens Cool",
    "swatchUrl": "/swatches/26392e389216545021369fa665074c77.jpg"
  },
  {
    "id": 1020810,
    "name": "Artifact",
    "color": "Artifact",
    "sku": "SW 6138",
    "specifier": "COLOR(RGB(154,129,94))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/f30cf091abc2ca4de2021e7da604e1ea.jpg"
  },
  {
    "id": 1022509,
    "name": "Artisan Tan",
    "color": "Artisan Tan",
    "sku": "SW 7540",
    "specifier": "COLOR(RGB(176,152,121))",
    "family": "Oranges Warm",
    "swatchUrl": "/swatches/5e61138e5b4772ae3e212f340ad9ef27.jpg"
  },
  {
    "id": 1020594,
    "name": "Artistic Taupe",
    "color": "Artistic Taupe",
    "sku": "SW 6030",
    "specifier": "COLOR(RGB(195,177,172))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/e4985f44a72c794f682a6bf2501170bf.jpg"
  },
  {
    "id": 1021410,
    "name": "Arugula",
    "color": "Arugula",
    "sku": "SW 6446",
    "specifier": "COLOR(RGB(66,96,60))",
    "family": "Greens Cool",
    "swatchUrl": "/swatches/79606d5ab6e2263ac6943c53b36b110c.jpg"
  },
  {
    "id": 1021600,
    "name": "Ash Violet",
    "color": "Ash Violet",
    "sku": "SW 6549",
    "specifier": "COLOR(RGB(162,155,170))",
    "family": "Purple",
    "swatchUrl": "/swatches/b37ebfc627141a0fb460b672dd696850.jpg"
  },
  {
    "id": 1023176,
    "name": "At Ease Soldier",
    "color": "At Ease Soldier",
    "sku": "SW 9127",
    "specifier": "COLOR(RGB(158,153,133))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/edaf9638b452558258ecb2a34456bb39.jpg"
  },
  {
    "id": 1022289,
    "name": "Black Fox",
    "color": "Black Fox",
    "sku": "SW 7020",
    "specifier": "COLOR(RGB(79,72,66))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/17e0bb11140ce81f4fde31a84108c6a7.jpg"
  },
  {
    "id": 1022239,
    "name": "Caviar",
    "color": "Caviar",
    "sku": "SW 6990",
    "specifier": "COLOR(RGB(49,48,49))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/f38407a26d5b6d286e3c6d430b516748.jpg"
  },
  {
    "id": 1020411,
    "name": "Charcoal Blue",
    "color": "Charcoal Blue",
    "sku": "SW 2739",
    "specifier": "COLOR(RGB(61,68,80))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/ba399c7340c7d9c91153d6747ac18527.jpg"
  },
  {
    "id": 1020391,
    "name": "Classic French Gray",
    "color": "Classic French Gray",
    "sku": "SW 0077",
    "specifier": "COLOR(RGB(136,135,130))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/9dc644ae2922ac190892039dde87688a.jpg"
  },
  {
    "id": 1020918,
    "name": "Coastal Plain",
    "color": "Coastal Plain",
    "sku": "SW 6192",
    "specifier": "COLOR(RGB(159,166,148))",
    "family": "Greens Cool",
    "swatchUrl": "/swatches/e4440c88f72b09bbe232e91c8cbec693.jpg"
  },
  {
    "id": 1020373,
    "name": "Copen Blue",
    "color": "Copen Blue",
    "sku": "SW 0068",
    "specifier": "COLOR(RGB(194,204,196))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/f52057deee7024c60d733d346d6c17a6.jpg"
  },
  {
    "id": 1022287,
    "name": "Gauntlet Gray",
    "color": "Gauntlet Gray",
    "sku": "SW 7019",
    "specifier": "COLOR(RGB(120,115,110))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/4dead7a719097dc1aaf4f3f9c3bbeec2.jpg"
  },
  {
    "id": 1022387,
    "name": "Iron Ore",
    "color": "Iron Ore",
    "sku": "SW 7069",
    "specifier": "COLOR(RGB(67,67,65))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/661f90fe6c8558f59b40810d7970a925.jpg"
  },
  {
    "id": 1022281,
    "name": "Mindful Gray",
    "color": "Mindful Gray",
    "sku": "SW 7016",
    "specifier": "COLOR(RGB(188,183,173))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/19597f6e83ac4b6cbff84c4d85b06510.jpg"
  },
  {
    "id": 1020413,
    "name": "Mineral Gray",
    "color": "Mineral Gray",
    "sku": "SW 2740",
    "specifier": "COLOR(RGB(81,87,99))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/ed69b2f135589c3db8273df668537534.jpg"
  },
  {
    "id": 1021022,
    "name": "Naval",
    "color": "Naval",
    "sku": "SW 6244",
    "specifier": "COLOR(RGB(47,61,76))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/737eba5c2e3b859274fbfc7effe87eb5.jpg"
  },
  {
    "id": 1020301,
    "name": "Needlepoint Navy",
    "color": "Needlepoint Navy",
    "sku": "SW 0032",
    "specifier": "COLOR(RGB(84,102,112))",
    "family": "Blues Cool",
    "swatchUrl": "/swatches/f888dcf3eca88c0833c1bcdc23b0180d.jpg"
  },
  {
    "id": 1022693,
    "name": "Origami White",
    "color": "Origami White",
    "sku": "SW 7636",
    "specifier": "COLOR(RGB(229,226,218))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/11d80960cea784ed0daca10ea50ba7cf.jpg"
  },
  {
    "id": 1020950,
    "name": "Pewter Green",
    "color": "Pewter Green",
    "sku": "SW 6208",
    "specifier": "COLOR(RGB(94,98,89))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/27659177fbc25df433d1d0ee2a91ab36.jpg"
  },
  {
    "id": 1022259,
    "name": "Pure White",
    "color": "Pure White",
    "sku": "SW 7005",
    "specifier": "COLOR(RGB(237,236,230))",
    "family": "Whites",
    "swatchUrl": "/swatches/99758ed9a9ba438e5ef07d1a4e15706b.jpg"
  },
  {
    "id": 1022279,
    "name": "Repose Gray",
    "color": "Repose Gray",
    "sku": "SW 7015",
    "specifier": "COLOR(RGB(204,201,192))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/a3120649ca45f0ff07eaaabc0e16b8a7.jpg"
  },
  {
    "id": 1023198,
    "name": "Stardew",
    "color": "Stardew",
    "sku": "SW 9138",
    "specifier": "COLOR(RGB(166,178,181))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/9b8c1f3ef2263df20808354205db3262.jpg"
  },
  {
    "id": 1021002,
    "name": "Uncertain Gray",
    "color": "Uncertain Gray",
    "sku": "SW 6234",
    "specifier": "COLOR(RGB(169,176,177))",
    "family": "Neutrals Cool",
    "swatchUrl": "/swatches/2dd96dc41304840564a1144b17510575.jpg"
  },
  {
    "id": 1022345,
    "name": "Urbane Bronze",
    "color": "Urbane Bronze",
    "sku": "SW 7048",
    "specifier": "COLOR(RGB(84,80,74))",
    "family": "Neutrals Warm",
    "swatchUrl": "/swatches/527df2e1150ac74af02ed8e72827bf38.jpg"
  }
];
export const COUNTERS_CATALOG: CounterProduct[] = [
  {
    "id": 1345748,
    "name": "Absolute White",
    "color": "Absolute White",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Quartz\\Absolute_White\\Polished()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/46b4e89381e0686ce90bfc9622e454a6.jpg"
  },
  {
    "id": 584483,
    "name": "Arabescato",
    "color": "Arabescato",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Marble\\Arabescato\\Arabescato_Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/d216580bcaedf480d32221499dfa4288.jpg"
  },
  {
    "id": 1842510,
    "name": "Arabescato Como",
    "color": "Arabescato Como",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Quartz\\Arabescato_Como\\Arabescato_Como()",
    "finish": "2CM & 3CM Slab",
    "swatchUrl": "/swatches/9ffba5cf4a1b93048eac36e54cd36a21.jpg"
  },
  {
    "id": 196728,
    "name": "Bianco Carrara",
    "color": "Bianco Carrara",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Marble\\Bianco_Carrara\\Bianco_Carrara_Slab()",
    "finish": "3CM Slab",
    "swatchUrl": "/swatches/253b17ecf9bbeea4f4f3552a4f4ba290.jpg"
  },
  {
    "id": 226388,
    "name": "Bianco Montanha",
    "color": "Bianco Montanha",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Granite\\Bianco_Montanha\\Bianco_Montanha_Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/e1acd8562cbb4452c526a03327e2a50c.jpg"
  },
  {
    "id": 196727,
    "name": "Bianco Venatino",
    "color": "Bianco Venatino",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Marble\\Bianco_Venatino\\Bianco_Venatino_Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/0a8b65ad6e6886306ac2e337801cdd32.jpg"
  },
  {
    "id": 196649,
    "name": "Black Pearl",
    "color": "Black Pearl",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Granite\\Black Pearl\\Black_Pearl_Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/89c6d1079ef4666ed91648f656cb872b.jpg"
  },
  {
    "id": 197581,
    "name": "Blizzard",
    "color": "Blizzard",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Granite\\Blizzard\\Blizzard_slab()",
    "finish": "3CM Slab",
    "swatchUrl": "/swatches/aed422bc36210f27bbae81370af261cd.jpg"
  },
  {
    "id": 1507760,
    "name": "County Clare-N",
    "color": "County Clare-N",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Quartz\\County_Clare_N\\County_Clare_N()",
    "finish": "Polished Slab",
    "swatchUrl": "/swatches/8fbbcee21fb417ada71edce0fed0c3e9.jpg"
  },
  {
    "id": 197037,
    "name": "Crema Marfil",
    "color": "Crema Marfil",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Marble\\Crema_Marfil\\Crema_Marfil_Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/e3cacc5baca470eddd0ad620ccfba10f.jpg"
  },
  {
    "id": 330935,
    "name": "Crema Vosscione",
    "color": "Crema Vosscione",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Limestone\\Crema_Vosscione\\Crema_Vosscione_Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/faa8e7dc08e68154f67d84474ba94cb1.jpg"
  },
  {
    "id": 1297615,
    "name": "Denali-N",
    "color": "Denali-N",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Quartz\\Denali\\Denali()",
    "finish": "2CM",
    "swatchUrl": "/swatches/e75fdfd21331684dae7a918ce6a6a3e2.jpg"
  },
  {
    "id": 1898154,
    "name": "Fantasy Ocean",
    "color": "Fantasy Ocean",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Marble\\Fantasy_Ocean\\Fantasy_Ocean()",
    "finish": "Polished Slab",
    "swatchUrl": "/swatches/94de75899f062765fad25b15fb3c7295.jpg"
  },
  {
    "id": 1509637,
    "name": "Fantasy White",
    "color": "Fantasy White",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Marble\\Fantasy_White\\Fantasy_White_Satin()",
    "finish": "Polished Slab",
    "swatchUrl": "/swatches/207179b2d66ad49bd3813c1f69a24414.jpg"
  },
  {
    "id": 196557,
    "name": "Galaxy Black",
    "color": "Galaxy Black",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Granite\\Galaxy Black\\Galaxy Black Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/7f920873b6e19ce64a4ea5cdd6977b0f.jpg"
  },
  {
    "id": 275334,
    "name": "Grigio Nube",
    "color": "Grigio Nube",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Quartz\\Grigio_Nube\\Grigio_Nube()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/e8cacc4b5e4a0f417d3f887107f4d1cc.jpg"
  },
  {
    "id": 197821,
    "name": "Monte Cristo",
    "color": "Monte Cristo",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Granite\\Monte_Cristo\\Monte_Cristo_Slab()",
    "finish": "3CM Slab",
    "swatchUrl": "/swatches/9203521822d069d2c53cbdb62212fe1a.jpg"
  },
  {
    "id": 238952,
    "name": "Mountain White",
    "color": "Mountain White",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Marble\\Mountain_White\\Mountain_White_Polished_Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/d97d6af872634c201544b8c23a816e56.jpg"
  },
  {
    "id": 1011687,
    "name": "Negro Marquina",
    "color": "Negro Marquina",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Marble\\Negro_Marquina\\Negro_Marquina_Marble()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/1ca51b54ff7f0dbb8c2353f6c9e3d1f8.jpg"
  },
  {
    "id": 1984482,
    "name": "Palmeri",
    "color": "Palmeri",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Quartz\\Palmeri\\Palmeri()",
    "finish": "Polished Slab",
    "swatchUrl": "/swatches/3dbf1f3f1ec5f4088309bd0c59a9e26c.jpg"
  },
  {
    "id": 1899213,
    "name": "Pro Cloud",
    "color": "Pro Cloud",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Quartz\\Pro\\Pro_Cloud\\Pro_Cloud()",
    "finish": "Polished Slab",
    "swatchUrl": "/swatches/49aeb70c5017fd0e43caf5cb634245b4.jpg"
  },
  {
    "id": 197755,
    "name": "River White",
    "color": "River White",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Granite\\River_White\\River_White_Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/521f4d24f21cafe341142f2e52fcd134.jpg"
  },
  {
    "id": 196710,
    "name": "Rocas Azul",
    "color": "Rocas Azul",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Limestone\\Rocas Azul\\Rocas Azul Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/413519360c16ed01989af2572a4f853a.jpg"
  },
  {
    "id": 264719,
    "name": "Thassos White",
    "color": "Thassos White",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Marble\\Thassos_White\\Thassos_White_Marble_Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/4f12c1115d0d32081c33217b18725910.jpg"
  },
  {
    "id": 196696,
    "name": "White Ice",
    "color": "White Ice",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Granite\\White Ice\\White Ice Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/df7c65db789437c7a820df7601c90f03.jpg"
  },
  {
    "id": 412302,
    "name": "White Sand",
    "color": "White Sand",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Quartz\\White_Sand\\White_Sand_Quartz_Slab()",
    "finish": "2CM Slab",
    "swatchUrl": "/swatches/27290318ad6620a53388680799b435cd.jpg"
  },
  {
    "id": 1177884,
    "name": "White Truffle",
    "color": "White Truffle",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\RWD\\Marble\\White_Truffle\\Slab\\White_Truffle()",
    "finish": "2CM",
    "swatchUrl": "/swatches/88a5cb3df9287af8a8b0022aeb6a6612.jpg"
  }
];
export const CABINETS_CATALOG: CabinetProduct[] = [
  {
    "id": 987249,
    "name": "Acacia Haze",
    "color": "Acacia Haze",
    "sku": "SW 9132",
    "specifier": "COLOR(RGB(150,156,146))",
    "swatchUrl": "/swatches/869f82f4564b9864ab794a9d4730c857.jpg"
  },
  {
    "id": 118216,
    "name": "Espresso",
    "color": "Espresso",
    "sku": "",
    "specifier": "Arizona Tile\\Products\\Stain\\Classic_Black()",
    "swatchUrl": "/swatches/5a5c5df3617a7867d2b33d8a4996fe80.jpg"
  },
  {
    "id": 1463247,
    "name": "Light Gray",
    "color": "Light Gray",
    "sku": "",
    "specifier": "COLOR(RGB(159,159,159))",
    "swatchUrl": "/swatches/03b663ace96f2893020f300c6d088e78.jpg"
  },
  {
    "id": 1463251,
    "name": "Gray",
    "color": "Gray",
    "sku": "",
    "specifier": "COLOR(RGB(98,98,100))",
    "swatchUrl": "/swatches/d48c9a42110cf852547607e99f90bf74.jpg"
  },
  {
    "id": 1022341,
    "name": "Anonymous",
    "color": "Anonymous",
    "sku": "SW 7046",
    "specifier": "COLOR(RGB(129,122,110))",
    "swatchUrl": "/swatches/93bfbadfcbb8e23c737872552e93418b.jpg"
  },
  {
    "id": 1022289,
    "name": "Black Fox",
    "color": "Black Fox",
    "sku": "SW 7020",
    "specifier": "COLOR(RGB(79,72,66))",
    "swatchUrl": "/swatches/17e0bb11140ce81f4fde31a84108c6a7.jpg"
  },
  {
    "id": 1022239,
    "name": "Caviar",
    "color": "Caviar",
    "sku": "SW 6990",
    "specifier": "COLOR(RGB(49,48,49))",
    "swatchUrl": "/swatches/f38407a26d5b6d286e3c6d430b516748.jpg"
  },
  {
    "id": 1020411,
    "name": "Charcoal Blue",
    "color": "Charcoal Blue",
    "sku": "SW 2739",
    "specifier": "COLOR(RGB(61,68,80))",
    "swatchUrl": "/swatches/ba399c7340c7d9c91153d6747ac18527.jpg"
  },
  {
    "id": 1020391,
    "name": "Classic French Gray",
    "color": "Classic French Gray",
    "sku": "SW 0077",
    "specifier": "COLOR(RGB(136,135,130))",
    "swatchUrl": "/swatches/9dc644ae2922ac190892039dde87688a.jpg"
  },
  {
    "id": 1020918,
    "name": "Coastal Plain",
    "color": "Coastal Plain",
    "sku": "SW 6192",
    "specifier": "COLOR(RGB(159,166,148))",
    "swatchUrl": "/swatches/e4440c88f72b09bbe232e91c8cbec693.jpg"
  },
  {
    "id": 1020373,
    "name": "Copen Blue",
    "color": "Copen Blue",
    "sku": "SW 0068",
    "specifier": "COLOR(RGB(194,204,196))",
    "swatchUrl": "/swatches/f52057deee7024c60d733d346d6c17a6.jpg"
  },
  {
    "id": 1022287,
    "name": "Gauntlet Gray",
    "color": "Gauntlet Gray",
    "sku": "SW 7019",
    "specifier": "COLOR(RGB(120,115,110))",
    "swatchUrl": "/swatches/4dead7a719097dc1aaf4f3f9c3bbeec2.jpg"
  },
  {
    "id": 1022387,
    "name": "Iron Ore",
    "color": "Iron Ore",
    "sku": "SW 7069",
    "specifier": "COLOR(RGB(67,67,65))",
    "swatchUrl": "/swatches/661f90fe6c8558f59b40810d7970a925.jpg"
  },
  {
    "id": 1022281,
    "name": "Mindful Gray",
    "color": "Mindful Gray",
    "sku": "SW 7016",
    "specifier": "COLOR(RGB(188,183,173))",
    "swatchUrl": "/swatches/19597f6e83ac4b6cbff84c4d85b06510.jpg"
  },
  {
    "id": 1020413,
    "name": "Mineral Gray",
    "color": "Mineral Gray",
    "sku": "SW 2740",
    "specifier": "COLOR(RGB(81,87,99))",
    "swatchUrl": "/swatches/ed69b2f135589c3db8273df668537534.jpg"
  },
  {
    "id": 1021022,
    "name": "Naval",
    "color": "Naval",
    "sku": "SW 6244",
    "specifier": "COLOR(RGB(47,61,76))",
    "swatchUrl": "/swatches/737eba5c2e3b859274fbfc7effe87eb5.jpg"
  },
  {
    "id": 1020301,
    "name": "Needlepoint Navy",
    "color": "Needlepoint Navy",
    "sku": "SW 0032",
    "specifier": "COLOR(RGB(84,102,112))",
    "swatchUrl": "/swatches/f888dcf3eca88c0833c1bcdc23b0180d.jpg"
  },
  {
    "id": 1022693,
    "name": "Origami White",
    "color": "Origami White",
    "sku": "SW 7636",
    "specifier": "COLOR(RGB(229,226,218))",
    "swatchUrl": "/swatches/11d80960cea784ed0daca10ea50ba7cf.jpg"
  },
  {
    "id": 1020950,
    "name": "Pewter Green",
    "color": "Pewter Green",
    "sku": "SW 6208",
    "specifier": "COLOR(RGB(94,98,89))",
    "swatchUrl": "/swatches/27659177fbc25df433d1d0ee2a91ab36.jpg"
  },
  {
    "id": 1022259,
    "name": "Pure White",
    "color": "Pure White",
    "sku": "SW 7005",
    "specifier": "COLOR(RGB(237,236,230))",
    "swatchUrl": "/swatches/99758ed9a9ba438e5ef07d1a4e15706b.jpg"
  },
  {
    "id": 1022279,
    "name": "Repose Gray",
    "color": "Repose Gray",
    "sku": "SW 7015",
    "specifier": "COLOR(RGB(204,201,192))",
    "swatchUrl": "/swatches/a3120649ca45f0ff07eaaabc0e16b8a7.jpg"
  },
  {
    "id": 1023198,
    "name": "Stardew",
    "color": "Stardew",
    "sku": "SW 9138",
    "specifier": "COLOR(RGB(166,178,181))",
    "swatchUrl": "/swatches/9b8c1f3ef2263df20808354205db3262.jpg"
  },
  {
    "id": 1021002,
    "name": "Uncertain Gray",
    "color": "Uncertain Gray",
    "sku": "SW 6234",
    "specifier": "COLOR(RGB(169,176,177))",
    "swatchUrl": "/swatches/2dd96dc41304840564a1144b17510575.jpg"
  },
  {
    "id": 1022345,
    "name": "Urbane Bronze",
    "color": "Urbane Bronze",
    "sku": "SW 7048",
    "specifier": "COLOR(RGB(84,80,74))",
    "swatchUrl": "/swatches/527df2e1150ac74af02ed8e72827bf38.jpg"
  }
];
export const GROUT_CATALOG: GroutColor[] = [
  {
    "id": 2499092,
    "brand": "Laticrete",
    "color": "Almond",
    "sku": "85",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Almond()"
  },
  {
    "id": 2499093,
    "brand": "Laticrete",
    "color": "Antique White",
    "sku": "23",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Antique White()"
  },
  {
    "id": 2499094,
    "brand": "Laticrete",
    "color": "Autumn Green",
    "sku": "67",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Autumn Green()"
  },
  {
    "id": 2499095,
    "brand": "Laticrete",
    "color": "Bright White",
    "sku": "44",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Bright White()"
  },
  {
    "id": 2499096,
    "brand": "Laticrete",
    "color": "Butter Cream",
    "sku": "81",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Butter Cream()"
  },
  {
    "id": 2499097,
    "brand": "Laticrete",
    "color": "Chestnut Brown",
    "sku": "66",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Chestnut Brown()"
  },
  {
    "id": 2499099,
    "brand": "Laticrete",
    "color": "Desert Khaki",
    "sku": "56",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Desert Khaki()"
  },
  {
    "id": 2499100,
    "brand": "Laticrete",
    "color": "Dusty Grey",
    "sku": "60",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Dusty Grey()"
  },
  {
    "id": 2499101,
    "brand": "Laticrete",
    "color": "Expresso",
    "sku": "59",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Expresso()"
  },
  {
    "id": 2499102,
    "brand": "Laticrete",
    "color": "Hemp",
    "sku": "27",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Hemp()"
  },
  {
    "id": 2499103,
    "brand": "Laticrete",
    "color": "Hot Cocoa",
    "sku": "57",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Hot Cocoa()"
  },
  {
    "id": 2499105,
    "brand": "Laticrete",
    "color": "Latte",
    "sku": "40",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Latte()"
  },
  {
    "id": 2499106,
    "brand": "Laticrete",
    "color": "Light Pewter",
    "sku": "90",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Light Pewter()"
  },
  {
    "id": 2499107,
    "brand": "Laticrete",
    "color": "Marble Beige",
    "sku": "17",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Marble Beige()"
  },
  {
    "id": 2499108,
    "brand": "Laticrete",
    "color": "Midnight Black",
    "sku": "22",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Midnight Black()"
  },
  {
    "id": 2499109,
    "brand": "Laticrete",
    "color": "Mocha",
    "sku": "35",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Mocha()"
  },
  {
    "id": 2499110,
    "brand": "Laticrete",
    "color": "Mushroom",
    "sku": "39",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Mushroom()"
  },
  {
    "id": 2499111,
    "brand": "Laticrete",
    "color": "Natural Grey",
    "sku": "24",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Natural Grey()"
  },
  {
    "id": 2499112,
    "brand": "Laticrete",
    "color": "Parchment",
    "sku": "61",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Parchment()"
  },
  {
    "id": 2499113,
    "brand": "Laticrete",
    "color": "Platinum",
    "sku": "42",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Platinum()"
  },
  {
    "id": 2499114,
    "brand": "Laticrete",
    "color": "Quarry Red",
    "sku": "46",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Quarry Red()"
  },
  {
    "id": 2499115,
    "brand": "Laticrete",
    "color": "Raven",
    "sku": "45",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Raven()"
  },
  {
    "id": 2499118,
    "brand": "Laticrete",
    "color": "Sand Beige",
    "sku": "30",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Sand Beige()"
  },
  {
    "id": 2499119,
    "brand": "Laticrete",
    "color": "Sandstone",
    "sku": "34",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Sandstone()"
  },
  {
    "id": 2499120,
    "brand": "Laticrete",
    "color": "Sauterne",
    "sku": "18",
    "specifier": "Daltile\\Products\\Grout_Colors\\Laticrete\\Sauterne()"
  }
];
export const PATTERNS_CATALOG: TilePattern[] = [
  {
    "id": 148991,
    "name": "Stack Bond Horizontal",
    "ratio": "1x2"
  },
  {
    "id": 203043,
    "name": "Stack Bond Vertical",
    "ratio": "1x2"
  },
  {
    "id": 176471,
    "name": "Running Bond Horizontal",
    "ratio": "1x2"
  },
  {
    "id": 214642,
    "name": "Running Bond Vertical",
    "ratio": "1x2"
  },
  {
    "id": 176473,
    "name": "1/3 Offset",
    "ratio": "1x2"
  },
  {
    "id": 1281127,
    "name": "Herringbone",
    "ratio": "1x2"
  },
  {
    "id": 177112,
    "name": "Mosaic Grid",
    "ratio": "Mosaic"
  }
];
