"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) {
        setError("Identifiants incorrects. Veuillez vérifier votre e-mail et mot de passe.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur d'authentification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-canvas px-5 py-10 text-ink sm:px-8">
      <div className="mx-auto flex w-full max-w-md items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase text-ink-muted hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Retour Showroom
        </Link>
        <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-ink-subtle">
          Accès Restreint
        </span>
      </div>

      <div className="mx-auto my-auto w-full max-w-md border border-hairline bg-surface p-8 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center bg-ink font-mono text-xs font-semibold text-ink-ivory">
            MV
          </span>
          <div>
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-accent">
              Maison Véloce · Direction
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Espace Administrateur
            </h1>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-ink-muted">
          Connectez-vous pour piloter les commandes COD, ajuster la matrice des 144 variantes
          et téléverser vos visuels véhicule. Les inscriptions publiques sont désactivées.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-5 border border-rose-500/40 bg-rose-50 px-4 py-3 text-xs text-rose-900"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink"
            >
              Adresse e-mail
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              placeholder="admin@maison-veloce.ma"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block font-mono text-[11px] tracking-[0.12em] uppercase text-ink"
            >
              Mot de passe
            </label>
            <input
              id="admin-password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full border border-hairline bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink"
            />
          </div>

          <button
            type="submit"
            id="admin-login-submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 bg-ink px-5 py-3.5 text-xs font-semibold tracking-[0.14em] uppercase text-ink-ivory transition-colors hover:bg-accent disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connexion...
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" />
                Se connecter
              </>
            )}
          </button>
        </form>
      </div>

      <p className="text-center font-mono text-[10px] tracking-[0.14em] uppercase text-ink-subtle">
        Authentification sécurisée Better Auth · PostgreSQL
      </p>
    </div>
  );
}
