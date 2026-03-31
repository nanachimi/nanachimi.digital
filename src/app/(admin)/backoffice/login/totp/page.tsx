"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";

export default function TOTPVerifyPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verifizierung fehlgeschlagen");
        setCode("");
        inputRef.current?.focus();
        return;
      }

      router.push("/backoffice");
    } catch {
      setError("Verbindungsfehler. Bitte erneut versuchen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-800 rounded-2xl mb-4">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">2FA-Verifizierung</h1>
          <p className="text-zinc-400 mt-1">
            Code aus der Authenticator-App eingeben
          </p>
        </div>

        {/* TOTP Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-zinc-300">
              Authentifizierungscode
            </Label>
            <Input
              id="code"
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              required
              autoComplete="one-time-code"
              className="bg-zinc-900 border-zinc-700 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-zinc-600 placeholder:tracking-[0.5em] focus:border-emerald-500 focus:ring-emerald-500/20"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Prüfe...
              </>
            ) : (
              "Verifizieren"
            )}
          </Button>

          <button
            type="button"
            onClick={() => router.push("/backoffice/login")}
            className="w-full flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-300 text-sm mt-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Zurück zum Login
          </button>
        </form>
      </div>
    </div>
  );
}
