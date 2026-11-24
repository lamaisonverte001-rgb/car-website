import "dotenv/config";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import {
  db,
  pool,
  products,
  productColors,
  productEngines,
  productWheels,
  productVariants,
  user,
  account,
} from "./index";
import { SEED_VEHICLES } from "./seed-data";

async function seedAdminAccount() {
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@maison-veloce.ma").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "VeloceAdmin2026!";
  const adminName = process.env.ADMIN_NAME || "Direction Maison Véloce";

  const existing = await db.query.user.findFirst({
    where: eq(user.email, adminEmail),
  });

  if (existing) {
    console.log(`✓ Compte administrateur déjà présent (${adminEmail})`);
    return;
  }

  const userId = "admin-maison-veloce-01";
  const accountId = "account-admin-maison-veloce-01";
  const passwordHash = await hashPassword(adminPassword);

  await db.insert(user).values({
    id: userId,
    name: adminName,
    email: adminEmail,
    emailVerified: true,
    role: "admin",
  });

  await db.insert(account).values({
    id: accountId,
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
  });

  console.log(`✓ Compte administrateur initial créé : ${adminEmail}`);
}

async function seedCatalog() {
  let totalVariants = 0;

  for (const v of SEED_VEHICLES) {
    await db
      .insert(products)
      .values({
        id: v.id,
        slug: v.slug,
        indexLabel: v.indexLabel,
        name: v.name,
        subtitle: v.subtitle,
        category: v.category,
        tagline: v.tagline,
        description: v.description,
        basePriceMad: v.basePriceMad,
        heroImageUrl: v.heroImageUrl,
        galleryImages: v.colors.map((c) => c.imageUrl),
        warranty: v.warranty,
        deliveryEstimate: v.deliveryEstimate,
        dimensions: v.dimensions,
        highlights: v.highlights,
        isFeatured: v.isFeatured,
        isActive: true,
        sortOrder: v.sortOrder,
      })
      .onConflictDoUpdate({
        target: products.id,
        set: {
          name: v.name,
          subtitle: v.subtitle,
          category: v.category,
          tagline: v.tagline,
          description: v.description,
          basePriceMad: v.basePriceMad,
          heroImageUrl: v.heroImageUrl,
          galleryImages: v.colors.map((c) => c.imageUrl),
          warranty: v.warranty,
          deliveryEstimate: v.deliveryEstimate,
          dimensions: v.dimensions,
          highlights: v.highlights,
          isFeatured: v.isFeatured,
          sortOrder: v.sortOrder,
          updatedAt: new Date(),
        },
      });

    for (let i = 0; i < v.colors.length; i++) {
      const c = v.colors[i];
      await db
        .insert(productColors)
        .values({
          id: c.id,
          productId: v.id,
          name: c.name,
          code: c.code,
          finish: c.finish,
          hex: c.hex,
          accentHex: c.accentHex,
          priceDeltaMad: c.priceDeltaMad,
          imageUrl: c.imageUrl,
          sortOrder: i,
        })
        .onConflictDoUpdate({
          target: productColors.id,
          set: {
            name: c.name,
            code: c.code,
            finish: c.finish,
            hex: c.hex,
            accentHex: c.accentHex,
            priceDeltaMad: c.priceDeltaMad,
            imageUrl: c.imageUrl,
            sortOrder: i,
          },
        });
    }

    for (let i = 0; i < v.engines.length; i++) {
      const e = v.engines[i];
      await db
        .insert(productEngines)
        .values({
          id: e.id,
          productId: v.id,
          name: e.name,
          code: e.code,
          fuelType: e.fuelType,
          horsepower: e.horsepower,
          torqueNm: e.torqueNm,
          zeroToHundred: e.zeroToHundred,
          topSpeedKmh: e.topSpeedKmh,
          transmission: e.transmission,
          consumption: e.consumption,
          co2Gkm: e.co2Gkm,
          drivetrain: e.drivetrain,
          priceDeltaMad: e.priceDeltaMad,
          sortOrder: i,
        })
        .onConflictDoUpdate({
          target: productEngines.id,
          set: {
            name: e.name,
            code: e.code,
            fuelType: e.fuelType,
            horsepower: e.horsepower,
            torqueNm: e.torqueNm,
            zeroToHundred: e.zeroToHundred,
            topSpeedKmh: e.topSpeedKmh,
            transmission: e.transmission,
            consumption: e.consumption,
            co2Gkm: e.co2Gkm,
            drivetrain: e.drivetrain,
            priceDeltaMad: e.priceDeltaMad,
            sortOrder: i,
          },
        });
    }

    for (let i = 0; i < v.wheels.length; i++) {
      const w = v.wheels[i];
      await db
        .insert(productWheels)
        .values({
          id: w.id,
          productId: v.id,
          name: w.name,
          code: w.code,
          sizeInches: w.sizeInches,
          style: w.style,
          finish: w.finish,
          finishLabel: w.finishLabel,
          tireSpec: w.tireSpec,
          weightNote: w.weightNote,
          priceDeltaMad: w.priceDeltaMad,
          sortOrder: i,
        })
        .onConflictDoUpdate({
          target: productWheels.id,
          set: {
            name: w.name,
            code: w.code,
            sizeInches: w.sizeInches,
            style: w.style,
            finish: w.finish,
            finishLabel: w.finishLabel,
            tireSpec: w.tireSpec,
            weightNote: w.weightNote,
            priceDeltaMad: w.priceDeltaMad,
            sortOrder: i,
          },
        });
    }

    // Generate full 3-layer variant matrix: Color × Engine × Jantes
    const shortPrefix = v.id.toUpperCase().replace(/[^A-Z0-9]/g, "");
    for (let ci = 0; ci < v.colors.length; ci++) {
      const c = v.colors[ci];
      for (let ei = 0; ei < v.engines.length; ei++) {
        const e = v.engines[ei];
        for (let wi = 0; wi < v.wheels.length; wi++) {
          const w = v.wheels[wi];
          const variantId = `${v.id}__${c.code.toLowerCase()}__${e.code.toLowerCase()}__${w.code.toLowerCase()}`;
          const sku = `MV-${shortPrefix}-${c.code}-${e.code}-${w.code}`;
          const priceMad = v.basePriceMad + c.priceDeltaMad + e.priceDeltaMad + w.priceDeltaMad;
          const variantLabel = `${c.name} · ${e.name} · Jantes ${w.name}`;
          // Realistic showroom allocation stock (1 to 4 units per configuration)
          const initialStock = ei === 2 && wi === 2 ? 1 : ci === 0 && ei === 0 ? 4 : 2;

          await db
            .insert(productVariants)
            .values({
              id: variantId,
              productId: v.id,
              colorId: c.id,
              engineId: e.id,
              wheelId: w.id,
              sku,
              variantLabel,
              priceMad,
              stock: initialStock,
              isActive: true,
              imageUrl: c.imageUrl,
            })
            .onConflictDoNothing({ target: productVariants.id });

          totalVariants++;
        }
      }
    }

    console.log(`✓ Véhicule initialisé : ${v.name} (36 configurations multi-couches)`);
  }

  console.log(`✓ Matrice complète : ${SEED_VEHICLES.length} véhicules · ${totalVariants} variantes SKUs`);
}

async function main() {
  console.log("— Initialisation de la base Maison Véloce —");
  await seedAdminAccount();
  await seedCatalog();
  await pool.end();
  console.log("— Seed terminé avec succès —");
}

main().catch(async (err) => {
  console.error("Erreur lors du seed :", err);
  await pool.end();
  process.exit(1);
});
