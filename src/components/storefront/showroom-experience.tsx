"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Layers,
  ShieldCheck,
  Sliders,
} from "lucide-react";
import type { CatalogVehicle } from "@/lib/catalog";
import { formatMad } from "@/lib/format";
import { AtelierConfigurator } from "@/components/configurator/atelier-configurator";

const HeroAmbient3D = dynamic(() => import("@/components/hero/hero-ambient-3d"), {
  ssr: false,
  loading: () => null,
});

const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

const CATEGORIES = ["Tous", "Hatchback", "Berline", "Coupé", "SUV"] as const;

const FAQ_ITEMS = [
  {
    q: "Comment fonctionne le paiement à la livraison (COD) pour un véhicule ?",
    a: "Votre commande réserve immédiatement l'allocation exacte (Teinte × Motorisation × Jantes) dans notre inventaire sans aucun paiement en ligne. Notre conseiller showroom confirme ensuite votre dossier par WhatsApp ou téléphone, prépare le véhicule et organise la livraison ou la remise au showroom de Casablanca. Le règlement intervient uniquement lors de la remise officielle après inspection complète.",
  },
  {
    q: "Les prix affichés en Dirhams (DH) incluent-ils les options sélectionnées ?",
    a: "Oui. Chaque teinte, motorisation et jeu de jantes affiche son supplément exact en MAD TTC. Le total calculé par le configurateur correspond au montant transparent clé en main, hors frais d'immatriculation préfectorale.",
  },
  {
    q: "Puis-je inspecter la jante et la teinte avant de confirmer ?",
    a: "Chaque fiche véhicule vous permet de visualiser la carrosserie photographiée en studio dans la teinte exacte sélectionnée, ainsi que d'ouvrir notre Atelier 3D interactif pour inspecter le dessin des jantes, la finition alliage et le rendu vernis sous tous les angles.",
  },
  {
    q: "Quels sont les délais et zones de livraison au Maroc ?",
    a: "Nos véhicules en allocation showroom sont livrés sous 7 à 15 jours ouvrés partout au Maroc (Casablanca, Rabat, Marrakech, Tanger, Agadir, Fès, Meknès, Oujda) sur porte-voiture sécurisé ou remis en main propre dans notre espace du Boulevard d'Anfa.",
  },
];

interface ShowroomExperienceProps {
  vehicles: CatalogVehicle[];
}

