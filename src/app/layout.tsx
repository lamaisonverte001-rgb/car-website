import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import { CartProvider } from "@/components/providers/cart-context";
import { CartCheckoutDrawer } from "@/components/cart/cart-checkout-drawer";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Maison Véloce — Showroom Automobile Contemporain au Maroc",
  description:
    "Configurez et commandez votre véhicule européen contemporain (Hatchback, Berline, Coupé, SUV) par teinte, motorisation et jantes. Tarifs transparents en Dirhams (MAD) et paiement à la livraison.",
  keywords: [
    "voiture neuve Maroc",
    "configurateur automobile",
    "showroom Casablanca",
    "berline européenne",
    "SUV performance",
    "jantes forgées",
    "paiement à la livraison",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${plusJakarta.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <CartProvider>
          {children}
          <CartCheckoutDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
