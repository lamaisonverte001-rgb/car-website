import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/* Better Auth Tables (PostgreSQL + Drizzle Adapter)                           */
/* -------------------------------------------------------------------------- */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* -------------------------------------------------------------------------- */
/* Vehicles & Multi-Layer Variance Catalog (Couleur × Motorisation × Jantes)   */
/* -------------------------------------------------------------------------- */

export interface VehicleDimensions {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  trunkLiters: number;
  seats: number;
}

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  indexLabel: text("index_label").notNull(),
  name: text("name").notNull(),
  subtitle: text("subtitle").notNull(),
  category: text("category").notNull(), // "Hatchback" | "Berline" | "Coupé" | "SUV"
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  basePriceMad: integer("base_price_mad").notNull(),
  heroImageUrl: text("hero_image_url").notNull(),
  galleryImages: jsonb("gallery_images").$type<string[]>().notNull().default([]),
  warranty: text("warranty").notNull().default("5 ans ou 100 000 km"),
  deliveryEstimate: text("delivery_estimate").notNull().default("Livraison concierge sous 7 à 14 jours"),
  dimensions: jsonb("dimensions").$type<VehicleDimensions>().notNull(),
  highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productColors = pgTable(
  "product_colors",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    finish: text("finish").notNull(), // "Métallisé" | "Nacré" | "Satiné" | "Mat"
    hex: text("hex").notNull(),
    accentHex: text("accent_hex").notNull(),
    priceDeltaMad: integer("price_delta_mad").notNull().default(0),
    imageUrl: text("image_url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("product_colors_product_idx").on(table.productId)]
);

export const productEngines = pgTable(
  "product_engines",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    fuelType: text("fuel_type").notNull(),
    horsepower: integer("horsepower").notNull(),
    torqueNm: integer("torque_nm").notNull(),
    zeroToHundred: text("zero_to_hundred").notNull(),
    topSpeedKmh: integer("top_speed_kmh").notNull(),
    transmission: text("transmission").notNull(),
    consumption: text("consumption").notNull(),
    co2Gkm: integer("co2_gkm").notNull(),
    drivetrain: text("drivetrain").notNull(),
    priceDeltaMad: integer("price_delta_mad").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("product_engines_product_idx").on(table.productId)]
);

export type WheelStyle = "aero-5" | "diamond-10" | "turbine-15" | "forged-y" | "sport-5";
export type WheelFinish =
  | "silver"
  | "bicolor"
  | "anthracite"
  | "titanium"
  | "bronze"
  | "matte-black"
  | "gloss-black";

export const productWheels = pgTable(
  "product_wheels",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    sizeInches: integer("size_inches").notNull(),
    style: text("style").$type<WheelStyle>().notNull(),
    finish: text("finish").$type<WheelFinish>().notNull(),
    finishLabel: text("finish_label").notNull(),
    tireSpec: text("tire_spec").notNull(),
    weightNote: text("weight_note").notNull(),
    priceDeltaMad: integer("price_delta_mad").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [index("product_wheels_product_idx").on(table.productId)]
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    colorId: text("color_id")
      .notNull()
      .references(() => productColors.id, { onDelete: "cascade" }),
    engineId: text("engine_id")
      .notNull()
      .references(() => productEngines.id, { onDelete: "cascade" }),
    wheelId: text("wheel_id")
      .notNull()
      .references(() => productWheels.id, { onDelete: "cascade" }),
    sku: text("sku").notNull().unique(),
    variantLabel: text("variant_label").notNull(),
    priceMad: integer("price_mad").notNull(),
    stock: integer("stock").notNull().default(2),
    isActive: boolean("is_active").notNull().default(true),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("product_variants_combo_unique").on(
      table.productId,
      table.colorId,
      table.engineId,
      table.wheelId
    ),
    index("product_variants_product_idx").on(table.productId),
  ]
);

/* -------------------------------------------------------------------------- */
/* COD Orders & Immutable Order Item Snapshots                                 */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    reference: text("reference").notNull().unique(),
    status: text("status").$type<OrderStatus>().notNull().default("pending"),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    city: text("city").notNull(),
    address: text("address").notNull(),
    notes: text("notes"),
    totalMad: integer("total_mad").notNull(),
    paymentMethod: text("payment_method").notNull().default("COD"),
    clientIp: text("client_ip"),
    stockRestored: boolean("stock_restored").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("orders_status_idx").on(table.status),
    index("orders_created_idx").on(table.createdAt),
  ]
);

export const orderItems = pgTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    variantId: text("variant_id").references(() => productVariants.id, {
      onDelete: "set null",
    }),
    productTitle: text("product_title").notNull(),
    variantSku: text("variant_sku").notNull(),
    variantLabel: text("variant_label").notNull(),
    colorName: text("color_name").notNull(),
    engineName: text("engine_name").notNull(),
    wheelName: text("wheel_name").notNull(),
    imageUrl: text("image_url").notNull(),
    unitPriceMad: integer("unit_price_mad").notNull(),
    quantity: integer("quantity").notNull(),
    lineTotalMad: integer("line_total_mad").notNull(),
  },
  (table) => [index("order_items_order_idx").on(table.orderId)]
);

/* -------------------------------------------------------------------------- */
/* Drizzle Relations                                                           */
/* -------------------------------------------------------------------------- */

export const productsRelations = relations(products, ({ many }) => ({
  colors: many(productColors),
  engines: many(productEngines),
  wheels: many(productWheels),
  variants: many(productVariants),
}));

export const productColorsRelations = relations(productColors, ({ one }) => ({
  product: one(products, {
    fields: [productColors.productId],
    references: [products.id],
  }),
}));

export const productEnginesRelations = relations(productEngines, ({ one }) => ({
  product: one(products, {
    fields: [productEngines.productId],
    references: [products.id],
  }),
}));

export const productWheelsRelations = relations(productWheels, ({ one }) => ({
  product: one(products, {
    fields: [productWheels.productId],
    references: [products.id],
  }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  color: one(productColors, {
    fields: [productVariants.colorId],
    references: [productColors.id],
  }),
  engine: one(productEngines, {
    fields: [productVariants.engineId],
    references: [productEngines.id],
  }),
  wheel: one(productWheels, {
    fields: [productVariants.wheelId],
    references: [productWheels.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
}));
