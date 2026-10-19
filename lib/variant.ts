import { z } from "zod";

const url = z
  .string()
  .trim()
  .max(2048)
  .refine((u) => u === "" || u.startsWith("/uploads/") || u.startsWith("https://"), {
    message: "Must be an uploaded file or an https URL",
  })
  .nullable()
  .optional();

export const variantSchema = z.object({
  sku: z.string().trim().min(2).max(64),
  size: z.string().trim().min(1).max(50),
  finish: z.string().trim().max(50).nullable().optional(),
  color: z.string().trim().max(80).nullable().optional(),
  thicknessMm: z.number().min(0).max(99).nullable().optional(),
  shadeCode: z.string().trim().max(50).nullable().optional(),
  piecesPerBox: z.number().int().min(1).max(1000),
  sqmPerBox: z.number().positive().max(100),
  weightKgPerBox: z.number().min(0).max(9999).nullable().optional(),
  pricePerSqm: z.number().min(0),
  pricePerBox: z.number().min(0),
  compareAtPrice: z.number().min(0).nullable().optional(),
  image: url,
  textureUrl: url,
  active: z.boolean().optional(),
});

type VariantRow = {
  thicknessMm: unknown; sqmPerBox: unknown; weightKgPerBox: unknown;
  pricePerSqm: unknown; pricePerBox: unknown; compareAtPrice: unknown;
};

/** Prisma Decimals → numbers. */
export const serializeVariant = <T extends VariantRow>(v: T) => ({
  ...v,
  thicknessMm: v.thicknessMm != null ? Number(v.thicknessMm) : null,
  sqmPerBox: Number(v.sqmPerBox),
  weightKgPerBox: v.weightKgPerBox != null ? Number(v.weightKgPerBox) : null,
  pricePerSqm: Number(v.pricePerSqm),
  pricePerBox: Number(v.pricePerBox),
  compareAtPrice: v.compareAtPrice != null ? Number(v.compareAtPrice) : null,
});

/** "" → null so cleared fields are really cleared. */
export const blankToNull = <T extends Record<string, unknown>>(o: T) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === "" ? null : v])) as T;