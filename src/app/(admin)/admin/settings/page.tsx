"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, RotateCcw, AlertTriangle, Check, Plus, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingConfig {
  weeklyRates: {
    "48h": number;
    "1-2wochen": number;
    "1monat": number;
    flexibel: number;
  };
  featureDays: Record<string, number>;
  bwPackages: { months: number; pricePerMonth: number }[];
  bwIncludedMonths: number;
  zahlungsbedingungen: { prozent: number; label: string }[];
  riskThresholds: { lowMaxFeatures: number; mediumMaxFeatures: number };
  demand: {
    maxCapacity: number;
    maxSurcharge: number;
    adminOverride: number;
  };
  autoAngebotLimits: { minPrice: number; maxPrice: number };
  baseSetupDays: number;
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-6">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
        {title}
      </h3>
      {children}
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  suffix,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-[#8B8F97] shrink-0">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          min={min}
          max={max}
          step={step || 1}
          className="w-24 rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-sm text-white text-right focus:border-[#FFC62C]/50 focus:outline-none"
        />
        {suffix && (
          <span className="text-xs text-[#6a6e76] w-12">{suffix}</span>
        )}
      </div>
    </div>
  );
}

interface ExcludedIp {
  id: string;
  ip: string;
  label: string | null;
  createdAt: string;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Excluded IPs state
  const [excludedIps, setExcludedIps] = useState<ExcludedIp[]>([]);
  const [newIp, setNewIp] = useState("");
  const [newIpLabel, setNewIpLabel] = useState("");
  const [ipSaving, setIpSaving] = useState(false);
  const [ipError, setIpError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const [configRes, ipsRes] = await Promise.all([
        fetch("/api/admin/settings/pricing"),
        fetch("/api/admin/settings/excluded-ips"),
      ]);
      if (!configRes.ok) throw new Error("Laden fehlgeschlagen");
      const data = await configRes.json();
      setConfig(data);
      if (ipsRes.ok) {
        setExcludedIps(await ipsRes.json());
      }
    } catch (err) {
      setError("Konfiguration konnte nicht geladen werden");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  async function addExcludedIp() {
    const ip = newIp.trim();
    if (!ip) return;
    setIpSaving(true);
    setIpError(null);
    try {
      const res = await fetch("/api/admin/settings/excluded-ips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, label: newIpLabel.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Speichern fehlgeschlagen");
      }
      const record = await res.json();
      setExcludedIps((prev) => [record, ...prev.filter((e) => e.ip !== ip)]);
      setNewIp("");
      setNewIpLabel("");
    } catch (err) {
      setIpError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setIpSaving(false);
    }
  }

  async function removeExcludedIp(id: string) {
    try {
      await fetch(`/api/admin/settings/excluded-ips?id=${id}`, {
        method: "DELETE",
      });
      setExcludedIps((prev) => prev.filter((e) => e.id !== id));
    } catch {
      // silent
    }
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/settings/pricing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Speichern fehlgeschlagen");
      }

      const updated = await res.json();
      setConfig(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  }

  function updateConfig(partial: Partial<PricingConfig>) {
    setConfig((prev) => (prev ? { ...prev, ...partial } : prev));
  }

