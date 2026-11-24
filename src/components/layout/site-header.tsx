"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Menu, X, ShieldCheck } from "lucide-react";
import { useCart } from "@/components/providers/cart-context";
import { formatMad } from "@/lib/format";

interface SiteHeaderProps {
  variant?: "transparent-hero" | "solid";
}

export function SiteHeader({ variant = "transparent-hero" }: SiteHeaderProps) {
  const { totalItems, totalMad, openDrawer } = useCart();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (variant === "solid") return;
    const onScroll = () => setHasScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  const scrolled = variant === "solid" || hasScrolled;

  const navLinks = [
    { href: "/#collection", label: "Collection" },
    { href: "/#atelier", label: "Configurateur" },
    { href: "/#philosophie", label: "L'Atelier" },
    { href: "/#livraison", label: "Livraison COD" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-hairline bg-canvas/92 text-ink backdrop-blur-md"
          : "border-b border-white/10 bg-stage/35 text-ink-ivory backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-[1400px] items-center justify-between px-5 sm:px-8 lg:px-12">
        {/* Brand Wordmark */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 sm:gap-3 focus:outline-none">
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center border text-xs font-mono font-semibold tracking-tight transition-colors ${
              scrolled
                ? "border-ink bg-ink text-ink-ivory group-hover:border-accent group-hover:bg-accent"
                : "border-white/30 bg-white/10 text-ink-ivory group-hover:border-accent group-hover:bg-accent"
            }`}
          >
            MV
          </span>
          <div className="flex flex-col leading-none">
            <span className="whitespace-nowrap text-xs font-semibold tracking-[0.18em] uppercase sm:text-sm sm:tracking-[0.2em]">
              Maison Véloce
            </span>
            <span
              className={`mt-1 hidden text-[10px] font-mono tracking-[0.16em] uppercase sm:block ${
                scrolled ? "text-ink-muted" : "text-ink-ivory-muted"
              }`}
            >
              Showroom · Casablanca
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Navigation principale" className="hidden items-center gap-8 md:flex">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="editorial-link text-xs font-medium tracking-[0.14em] uppercase transition-opacity hover:opacity-80"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/admin"
            className={`hidden items-center gap-1.5 border px-3 py-2 text-[11px] font-mono tracking-[0.12em] uppercase transition-colors lg:inline-flex ${
              scrolled
                ? "border-hairline text-ink-muted hover:border-ink hover:text-ink"
                : "border-white/20 text-ink-ivory-muted hover:border-white/50 hover:text-ink-ivory"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin
          </Link>

          <button
            type="button"
            onClick={() => openDrawer("cart")}
            id="header-cart-button"
            aria-label="Ouvrir ma sélection"
            className={`group inline-flex items-center gap-2 border px-3 py-2 text-xs font-medium transition-all duration-200 sm:gap-2.5 sm:px-4 ${
              totalItems > 0
                ? "border-accent bg-accent text-white hover:bg-accent-hover"
                : scrolled
                  ? "border-ink bg-ink text-ink-ivory hover:border-accent hover:bg-accent"
                  : "border-white/30 bg-white/10 text-ink-ivory hover:border-accent hover:bg-accent"
            }`}
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span className="hidden tracking-[0.1em] uppercase sm:inline">Sélection</span>
            <span className="font-mono text-[11px] tabular-nums opacity-90">
              ({totalItems})
            </span>
            {totalItems > 0 && (
              <span className="hidden border-l border-white/25 pl-2.5 font-mono text-[11px] tabular-nums sm:inline">
                {formatMad(totalMad)}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu mobile"
            className={`inline-flex h-10 w-10 items-center justify-center border md:hidden ${
              scrolled ? "border-hairline text-ink" : "border-white/25 text-ink-ivory"
            }`}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileOpen && (
        <div className="border-t border-hairline bg-surface px-5 py-6 text-ink md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-xs font-semibold tracking-[0.16em] uppercase text-ink"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center gap-2 border-t border-hairline pt-4 text-xs font-mono tracking-[0.14em] uppercase text-ink-muted"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Espace Direction / Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