export function ShowroomExperience({ vehicles }: ShowroomExperienceProps) {
  const prefersReducedMotion = useReducedMotion();
  const [showHero3D, setShowHero3D] = useState(false);
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>("Tous");
  const [activeConfiguratorSlug, setActiveConfiguratorSlug] = useState<string>(
    vehicles[0]?.slug ?? ""
  );
  // Independent per-card live paint preview on the Collection gallery
  const [cardColorMap, setCardColorMap] = useState<Record<string, string>>({});
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop) return;
    const timer = window.setTimeout(() => setShowHero3D(true), 350);
    return () => window.clearTimeout(timer);
  }, [prefersReducedMotion]);

  const filteredVehicles =
    activeCategory === "Tous"
      ? vehicles
      : vehicles.filter((v) => v.category === activeCategory);

  const jumpToConfigurator = (slug: string) => {
    setActiveConfiguratorSlug(slug);
    const el = document.getElementById("atelier");
    if (el) {
      el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
    }
  };

  return (
    <main>
      {/* =================================================================== */}
      {/* ACT I — ATMOSPHERIC ARCHITECTURAL SHOWROOM HERO                      */}
      {/* =================================================================== */}
      <section className="relative flex min-h-[min(90vh,900px)] flex-col justify-between overflow-hidden bg-stage pt-24 text-ink-ivory">
        {/* Background Showroom Editorial Photography */}
        <motion.div
          initial={prefersReducedMotion ? false : { scale: 1.06, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: EASE_OUT_EXPO }}
          className="absolute inset-0"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-showroom.jpg"
            alt="Showroom architectural Maison Véloce à Casablanca"
            className="h-full w-full object-cover object-center"
          />
          {/* Balanced architectural scrim: dark left for editorial clarity, luminous right for the vehicle */}
          <div className="absolute inset-0 bg-gradient-to-r from-stage/92 via-stage/62 to-stage/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-stage via-transparent to-stage/45" />
        </motion.div>

        {/* Strictly lazy-loaded, desktop-only subtle 3D studio ring accent */}
        {showHero3D && !prefersReducedMotion && <HeroAmbient3D />}

        {/* Main Hero Content */}
        <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="max-w-2xl">
            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
              className="font-mono text-[11px] tracking-[0.2em] uppercase text-accent"
            >
              Showroom Européen Contemporain · Casablanca — Maroc
            </motion.p>

            <motion.h1
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08, ease: EASE_OUT_EXPO }}
              className="mt-5 text-4xl font-semibold tracking-[-0.035em] text-ink-ivory sm:text-6xl lg:text-[4.5rem] lg:leading-[0.98]"
            >
              L&apos;automobile européenne,{" "}
              <span className="font-serif font-normal italic text-[#EFE9DC]">
                configurée sur-mesure.
              </span>
            </motion.h1>

            <motion.p
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.16, ease: EASE_OUT_EXPO }}
              className="mt-6 max-w-xl text-base leading-relaxed text-ink-ivory-muted sm:text-lg"
            >
              Quatre silhouettes européennes — Hatchback, Berline, Coupé et SUV —
              personnalisables sur trois couches : teinte de carrosserie, motorisation
              et jantes en alliage. Prix transparents en Dirhams et paiement à la livraison.
            </motion.p>

            <motion.div
              initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.24, ease: EASE_OUT_EXPO }}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <a
                href="#atelier"
                className="inline-flex items-center gap-2.5 bg-accent px-7 py-4 text-xs font-semibold tracking-[0.14em] uppercase text-white transition-all duration-200 hover:bg-accent-hover"
              >
                Ouvrir le Configurateur
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#collection"
                className="inline-flex items-center gap-2 border border-white/25 bg-white/5 px-6 py-4 text-xs font-semibold tracking-[0.14em] uppercase text-ink-ivory backdrop-blur-xs transition-colors hover:border-white hover:bg-white hover:text-stage"
              >
                Découvrir les 4 modèles
              </a>
            </motion.div>
          </div>
        </div>

        {/* Bottom Architectural Quick-Index Strip for the 4 Models */}
        <div className="relative z-10 border-t border-white/12 bg-stage/75 backdrop-blur-md">
          <div className="mx-auto grid max-w-[1400px] grid-cols-2 divide-x divide-y divide-white/10 lg:grid-cols-4 lg:divide-y-0">
            {vehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => jumpToConfigurator(v.slug)}
                className="group flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/5 sm:px-7"
              >
                <div>
                  <span className="font-mono text-[10px] tracking-[0.16em] text-accent">
                    {v.indexLabel} · {v.category.toUpperCase()}
                  </span>
                  <p className="mt-1 text-sm font-semibold tracking-tight text-ink-ivory group-hover:text-white">
                    {v.name}
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] tabular-nums text-ink-ivory-muted">
                    Dès {formatMad(v.basePriceMad)}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-ink-ivory-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* ACT II — CURATED 4-VEHICLE COLLECTION WITH LIVE PAINT SWATCH PREVIEW */}
      {/* =================================================================== */}
      <section
        id="collection"
        className="scroll-mt-16 border-b border-hairline bg-canvas py-20 lg:py-28"
      >
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          {/* Header & Filter */}
          <div className="flex flex-col justify-between gap-6 border-b border-hairline pb-8 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent">
                La Collection · 04 Silhouettes Européennes
              </p>
              <h2 className="mt-2.5 text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl lg:text-[2.85rem] lg:leading-[1.04]">
                Quatre tempéraments,{" "}
                <span className="font-serif font-normal italic">144 configurations.</span>
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5" role="tablist">
              {CATEGORIES.map((cat) => {
                const active = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveCategory(cat)}
                    className={`relative px-4 py-2 font-mono text-[11px] tracking-[0.12em] uppercase transition-colors ${
                      active
                        ? "text-ink-ivory"
                        : "border border-hairline bg-surface text-ink-muted hover:border-ink/40 hover:text-ink"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="collection-category-pill"
                        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                        className="absolute inset-0 bg-ink"
                      />
                    )}
                    <span className="relative z-10">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2x2 Architectural Gallery Grid */}
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {filteredVehicles.map((vehicle, index) => {
              const activeCardColor =
                vehicle.colors.find((c) => c.id === cardColorMap[vehicle.id]) ??
                vehicle.colors[0];
              const minHp = Math.min(...vehicle.engines.map((e) => e.horsepower));
              const maxHp = Math.max(...vehicle.engines.map((e) => e.horsepower));
              const minWheel = Math.min(...vehicle.wheels.map((w) => w.sizeInches));
              const maxWheel = Math.max(...vehicle.wheels.map((w) => w.sizeInches));

              return (
                <motion.article
                  key={vehicle.id}
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.06,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="group flex flex-col border border-hairline bg-surface transition-colors duration-300 hover:border-ink/45"
                >
                  {/* Top Index & Category Header */}
                  <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-semibold text-accent">
                        {vehicle.indexLabel}
                      </span>
                      <span className="h-3 w-px bg-hairline" />
                      <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink-muted">
                        {vehicle.category}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-ink-subtle">
                      {vehicle.colors.length} teintes · {vehicle.engines.length} moteurs ·{" "}
                      {vehicle.wheels.length} jantes
                    </span>
                  </div>

                  {/* Live-Switching Studio Car Photography */}
                  <div className="relative aspect-[16/10] overflow-hidden bg-stage">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeCardColor?.imageUrl}
                        src={activeCardColor?.imageUrl || vehicle.heroImageUrl}
                        alt={`${vehicle.name} en ${activeCardColor?.name}`}
                        initial={{ opacity: 0.3 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0.3 }}
                        transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </AnimatePresence>

                    {/* Subtle bottom paint label */}
                    <div className="absolute bottom-3 left-4 border border-white/15 bg-stage/80 px-2.5 py-1 backdrop-blur-md">
                      <span className="font-mono text-[10px] tracking-[0.1em] text-ink-ivory">
                        {activeCardColor?.name}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-2xl font-semibold tracking-[-0.025em] text-ink">
                          {vehicle.name}
                        </h3>
                        <p className="mt-1 text-xs text-ink-muted">{vehicle.subtitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink-subtle">
                          À partir de
                        </p>
                        <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-ink">
                          {formatMad(vehicle.basePriceMad)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                      {vehicle.tagline}
                    </p>

                    {/* Interactive Paint Swatches directly on the card */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-y border-hairline py-4">
                      <div className="flex items-center gap-2">
                        <span className="mr-1 font-mono text-[10px] tracking-[0.12em] uppercase text-ink-subtle">
                          Teintes
                        </span>
                        {vehicle.colors.map((c) => {
                          const isSelected = c.id === activeCardColor?.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              title={c.name}
                              aria-label={`Aperçu ${vehicle.name} en ${c.name}`}
                              onClick={() =>
                                setCardColorMap((prev) => ({
                                  ...prev,
                                  [vehicle.id]: c.id,
                                }))
                              }
                              className={`h-6 w-6 rounded-full border transition-transform ${
                                isSelected
                                  ? "scale-110 border-accent ring-2 ring-accent/35"
                                  : "border-black/25 hover:scale-105"
                              }`}
                              style={{
                                background: `radial-gradient(circle at 30% 30%, ${c.accentHex}, ${c.hex} 70%)`,
                              }}
                            />
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-3 font-mono text-[11px] text-ink-muted">
                        <span>
                          {minHp}–{maxHp} ch
                        </span>
                        <span className="text-hairline">|</span>
                        <span>
                          Jantes {minWheel}&quot;–{maxWheel}&quot;
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => jumpToConfigurator(vehicle.slug)}
                        className="inline-flex items-center justify-center gap-2 bg-ink px-4 py-3 text-xs font-semibold tracking-[0.12em] uppercase text-ink-ivory transition-colors hover:bg-accent"
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        Configurer
                      </button>
                      <Link
                        href={`/vehicules/${vehicle.slug}`}
                        className="inline-flex items-center justify-center gap-1.5 border border-hairline px-4 py-3 text-xs font-semibold tracking-[0.12em] uppercase text-ink transition-colors hover:border-ink"
                      >
                        Fiche complète
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* ACT III — SIGNATURE INTERACTIVE MULTI-LAYER ATELIER CONFIGURATOR     */}
      {/* =================================================================== */}
      <section className="border-b border-hairline bg-surface-muted/45 py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <AtelierConfigurator
            key={activeConfiguratorSlug}
            vehicles={vehicles}
            initialVehicleSlug={activeConfiguratorSlug}
          />
        </div>
      </section>

      {/* =================================================================== */}
      {/* ACT IV — EDITORIAL PHILOSOPHY SPLIT (NO GENERIC ICON BOX GRIDS)      */}
      {/* =================================================================== */}
      <section
        id="philosophie"
        className="scroll-mt-16 border-b border-hairline bg-canvas py-20 lg:py-28"
      >
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:px-12">
          {/* Left Sticky Editorial Thesis (5 cols) */}
          <div className="lg:col-span-5">
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent">
              L&apos;Esprit Maison Véloce
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl lg:leading-[1.08]">
              L&apos;exigence d&apos;un atelier européen,{" "}
              <span className="font-serif font-normal italic">sans friction.</span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-muted sm:text-base">
              Nous avons remplacé l&apos;opacité des concessions traditionnelles par une
              architecture digitale directe : quatre modèles choisis pour leur justesse,
              trois couches de variantes mécaniques et esthétiques, et un prix final
              transparent au dirham près.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-hairline pt-8">
              <div>
                <p className="font-mono text-2xl font-semibold tabular-nums text-ink">04</p>
                <p className="mt-1 text-xs text-ink-muted">Modèles sélectionnés</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold tabular-nums text-ink">144</p>
                <p className="mt-1 text-xs text-ink-muted">Variantes SKUs en stock</p>
              </div>
              <div>
                <p className="font-mono text-2xl font-semibold tabular-nums text-ink">5 ans</p>
                <p className="mt-1 text-xs text-ink-muted">Garantie constructeur</p>
              </div>
            </div>
          </div>

          {/* Right Numbered Architectural Commitments (7 cols) */}
          <div className="divide-y divide-hairline border-y border-hairline lg:col-span-7">
            <div className="grid gap-4 py-8 sm:grid-cols-12">
              <div className="font-mono text-xs font-semibold text-accent sm:col-span-2">
                01 / VARIANTES
              </div>
              <div className="sm:col-span-10">
                <h3 className="text-lg font-semibold tracking-tight text-ink">
                  Personnalisation multi-couches en temps réel
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                  Contrairement aux annonces statiques, chaque teinte, chaque bloc moteur
                  (micro-hybride, diesel Euro 6e, PHEV ou V6 Biturbo) et chaque jeu de jantes
                  forgées ou diamantées dispose de son propre SKU et de son allocation réelle
                  en base de données.
                </p>
              </div>
            </div>

            <div className="grid gap-4 py-8 sm:grid-cols-12">
              <div className="font-mono text-xs font-semibold text-accent sm:col-span-2">
                02 / PRIX MAD
              </div>
              <div className="sm:col-span-10">
                <h3 className="text-lg font-semibold tracking-tight text-ink">
                  Tarification transparente en Dirhams TTC
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                  Chaque option affiche immédiatement son impact en DH : pas de devis opaques
                  ni de frais cachés de mise à la route. Le montant affiché dans votre
                  récapitulatif est celui qui figure sur votre bon de commande officiel.
                </p>
              </div>
            </div>

            <div className="grid gap-4 py-8 sm:grid-cols-12">
              <div className="font-mono text-xs font-semibold text-accent sm:col-span-2">
                03 / CONCIERGERIE
              </div>
              <div className="sm:col-span-10">
                <h3 className="text-lg font-semibold tracking-tight text-ink">
                  Réservation immédiate COD & confirmation WhatsApp
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                  Bloquez votre véhicule en trente secondes sans carte bancaire. Dès votre
                  validation, un lien WhatsApp pré-rempli vous relie directement à notre
                  équipe de Casablanca pour planifier l&apos;inspection et la livraison à
                  votre domicile.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* ACT V — COD DELIVERY PROCESS, OBJECTION HANDLING & CLOSING CTA       */}
      {/* =================================================================== */}
      <section id="livraison" className="scroll-mt-16 bg-surface py-20 lg:py-28">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
          {/* 4-Step COD Delivery Architecture */}
          <div className="flex flex-col justify-between gap-4 border-b border-hairline pb-8 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent">
                Livraison Royaume & Paiement à la Livraison (COD)
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-ink sm:text-4xl">
                Du configurateur jusqu&apos;à{" "}
                <span className="font-serif font-normal italic">votre porte.</span>
              </h2>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-ink-muted sm:text-sm">
              Casablanca · Rabat · Marrakech · Tanger · Agadir · Fès — livraison assurée
              sur transporteur fermé avec contrôle 120 points.
            </p>
          </div>

          <div className="mt-10 grid gap-px border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "ÉTAPE 01",
                title: "Configuration 3 Couches",
                text: "Sélectionnez votre modèle, sa teinte studio, sa motorisation et ses jantes en temps réel.",
              },
              {
                step: "ÉTAPE 02",
                title: "Réservation COD",
                text: "Validez vos coordonnées de livraison sans acompte en ligne. Votre SKU est réservé instantanément.",
              },
              {
                step: "ÉTAPE 03",
                title: "Validation WhatsApp",
                text: "Confirmez votre créneau en un clic sur WhatsApp avec notre responsable showroom de Casablanca.",
              },
              {
                step: "ÉTAPE 04",
                title: "Inspection & Règlement",
                text: "Contrôlez votre véhicule lors de la remise des clés puis effectuez votre règlement à la livraison.",
              },
            ].map((item) => (
              <div key={item.step} className="bg-surface p-7">
                <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-accent">
                  {item.step}
                </p>
                <h3 className="mt-3 text-base font-semibold tracking-tight text-ink">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-xs leading-relaxed text-ink-muted">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          {/* FAQ Accordion + Closing Conversion Card */}
          <div className="mt-20 grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent">
                Questions Fréquentes
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-[-0.025em] text-ink">
                Tout savoir avant de réserver.
              </h3>

              <div className="mt-6 divide-y divide-hairline border-y border-hairline">
                {FAQ_ITEMS.map((faq, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={faq.q}>
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 py-5 text-left"
                      >
                        <span className="text-sm font-semibold text-ink">{faq.q}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-accent" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.28, ease: EASE_OUT_EXPO }}
                            className="overflow-hidden"
                          >
                            <p className="pb-5 pr-8 text-sm leading-relaxed text-ink-muted">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confident Closing Conversion Panel */}
            <div className="flex flex-col justify-between border border-stage-border bg-stage p-8 text-ink-ivory lg:col-span-5 lg:p-10">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-accent">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Prêt à composer votre véhicule ?</span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                  Essayez vos combinaisons de{" "}
                  <span className="font-serif font-normal italic">
                    teintes, moteurs et jantes.
                  </span>
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-ink-ivory-muted">
                  Nos allocations showroom sont mises à jour en temps réel. Configurez votre
                  modèle maintenant et bloquez sa disponibilité sans aucun acompte en ligne.
                </p>
              </div>

              <div className="mt-10 space-y-4">
                <a
                  href="#atelier"
                  className="flex w-full items-center justify-center gap-2 bg-accent px-6 py-4 text-xs font-semibold tracking-[0.14em] uppercase text-white transition-colors hover:bg-accent-hover"
                >
                  Lancer le Configurateur
                  <ArrowRight className="h-4 w-4" />
                </a>
                <div className="flex items-center justify-center gap-2 font-mono text-[10px] text-ink-ivory-muted">
                  <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                  <span>Garantie 5 ans · Contrôle 120 points · Paiement COD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