  if (loading) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-[#FFC62C] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="p-6 md:p-10 text-center text-red-400">
        Konfiguration konnte nicht geladen werden.
      </div>
    );
  }

  const tranchenSum = config.zahlungsbedingungen.reduce(
    (s, t) => s + t.prozent,
    0
  );

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Einstellungen</h1>
          <p className="text-sm text-[#6a6e76] mt-1">
            Preislogik, Zahlungsbedingungen und Automatisierung
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={fetchConfig}
            className="text-[#8B8F97] hover:text-white"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Zurücksetzen
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] font-bold"
          >
            {saving ? (
              "Speichern..."
            ) : success ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Gespeichert
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Speichern
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Weekly Rates */}
        <SectionCard title="Wochensätze">
          <div className="space-y-3">
            <NumberInput
              label="48h (Rush)"
              value={config.weeklyRates["48h"]}
              suffix="€/W"
              onChange={(v) =>
                updateConfig({
                  weeklyRates: { ...config.weeklyRates, "48h": v },
                })
              }
            />
            <NumberInput
              label="1–2 Wochen"
              value={config.weeklyRates["1-2wochen"]}
              suffix="€/W"
              onChange={(v) =>
                updateConfig({
                  weeklyRates: { ...config.weeklyRates, "1-2wochen": v },
                })
              }
            />
            <NumberInput
              label="1 Monat"
              value={config.weeklyRates["1monat"]}
              suffix="€/W"
              onChange={(v) =>
                updateConfig({
                  weeklyRates: { ...config.weeklyRates, "1monat": v },
                })
              }
            />
            <NumberInput
              label="Flexibel"
              value={config.weeklyRates.flexibel}
              suffix="€/W"
              onChange={(v) =>
                updateConfig({
                  weeklyRates: { ...config.weeklyRates, flexibel: v },
                })
              }
            />
          </div>
          <p className="text-xs text-[#5a5e66] mt-3">
            Tagessatz = Wochensatz / 5. Reihenfolge: 48h &gt; 1-2W &gt; 1M &gt; Flexibel
          </p>
        </SectionCard>

        {/* Feature Days */}
        <SectionCard title="Feature-Aufwand (Personentage)">
          <div className="space-y-3">
            {Object.entries(config.featureDays).map(([feature, days]) => (
              <NumberInput
                key={feature}
                label={feature}
                value={days}
                suffix="PT"
                step={0.5}
                min={0.5}
                onChange={(v) =>
                  updateConfig({
                    featureDays: { ...config.featureDays, [feature]: v },
                  })
                }
              />
            ))}
          </div>
          <p className="text-xs text-[#5a5e66] mt-3">
            Basis-Setup: {config.baseSetupDays} Tage (zusätzlich zu Features)
          </p>
        </SectionCard>

        {/* B&W Packages */}
        <SectionCard title="Betrieb & Wartung">
          <div className="space-y-3">
            <NumberInput
              label="Inkl. im Festpreis"
              value={config.bwIncludedMonths}
              suffix="Monat(e)"
              min={0}
              max={12}
              onChange={(v) =>
                updateConfig({ bwIncludedMonths: v })
              }
            />
            <div className="border-t border-white/[0.06] my-3 pt-3">
              <p className="text-xs text-[#8B8F97] mb-3">Abo-Pakete (nach dem inkl. Zeitraum):</p>
            </div>
            {config.bwPackages.map((pkg, i) => (
              <NumberInput
                key={i}
                label={`${pkg.months} Monate`}
                value={pkg.pricePerMonth}
                suffix="€/Mo"
                min={1}
                onChange={(v) => {
                  const updated = [...config.bwPackages];
                  updated[i] = { ...updated[i], pricePerMonth: v };
                  updateConfig({ bwPackages: updated });
                }}
              />
            ))}
          </div>
        </SectionCard>

        {/* Payment Terms */}
        <SectionCard title="Zahlungsbedingungen">
          <div className="space-y-3">
            {config.zahlungsbedingungen.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  type="number"
                  value={t.prozent}
                  min={0}
                  max={100}
                  onChange={(e) => {
                    const updated = [...config.zahlungsbedingungen];
                    updated[i] = { ...updated[i], prozent: Number(e.target.value) };
                    updateConfig({ zahlungsbedingungen: updated });
                  }}
                  className="w-20 rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-sm text-white text-right focus:border-[#FFC62C]/50 focus:outline-none"
                />
                <span className="text-sm text-[#6a6e76]">%</span>
                <input
                  type="text"
                  value={t.label}
                  onChange={(e) => {
                    const updated = [...config.zahlungsbedingungen];
                    updated[i] = { ...updated[i], label: e.target.value };
                    updateConfig({ zahlungsbedingungen: updated });
                  }}
                  className="flex-1 rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-sm text-white focus:border-[#FFC62C]/50 focus:outline-none"
                />
              </div>
            ))}
          </div>
          <p
            className={`text-xs mt-3 ${
              tranchenSum === 100 ? "text-green-400" : "text-red-400"
            }`}
          >
            Summe: {tranchenSum}%{" "}
            {tranchenSum !== 100 && " — Muss 100% ergeben!"}
          </p>
        </SectionCard>

        {/* Demand / Auslastung */}
        <SectionCard title="Auslastung & Dynamisches Pricing">
          <div className="space-y-3">
            <NumberInput
              label="Max. Kapazität"
              value={config.demand.maxCapacity}
              suffix="Projekte"
              min={1}
              max={10}
              onChange={(v) =>
                updateConfig({
                  demand: { ...config.demand, maxCapacity: v },
                })
              }
            />
            <NumberInput
              label="Max. Aufschlag"
              value={Math.round(config.demand.maxSurcharge * 100)}
              suffix="%"
              min={0}
              max={100}
              onChange={(v) =>
                updateConfig({
                  demand: {
                    ...config.demand,
                    maxSurcharge: v / 100,
                  },
                })
              }
            />
            <NumberInput
              label="Manueller Override"
              value={config.demand.adminOverride}
              suffix="Faktor"
              step={0.01}
              min={0}
              max={2}
              onChange={(v) =>
                updateConfig({
                  demand: { ...config.demand, adminOverride: v },
                })
              }
            />
          </div>
          <p className="text-xs text-[#5a5e66] mt-3">
            Override = 0 → deaktiviert. Sonst: max(Override, Auto-Berechnung).
          </p>
        </SectionCard>

        {/* Risk Thresholds */}
        <SectionCard title="Risiko-Schwellenwerte">
          <div className="space-y-3">
            <NumberInput
              label="Low → Medium (Features)"
              value={config.riskThresholds.lowMaxFeatures}
              suffix="Features"
              min={1}
              onChange={(v) =>
                updateConfig({
                  riskThresholds: {
                    ...config.riskThresholds,
                    lowMaxFeatures: v,
                  },
                })
              }
            />
            <NumberInput
              label="Medium → High (Features)"
              value={config.riskThresholds.mediumMaxFeatures}
              suffix="Features"
              min={1}
              onChange={(v) =>
                updateConfig({
                  riskThresholds: {
                    ...config.riskThresholds,
                    mediumMaxFeatures: v,
                  },
                })
              }
            />
          </div>
          <p className="text-xs text-[#5a5e66] mt-3">
            Low: SLA 30 Min · Medium: SLA 1h · High: SLA 2h
          </p>
        </SectionCard>

        {/* Auto-Angebot Limits */}
        <SectionCard title="Auto-Angebot Grenzen">
          <div className="space-y-3">
            <NumberInput
              label="Mindestpreis"
              value={config.autoAngebotLimits.minPrice}
              suffix="€"
              min={0}
              onChange={(v) =>
                updateConfig({
                  autoAngebotLimits: {
                    ...config.autoAngebotLimits,
                    minPrice: v,
                  },
                })
              }
            />
            <NumberInput
              label="Höchstpreis"
              value={config.autoAngebotLimits.maxPrice}
              suffix="€"
              min={0}
              onChange={(v) =>
                updateConfig({
                  autoAngebotLimits: {
                    ...config.autoAngebotLimits,
                    maxPrice: v,
                  },
                })
              }
            />
          </div>
          <p className="text-xs text-[#5a5e66] mt-3">
            Über Höchstpreis: Admin muss manuell Angebot erstellen.
          </p>
        </SectionCard>

        {/* Excluded IPs */}
        <SectionCard title="Analytics — Ausgeschlossene IPs">
          <div className="flex items-start gap-2 mb-4 text-sm text-[#8B8F97]">
            <Shield className="h-4 w-4 mt-0.5 shrink-0 text-[#FFC62C]" />
            <p>
              IP-Adressen, die vom Analytics-Tracking ausgeschlossen werden
              (z.B. eigene IPs oder Tester).
            </p>
          </div>

          {/* Add new IP */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newIp}
              onChange={(e) => setNewIp(e.target.value)}
              placeholder="IP-Adresse"
              className="w-40 rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExcludedIp();
                }
              }}
            />
            <input
              type="text"
              value={newIpLabel}
              onChange={(e) => setNewIpLabel(e.target.value)}
              placeholder="Bezeichnung (optional)"
              className="flex-1 rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-sm text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExcludedIp();
                }
              }}
            />
            <button
              type="button"
              onClick={addExcludedIp}
              disabled={ipSaving || !newIp.trim()}
              className="flex items-center gap-1.5 rounded-lg border border-[#FFC62C]/30 bg-[#FFC62C]/[0.06] px-4 py-2 text-sm font-medium text-[#FFC62C] transition-all hover:bg-[#FFC62C]/[0.12] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" />
              {ipSaving ? "..." : "Hinzufügen"}
            </button>
          </div>

          {ipError && (
            <p className="text-sm text-red-400 mb-3">{ipError}</p>
          )}

          {/* List of excluded IPs */}
          {excludedIps.length > 0 ? (
            <div className="space-y-2">
              {excludedIps.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <code className="text-sm text-[#FFC62C] font-mono">
                      {entry.ip}
                    </code>
                    {entry.label && (
                      <span className="text-xs text-[#6a6e76] truncate">
                        — {entry.label}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExcludedIp(entry.id)}
                    className="rounded-full p-1 text-[#6a6e76] hover:text-red-400 hover:bg-white/[0.06] transition-colors shrink-0"
                    aria-label={`${entry.ip} entfernen`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5a5e66]">
              Keine IPs ausgeschlossen. Alle Besucher werden getrackt.
            </p>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
