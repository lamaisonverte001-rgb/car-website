/**
 * Format MAD (Dirham Marocain) amounts cleanly with French narrow spaces.
 * e.g. 325000 -> "325 000 DH"
 */
export function formatMad(amount: number): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  })
    .format(Math.round(amount))
    .replace(/\u202f|\u00a0/g, " ");
  return `${formatted} DH`;
}

export function formatMadDelta(delta: number): string {
  if (delta === 0) return "Inclus";
  return `+${formatMad(delta)}`;
}

export interface WhatsAppOrderPayload {
  reference: string;
  customerName: string;
  city: string;
  address: string;
  totalMad: number;
  items: Array<{
    productTitle: string;
    colorName: string;
    engineName: string;
    wheelName: string;
    quantity: number;
    lineTotalMad: number;
  }>;
}

export function buildWhatsAppConfirmationUrl(payload: WhatsAppOrderPayload): string {
  const phone = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "212600000000").replace(
    /[^\d]/g,
    ""
  );
  const itemsText = payload.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.productTitle} (x${item.quantity})\n   • Teinte : ${item.colorName}\n   • Motorisation : ${item.engineName}\n   • Jantes : ${item.wheelName}\n   • Montant : ${formatMad(item.lineTotalMad)}`
    )
    .join("\n\n");

  const message = [
    `Bonjour Maison Véloce,`,
    ``,
    `Je souhaite confirmer ma commande en paiement à la livraison (COD) :`,
    `• Référence : ${payload.reference}`,
    `• Client : ${payload.customerName}`,
    `• Ville : ${payload.city}`,
    `• Adresse : ${payload.address}`,
    ``,
    `Configuration(s) réservée(s) :`,
    itemsText,
    ``,
    `Total TTC : ${formatMad(payload.totalMad)}`,
    ``,
    `Merci de bien vouloir me recontacter pour planifier la livraison.`,
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export const ORDER_STATUS_META: Record<
  string,
  { label: string; description: string; badgeClass: string }
> = {
  pending: {
    label: "En attente",
    description: "À confirmer par téléphone / WhatsApp",
    badgeClass: "bg-amber-500/15 text-amber-800 border-amber-500/30",
  },
  confirmed: {
    label: "Confirmée",
    description: "Validée avec le client — préparation atelier",
    badgeClass: "bg-sky-500/15 text-sky-800 border-sky-500/30",
  },
  shipped: {
    label: "En livraison",
    description: "Transporteur concierge en route",
    badgeClass: "bg-indigo-500/15 text-indigo-800 border-indigo-500/30",
  },
  delivered: {
    label: "Livrée",
    description: "Remise des clés & règlement finalisé",
    badgeClass: "bg-emerald-500/15 text-emerald-800 border-emerald-500/30",
  },
  cancelled: {
    label: "Annulée",
    description: "Stock automatiquement restauré",
    badgeClass: "bg-rose-500/15 text-rose-800 border-rose-500/30",
  },
};
