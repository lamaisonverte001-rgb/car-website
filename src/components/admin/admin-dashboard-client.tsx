"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  ExternalLink,
  Package,
  Layers,
  UploadCloud,
  MessageCircle,
  Check,
  RefreshCw,
  Search,
  AlertCircle,
} from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { formatMad, ORDER_STATUS_META } from "@/lib/format";
import { ORDER_STATUSES, type OrderStatus } from "@/db/schema";

export interface AdminOrderItem {
  id: string;
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
}

export interface AdminOrder {
  id: string;
  reference: string;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  city: string;
  address: string;
  notes: string | null;
  totalMad: number;
  stockRestored: boolean;
  createdAt: string;
  items: AdminOrderItem[];
}

export interface AdminVariantRow {
  id: string;
  productId: string;
  sku: string;
  variantLabel: string;
  priceMad: number;
  stock: number;
  isActive: boolean;
  imageUrl: string | null;
  color: { id: string; name: string; hex: string };
  engine: { id: string; name: string; code: string };
  wheel: { id: string; name: string; code: string };
}

export interface AdminVehicle {
  id: string;
  name: string;
  indexLabel: string;
  category: string;
  heroImageUrl: string;
  colors: Array<{ id: string; name: string; hex: string; imageUrl: string }>;
  variants: AdminVariantRow[];
}

interface AdminDashboardClientProps {
  adminUser: { name: string; email: string };
  initialOrders: AdminOrder[];
  initialVehicles: AdminVehicle[];
  r2Configured: boolean;
}

