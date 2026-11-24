"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MessageCircle,
  ShieldCheck,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { useCart } from "@/components/providers/cart-context";
import { formatMad } from "@/lib/format";
import { MOROCCAN_CITIES } from "@/lib/validations";

interface OrderSuccessState {
  reference: string;
  customerName: string;
  city: string;
  address: string;
  totalMad: number;
  whatsappUrl: string;
  items: Array<{
    productTitle: string;
    colorName: string;
    engineName: string;
    wheelName: string;
    quantity: number;
    lineTotalMad: number;
    variantSku: string;
  }>;
}

export function CartCheckoutDrawer() {
  const {
    items,
    isDrawerOpen,
    drawerStep,
    totalMad,
    closeDrawer,
    setDrawerStep,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [city, setCity] = useState<string>("Casablanca");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [website, setWebsite] = useState(""); // Anti-spam honeypot field

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<OrderSuccessState | null>(null);

  const handleClose = () => {
    closeDrawer();
    if (orderSuccess) {
      setTimeout(() => setOrderSuccess(null), 300);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerPhone,
          customerEmail,
          city,
          address,
          notes,
          website,
          items: items.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(
          data.error || "Impossible de valider votre commande. Veuillez vérifier vos champs."
        );
        return;
      }

      setOrderSuccess({
        reference: data.order.reference,
        customerName: data.order.customerName,
        city: data.order.city,
        address: data.order.address,
        totalMad: data.order.totalMad,
        whatsappUrl: data.whatsappUrl,
        items: data.order.items,
      });
      clearCart();
      setCustomerName("");
      setCustomerPhone("");
      setCustomerEmail("");
      setAddress("");
      setNotes("");
    } catch {
      setErrorMessage("Erreur réseau. Veuillez réessayer dans un instant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            className="fixed inset-0 bg-stage/65 backdrop-blur-xs"
          />

          {/* Slide-over Panel */}
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Sélection et commande COD"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-hairline bg-canvas text-ink shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-hairline bg-surface px-6 py-5">
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent">
                  {orderSuccess
                    ? "Commande enregistrée"
                    : drawerStep === "cart"
                      ? "Ma Sélection · Maison Véloce"
                      : "Paiement à la livraison (COD)"}
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">
                  {orderSuccess
                    ? `Référence ${orderSuccess.reference}`
                    : drawerStep === "cart"
                      ? "Configurations retenues"
                      : "Coordonnées de livraison"}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Fermer le panneau"
                className="flex h-9 w-9 items-center justify-center border border-hairline text-ink transition-colors hover:border-ink hover:bg-ink hover:text-ink-ivory"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {orderSuccess ? (
                /* STEP 3: ORDER CONFIRMED + WHATSAPP CONFIRMATION CTA */
                <div className="space-y-6">
                  <div className="border border-emerald-600/30 bg-emerald-50/70 p-5">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-950">
                          Votre réservation a bien été enregistrée.
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-emerald-900/80">
                          Notre équipe showroom à Casablanca a bloqué votre allocation.
                          Confirmez dès maintenant sur WhatsApp pour accélérer la mise en
                          préparation et convenir du créneau de livraison à{" "}
                          <strong>{orderSuccess.city}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Prominent WhatsApp Self-Confirmation CTA */}
                  <a
                    href={orderSuccess.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    id="whatsapp-confirm-button"
                    className="flex w-full items-center justify-center gap-2.5 bg-[#1F8A4C] px-5 py-4 text-xs font-semibold tracking-[0.12em] uppercase text-white transition-colors hover:bg-[#17723D]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Confirmer ma commande sur WhatsApp
                  </a>

                  {/* Immutable Snapshot Summary */}
                  <div className="border border-hairline bg-surface p-5">
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-muted">
                      Récapitulatif officiel · {orderSuccess.reference}
                    </p>
                    <div className="mt-4 space-y-3 border-b border-hairline pb-4">
                      {orderSuccess.items.map((item) => (
                        <div key={item.variantSku} className="text-xs">
                          <div className="flex justify-between font-semibold text-ink">
                            <span>
                              {item.productTitle} × {item.quantity}
                            </span>
                            <span className="font-mono tabular-nums">
                              {formatMad(item.lineTotalMad)}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-ink-muted">
                            {item.colorName} · {item.engineName} · {item.wheelName}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-ink-subtle">
                            SKU : {item.variantSku}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-ink-muted">
                      <p>
                        <strong className="text-ink">Destinataire :</strong>{" "}
                        {orderSuccess.customerName}
                      </p>
                      <p>
                        <strong className="text-ink">Livraison :</strong>{" "}
                        {orderSuccess.address}, {orderSuccess.city}
                      </p>
                      <p>
                        <strong className="text-ink">Règlement :</strong> Paiement à la livraison
                        (COD)
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-hairline pt-4">
                      <span className="font-mono text-[11px] uppercase text-ink-muted">
                        Total TTC
                      </span>
                      <span className="font-mono text-lg font-semibold tabular-nums text-ink">
                        {formatMad(orderSuccess.totalMad)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : items.length === 0 ? (
                /* EMPTY CART STATE */
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center border border-hairline bg-surface">
                    <ShoppingBag className="h-5 w-5 text-ink-muted" />
                  </div>
                  <p className="mt-5 text-base font-semibold text-ink">
                    Votre sélection est vide.
                  </p>
                  <p className="mt-2 max-w-xs text-xs leading-relaxed text-ink-muted">
                    Configurez l&apos;une de nos 4 silhouettes européennes en choisissant sa
                    teinte, sa motorisation et ses jantes.
                  </p>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-6 bg-ink px-5 py-3 text-xs font-semibold tracking-[0.12em] uppercase text-ink-ivory transition-colors hover:bg-accent"
                  >
                    Retourner au configurateur
                  </button>
                </div>
              ) : drawerStep === "cart" ? (
                /* STEP 1: CART ITEMS */
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.variantId}
                      className="border border-hairline bg-surface p-4"
                    >
                      <div className="flex gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-20 w-28 shrink-0 border border-hairline object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-ink">
                                {item.productName}
                              </p>
                              <p className="font-mono text-[10px] text-ink-subtle">
                                {item.sku}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.variantId)}
                              aria-label="Retirer cette configuration"
                              className="text-ink-subtle transition-colors hover:text-accent"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>

                          <ul className="mt-2 space-y-1 text-[11px] text-ink-muted">
                            <li className="flex items-center gap-1.5">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full border border-black/20"
                                style={{ backgroundColor: item.colorHex }}
                              />
                              <span>{item.colorName}</span>
                            </li>
                            <li>{item.engineName}</li>
                            <li>Jantes {item.wheelName}</li>
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
                        <div className="inline-flex items-center border border-hairline">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                            aria-label="Diminuer la quantité"
                            className="flex h-8 w-8 items-center justify-center text-ink hover:bg-surface-muted"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center font-mono text-xs tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                            disabled={item.quantity >= Math.min(3, item.maxStock)}
                            aria-label="Augmenter la quantité"
                            className="flex h-8 w-8 items-center justify-center text-ink hover:bg-surface-muted disabled:opacity-35"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <p className="font-mono text-sm font-semibold tabular-nums text-ink">
                          {formatMad(item.unitPriceMad * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* STEP 2: FRICTIONLESS COD CHECKOUT FORM */
                <form id="cod-order-form" onSubmit={handleSubmitOrder} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setDrawerStep("cart");
                    }}
                    className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.1em] uppercase text-ink-muted hover:text-ink"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Modifier ma sélection
                  </button>

                  {errorMessage && (
                    <div
                      role="alert"
                      className="border border-rose-500/40 bg-rose-50 px-4 py-3 text-xs text-rose-900"
                    >
                      {errorMessage}
                    </div>
                  )}

                  {/* Honeypot field — visually hidden for human users, catches bots */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="cod-website">Site web</label>
                    <input
                      id="cod-website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cod-name"
                      className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink"
                    >
                      Nom complet *
                    </label>
                    <input
                      id="cod-name"
                      type="text"
                      required
                      minLength={3}
                      placeholder="Ex. Youssef Benali"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1.5 w-full border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cod-phone"
                      className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink"
                    >
                      Téléphone / WhatsApp *
                    </label>
                    <input
                      id="cod-phone"
                      type="tel"
                      required
                      placeholder="Ex. 06 12 34 56 78 ou +212 6 12 34 56 78"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="mt-1.5 w-full border border-hairline bg-surface px-3.5 py-2.5 font-mono text-sm text-ink outline-none transition-colors focus:border-ink"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="cod-city"
                        className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink"
                      >
                        Ville *
                      </label>
                      <select
                        id="cod-city"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="mt-1.5 w-full border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink"
                      >
                        {MOROCCAN_CITIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="cod-email"
                        className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink"
                      >
                        E-mail (optionnel)
                      </label>
                      <input
                        id="cod-email"
                        type="email"
                        placeholder="nom@exemple.ma"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="mt-1.5 w-full border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="cod-address"
                      className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink"
                    >
                      Adresse de livraison *
                    </label>
                    <input
                      id="cod-address"
                      type="text"
                      required
                      minLength={6}
                      placeholder="Quartier, résidence, avenue..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="mt-1.5 w-full border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="cod-notes"
                      className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink"
                    >
                      Notes / Créneau souhaité (optionnel)
                    </label>
                    <textarea
                      id="cod-notes"
                      rows={2}
                      placeholder="Ex. Préférence livraison en fin d'après-midi, reprise éventuelle..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1.5 w-full border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition-colors focus:border-ink"
                    />
                  </div>

                  <div className="flex items-start gap-2.5 border border-hairline bg-surface-muted/60 p-3.5 text-xs text-ink-muted">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <p className="leading-relaxed">
                      <strong className="text-ink">Paiement à la livraison (COD) :</strong> aucun
                      paiement par carte requis aujourd&apos;hui. Vous inspectez le véhicule
                      configuré lors de la remise officielle avant règlement.
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Footer Action Bar */}
            {!orderSuccess && items.length > 0 && (
              <div className="border-t border-hairline bg-surface px-6 py-5">
                <div className="mb-4 flex items-baseline justify-between">
                  <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink-muted">
                    Total TTC (COD)
                  </span>
                  <span className="font-mono text-xl font-semibold tabular-nums text-ink">
                    {formatMad(totalMad)}
                  </span>
                </div>

                {drawerStep === "cart" ? (
                  <button
                    type="button"
                    id="drawer-proceed-checkout"
                    onClick={() => setDrawerStep("checkout")}
                    className="flex w-full items-center justify-center gap-2 bg-accent px-5 py-4 text-xs font-semibold tracking-[0.14em] uppercase text-white transition-colors hover:bg-accent-hover"
                  >
                    Passer la commande (COD)
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    form="cod-order-form"
                    id="drawer-submit-cod"
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 bg-accent px-5 py-4 text-xs font-semibold tracking-[0.14em] uppercase text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Validation en cours...
                      </>
                    ) : (
                      <>
                        Valider ma commande COD
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
