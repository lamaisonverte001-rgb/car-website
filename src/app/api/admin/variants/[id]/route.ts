import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, productVariants } from "@/db";
import { getAdminSession } from "@/lib/admin-guard";
import { updateVariantSchema } from "@/lib/validations";

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
  const parsed = updateVariantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valeurs de variante invalides." },
      { status: 400 }
    );
  }

  const updates: Partial<typeof productVariants.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (typeof parsed.data.stock === "number") updates.stock = parsed.data.stock;
  if (typeof parsed.data.priceMad === "number") updates.priceMad = parsed.data.priceMad;
  if (typeof parsed.data.isActive === "boolean") updates.isActive = parsed.data.isActive;

  const [updated] = await db
    .update(productVariants)
    .set(updates)
    .where(eq(productVariants.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Variante introuvable." }, { status: 404 });
  }

  return NextResponse.json({ variant: updated });
}
