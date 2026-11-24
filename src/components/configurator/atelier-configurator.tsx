"use client";

import React, { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Gauge,
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Box,
  Camera,
  ShieldCheck,
  Truck,
  Layers,
  AlertCircle,
} from "lucide-react";
import type { CatalogVehicle } from "@/lib/catalog";
import { formatMad, formatMadDelta } from "@/lib/format";
import { useCart } from "@/components/providers/cart-context";
import { WheelSvg } from "./wheel-svg";

const WheelStudio3D = dynamic(() => import("./wheel-studio-3d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center bg-stage text-ink-ivory-muted">
      <div className="h-10 w-10 animate-spin rounded-full border border-white/15 border-t-accent" />
      <p className="mt-4 font-mono text-[11px] tracking-[0.16em] uppercase">
        Chargement de l&apos;Atelier 3D...
      </p>
    </div>
  ),
});

interface AtelierConfiguratorProps {
  vehicles: CatalogVehicle[];
  initialVehicleSlug?: string;
  lockVehicle?: boolean;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function AtelierConfigurator({
  vehicles,
  initialVehicleSlug,
  lockVehicle = false,
}: AtelierConfiguratorProps) {
  const prefersReducedMotion = useReducedMotion();
  const { addItem } = useCart();

  const initialVehicle =
    vehicles.find((v) => v.slug === initialVehicleSlug) ?? vehicles[0];

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(
    initialVehicle?.id ?? ""
  );

  const vehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedVehicleId) ?? vehicles[0],
    [vehicles, selectedVehicleId]
  );

  const [colorId, setColorId] = useState<string>(vehicle?.colors[0]?.id ?? "");
  const [engineId, setEngineId] = useState<string>(vehicle?.engines[0]?.id ?? "");
  const [wheelId, setWheelId] = useState<string>(vehicle?.wheels[0]?.id ?? "");
  const [stageMode, setStageMode] = useState<"photo" | "3d">("photo");
  const [wheelSpinKey, setWheelSpinKey] = useState(0);

  // Selection initializes from initialVehicleSlug (parent passes key when jumping from Collection)
  const handleSelectVehicle = (nextVehicle: CatalogVehicle) => {
    setSelectedVehicleId(nextVehicle.id);
    setColorId(nextVehicle.colors[0]?.id ?? "");
    setEngineId(nextVehicle.engines[0]?.id ?? "");
    setWheelId(nextVehicle.wheels[0]?.id ?? "");
    setStageMode("photo");
  };

  const selectedColor =
    vehicle.colors.find((c) => c.id === colorId) ?? vehicle.colors[0];
  const selectedEngine =
    vehicle.engines.find((e) => e.id === engineId) ?? vehicle.engines[0];
  const selectedWheel =
    vehicle.wheels.find((w) => w.id === wheelId) ?? vehicle.wheels[0];

  // Resolve exact Color × Engine × Jantes SKU row from PostgreSQL matrix
  const resolvedVariant = useMemo(() => {
    return vehicle.variants.find(
      (v) =>
        v.colorId === selectedColor?.id &&
        v.engineId === selectedEngine?.id &&
        v.wheelId === selectedWheel?.id
    );
  }, [vehicle.variants, selectedColor?.id, selectedEngine?.id, selectedWheel?.id]);

  const computedTotalMad =
    resolvedVariant?.priceMad ??
    vehicle.basePriceMad +
      (selectedColor?.priceDeltaMad ?? 0) +
      (selectedEngine?.priceDeltaMad ?? 0) +
      (selectedWheel?.priceDeltaMad ?? 0);

  const stockCount = resolvedVariant?.stock ?? 0;
  const isAvailable = Boolean(resolvedVariant && resolvedVariant.isActive && stockCount > 0);

  const maxHp = Math.max(...vehicle.engines.map((e) => e.horsepower), 450);
  const maxTorque = Math.max(...vehicle.engines.map((e) => e.torqueNm), 620);

  const handleWheelSelect = (nextWheelId: string) => {
    setWheelId(nextWheelId);
    setWheelSpinKey((k) => k + 1);
  };

  const handleAddToSelection = (directCheckout = false) => {
    if (!resolvedVariant || !isAvailable || !selectedColor || !selectedEngine || !selectedWheel) {
      return;
    }
    addItem(
      {
        variantId: resolvedVariant.id,
        productId: vehicle.id,
        productSlug: vehicle.slug,
        productName: vehicle.name,
        category: vehicle.category,
        sku: resolvedVariant.sku,
        colorName: selectedColor.name,
        colorHex: selectedColor.hex,
        engineName: selectedEngine.name,
        wheelName: selectedWheel.name,
        imageUrl: selectedColor.imageUrl,
        unitPriceMad: computedTotalMad,
        maxStock: stockCount,
      },
      directCheckout
    );
  };

  return (
    <div id="atelier" className="scroll-mt-20">
      {/* Top 4-Model Selector Strip (shown on homepage, hidden when locked on /vehicules/[slug]) */}
      {!lockVehicle && (
        <div className="mb-8 border-b border-hairline pb-4">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent">
                Atelier Multi-Couches · 3 Axes de Personnalisation
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl lg:text-[2.75rem] lg:leading-[1.05]">
                Configurez votre{" "}
                <span className="font-serif font-normal italic">silhouette.</span>
              </h2>
            </div>

            <div
              role="tablist"
              aria-label="Sélectionner un modèle"
              className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap"
            >
              {vehicles.map((v) => {
                const active = v.id === vehicle.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleSelectVehicle(v)}
                    className={`group relative flex items-center gap-2.5 border px-4 py-2.5 text-left transition-all duration-200 ${
                      active
                        ? "border-ink bg-ink text-ink-ivory"
                        : "border-hairline bg-surface text-ink hover:border-ink/40"
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] tracking-[0.12em] ${
                        active ? "text-accent" : "text-ink-muted"
                      }`}
                    >
                      {v.indexLabel.split("/")[0]?.trim()}
                    </span>
                    <span className="text-xs font-semibold tracking-tight">{v.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Split Configurator Grid */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* LEFT COLUMN: Sticky Obsidian Studio Visual Stage + Live Telemetry (7 cols) */}
        <div className="lg:sticky lg:top-24 lg:col-span-7">
          <div className="overflow-hidden border border-stage-border bg-stage text-ink-ivory">
            {/* Stage Top Chrome Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stage-border px-5 py-3.5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] tracking-[0.16em] text-accent">
                  {vehicle.indexLabel}
                </span>
                <span className="h-3 w-px bg-stage-border" />
                <span className="text-sm font-semibold tracking-tight text-ink-ivory">
                  {vehicle.name}
                </span>
                <span className="hidden font-mono text-[11px] text-ink-ivory-muted sm:inline">
                  · {vehicle.category}
                </span>
              </div>

              {/* Dual View Toggle: Studio Photo vs Atelier 3D */}
              <div className="flex items-center border border-stage-border bg-stage-elevated p-0.5">
                <button
                  type="button"
                  onClick={() => setStageMode("photo")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors ${
                    stageMode === "photo"
                      ? "bg-ink-ivory text-stage font-semibold"
                      : "text-ink-ivory-muted hover:text-ink-ivory"
                  }`}
                >
                  <Camera className="h-3 w-3" />
                  Studio Photo
                </button>
                <button
                  type="button"
                  onClick={() => setStageMode("3d")}
                  id="toggle-3d-studio"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase transition-colors ${
                    stageMode === "3d"
                      ? "bg-accent text-white font-semibold"
                      : "text-ink-ivory-muted hover:text-ink-ivory"
                  }`}
                >
                  <Box className="h-3 w-3" />
                  Atelier 3D
                </button>
              </div>
            </div>

            {/* Stage Canvas Area (16:9) */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-stage">
              {/* Subtle top studio reflection line tinted by selected car paint */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px] transition-colors duration-500"
                style={{
                  background: `linear-gradient(90deg, transparent 5%, ${selectedColor?.accentHex || "#fff"} 50%, transparent 95%)`,
                }}
              />

              {stageMode === "photo" ? (
                <>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={selectedColor?.imageUrl}
                      initial={{ opacity: 0.25, scale: 1.015 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0.25 }}
                      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                      className="relative h-full w-full"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedColor?.imageUrl || vehicle.heroImageUrl}
                        alt={`${vehicle.name} — ${selectedColor?.name}`}
                        className="h-full w-full object-cover object-center"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Bottom Studio Scrim & Live Multi-Layer Overlay Badges (sm+ desktop/tablet) */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-32 bg-gradient-to-t from-stage via-stage/55 to-transparent sm:block" />

                  <div className="absolute inset-x-4 bottom-4 z-10 hidden items-end justify-between gap-3 sm:flex">
                    {/* Paint & Engine Readout */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 border border-white/15 bg-stage/85 px-3 py-1.5 backdrop-blur-md">
                        <span
                          className="h-3 w-3 rounded-full border border-white/40"
                          style={{ backgroundColor: selectedColor?.hex }}
                        />
                        <span className="font-mono text-[11px] text-ink-ivory">
                          {selectedColor?.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 border border-white/15 bg-stage/85 px-3 py-1.5 backdrop-blur-md">
                        <Gauge className="h-3 w-3 text-accent" />
                        <span className="font-mono text-[11px] text-ink-ivory">
                          {selectedEngine?.horsepower} ch · {selectedEngine?.zeroToHundred}
                        </span>
                      </div>
                    </div>

                    {/* Precision Jante Medallion (interactive click opens 3D Wheel Inspector) */}
                    <button
                      type="button"
                      onClick={() => setStageMode("3d")}
                      title="Inspecter la jante et la teinte en 3D"
                      className="group flex items-center gap-3 border border-white/20 bg-stage/90 px-3 py-2 text-left backdrop-blur-md transition-colors hover:border-accent"
                    >
                      <motion.div
                        key={`${selectedWheel?.id}-${wheelSpinKey}`}
                        initial={prefersReducedMotion ? false : { rotate: -65, scale: 0.92 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
                      >
                        <WheelSvg
                          style={selectedWheel?.style ?? "forged-y"}
                          finish={selectedWheel?.finish ?? "silver"}
                          sizeInches={selectedWheel?.sizeInches ?? 19}
                          className="h-10 w-10"
                        />
                      </motion.div>
                      <div className="leading-tight">
                        <span className="block font-mono text-[9px] tracking-[0.14em] uppercase text-ink-ivory-muted group-hover:text-accent">
                          Jantes sélectionnées · Vue 3D →
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-ink-ivory">
                          {selectedWheel?.name}
                        </span>
                      </div>
                    </button>
                  </div>
                </>
              ) : (
                <div className="relative h-full w-full">
                  <WheelStudio3D
                    paintHex={selectedColor?.hex ?? "#7A8087"}
                    paintFinish={selectedColor?.finish ?? "Métallisé"}
                    wheelStyle={selectedWheel?.style ?? "forged-y"}
                    wheelFinish={selectedWheel?.finish ?? "silver"}
                    sizeInches={selectedWheel?.sizeInches ?? 19}
                    reducedMotion={Boolean(prefersReducedMotion)}
                  />
                  <div className="pointer-events-none absolute left-4 top-4 border border-white/15 bg-stage/80 px-3 py-1.5 backdrop-blur-md">
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-ivory">
                      Inspecteur 3D · Glissez pour pivoter
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-ivory-muted">
                      Arche peinte {selectedColor?.name} × Jante {selectedWheel?.name}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile-only Docked Paint & Jante Bar (keeps car photo 100% unobstructed on phones) */}
            {stageMode === "photo" && (
              <div className="flex items-center justify-between gap-3 border-t border-stage-border bg-stage px-4 py-3 sm:hidden">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full border border-white/40"
                    style={{ backgroundColor: selectedColor?.hex }}
                  />
                  <span className="truncate font-mono text-[11px] text-ink-ivory">
                    {selectedColor?.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStageMode("3d")}
                  className="flex shrink-0 items-center gap-2 border border-white/20 bg-stage-elevated px-2.5 py-1.5 text-left"
                >
                  <WheelSvg
                    style={selectedWheel?.style ?? "forged-y"}
                    finish={selectedWheel?.finish ?? "silver"}
                    sizeInches={selectedWheel?.sizeInches ?? 19}
                    className="h-6 w-6"
                  />
                  <span className="font-mono text-[10px] text-ink-ivory">
                    {selectedWheel?.sizeInches}&quot; · 3D →
                  </span>
                </button>
              </div>
            )}

            {/* Live Mechanical Telemetry Strip (Reacts to Layer 2 — Engine) */}
            <div className="grid grid-cols-2 gap-px border-t border-stage-border bg-stage-border sm:grid-cols-4">
              <div className="bg-stage-elevated p-4">
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-ivory-muted">
                  Puissance
                </p>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink-ivory">
                  {selectedEngine?.horsepower}{" "}
                  <span className="text-xs font-normal text-ink-ivory-muted">ch</span>
                </p>
                <div className="mt-2 h-1 w-full bg-white/10">
                  <div
                    className="h-full bg-accent transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((selectedEngine?.horsepower ?? 150) / maxHp) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-stage-elevated p-4">
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-ivory-muted">
                  Couple Max
                </p>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink-ivory">
                  {selectedEngine?.torqueNm}{" "}
                  <span className="text-xs font-normal text-ink-ivory-muted">Nm</span>
                </p>
                <div className="mt-2 h-1 w-full bg-white/10">
                  <div
                    className="h-full bg-ink-ivory transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((selectedEngine?.torqueNm ?? 250) / maxTorque) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="bg-stage-elevated p-4">
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-ivory-muted">
                  0 – 100 km/h
                </p>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink-ivory">
                  {selectedEngine?.zeroToHundred}
                </p>
                <p className="mt-1.5 font-mono text-[10px] text-ink-ivory-muted">
                  V. max {selectedEngine?.topSpeedKmh} km/h
                </p>
              </div>

              <div className="bg-stage-elevated p-4">
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-ivory-muted">
                  Conso. Mixte
                </p>
                <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink-ivory">
                  {selectedEngine?.consumption}
                </p>
                <p className="mt-1.5 font-mono text-[10px] text-ink-ivory-muted">
                  {selectedEngine?.transmission}
                </p>
              </div>
            </div>
          </div>

          {/* Model Quick Editorial Specs Under Stage */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border border-hairline bg-surface px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-ink-muted">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" />
                Garantie {vehicle.warranty}
              </span>
              <span className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-accent" />
                {vehicle.deliveryEstimate}
              </span>
            </div>
            {!lockVehicle && (
              <Link
                href={`/vehicules/${vehicle.slug}`}
                className="editorial-link inline-flex items-center gap-1.5 font-mono text-[11px] font-medium tracking-[0.12em] uppercase text-ink"
              >
                Fiche technique complète
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: 3-Layer Variance Selector Rail + Live Checkout Box (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* LAYER 1: TEINTE DE CARROSSERIE */}
          <section className="border border-hairline bg-surface p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center bg-ink font-mono text-[10px] font-semibold text-ink-ivory">
                  01
                </span>
                <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-ink">
                  Teinte de Carrosserie
                </h3>
              </div>
              <span className="font-mono text-xs tabular-nums text-ink-muted">
                {formatMadDelta(selectedColor?.priceDeltaMad ?? 0)}
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between border-b border-hairline pb-3">
              <p className="text-sm font-medium text-ink">{selectedColor?.name}</p>
              <span className="font-mono text-[11px] text-ink-muted">
                {selectedColor?.finish}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {vehicle.colors.map((color) => {
                const active = color.id === selectedColor?.id;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setColorId(color.id)}
                    aria-pressed={active}
                    className={`group flex items-center gap-3 border p-3 text-left transition-all duration-200 ${
                      active
                        ? "border-accent bg-accent-soft/60"
                        : "border-hairline bg-canvas/40 hover:border-ink/40 hover:bg-canvas"
                    }`}
                  >
                    {/* Realistic metallic paint swatch */}
                    <span
                      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/20 shadow-inner"
                      style={{
                        background: `radial-gradient(circle at 32% 28%, ${color.accentHex}, ${color.hex} 68%, #0f1114 130%)`,
                      }}
                    >
                      {active && (
                        <Check
                          className={`h-4 w-4 ${
                            color.hex.toLowerCase() === "#e8eaeb" ||
                            color.hex.toLowerCase() === "#e6e3dc" ||
                            color.hex.toLowerCase() === "#beb9ae"
                              ? "text-ink"
                              : "text-white"
                          }`}
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-ink">{color.name}</p>
                      <p className="mt-0.5 font-mono text-[10px] tabular-nums text-ink-muted">
                        {formatMadDelta(color.priceDeltaMad)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* LAYER 2: MOTORISATION */}
          <section className="border border-hairline bg-surface p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center bg-ink font-mono text-[10px] font-semibold text-ink-ivory">
                  02
                </span>
                <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-ink">
                  Motorisation
                </h3>
              </div>
              <span className="font-mono text-xs tabular-nums text-ink-muted">
                {formatMadDelta(selectedEngine?.priceDeltaMad ?? 0)}
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {vehicle.engines.map((engine) => {
                const active = engine.id === selectedEngine?.id;
                return (
                  <button
                    key={engine.id}
                    type="button"
                    onClick={() => setEngineId(engine.id)}
                    aria-pressed={active}
                    className={`w-full border p-4 text-left transition-all duration-200 ${
                      active
                        ? "border-accent bg-accent-soft/60"
                        : "border-hairline bg-canvas/40 hover:border-ink/40 hover:bg-canvas"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-ink">{engine.name}</span>
                        </div>
                        <p className="mt-1 font-mono text-[11px] text-ink-muted">
                          {engine.fuelType} · {engine.drivetrain}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${
                          active ? "text-accent" : "text-ink"
                        }`}
                      >
                        {formatMadDelta(engine.priceDeltaMad)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-hairline/80 pt-2.5 font-mono text-[10px] text-ink-muted">
                      <span>{engine.horsepower} ch</span>
                      <span>{engine.torqueNm} Nm</span>
                      <span>0–100 : {engine.zeroToHundred}</span>
                      <span>{engine.consumption}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* LAYER 3: JANTES */}
          <section className="border border-hairline bg-surface p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center bg-ink font-mono text-[10px] font-semibold text-ink-ivory">
                  03
                </span>
                <h3 className="text-xs font-semibold tracking-[0.16em] uppercase text-ink">
                  Jantes en Alliage
                </h3>
              </div>
              <span className="font-mono text-xs tabular-nums text-ink-muted">
                {formatMadDelta(selectedWheel?.priceDeltaMad ?? 0)}
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {vehicle.wheels.map((wheel) => {
                const active = wheel.id === selectedWheel?.id;
                return (
                  <button
                    key={wheel.id}
                    type="button"
                    onClick={() => handleWheelSelect(wheel.id)}
                    aria-pressed={active}
                    className={`flex w-full items-center gap-4 border p-3.5 text-left transition-all duration-200 ${
                      active
                        ? "border-accent bg-accent-soft/60"
                        : "border-hairline bg-canvas/40 hover:border-ink/40 hover:bg-canvas"
                    }`}
                  >
                    <WheelSvg
                      style={wheel.style}
                      finish={wheel.finish}
                      sizeInches={wheel.sizeInches}
                      className="h-14 w-14 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">{wheel.name}</p>
                        <span
                          className={`shrink-0 font-mono text-xs font-semibold tabular-nums ${
                            active ? "text-accent" : "text-ink"
                          }`}
                        >
                          {formatMadDelta(wheel.priceDeltaMad)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-muted">{wheel.finishLabel}</p>
                      <p className="mt-1 font-mono text-[10px] text-ink-subtle">
                        {wheel.tireSpec}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* RESOLVED CONFIGURATION SUMMARY & CONVERSION CARD */}
          <section className="border border-ink bg-ink p-6 text-ink-ivory">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] uppercase text-ink-ivory-muted">
                <Layers className="h-3.5 w-3.5 text-accent" />
                <span>Référence SKU</span>
              </div>
              <span className="font-mono text-xs text-ink-ivory">
                {resolvedVariant?.sku ?? "—"}
              </span>
            </div>

            {/* Itemized Price Breakdown */}
            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-ink-ivory-muted">
                <dt>Prix de base · {vehicle.name}</dt>
                <dd className="font-mono tabular-nums text-ink-ivory">
                  {formatMad(vehicle.basePriceMad)}
                </dd>
              </div>
              <div className="flex justify-between text-ink-ivory-muted">
                <dt>Teinte · {selectedColor?.name}</dt>
                <dd className="font-mono tabular-nums text-ink-ivory">
                  {formatMadDelta(selectedColor?.priceDeltaMad ?? 0)}
                </dd>
              </div>
              <div className="flex justify-between text-ink-ivory-muted">
                <dt>Moteur · {selectedEngine?.code}</dt>
                <dd className="font-mono tabular-nums text-ink-ivory">
                  {formatMadDelta(selectedEngine?.priceDeltaMad ?? 0)}
                </dd>
              </div>
              <div className="flex justify-between text-ink-ivory-muted">
                <dt>Jantes · {selectedWheel?.sizeInches}&quot; {selectedWheel?.code}</dt>
                <dd className="font-mono tabular-nums text-ink-ivory">
                  {formatMadDelta(selectedWheel?.priceDeltaMad ?? 0)}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex items-end justify-between border-t border-white/15 pt-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-ivory-muted">
                  Total Configuré TTC
                </p>
                <p
                  id="configurator-total-price"
                  className="mt-1 font-mono text-2xl font-semibold tabular-nums text-ink-ivory sm:text-3xl"
                >
                  {formatMad(computedTotalMad)}
                </p>
              </div>

              {/* Live PostgreSQL Stock Badge */}
              <div className="text-right">
                {isAvailable ? (
                  <span className="inline-flex items-center gap-1.5 border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase text-emerald-300">
                    <Sparkles className="h-3 w-3" />
                    {stockCount === 1
                      ? "Dernier exemplaire"
                      : `${stockCount} en allocation`}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 border border-rose-500/35 bg-rose-500/15 px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] uppercase text-rose-300">
                    <AlertCircle className="h-3 w-3" />
                    Rupture momentanée
                  </span>
                )}
              </div>
            </div>

            {/* Action CTAs */}
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              <button
                type="button"
                id="configurator-add-cart"
                disabled={!isAvailable}
                onClick={() => handleAddToSelection(false)}
                className="inline-flex items-center justify-center gap-2 bg-accent px-5 py-3.5 text-xs font-semibold tracking-[0.12em] uppercase text-white transition-all duration-200 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ShoppingBag className="h-4 w-4" />
                Ajouter à ma sélection
              </button>

              <button
                type="button"
                id="configurator-buy-cod"
                disabled={!isAvailable}
                onClick={() => handleAddToSelection(true)}
                className="inline-flex items-center justify-center gap-2 border border-white/25 bg-white/5 px-5 py-3.5 text-xs font-semibold tracking-[0.12em] uppercase text-ink-ivory transition-all duration-200 hover:border-white hover:bg-white hover:text-stage disabled:cursor-not-allowed disabled:opacity-40"
              >
                Commander (COD)
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-center font-mono text-[10px] text-ink-ivory-muted">
              Paiement à la livraison (COD) · Confirmation directe sur WhatsApp · Zéro acompte en ligne
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
