import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, products, productColors, productVariants } from "@/db";
import { getAdminSession } from "@/lib/admin-guard";
import { isR2Configured, uploadImageToR2 } from "@/lib/r2";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const productId = formData.get("productId")?.toString() || "";
    const colorId = formData.get("colorId")?.toString() || "";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier image fourni." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez JPG, PNG, WebP ou AVIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image trop volumineuse (maximum 10 Mo)." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let uploadedUrl = "";
    let storage: "r2" | "local" = "local";

    if (isR2Configured()) {
      const result = await uploadImageToR2({
        buffer,
        contentType: file.type,
        originalName: file.name,
      });
      uploadedUrl = result.url;
      storage = "r2";
    } else {
      // Development / VPS local fallback when Cloudflare R2 env vars are not yet configured
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "avif"].includes(ext) ? ext : "jpg";
      const filename = `${Date.now()}-${crypto.randomBytes(5).toString("hex")}.${safeExt}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      uploadedUrl = `/uploads/${filename}`;
      storage = "local";
    }

    // Optionally persist image directly to selected color variant or product hero
    if (colorId) {
      await db
        .update(productColors)
        .set({ imageUrl: uploadedUrl })
        .where(eq(productColors.id, colorId));
      await db
        .update(productVariants)
        .set({ imageUrl: uploadedUrl, updatedAt: new Date() })
        .where(eq(productVariants.colorId, colorId));
    } else if (productId) {
      await db
        .update(products)
        .set({ heroImageUrl: uploadedUrl, updatedAt: new Date() })
        .where(eq(products.id, productId));
    }

    return NextResponse.json({ url: uploadedUrl, storage });
  } catch (error) {
    console.error("[POST /api/admin/upload]", error);
    return NextResponse.json(
      { error: "Échec du téléversement de l'image." },
      { status: 500 }
    );
  }
}
