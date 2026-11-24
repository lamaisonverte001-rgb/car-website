import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, orders, orderItems, productVariants } from "@/db";
import { getAdminSession } from "@/lib/admin-guard";
import { updateOrderStatusSchema } from "@/lib/validations";

class StatusTransitionError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 409) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const parsed = updateOrderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut de commande invalide." }, { status: 400 });
  }

  const nextStatus = parsed.data.status;

  try {
    const updatedOrder = await db.transaction(async (tx) => {
      const existing = await tx.query.orders.findFirst({
        where: eq(orders.id, id),
        with: { items: true },
      });

      if (!existing) {
        throw new StatusTransitionError("Commande introuvable.", 404);
      }

      if (existing.status === nextStatus) {
        return existing;
      }

      let stockRestored = existing.stockRestored;

      // Transition INTO cancelled -> restore stock atomically once
      if (nextStatus === "cancelled" && !existing.stockRestored) {
        for (const item of existing.items) {
          if (item.variantId) {
            await tx
              .update(productVariants)
              .set({
                stock: sql`${productVariants.stock} + ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(eq(productVariants.id, item.variantId));
          }
        }
        stockRestored = true;
      }

      // Transition OUT OF cancelled -> re-decrement stock atomically if available
      if (existing.status === "cancelled" && nextStatus !== "cancelled" && existing.stockRestored) {
        for (const item of existing.items) {
          if (item.variantId) {
            const reallocated = await tx
              .update(productVariants)
              .set({
                stock: sql`${productVariants.stock} - ${item.quantity}`,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(productVariants.id, item.variantId),
                  gte(productVariants.stock, item.quantity)
                )
              )
              .returning({ id: productVariants.id });

            if (reallocated.length === 0) {
              throw new StatusTransitionError(
                `Impossible de réactiver : stock insuffisant pour ${item.productTitle} (${item.variantSku}).`,
                409
              );
            }
          }
        }
        stockRestored = false;
      }

      const [saved] = await tx
        .update(orders)
        .set({
          status: nextStatus,
          stockRestored,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, id))
        .returning();

      const items = await tx.query.orderItems.findMany({
        where: eq(orderItems.orderId, id),
      });

      return { ...saved, items };
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    if (error instanceof StatusTransitionError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[PATCH /api/admin/orders/:id]", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut." },
      { status: 500 }
    );
  }
}
