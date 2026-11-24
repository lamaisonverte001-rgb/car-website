import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import { db, orders, orderItems, productVariants } from "@/db";
import { createCodOrderSchema } from "@/lib/validations";
import { checkOrderRateLimit } from "@/lib/rate-limit";
import { buildWhatsAppConfirmationUrl } from "@/lib/format";
import { sendOrderNotificationEmail } from "@/lib/mailer";

class OrderBusinessError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 409) {
    super(message);
    this.statusCode = statusCode;
  }
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "local";
}

function generateOrderReference(): string {
  const year = new Date().getFullYear();
  const suffix = crypto.randomInt(1000, 9999);
  const code = crypto.randomBytes(1).toString("hex").toUpperCase();
  return `MV-${year}-${suffix}${code}`;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== "object") {
      return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
    }

    // Honeypot silent rejection before heavy work
    if (typeof rawBody.website === "string" && rawBody.website.trim().length > 0) {
      return NextResponse.json(
        { error: "Votre demande n'a pas pu être validée." },
        { status: 400 }
      );
    }

    const parsed = createCodOrderSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message || "Veuillez vérifier les informations saisies.",
          fieldErrors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const clientIp = getClientIp(req);

    // Rate limit by IP and phone number
    const rate = checkOrderRateLimit(clientIp, input.customerPhone);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `Trop de tentatives récentes. Veuillez patienter ${Math.ceil(rate.retryAfterSec / 60)} min ou nous contacter sur WhatsApp.`,
        },
        { status: 429 }
      );
    }

    // Merge duplicate variantIds in cart defensively
    const mergedMap = new Map<string, number>();
    for (const item of input.items) {
      mergedMap.set(item.variantId, (mergedMap.get(item.variantId) ?? 0) + item.quantity);
    }
    const normalizedItems = Array.from(mergedMap.entries()).map(([variantId, quantity]) => ({
      variantId,
      quantity,
    }));

    const variantIds = normalizedItems.map((i) => i.variantId);

    // Atomic PostgreSQL transaction: verify & decrement stock + create immutable order snapshot
    const createdOrder = await db.transaction(async (tx) => {
      const variantRows = await tx.query.productVariants.findMany({
        where: inArray(productVariants.id, variantIds),
        with: {
          product: true,
          color: true,
          engine: true,
          wheel: true,
        },
      });

      const variantById = new Map(variantRows.map((v) => [v.id, v]));

      const snapshotItems: Array<{
        productId: string;
        variantId: string;
        productTitle: string;
        variantSku: string;
        variantLabel: string;
        colorName: string;
        engineName: string;
        wheelName: string;
        imageUrl: string;
        unitPriceMad: number;
        quantity: number;
        lineTotalMad: number;
      }> = [];

      let totalMad = 0;

      for (const reqItem of normalizedItems) {
        const variant = variantById.get(reqItem.variantId);
        if (!variant || !variant.isActive || !variant.product.isActive) {
          throw new OrderBusinessError(
            "L'une des configurations sélectionnées n'est plus disponible à la commande.",
            409
          );
        }

        // Atomic conditional stock decrement prevents overselling or negative stock
        const updated = await tx
          .update(productVariants)
          .set({
            stock: sql`${productVariants.stock} - ${reqItem.quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(productVariants.id, variant.id),
              eq(productVariants.isActive, true),
              gte(productVariants.stock, reqItem.quantity)
            )
          )
          .returning({ id: productVariants.id, stock: productVariants.stock });

        if (updated.length === 0) {
          throw new OrderBusinessError(
            `Stock insuffisant pour ${variant.product.name} (${variant.variantLabel}). Disponible : ${variant.stock}.`,
            409
          );
        }

        const lineTotalMad = variant.priceMad * reqItem.quantity;
        totalMad += lineTotalMad;

        snapshotItems.push({
          productId: variant.product.id,
          variantId: variant.id,
          productTitle: variant.product.name,
          variantSku: variant.sku,
          variantLabel: variant.variantLabel,
          colorName: variant.color.name,
          engineName: variant.engine.name,
          wheelName: variant.wheel.name,
          imageUrl: variant.imageUrl || variant.color.imageUrl || variant.product.heroImageUrl,
          unitPriceMad: variant.priceMad,
          quantity: reqItem.quantity,
          lineTotalMad,
        });
      }

      const orderId = crypto.randomUUID();
      const reference = generateOrderReference();

      await tx.insert(orders).values({
        id: orderId,
        reference,
        status: "pending",
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail || null,
        city: input.city,
        address: input.address,
        notes: input.notes || null,
        totalMad,
        paymentMethod: "COD",
        clientIp,
        stockRestored: false,
      });

      await tx.insert(orderItems).values(
        snapshotItems.map((item) => ({
          id: crypto.randomUUID(),
          orderId,
          ...item,
        }))
      );

      return {
        id: orderId,
        reference,
        status: "pending" as const,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        customerEmail: input.customerEmail || null,
        city: input.city,
        address: input.address,
        notes: input.notes || null,
        totalMad,
        items: snapshotItems,
      };
    });

    // Fire non-blocking SMTP notification email (errors never affect customer confirmation)
    void sendOrderNotificationEmail({
      reference: createdOrder.reference,
      customerName: createdOrder.customerName,
      customerPhone: createdOrder.customerPhone,
      customerEmail: createdOrder.customerEmail,
      city: createdOrder.city,
      address: createdOrder.address,
      notes: createdOrder.notes,
      totalMad: createdOrder.totalMad,
      items: createdOrder.items,
    }).catch((err) => console.error("[SMTP non-blocking error]", err));

    const whatsappUrl = buildWhatsAppConfirmationUrl({
      reference: createdOrder.reference,
      customerName: createdOrder.customerName,
      city: createdOrder.city,
      address: createdOrder.address,
      totalMad: createdOrder.totalMad,
      items: createdOrder.items,
    });

    return NextResponse.json(
      {
        order: createdOrder,
        whatsappUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof OrderBusinessError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error("[POST /api/orders]", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'enregistrement de votre commande." },
      { status: 500 }
    );
  }
}
