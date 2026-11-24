import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db, products, productColors, productEngines, productWheels, productVariants } from "@/db";
import { getAdminSession } from "@/lib/admin-guard";
import { isR2Configured } from "@/lib/r2";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const vehicles = await db.query.products.findMany({
    orderBy: [asc(products.sortOrder)],
    with: {
      colors: { orderBy: [asc(productColors.sortOrder)] },
      engines: { orderBy: [asc(productEngines.sortOrder)] },
      wheels: { orderBy: [asc(productWheels.sortOrder)] },
      variants: {
        orderBy: [asc(productVariants.sku)],
        with: {
          color: true,
          engine: true,
          wheel: true,
        },
      },
    },
  });

  return NextResponse.json({
    vehicles,
    r2Configured: isR2Configured(),
  });
}
