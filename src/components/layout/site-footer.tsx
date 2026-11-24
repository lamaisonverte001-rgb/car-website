import React from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Phone, Clock } from "lucide-react";

export function SiteFooter() {
  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "212600000000").replace(
    /[^\d]/g,
    ""
  );

  return (
    <footer className="border-t border-stage-border bg-stage text-ink-ivory">
      <div className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Column 1: Brand Statement */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center border border-white/25 font-mono text-xs font-semibold">
                MV
              </span>
              <span className="text-sm font-semibold tracking-[0.22em] uppercase">
                Maison Véloce
              </span>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-ink-ivory-muted">
              Showroom automobile contemporain à Casablanca. Quatre silhouettes européennes
              sélectionnées, configurables sur-mesure par teinte, motorisation et jantes,
              avec tarification transparente en Dirhams et paiement à la livraison.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                  "Bonjour Maison Véloce, je souhaite échanger avec un conseiller showroom."
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-white/20 px-4 py-2.5 text-xs font-mono tracking-[0.12em] uppercase text-ink-ivory transition-colors hover:border-accent hover:bg-accent"
              >
                Conciergerie WhatsApp
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 border border-white/10 px-4 py-2.5 text-xs font-mono tracking-[0.12em] uppercase text-ink-ivory-muted transition-colors hover:border-white/30 hover:text-ink-ivory"
              >
                Portail Admin
              </Link>
            </div>
          </div>

          {/* Column 2: The 4 Models */}
          <div className="lg:col-span-3">
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-ivory-muted">
              La Collection · 04 Modèles
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  href="/vehicules/veloce-aero-3"
                  className="flex items-center justify-between border-b border-white/10 pb-2.5 text-ink-ivory transition-colors hover:text-accent"
                >
                  <span>01 · Véloce Aero 3</span>
                  <span className="font-mono text-[11px] text-ink-ivory-muted">Hatchback</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/vehicules/veloce-solis-gt"
                  className="flex items-center justify-between border-b border-white/10 pb-2.5 text-ink-ivory transition-colors hover:text-accent"
                >
                  <span>02 · Véloce Solis GT</span>
                  <span className="font-mono text-[11px] text-ink-ivory-muted">Berline</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/vehicules/veloce-cortina-s"
                  className="flex items-center justify-between border-b border-white/10 pb-2.5 text-ink-ivory transition-colors hover:text-accent"
                >
                  <span>03 · Véloce Cortina S</span>
                  <span className="font-mono text-[11px] text-ink-ivory-muted">Coupé</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/vehicules/veloce-atlas-x"
                  className="flex items-center justify-between border-b border-white/10 pb-2.5 text-ink-ivory transition-colors hover:text-accent"
                >
                  <span>04 · Véloce Atlas X</span>
                  <span className="font-mono text-[11px] text-ink-ivory-muted">SUV</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Showroom Casablanca */}
          <div className="lg:col-span-4">
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-ivory-muted">
              Showroom & Livraison Royaume
            </p>
            <div className="mt-5 space-y-4 text-sm text-ink-ivory-muted">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>
                  148 Boulevard d&apos;Anfa, Quartier Racine
                  <br />
                  20050 Casablanca, Maroc
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                <span className="font-mono text-xs text-ink-ivory">+212 5 22 94 00 40</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 shrink-0 text-accent" />
                <span>Lundi – Samedi · 09h30 – 19h30</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-ink-ivory-muted sm:flex-row sm:items-center">
          <p className="font-mono">
            © {new Date().getFullYear()} MAISON VÉLOCE AUTOMOBILES. TOUS DROITS RÉSERVÉS.
          </p>
          <p className="font-mono text-[11px] tracking-[0.1em] uppercase">
            Tarifs TTC en Dirhams (MAD) · Garantie Constructeur 5 ans
          </p>
        </div>
      </div>
    </footer>
  );
}
