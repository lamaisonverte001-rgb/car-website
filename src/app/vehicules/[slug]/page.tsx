import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { getCatalogVehicles, getVehicleBySlug } from "@/lib/catalog";
import { formatMad } from "@/lib/format";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AtelierConfigurator } from "@/components/configurator/atelier-configurator";

export const dynamic = "force-dynamic";

interface VehiclePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: VehiclePageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) {
    return { title: "Véhicule introuvable · Maison Véloce" };
  }
  return {
    title: `${vehicle.name} — Configurateur & Prix Maroc | Maison Véloce`,
    description: `${vehicle.subtitle}. ${vehicle.tagline} À partir de ${formatMad(vehicle.basePriceMad)} avec variantes teintes, motorisations et jantes.`,
  };
}

export default async function VehicleDetailPage({ params }: VehiclePageProps) {
  const { slug } = await params;
  const allVehicles = await getCatalogVehicles();
  const vehicle = allVehicles.find((v) => v.slug === slug);

  if (!vehicle) {
    notFound();
  }

  const otherVehicles = allVehicles.filter((v) => v.id !== vehicle.id);

  return (
    <>
      <SiteHeader variant="solid" />
      <main className="bg-canvas pt-24">
        {/* Editorial Vehicle Intro Header */}
        <section className="border-b border-hairline bg-surface py-10 lg:py-14">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <Link
              href="/#collection"
              className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase text-ink-muted transition-colors hover:text-accent"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Retour à la collection (04 modèles)
            </Link>

            <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent">
                  {vehicle.indexLabel} · {vehicle.subtitle}
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-[-0.035em] text-ink sm:text-5xl">
                  {vehicle.name}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-muted sm:text-base">
                  {vehicle.description}
                </p>
              </div>

              <div className="border border-hairline bg-canvas px-6 py-4 lg:text-right">
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink-subtle">
                  Prix de départ TTC
                </p>
                <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-ink">
                  {formatMad(vehicle.basePriceMad)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Locked Multi-Layer Configurator */}
        <section className="border-b border-hairline py-14 lg:py-20">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <AtelierConfigurator
              vehicles={allVehicles}
              initialVehicleSlug={vehicle.slug}
              lockVehicle={true}
            />
          </div>
        </section>

        {/* Technical Dimensions & Standard Craft Highlights */}
        <section className="border-b border-hairline bg-surface py-16 lg:py-24">
          <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:px-12">
            <div className="lg:col-span-5">
              <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent">
                Gabarit & Proportions
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                Dimensions techniques
              </h2>

              <dl className="mt-6 divide-y divide-hairline border-y border-hairline text-sm">
                <div className="flex justify-between py-3.5">
                  <dt className="text-ink-muted">Longueur hors-tout</dt>
                  <dd className="font-mono font-medium tabular-nums text-ink">
                    {vehicle.dimensions.lengthMm} mm
                  </dd>
                </div>
                <div className="flex justify-between py-3.5">
                  <dt className="text-ink-muted">Largeur (hors rétroviseurs)</dt>
                  <dd className="font-mono font-medium tabular-nums text-ink">
                    {vehicle.dimensions.widthMm} mm
                  </dd>
                </div>
                <div className="flex justify-between py-3.5">
                  <dt className="text-ink-muted">Hauteur</dt>
                  <dd className="font-mono font-medium tabular-nums text-ink">
                    {vehicle.dimensions.heightMm} mm
                  </dd>
                </div>
                <div className="flex justify-between py-3.5">
                  <dt className="text-ink-muted">Volume de coffre</dt>
                  <dd className="font-mono font-medium tabular-nums text-ink">
                    {vehicle.dimensions.trunkLiters} litres
                  </dd>
                </div>
                <div className="flex justify-between py-3.5">
                  <dt className="text-ink-muted">Nombre de places</dt>
                  <dd className="font-mono font-medium tabular-nums text-ink">
                    {vehicle.dimensions.seats} places
                  </dd>
                </div>
              </dl>
            </div>

            <div className="lg:col-span-7">
              <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent">
                Dotation de Série
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                Équipements & ingénierie embarquée
              </h2>

              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {vehicle.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 border border-hairline bg-canvas p-5 text-sm leading-relaxed text-ink"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Cross-Navigation to the Other 3 Models */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-accent">
              Poursuivre la visite
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
              Les autres modèles du showroom
            </h2>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {otherVehicles.map((other) => (
                <Link
                  key={other.id}
                  href={`/vehicules/${other.slug}`}
                  className="group border border-hairline bg-surface transition-colors hover:border-ink"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-stage">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={other.heroImageUrl}
                      alt={other.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex items-center justify-between p-5">
                    <div>
                      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent">
                        {other.indexLabel} · {other.category}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-ink">
                        {other.name}
                      </h3>
                      <p className="mt-0.5 font-mono text-xs text-ink-muted">
                        Dès {formatMad(other.basePriceMad)}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
