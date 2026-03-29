import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnboardingData } from "@/lib/onboarding-schema";
import { Users, AppWindow, Globe, Smartphone, Monitor } from "lucide-react";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

const rollenOptions = [
  { value: "1", label: "Nur ich / eine Gruppe", desc: "z.B. nur ich selbst oder meine Kunden" },
  { value: "2", label: "Zwei Gruppen", desc: "z.B. Kunden + Verwaltung" },
  { value: "3+", label: "Drei oder mehr Gruppen", desc: "z.B. Kunden, Mitarbeiter, Verwaltung" },
] as const;

const appTypOptions = [
  { value: "web", label: "Web", icon: Globe },
  { value: "mobile", label: "Mobile", icon: Smartphone },
  { value: "desktop", label: "Desktop", icon: Monitor },
] as const;

function getRollenCount(anzahl: string): number {
  return anzahl === "3+" ? 3 : parseInt(anzahl, 10);
}

export function StepNutzerrollen({ data, onChange }: Props) {
  const hasMultipleRoles = data.rollenAnzahl === "2" || data.rollenAnzahl === "3+";
  const rollenCount = data.rollenAnzahl ? getRollenCount(data.rollenAnzahl) : 0;

  // Initialize rollenApps when switching structure
  function handleAppStrukturChange(struktur: "shared" | "separate") {
    if (!data.rollenApps || data.rollenApps.length !== rollenCount) {
      const apps = Array.from({ length: rollenCount }, (_, i) => ({
        rolle: data.rollenApps?.[i]?.rolle || `Rolle ${i + 1}`,
        appTyp: data.rollenApps?.[i]?.appTyp || ["web"] as ("web" | "mobile" | "desktop")[],
        beschreibung: data.rollenApps?.[i]?.beschreibung || "",
      }));
      onChange({ appStruktur: struktur, rollenApps: apps });
    } else {
      onChange({ appStruktur: struktur });
    }
  }

  function toggleAppTyp(index: number, typ: "web" | "mobile" | "desktop") {
    const apps = [...(data.rollenApps || [])];
    if (apps[index]) {
      const current = apps[index].appTyp;
      const hasTyp = current.includes(typ);
      // Don't allow deselecting the last one
      if (hasTyp && current.length <= 1) return;
      const updated = hasTyp
        ? current.filter((t) => t !== typ)
        : [...current, typ];
      apps[index] = { ...apps[index], appTyp: updated as ("web" | "mobile" | "desktop")[] };
      onChange({ rollenApps: apps });
    }
  }

  function updateRolleField(index: number, field: "rolle" | "beschreibung", value: string) {
    const apps = [...(data.rollenApps || [])];
    if (apps[index]) {
      apps[index] = { ...apps[index], [field]: value };
      onChange({ rollenApps: apps });
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-[#8B8F97]">
        Wie viele verschiedene Personengruppen nutzen Ihre Lösung?
      </p>

      {/* Role count selection */}
      <div className="grid gap-3 sm:grid-cols-3">
        {rollenOptions.map((opt) => {
          const selected = data.rollenAnzahl === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                const updates: Partial<OnboardingData> = { rollenAnzahl: opt.value };
                // Reset appStruktur when changing role count
                if (opt.value === "1") {
                  updates.appStruktur = undefined;
                  updates.rollenApps = undefined;
                }
                onChange(updates);
              }}
              className={`rounded-xl border p-4 text-center transition-all ${
                selected
                  ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <p className={`text-lg font-bold ${selected ? "text-[#FFC62C]" : "text-white"}`}>
                {opt.label}
              </p>
              <p className="text-xs text-[#6a6e76] mt-1">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* App structure question — only shown when >1 role */}
      {hasMultipleRoles && (
        <div className="space-y-3">
          <p className="text-sm text-[#8B8F97]">
            Nutzen alle Gruppen dieselbe Lösung oder braucht jede Gruppe eine eigene?
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleAppStrukturChange("shared")}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                data.appStruktur === "shared"
                  ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                data.appStruktur === "shared" ? "bg-[#FFC62C]/20" : "bg-white/[0.06]"
              }`}>
                <AppWindow className={`h-4 w-4 ${data.appStruktur === "shared" ? "text-[#FFC62C]" : "text-[#8B8F97]"}`} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${data.appStruktur === "shared" ? "text-[#FFC62C]" : "text-white"}`}>
                  Gemeinsame Lösung
                </p>
                <p className="text-xs text-[#6a6e76] mt-0.5">
                  Alle Gruppen nutzen dieselbe Lösung
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleAppStrukturChange("separate")}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                data.appStruktur === "separate"
                  ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08]"
                  : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                data.appStruktur === "separate" ? "bg-[#FFC62C]/20" : "bg-white/[0.06]"
              }`}>
                <Users className={`h-4 w-4 ${data.appStruktur === "separate" ? "text-[#FFC62C]" : "text-[#8B8F97]"}`} />
              </div>
              <div>
                <p className={`font-semibold text-sm ${data.appStruktur === "separate" ? "text-[#FFC62C]" : "text-white"}`}>
                  Eigene Lösung pro Gruppe
                </p>
                <p className="text-xs text-[#6a6e76] mt-0.5">
                  Jede Gruppe hat einen eigenen Zugang
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Per-role app type — only shown when separate */}
      {hasMultipleRoles && data.appStruktur === "separate" && data.rollenApps && (
        <div className="space-y-4">
          <p className="text-sm text-[#8B8F97]">
            Welche Plattform benötigt jede Gruppe? (Mehrfachauswahl möglich)
          </p>
          {data.rollenApps.map((app, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3"
            >
              <Input
                value={app.rolle}
                onChange={(e) => updateRolleField(idx, "rolle", e.target.value)}
                placeholder={`Rolle ${idx + 1}`}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 text-sm"
              />
              <Input
                value={app.beschreibung || ""}
                onChange={(e) => updateRolleField(idx, "beschreibung", e.target.value)}
                placeholder={`Was macht diese Rolle? z.B. Verwaltet Bestellungen, erstellt Berichte…`}
                className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 text-sm"
              />
              <div className="flex gap-2">
                {appTypOptions.map((opt) => {
                  const selected = app.appTyp.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleAppTyp(idx, opt.value)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                        selected
                          ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.08] text-[#FFC62C]"
                          : "border-white/[0.08] bg-white/[0.02] text-[#8B8F97] hover:border-white/20"
                      }`}
                    >
                      <opt.icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Per-role description — shown when shared app with multiple roles */}
      {hasMultipleRoles && data.appStruktur === "shared" && (
        <div className="space-y-4">
          <p className="text-sm text-[#8B8F97]">
            Beschreiben Sie jede Gruppe (optional)
          </p>
          {Array.from({ length: rollenCount }, (_, idx) => {
            const apps = data.rollenApps || [];
            const app = apps[idx] || { rolle: `Rolle ${idx + 1}`, appTyp: ["web"], beschreibung: "" };
            return (
              <div
                key={idx}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-3"
              >
                <Input
                  value={app.rolle}
                  onChange={(e) => {
                    const updated = [...apps];
                    if (!updated[idx]) updated[idx] = { rolle: `Rolle ${idx + 1}`, appTyp: ["web"], beschreibung: "" };
                    updated[idx] = { ...updated[idx], rolle: e.target.value };
                    onChange({ rollenApps: updated });
                  }}
                  placeholder={`Rolle ${idx + 1}`}
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 text-sm"
                />
                <Input
                  value={app.beschreibung || ""}
                  onChange={(e) => {
                    const updated = [...apps];
                    if (!updated[idx]) updated[idx] = { rolle: `Rolle ${idx + 1}`, appTyp: ["web"], beschreibung: "" };
                    updated[idx] = { ...updated[idx], beschreibung: e.target.value };
                    onChange({ rollenApps: updated });
                  }}
                  placeholder={`Was macht diese Rolle? z.B. Verwaltet Bestellungen, erstellt Berichte…`}
                  className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 text-sm"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Single role description */}
      {data.rollenAnzahl === "1" && (
        <div className="space-y-2">
          <Label className="text-[#c8cad0]">Beschreibung (optional)</Label>
          <Input
            value={data.rollenBeschreibung || ""}
            onChange={(e) => onChange({ rollenBeschreibung: e.target.value })}
            placeholder="z.B. Endnutzer sucht Produkte und bestellt online"
            className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50"
          />
        </div>
      )}
    </div>
  );
}
