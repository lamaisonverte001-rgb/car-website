import { NextResponse } from "next/server";
import { getCatalogVehicles } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const vehicles = await getCatalogVehicles();
    return NextResponse.json({ vehicles });
  } catch (error) {
    console.error("[GET /api/products]", error);
    return NextResponse.json(
      { error: "Impossible de charger le catalogue des véhicules." },
      { status: 500 }
    );
  }
}
