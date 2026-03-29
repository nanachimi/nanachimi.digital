"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Smartphone, Loader2, Copy, Check, AlertTriangle } from "lucide-react";

export default function Setup2FAPage() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingQR, setLoadingQR] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEnrollment();
  }, []);

  async function fetchEnrollment() {
    try {
      const res = await fetch("/api/admin/auth/setup-totp");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Fehler beim Laden der 2FA-Einrichtung");
        return;
      }

      setSecret(data.secret);
      setQrDataUrl(data.qrDataUrl);
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoadingQR(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/setup-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), secret }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verifizierung fehlgeschlagen");
        setCode("");
        inputRef.current?.focus();
        return;
      }

      setSetupComplete(true);
    } catch {
      setError("Verbindungsfehler");
    } finally {
      setLoading(false);
    }
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // After successful setup — show instructions
  if (setupComplete) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-2xl mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">2FA eingerichtet!</h1>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-200">
                <p className="font-medium mb-2">Wichtig: Speichere dieses Secret in deiner .env Datei:</p>
                <code className="block bg-zinc-900 rounded px-3 py-2 font-mono text-xs text-emerald-400 break-all">
                  ADMIN_TOTP_SECRET={secret}
                </code>
                <p className="mt-2 text-zinc-400">
                  Nach dem Server-Neustart wird das Secret aus der Umgebungsvariable gelesen.
                  Ohne diese Variable muss 2FA bei jedem Neustart erneut eingerichtet werden.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={copySecret}
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Kopiert
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Secret kopieren
                </>
              )}
            </Button>
            <Button
              onClick={() => router.push("/admin")}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Zum Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-800 rounded-2xl mb-4">
            <Smartphone className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">2FA einrichten</h1>
          <p className="text-zinc-400 mt-1">
            Scanne den QR-Code mit deiner Authenticator-App
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-xl p-4 mx-auto w-fit mb-6">
          {loadingQR ? (
            <div className="w-48 h-48 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
          ) : qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="2FA QR Code" className="w-48 h-48" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-zinc-400 text-sm">
              QR-Code nicht verfügbar
            </div>
          )}
        </div>

        {/* Manual entry */}
        {secret && (
          <div className="mb-6">
            <p className="text-xs text-zinc-500 text-center mb-2">
              Oder manuell eingeben:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 text-center break-all">
                {secret}
              </code>
              <button
                onClick={copySecret}
                className="shrink-0 p-2 text-zinc-400 hover:text-zinc-300"
                title="Kopieren"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Confirm Code */}
        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code" className="text-zinc-300">
              Bestätigungscode eingeben
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
              "Bestätigen & Einrichten"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