export function AdminDashboardClient({
  adminUser,
  initialOrders,
  initialVehicles,
  r2Configured,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "inventory" | "media">("orders");
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [vehicles, setVehicles] = useState<AdminVehicle[]>(initialVehicles);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Inventory filters & inline drafts
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState<string>(
    initialVehicles[0]?.id ?? "all"
  );
  const [skuSearch, setSkuSearch] = useState("");
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);
  const [variantDrafts, setVariantDrafts] = useState<
    Record<string, { stock: number; priceMad: number; isActive: boolean }>
  >({});

  // Media upload state
  const [uploadVehicleId, setUploadVehicleId] = useState<string>(
    initialVehicles[0]?.id ?? ""
  );
  const [uploadColorId, setUploadColorId] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const showToast = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 4000);
  };

  const refreshAll = async () => {
    try {
      const [ordRes, catRes] = await Promise.all([
        fetch("/api/admin/orders"),
        fetch("/api/admin/catalog"),
      ]);
      if (ordRes.ok) {
        const d = await ordRes.json();
        setOrders(d.orders);
      }
      if (catRes.ok) {
        const d = await catRes.json();
        setVehicles(d.vehicles);
      }
      showToast("ok", "Données actualisées depuis PostgreSQL.");
    } catch {
      showToast("err", "Erreur lors de l'actualisation.");
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/admin/login");
    router.refresh();
  };

  const handleOrderStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("err", data.error || "Échec de mise à jour du statut.");
        return;
      }

      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      // Refresh catalog if cancellation/reactivation altered stock
      const catRes = await fetch("/api/admin/catalog");
      if (catRes.ok) {
        const catData = await catRes.json();
        setVehicles(catData.vehicles);
      }
      showToast(
        "ok",
        nextStatus === "cancelled"
          ? `Commande ${data.order.reference} annulée — stock restauré automatiquement.`
          : `Commande ${data.order.reference} passée en « ${ORDER_STATUS_META[nextStatus]?.label} ».`
      );
    } catch {
      showToast("err", "Erreur réseau lors du changement de statut.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getDraft = (v: AdminVariantRow) =>
    variantDrafts[v.id] ?? { stock: v.stock, priceMad: v.priceMad, isActive: v.isActive };

  const handleSaveVariant = async (v: AdminVariantRow) => {
    const draft = getDraft(v);
    setSavingVariantId(v.id);
    try {
      const res = await fetch(`/api/admin/variants/${v.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("err", data.error || "Erreur de mise à jour.");
        return;
      }

      setVehicles((prev) =>
        prev.map((veh) => ({
          ...veh,
          variants: veh.variants.map((row) =>
            row.id === v.id
              ? {
                  ...row,
                  stock: data.variant.stock,
                  priceMad: data.variant.priceMad,
                  isActive: data.variant.isActive,
                }
              : row
          ),
        }))
      );
      showToast("ok", `Variante ${v.sku} enregistrée.`);
    } catch {
      showToast("err", "Erreur réseau.");
    } finally {
      setSavingVariantId(null);
    }
  };

  const handleUploadMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadVehicleId) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", uploadFile);
      fd.append("productId", uploadVehicleId);
      if (uploadColorId) fd.append("colorId", uploadColorId);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("err", data.error || "Échec de l'upload.");
        return;
      }

      setUploadFile(null);
      await refreshAll();
      showToast(
        "ok",
        `Image téléversée (${data.storage === "r2" ? "Cloudflare R2" : "stockage local"}) et appliquée.`
      );
    } catch {
      showToast("err", "Erreur réseau durant le téléversement.");
    } finally {
      setUploading(false);
    }
  };

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === "pending").length;
    const confirmedOrShipped = orders.filter(
      (o) => o.status === "confirmed" || o.status === "shipped"
    ).length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const activeRevenue = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((acc, o) => acc + o.totalMad, 0);
    return { total: orders.length, pending, confirmedOrShipped, delivered, activeRevenue };
  }, [orders]);

  const filteredOrders =
    statusFilter === "all" ? orders : orders.filter((o) => o.status === statusFilter);

  const visibleVariants = useMemo(() => {
    const list = vehicles
      .filter((veh) => selectedVehicleFilter === "all" || veh.id === selectedVehicleFilter)
      .flatMap((veh) =>
        veh.variants.map((variant) => ({
          ...variant,
          vehicleName: veh.name,
        }))
      );
    const q = skuSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (item) =>
        item.sku.toLowerCase().includes(q) ||
        item.variantLabel.toLowerCase().includes(q) ||
        item.vehicleName.toLowerCase().includes(q)
    );
  }, [vehicles, selectedVehicleFilter, skuSearch]);

  const selectedUploadVehicle = vehicles.find((v) => v.id === uploadVehicleId);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* Admin Top Bar */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-surface/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center bg-ink font-mono text-xs font-semibold text-ink-ivory">
              MV
            </span>
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] uppercase text-ink">
                Maison Véloce · Admin
              </p>
              <p className="font-mono text-[10px] text-ink-muted">{adminUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={refreshAll}
              className="inline-flex items-center gap-1.5 border border-hairline bg-canvas px-3 py-2 font-mono text-[11px] uppercase text-ink hover:border-ink"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 border border-hairline bg-canvas px-3 py-2 font-mono text-[11px] uppercase text-ink hover:border-ink"
            >
              Showroom
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 bg-ink px-3.5 py-2 font-mono text-[11px] uppercase text-ink-ivory hover:bg-accent"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8">
        {/* Toast feedback */}
        {toast && (
          <div
            role="status"
            className={`mb-6 flex items-center gap-2 border px-4 py-3 text-xs font-medium ${
              toast.type === "ok"
                ? "border-emerald-600/30 bg-emerald-50 text-emerald-900"
                : "border-rose-500/40 bg-rose-50 text-rose-900"
            }`}
          >
            {toast.type === "ok" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
        )}

        {/* KPI Metrics Strip */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-hairline bg-surface p-5">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-muted">
              Commandes COD
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">
              {stats.total}
            </p>
            <p className="mt-1 text-xs text-ink-subtle">Toutes périodes confondues</p>
          </div>
          <div className="border border-hairline bg-surface p-5">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-amber-700">
              En attente de confirmation
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">
              {stats.pending}
            </p>
            <p className="mt-1 text-xs text-ink-subtle">À rappeler / valider sur WhatsApp</p>
          </div>
          <div className="border border-hairline bg-surface p-5">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-muted">
              En cours / Livrées
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink">
              {stats.confirmedOrShipped} / {stats.delivered}
            </p>
            <p className="mt-1 text-xs text-ink-subtle">Préparation & remises finalisées</p>
          </div>
          <div className="border border-ink bg-ink p-5 text-ink-ivory">
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-ivory-muted">
              Volume Actif TTC
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tabular-nums text-ink-ivory">
              {formatMad(stats.activeRevenue)}
            </p>
            <p className="mt-1 text-xs text-ink-ivory-muted">Hors commandes annulées</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-hairline pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`inline-flex items-center gap-2 border px-4 py-2.5 font-mono text-xs uppercase transition-colors ${
              activeTab === "orders"
                ? "border-ink bg-ink text-ink-ivory"
                : "border-hairline bg-surface text-ink hover:border-ink"
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            Commandes COD ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`inline-flex items-center gap-2 border px-4 py-2.5 font-mono text-xs uppercase transition-colors ${
              activeTab === "inventory"
                ? "border-ink bg-ink text-ink-ivory"
                : "border-hairline bg-surface text-ink hover:border-ink"
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            Stock & Variantes (144 SKUs)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`inline-flex items-center gap-2 border px-4 py-2.5 font-mono text-xs uppercase transition-colors ${
              activeTab === "media"
                ? "border-ink bg-ink text-ink-ivory"
                : "border-hairline bg-surface text-ink hover:border-ink"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Médias & Cloudflare R2
          </button>
        </div>

        {/* =============================================================== */}
        {/* TAB 1: COD ORDERS MANAGEMENT                                     */}
        {/* =============================================================== */}
        {activeTab === "orders" && (
          <section className="mt-6 space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {["all", ...ORDER_STATUSES].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`border px-3 py-1.5 font-mono text-[11px] uppercase transition-colors ${
                    statusFilter === st
                      ? "border-accent bg-accent text-white"
                      : "border-hairline bg-surface text-ink-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  {st === "all" ? "Toutes" : ORDER_STATUS_META[st]?.label ?? st}
                </button>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="border border-hairline bg-surface p-12 text-center">
                <p className="text-sm font-semibold text-ink">Aucune commande dans ce filtre.</p>
                <p className="mt-1 text-xs text-ink-muted">
                  Les nouvelles réservations COD du showroom apparaîtront ici en temps réel.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const meta = ORDER_STATUS_META[order.status] ?? ORDER_STATUS_META.pending;
                  const cleanCustomerPhone = order.customerPhone.replace(/[^\d]/g, "");
                  const waPhone = cleanCustomerPhone.startsWith("0")
                    ? `212${cleanCustomerPhone.slice(1)}`
                    : cleanCustomerPhone;
                  const waFollowup = `https://wa.me/${waPhone}?text=${encodeURIComponent(
                    `Bonjour ${order.customerName}, ici le showroom Maison Véloce Casablanca concernant votre commande ${order.reference} (${formatMad(order.totalMad)}).`
                  )}`;

                  return (
                    <article
                      key={order.id}
                      className="border border-hairline bg-surface p-5 sm:p-6"
                    >
                      <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-4 lg:flex-row lg:items-center">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="font-mono text-sm font-semibold text-ink">
                            {order.reference}
                          </span>
                          <span
                            className={`border px-2.5 py-0.5 font-mono text-[10px] uppercase ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                          <span className="font-mono text-[11px] text-ink-subtle">
                            {new Date(order.createdAt).toLocaleString("fr-MA", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                          {order.stockRestored && (
                            <span className="font-mono text-[10px] text-rose-700">
                              · Stock restauré
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          <a
                            href={waFollowup}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 border border-emerald-600/30 bg-emerald-50 px-3 py-1.5 font-mono text-[11px] text-emerald-900 hover:bg-emerald-100"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp client
                          </a>

                          <select
                            aria-label={`Statut de la commande ${order.reference}`}
                            value={order.status}
                            disabled={updatingOrderId === order.id}
                            onChange={(e) =>
                              handleOrderStatusChange(
                                order.id,
                                e.target.value as OrderStatus
                              )
                            }
                            className="border border-ink bg-canvas px-3 py-1.5 font-mono text-xs font-medium text-ink outline-none"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {ORDER_STATUS_META[st]?.label ?? st}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-6 lg:grid-cols-12">
                        {/* Customer details */}
                        <div className="space-y-1.5 text-xs lg:col-span-4">
                          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-subtle">
                            Client & Livraison COD
                          </p>
                          <p className="text-sm font-semibold text-ink">{order.customerName}</p>
                          <p className="font-mono text-ink">{order.customerPhone}</p>
                          {order.customerEmail && (
                            <p className="text-ink-muted">{order.customerEmail}</p>
                          )}
                          <p className="text-ink-muted">
                            {order.address}, <strong className="text-ink">{order.city}</strong>
                          </p>
                          {order.notes && (
                            <p className="mt-2 border-l-2 border-accent pl-2.5 text-ink-muted">
                              Note : {order.notes}
                            </p>
                          )}
                        </div>

                        {/* Immutable ordered vehicle configurations */}
                        <div className="space-y-2.5 lg:col-span-8">
                          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-subtle">
                            Véhicules configurés (Snapshot immuable)
                          </p>
                          {order.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-3 border border-hairline bg-canvas/60 p-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.imageUrl}
                                  alt={item.productTitle}
                                  className="h-12 w-18 border border-hairline object-cover"
                                />
                                <div>
                                  <p className="font-semibold text-ink">
                                    {item.productTitle} × {item.quantity}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-ink-muted">
                                    {item.colorName} · {item.engineName} · {item.wheelName}
                                  </p>
                                  <p className="font-mono text-[10px] text-ink-subtle">
                                    SKU : {item.variantSku}
                                  </p>
                                </div>
                              </div>
                              <p className="font-mono text-sm font-semibold tabular-nums text-ink">
                                {formatMad(item.lineTotalMad)}
                              </p>
                            </div>
                          ))}

                          <div className="flex items-center justify-between pt-2">
                            <span className="font-mono text-[11px] uppercase text-ink-muted">
                              Total Commande COD
                            </span>
                            <span className="font-mono text-lg font-semibold tabular-nums text-ink">
                              {formatMad(order.totalMad)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* =============================================================== */}
        {/* TAB 2: MULTI-LAYER INVENTORY MATRIX (144 SKUs)                   */}
        {/* =============================================================== */}
        {activeTab === "inventory" && (
          <section className="mt-6 space-y-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedVehicleFilter("all")}
                  className={`border px-3 py-1.5 font-mono text-[11px] uppercase ${
                    selectedVehicleFilter === "all"
                      ? "border-ink bg-ink text-ink-ivory"
                      : "border-hairline bg-surface text-ink"
                  }`}
                >
                  Tous (4)
                </button>
                {vehicles.map((veh) => (
                  <button
                    key={veh.id}
                    type="button"
                    onClick={() => setSelectedVehicleFilter(veh.id)}
                    className={`border px-3 py-1.5 font-mono text-[11px] uppercase ${
                      selectedVehicleFilter === veh.id
                        ? "border-ink bg-ink text-ink-ivory"
                        : "border-hairline bg-surface text-ink"
                    }`}
                  >
                    {veh.name}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
                <input
                  type="search"
                  placeholder="Filtrer SKU, teinte, moteur, jante..."
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  className="w-full border border-hairline bg-surface py-2 pl-9 pr-3 text-xs text-ink outline-none focus:border-ink"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-hairline bg-surface">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-hairline bg-canvas font-mono text-[10px] tracking-[0.12em] uppercase text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">SKU & Modèle</th>
                    <th className="px-4 py-3">Teinte · Moteur · Jantes</th>
                    <th className="px-4 py-3">Prix TTC (DH)</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {visibleVariants.map((row) => {
                    const draft = getDraft(row);
                    const dirty =
                      draft.stock !== row.stock ||
                      draft.priceMad !== row.priceMad ||
                      draft.isActive !== row.isActive;

                    return (
                      <tr key={row.id} className="hover:bg-canvas/50">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-ink">{row.vehicleName}</p>
                          <p className="font-mono text-[10px] text-ink-subtle">{row.sku}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3 w-3 shrink-0 rounded-full border border-black/20"
                              style={{ backgroundColor: row.color.hex }}
                            />
                            <span className="text-ink">{row.color.name}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-ink-muted">
                            {row.engine.name} · {row.wheel.name}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            step={1000}
                            min={50000}
                            value={draft.priceMad}
                            onChange={(e) =>
                              setVariantDrafts((prev) => ({
                                ...prev,
                                [row.id]: {
                                  ...draft,
                                  priceMad: Number(e.target.value) || 0,
                                },
                              }))
                            }
                            className="w-28 border border-hairline bg-canvas px-2.5 py-1.5 font-mono text-xs tabular-nums text-ink focus:border-ink"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={draft.stock}
                            onChange={(e) =>
                              setVariantDrafts((prev) => ({
                                ...prev,
                                [row.id]: {
                                  ...draft,
                                  stock: Math.max(0, Number(e.target.value) || 0),
                                },
                              }))
                            }
                            className="w-16 border border-hairline bg-canvas px-2.5 py-1.5 font-mono text-xs tabular-nums text-ink focus:border-ink"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              setVariantDrafts((prev) => ({
                                ...prev,
                                [row.id]: { ...draft, isActive: !draft.isActive },
                              }))
                            }
                            className={`border px-2.5 py-1 font-mono text-[10px] uppercase ${
                              draft.isActive
                                ? "border-emerald-600/30 bg-emerald-50 text-emerald-800"
                                : "border-rose-500/30 bg-rose-50 text-rose-800"
                            }`}
                          >
                            {draft.isActive ? "Actif" : "Masqué"}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={!dirty || savingVariantId === row.id}
                            onClick={() => handleSaveVariant(row)}
                            className="bg-ink px-3 py-1.5 font-mono text-[10px] uppercase text-ink-ivory transition-colors hover:bg-accent disabled:opacity-30"
                          >
                            {savingVariantId === row.id ? "..." : "Enregistrer"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* =============================================================== */}
        {/* TAB 3: CLOUDFLARE R2 MEDIA UPLOAD                                */}
        {/* =============================================================== */}
        {activeTab === "media" && (
          <section className="mt-6 grid gap-8 lg:grid-cols-12">
            <form
              onSubmit={handleUploadMedia}
              className="space-y-5 border border-hairline bg-surface p-6 lg:col-span-5"
            >
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent">
                  Téléversement Média · Cloudflare R2 (S3)
                </p>
                <h2 className="mt-1 text-lg font-semibold text-ink">
                  Mettre à jour un visuel véhicule
                </h2>
              </div>

              <div
                className={`border px-3.5 py-2.5 text-xs ${
                  r2Configured
                    ? "border-emerald-600/30 bg-emerald-50 text-emerald-900"
                    : "border-amber-500/35 bg-amber-50 text-amber-900"
                }`}
              >
                {r2Configured
                  ? "Connecté à Cloudflare R2 — les visuels seront hébergés sur votre bucket R2."
                  : "Variables R2 non renseignées dans .env : bascule automatique en stockage local (/public/uploads) en attendant la configuration R2."}
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase text-ink">
                  Véhicule cible
                </label>
                <select
                  value={uploadVehicleId}
                  onChange={(e) => {
                    setUploadVehicleId(e.target.value);
                    setUploadColorId("");
                  }}
                  className="mt-1.5 w-full border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.indexLabel} · {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase text-ink">
                  Teinte spécifique (optionnel)
                </label>
                <select
                  value={uploadColorId}
                  onChange={(e) => setUploadColorId(e.target.value)}
                  className="mt-1.5 w-full border border-hairline bg-canvas px-3 py-2.5 text-sm text-ink"
                >
                  <option value="">Image principale du modèle (Hero)</option>
                  {selectedUploadVehicle?.colors.map((c) => (
                    <option key={c.id} value={c.id}>
                      Teinte · {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] uppercase text-ink">
                  Fichier image (JPG, PNG, WebP · max 10 Mo)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className="mt-1.5 block w-full border border-dashed border-hairline bg-canvas p-4 text-xs text-ink"
                />
              </div>

              <button
                type="submit"
                disabled={!uploadFile || uploading}
                className="flex w-full items-center justify-center gap-2 bg-accent px-5 py-3.5 text-xs font-semibold tracking-[0.12em] uppercase text-white hover:bg-accent-hover disabled:opacity-50"
              >
                <UploadCloud className="h-4 w-4" />
                {uploading ? "Téléversement..." : "Téléverser & Appliquer"}
              </button>
            </form>

            {/* Current Color Visuals Overview */}
            <div className="border border-hairline bg-surface p-6 lg:col-span-7">
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink-muted">
                Galerie Studio Active · {selectedUploadVehicle?.name}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {selectedUploadVehicle?.colors.map((c) => (
                  <div key={c.id} className="border border-hairline bg-canvas">
                    <div className="aspect-[16/10] bg-stage">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.imageUrl}
                        alt={c.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2.5 text-xs">
                      <span
                        className="h-3 w-3 rounded-full border border-black/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="font-medium text-ink">{c.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
