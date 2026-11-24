import { z } from "zod";
import { ORDER_STATUSES } from "@/db/schema";

/**
 * Moroccan / International phone validation.
 * Cleanly accepts spaced formats like "06 12 34 56 78", "+212 6 12 34 56 78",
 * "0612345678", "+212612345678", or international "+33 6 12 34 56 78".
 */
const ALLOWED_PHONE_CHARS = /^[\d+\s().-]+$/;
const MOROCCO_OR_INTL_NORMALIZED = /^(?:(?:\+?212|0)[5-8]\d{8}|\+[1-9]\d{7,14})$/;

export function isValidPhoneNumber(raw: string): boolean {
  const trimmed = raw.trim();
  if (!ALLOWED_PHONE_CHARS.test(trimmed)) return false;
  const normalized = trimmed.replace(/[\s().-]/g, "");
  return MOROCCO_OR_INTL_NORMALIZED.test(normalized);
}

export const MOROCCAN_CITIES = [
  "Casablanca",
  "Rabat",
  "Marrakech",
  "Tanger",
  "Agadir",
  "Fès",
  "Meknès",
  "Oujda",
  "Kénitra",
  "Tétouan",
  "Mohammédia",
  "El Jadida",
  "Essaouira",
  "Bouskoura",
  "Autre ville (Maroc)",
] as const;

export const orderItemInputSchema = z.object({
  variantId: z.string().min(1, "Configuration invalide"),
  quantity: z.number().int().min(1, "Quantité minimale : 1").max(3, "Maximum 3 véhicules par commande"),
});

export const createCodOrderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(3, "Veuillez indiquer votre nom complet (minimum 3 caractères).")
    .max(120, "Nom trop long."),
  customerPhone: z
    .string()
    .trim()
    .refine(
      (val) => isValidPhoneNumber(val),
      "Numéro de téléphone invalide (ex. 06 12 34 56 78 ou +212 6 12 34 56 78)."
    ),
  customerEmail: z
    .string()
    .trim()
    .email("Adresse e-mail invalide.")
    .optional()
    .or(z.literal("")),
  city: z.string().trim().min(2, "Veuillez sélectionner votre ville.").max(80),
  address: z
    .string()
    .trim()
    .min(6, "Veuillez préciser votre adresse ou quartier de livraison.")
    .max(300),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  // Honeypot anti-spam field — must remain empty
  website: z.string().max(0, "Requête refusée.").optional().default(""),
  items: z.array(orderItemInputSchema).min(1, "Votre sélection est vide.").max(6),
});

export type CreateCodOrderInput = z.infer<typeof createCodOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

export const updateVariantSchema = z.object({
  stock: z.number().int().min(0).max(99).optional(),
  priceMad: z.number().int().min(50000).max(5000000).optional(),
  isActive: z.boolean().optional(),
});

export const updateProductImageSchema = z.object({
  productId: z.string().min(1),
  colorId: z.string().optional(),
  imageUrl: z.string().url("URL d'image invalide").or(z.string().startsWith("/")),
});
