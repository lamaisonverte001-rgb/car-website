import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, orders } from "@/db";
import { getAdminSession } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const allOrders = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    with: {
      items: true,
    },
  });

  const stats = {
    totalOrders: allOrders.length,
    pendingCount: allOrders.filter((o) => o.status === "pending").length,
    confirmedCount: allOrders.filter((o) => o.status === "confirmed").length,
    shippedCount: allOrders.filter((o) => o.status === "shipped").length,
    deliveredCount: allOrders.filter((o) => o.status === "delivered").length,
    cancelledCount: allOrders.filter((o) => o.status === "cancelled").length,
    activeRevenueMad: allOrders
      .filter((o) => o.status !== "cancelled")
      .reduce((acc, o) => acc + o.totalMad, 0),
  };

  return NextResponse.json({ orders: allOrders, stats });
}
