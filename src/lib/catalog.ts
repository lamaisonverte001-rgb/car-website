import { asc, eq } from "drizzle-orm";
import { db, products, productColors, productEngines, productWheels, productVariants } from "@/db";
import type { VehicleDimensions, WheelFinish, WheelStyle } from "@/db/schema";

export interface CatalogColor {
  id: string;
  productId: string;
  name: string;
  code: string;
  finish: string;
  hex: string;
  accentHex: string;
  priceDeltaMad: number;
  imageUrl: string;
  sortOrder: number;
}

export interface CatalogEngine {
  id: string;
  productId: string;
  name: string;
  code: string;
  fuelType: string;
  horsepower: number;
  torqueNm: number;
  zeroToHundred: string;
  topSpeedKmh: number;
  transmission: string;
  consumption: string;
  co2Gkm: number;
  drivetrain: string;
  priceDeltaMad: number;
  sortOrder: number;
}

export interface CatalogWheel {
  id: string;
  productId: string;
  name: string;
  code: string;
  sizeInches: number;
  style: WheelStyle;
  finish: WheelFinish;
  finishLabel: string;
  tireSpec: string;
  weightNote: string;
  priceDeltaMad: number;
  sortOrder: number;
}

export interface CatalogVariant {
  id: string;
  productId: string;
  colorId: string;
  engineId: string;
  wheelId: string;
  sku: string;
  variantLabel: string;
  priceMad: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
}

export interface CatalogVehicle {
  id: string;
  slug: string;
  indexLabel: string;
  name: string;
  subtitle: string;
  category: string;
  tagline: string;
  description: string;
  basePriceMad: number;
  heroImageUrl: string;
  galleryImages: string[];
  warranty: string;
  deliveryEstimate: string;
  dimensions: VehicleDimensions;
  highlights: string[];
  isFeatured: boolean;
  isActive: boolean;
  sortOrder: number;
  colors: CatalogColor[];
  engines: CatalogEngine[];
  wheels: CatalogWheel[];
  variants: CatalogVariant[];
}

export async function getCatalogVehicles(): Promise<CatalogVehicle[]> {
  const rows = await db.query.products.findMany({
    where: eq(products.isActive, true),
    orderBy: [asc(products.sortOrder)],
    with: {
      colors: { orderBy: [asc(productColors.sortOrder)] },
      engines: { orderBy: [asc(productEngines.sortOrder)] },
      wheels: { orderBy: [asc(productWheels.sortOrder)] },
      variants: { orderBy: [asc(productVariants.sku)] },
    },
  });

  return rows as CatalogVehicle[];
}

export async function getVehicleBySlug(slug: string): Promise<CatalogVehicle | null> {
  const row = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: {
      colors: { orderBy: [asc(productColors.sortOrder)] },
      engines: { orderBy: [asc(productEngines.sortOrder)] },
      wheels: { orderBy: [asc(productWheels.sortOrder)] },
      variants: { orderBy: [asc(productVariants.sku)] },
    },
  });

  if (!row || !row.isActive) return null;
  return row as CatalogVehicle;
}
