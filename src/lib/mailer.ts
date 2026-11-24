import nodemailer from "nodemailer";
import { formatMad } from "./format";

export interface OrderNotificationPayload {
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  city: string;
  address: string;
  notes?: string | null;
  totalMad: number;
  items: Array<{
    productTitle: string;
    variantSku: string;
    colorName: string;
    engineName: string;
    wheelName: string;
    quantity: number;
    unitPriceMad: number;
    lineTotalMad: number;
  }>;
}

/**
 * Sends an instant SMTP notification email for a new COD order.
 * Strictly non-blocking: logs errors cleanly and never throws to callers.
 */
export async function sendOrderNotificationEmail(
  payload: OrderNotificationPayload
): Promise<void> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const notifyTo = process.env.ORDER_NOTIFY_EMAIL;

  if (!host || !user || !pass || !notifyTo) {
    console.info(
      `[SMTP] Notification ignorée pour ${payload.reference} (variables SMTP non configurées).`
    );
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });

    const itemsRows = payload.items
      .map(
        (item) => `
          <tr>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e2db;">
              <strong>${item.productTitle}</strong><br/>
              <span style="color:#5a5d63;font-size:12px;">
                ${item.colorName} · ${item.engineName} · ${item.wheelName} (${item.variantSku})
              </span>
            </td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e2db;text-align:center;">${item.quantity}</td>
            <td style="padding:10px 12px;border-bottom:1px solid #e5e2db;text-align:right;font-family:monospace;">
              ${formatMad(item.lineTotalMad)}
            </td>
          </tr>
        `
      )
      .join("");

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;color:#141518;background:#f5f3ee;padding:24px;">
        <div style="background:#fdfcfa;border:1px solid #dcd6ca;padding:28px;">
          <p style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#c83e2b;margin:0 0 8px;">
            MAISON VÉLOCE · NOUVELLE COMMANDE COD
          </p>
          <h1 style="font-size:22px;margin:0 0 20px;">Référence ${payload.reference}</h1>
          <p style="margin:0 0 6px;"><strong>Client :</strong> ${payload.customerName}</p>
          <p style="margin:0 0 6px;"><strong>Téléphone :</strong> ${payload.customerPhone}</p>
          ${payload.customerEmail ? `<p style="margin:0 0 6px;"><strong>E-mail :</strong> ${payload.customerEmail}</p>` : ""}
          <p style="margin:0 0 6px;"><strong>Ville :</strong> ${payload.city}</p>
          <p style="margin:0 0 16px;"><strong>Adresse :</strong> ${payload.address}</p>
          ${payload.notes ? `<p style="margin:0 0 16px;padding:10px;background:#f5f3ee;"><strong>Note :</strong> ${payload.notes}</p>` : ""}
          <table style="width:100%;border-collapse:collapse;margin-top:12px;">
            <thead>
              <tr style="background:#f5f3ee;font-size:12px;text-transform:uppercase;">
                <th style="padding:10px 12px;text-align:left;">Configuration</th>
                <th style="padding:10px 12px;text-align:center;">Qté</th>
                <th style="padding:10px 12px;text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsRows}</tbody>
          </table>
          <p style="text-align:right;font-size:18px;font-weight:600;margin:18px 0 0;">
            Total TTC : ${formatMad(payload.totalMad)}
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to: notifyTo,
      subject: `[Maison Véloce] Nouvelle commande COD ${payload.reference} — ${payload.city}`,
      html,
    });
  } catch (error) {
    console.error(`[SMTP] Échec d'envoi pour ${payload.reference}:`, error);
  }
}
