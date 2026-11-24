import React from "react";
import { redirect } from "next/navigation";
import { asc, desc } from "drizzle-orm";
import {
  db,
  orders,
  products,
  productColors,
  productVariants,
} from "@/db";
import { getAdminSession } from "@/lib/admin-guard";
import { isR2Configured } from "@/lib/r2";
import {
  AdminDashboardClient,
  type AdminOrder,
  type AdminVehicle,
} from "@/components/admin/admin-dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const [orderRows, vehicleRows] = await Promise.all([
    db.query.orders.findMany({
      orderBy: [desc(orders.createdAt)],
      with: { items: true },
    }),
    db.query.products.findMany({
      orderBy: [asc(products.sortOrder)],
      with: {
        colors: { orderBy: [asc(productColors.sortOrder)] },
        variants: {
          orderBy: [asc(productVariants.sku)],
          with: {
            color: true,
            engine: true,
            wheel: true,
          },
        },
      },
    }),
  ]);

  const serializedOrders: AdminOrder[] = orderRows.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));

  const serializedVehicles: AdminVehicle[] = vehicleRows.map((v) => ({
    id: v.id,
    name: v.name,
    indexLabel: v.indexLabel,
    category: v.category,
    heroImageUrl: v.heroImageUrl,
    colors: v.colors.map((c) => ({
      id: c.id,
      name: c.name,
      hex: c.hex,
      imageUrl: c.imageUrl,
    })),
    variants: v.variants.map((vr) => ({
      id: vr.id,
      productId: vr.productId,
      sku: vr.sku,
      variantLabel: vr.variantLabel,
      priceMad: vr.priceMad,
      stock: vr.stock,
      isActive: vr.isActive,
      imageUrl: vr.imageUrl,
      color: { id: vr.color.id, name: vr.color.name, hex: vr.color.hex },
      engine: { id: vr.engine.id, name: vr.engine.name, code: vr.engine.code },
      wheel: { id: vr.wheel.id, name: vr.wheel.name, code: vr.wheel.code },
    })),
  }));

  return (
    <AdminDashboardClient
      adminUser={{
        name: session.user.name,
        email: session.user.email,
      }}
      initialOrders={serializedOrders}
      initialVehicles={serializedVehicles}
      r2Configured={isR2Configured()}
    />
  );
}
