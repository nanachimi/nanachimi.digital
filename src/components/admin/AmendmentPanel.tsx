"use client";

import { useState } from "react";
import {
  Brain,
  Save,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Code,
  Layout,
  Server,
  Shield,
  Sparkles,
  Plus,
  Trash2,
  Pencil,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectPlan, UserStory, ApiEndpoint, TechChoice, CriticalPoint, OffenerPunkt } from "@/lib/plan-template";

interface AmendmentPanelProps {
  submissionId: string;
  existingPlan?: ProjectPlan;
  existingPricing?: {
    festpreis: number;
    aufwand: number;
  };
  existingNotes?: string;
  autoEstimate: {
    festpreis: number;
    aufwand: number;
  };
  onSaved: () => void;
}

function formatEur(n: number) {
  return n.toLocaleString("de-DE") + " EUR";
}

const PRIORITAET_COLORS = {
  must: "bg-red-400/10 text-red-400 border-red-400/20",
  should: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  could: "bg-green-400/10 text-green-400 border-green-400/20",
};

// Editable text input helper
function EditableField({
  value,
  onChange,
  className = "",
  multiline = false,
  placeholder = "",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={`w-full rounded bg-white/[0.06] border border-white/[0.1] px-2 py-1 text-sm text-white focus:border-[#FFC62C]/50 focus:outline-none resize-none ${className}`}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded bg-white/[0.06] border border-white/[0.1] px-2 py-1 text-sm text-white focus:border-[#FFC62C]/50 focus:outline-none ${className}`}
    />
  );
}

// ── Read-only plan display ──────────────────────────────────────────

export function ReadOnlyPlan({ plan }: { plan: ProjectPlan }) {
  return (
    <div className="space-y-6">
      {/* Requirements */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Check className="h-4 w-4 text-[#FFC62C]" />
          Anforderungen
        </h4>
        <div className="space-y-2">
          {plan.anforderungen.userStories.map((story, i) => (
            <div
              key={i}
              className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 flex items-start gap-3"
            >
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border ${PRIORITAET_COLORS[story.prioritaet]}`}
              >
                {story.prioritaet}
              </span>
              <div className="text-sm">
                <span className="text-[#8B8F97]">Als </span>
                <span className="text-white font-medium">{story.rolle}</span>
                <span className="text-[#8B8F97]"> möchte ich </span>
                <span className="text-white">{story.aktion}</span>
                <span className="text-[#8B8F97]">, damit </span>
                <span className="text-[#c0c3c9]">{story.nutzen}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* API Endpoints */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Server className="h-4 w-4 text-[#FFC62C]" />
          API-Endpunkte
        </h4>
        <div className="rounded-lg border border-white/[0.06] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.04]">
                <th className="text-left px-3 py-2 text-[#6a6e76] text-xs uppercase tracking-wider">Methode</th>
                <th className="text-left px-3 py-2 text-[#6a6e76] text-xs uppercase tracking-wider">Pfad</th>
                <th className="text-left px-3 py-2 text-[#6a6e76] text-xs uppercase tracking-wider">Beschreibung</th>
              </tr>
            </thead>
            <tbody>
              {plan.apiEndpunkte.map((ep, i) => (
                <tr key={i} className="border-t border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-3 py-2">
                    <span className="rounded bg-[#FFC62C]/10 px-1.5 py-0.5 text-xs font-mono font-bold text-[#FFC62C]">
                      {ep.methode}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[#c0c3c9]">{ep.pfad}</td>
                  <td className="px-3 py-2 text-[#8B8F97]">{ep.beschreibung}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* UI Components */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Layout className="h-4 w-4 text-[#FFC62C]" />
          UI-Komponenten
        </h4>
        <div className="space-y-3">
          {plan.uiKomponenten.map((roleUI, i) => (
            <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <p className="text-xs text-[#FFC62C] font-semibold uppercase tracking-wider mb-2">{roleUI.rolle}</p>
              <div className="space-y-2">
                {roleUI.screens.map((screen, j) => (
                  <div key={j} className="pl-3 border-l-2 border-white/10">
                    <p className="text-sm font-medium text-white">{screen.name}</p>
                    <p className="text-xs text-[#8B8F97]">{screen.beschreibung}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {screen.komponenten.map((k, idx) => (
                        <span key={idx} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#c0c3c9]">{k}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Server className="h-4 w-4 text-[#FFC62C]" />
          Architektur
        </h4>
        <div className="space-y-3 text-sm text-[#c0c3c9]">
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">Systemarchitektur</p>
            <p>{plan.architektur.beschreibung}</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">Datenfluss</p>
            <p>{plan.architektur.datenfluss}</p>
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">Datenbankmodell</p>
            <p>{plan.architektur.datenbankmodell}</p>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Code className="h-4 w-4 text-[#FFC62C]" />
          Technologie-Stack
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {plan.technologieStack.map((tech, i) => (
            <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <span className="text-[10px] uppercase tracking-wider text-[#6a6e76]">{tech.kategorie}</span>
              <p className="text-sm font-medium text-white">{tech.technologie}</p>
              <p className="text-xs text-[#8B8F97] mt-0.5">{tech.begruendung}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Points */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-[#FFC62C]" />
          Kritische Punkte
        </h4>
        <div className="space-y-2">
          {plan.kritischePunkte.map((point, i) => (
            <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <span className="text-[10px] uppercase tracking-wider text-yellow-400 bg-yellow-400/10 rounded-full px-2 py-0.5">
                {point.kategorie}
              </span>
              <p className="text-sm text-white mt-1.5">{point.beschreibung}</p>
              <p className="text-xs text-green-400 mt-1">→ {point.empfehlung}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Offene Punkte */}
      {plan.offenePunkte && plan.offenePunkte.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            Offene Punkte &amp; Vorschläge
          </h4>
          <div className="space-y-2">
            {plan.offenePunkte.map((punkt, i) => {
              const typColors: Record<string, string> = {
                luecke: "text-red-400 bg-red-400/10",
                inkonsistenz: "text-orange-400 bg-orange-400/10",
                risiko: "text-yellow-400 bg-yellow-400/10",
                unklarheit: "text-blue-400 bg-blue-400/10",
              };
              const prioColors: Record<string, string> = {
                hoch: "text-red-400",
                mittel: "text-yellow-400",
                niedrig: "text-green-400",
              };
              return (
                <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${typColors[punkt.typ] || "text-[#8B8F97] bg-white/[0.06]"}`}>
                      {punkt.typ}
                    </span>
                    <span className={`text-[10px] uppercase tracking-wider ${prioColors[punkt.prioritaet] || "text-[#8B8F97]"}`}>
                      ● {punkt.prioritaet}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">{punkt.titel}</p>
                  <p className="text-xs text-[#8B8F97] mt-0.5">{punkt.beschreibung}</p>
                  <p className="text-xs text-green-400 mt-1.5">→ {punkt.vorschlag}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Betrieb & Wartung */}
      {plan.betriebUndWartung && (
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Server className="h-4 w-4 text-[#FFC62C]" />
            Betrieb &amp; Wartung
          </h4>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#6a6e76] mb-0.5">Umfang</p>
                <p className="text-[#c0c3c9]">{plan.betriebUndWartung.umfang}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#6a6e76] mb-0.5">Vertragslaufzeit</p>
                <p className="text-white font-medium">{plan.betriebUndWartung.vertragslaufzeit}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#6a6e76] mb-0.5">Abo-Optionen</p>
                <p className="text-[#c0c3c9]">{plan.betriebUndWartung.aboOptionen || "3 Mo: 69€/Mo, 6 Mo: 49€/Mo, 12 Mo: 29€/Mo"}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-[#6a6e76] mb-0.5">SLA</p>
              <p className="text-sm text-[#c0c3c9]">{plan.betriebUndWartung.sla}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Editable plan display ───────────────────────────────────────────

function EditablePlan({
  plan,
  setPlan,
}: {
  plan: ProjectPlan;
  setPlan: (p: ProjectPlan) => void;
}) {
  function updateStory(index: number, field: keyof UserStory, value: string) {
    const stories = [...plan.anforderungen.userStories];
    stories[index] = { ...stories[index], [field]: value };
    setPlan({ ...plan, anforderungen: { userStories: stories } });
  }

  function removeStory(index: number) {
    setPlan({ ...plan, anforderungen: { userStories: plan.anforderungen.userStories.filter((_, i) => i !== index) } });
  }

  function addStory() {
    setPlan({ ...plan, anforderungen: { userStories: [...plan.anforderungen.userStories, { rolle: "", aktion: "", nutzen: "", prioritaet: "should" as const }] } });
  }

  function updateEndpoint(index: number, field: keyof ApiEndpoint, value: string) {
    const endpoints = [...plan.apiEndpunkte];
    endpoints[index] = { ...endpoints[index], [field]: value };
    setPlan({ ...plan, apiEndpunkte: endpoints });
  }

  function removeEndpoint(index: number) {
    setPlan({ ...plan, apiEndpunkte: plan.apiEndpunkte.filter((_, i) => i !== index) });
  }

  function addEndpoint() {
    setPlan({ ...plan, apiEndpunkte: [...plan.apiEndpunkte, { methode: "GET", pfad: "/api/", beschreibung: "" }] });
  }

  function updateTech(index: number, field: keyof TechChoice, value: string) {
    const stack = [...plan.technologieStack];
    stack[index] = { ...stack[index], [field]: value };
    setPlan({ ...plan, technologieStack: stack });
  }

  function removeTech(index: number) {
    setPlan({ ...plan, technologieStack: plan.technologieStack.filter((_, i) => i !== index) });
  }

  function addTech() {
    setPlan({ ...plan, technologieStack: [...plan.technologieStack, { kategorie: "", technologie: "", begruendung: "" }] });
  }

  function updateCritical(index: number, field: keyof CriticalPoint, value: string) {
    const points = [...plan.kritischePunkte];
    points[index] = { ...points[index], [field]: value };
    setPlan({ ...plan, kritischePunkte: points });
  }

  function removeCritical(index: number) {
    setPlan({ ...plan, kritischePunkte: plan.kritischePunkte.filter((_, i) => i !== index) });
  }

  function addCritical() {
    setPlan({ ...plan, kritischePunkte: [...plan.kritischePunkte, { kategorie: "", beschreibung: "", empfehlung: "" }] });
  }

  function updateOffenePunkte(index: number, field: keyof OffenerPunkt, value: string) {
    const punkte = [...(plan.offenePunkte || [])];
    punkte[index] = { ...punkte[index], [field]: value };
    setPlan({ ...plan, offenePunkte: punkte });
  }

  function removeOffenerPunkt(index: number) {
    setPlan({ ...plan, offenePunkte: (plan.offenePunkte || []).filter((_, i) => i !== index) });
  }

  function addOffenerPunkt() {
    setPlan({ ...plan, offenePunkte: [...(plan.offenePunkte || []), { typ: "unklarheit", titel: "", beschreibung: "", vorschlag: "", prioritaet: "mittel" }] });
  }

  function updateArchitektur(field: "beschreibung" | "datenfluss" | "datenbankmodell", value: string) {
    setPlan({ ...plan, architektur: { ...plan.architektur, [field]: value } });
  }

  function updateScreen(roleIdx: number, screenIdx: number, field: "name" | "beschreibung", value: string) {
    const ui = [...plan.uiKomponenten];
    const screens = [...ui[roleIdx].screens];
    screens[screenIdx] = { ...screens[screenIdx], [field]: value };
    ui[roleIdx] = { ...ui[roleIdx], screens };
    setPlan({ ...plan, uiKomponenten: ui });
  }

  function updateScreenKomponenten(roleIdx: number, screenIdx: number, value: string) {
    const ui = [...plan.uiKomponenten];
    const screens = [...ui[roleIdx].screens];
    screens[screenIdx] = { ...screens[screenIdx], komponenten: value.split(",").map(s => s.trim()).filter(Boolean) };
    ui[roleIdx] = { ...ui[roleIdx], screens };
    setPlan({ ...plan, uiKomponenten: ui });
  }

  return (
    <div className="space-y-6">
      {/* Requirements — editable */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Check className="h-4 w-4 text-[#FFC62C]" />
          Anforderungen
        </h4>
        <div className="space-y-2">
          {plan.anforderungen.userStories.map((story, i) => (
            <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 space-y-2">
              <div className="flex items-center gap-2">
                <select
                  value={story.prioritaet}
                  onChange={(e) => updateStory(i, "prioritaet", e.target.value)}
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase border bg-transparent focus:outline-none cursor-pointer ${PRIORITAET_COLORS[story.prioritaet]}`}
                >
                  <option value="must">MUST</option>
                  <option value="should">SHOULD</option>
                  <option value="could">COULD</option>
                </select>
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <EditableField value={story.rolle} onChange={(v) => updateStory(i, "rolle", v)} placeholder="Rolle" />
                  <EditableField value={story.aktion} onChange={(v) => updateStory(i, "aktion", v)} placeholder="Aktion" />
                  <EditableField value={story.nutzen} onChange={(v) => updateStory(i, "nutzen", v)} placeholder="Nutzen" />
                </div>
                <button onClick={() => removeStory(i)} className="text-red-400/60 hover:text-red-400 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          <button onClick={addStory} className="flex items-center gap-1.5 text-xs text-[#FFC62C] hover:text-[#e6b228] mt-1">
            <Plus className="h-3.5 w-3.5" /> User Story hinzufügen
          </button>
        </div>
      </div>

      {/* API Endpoints — editable */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Server className="h-4 w-4 text-[#FFC62C]" />
          API-Endpunkte
        </h4>
        <div className="space-y-2">
          {plan.apiEndpunkte.map((ep, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] p-2">
              <select
                value={ep.methode}
                onChange={(e) => updateEndpoint(i, "methode", e.target.value)}
                className="shrink-0 rounded bg-[#FFC62C]/10 px-1.5 py-1 text-xs font-mono font-bold text-[#FFC62C] border-none focus:outline-none cursor-pointer"
              >
                {["GET", "POST", "PATCH", "PUT", "DELETE"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <EditableField value={ep.pfad} onChange={(v) => updateEndpoint(i, "pfad", v)} placeholder="/api/..." className="font-mono text-xs flex-shrink-0 w-48" />
              <EditableField value={ep.beschreibung} onChange={(v) => updateEndpoint(i, "beschreibung", v)} placeholder="Beschreibung" className="flex-1" />
              <button onClick={() => removeEndpoint(i)} className="text-red-400/60 hover:text-red-400 shrink-0">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button onClick={addEndpoint} className="flex items-center gap-1.5 text-xs text-[#FFC62C] hover:text-[#e6b228] mt-1">
            <Plus className="h-3.5 w-3.5" /> Endpunkt hinzufügen
          </button>
        </div>
      </div>

      {/* UI Components — editable */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Layout className="h-4 w-4 text-[#FFC62C]" />
          UI-Komponenten
        </h4>
        <div className="space-y-3">
          {plan.uiKomponenten.map((roleUI, i) => (
            <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
              <p className="text-xs text-[#FFC62C] font-semibold uppercase tracking-wider mb-2">{roleUI.rolle}</p>
              <div className="space-y-2">
                {roleUI.screens.map((screen, j) => (
                  <div key={j} className="pl-3 border-l-2 border-white/10 space-y-1">
                    <EditableField value={screen.name} onChange={(v) => updateScreen(i, j, "name", v)} placeholder="Screen-Name" className="font-medium" />
                    <EditableField value={screen.beschreibung} onChange={(v) => updateScreen(i, j, "beschreibung", v)} placeholder="Beschreibung" className="text-xs" />
                    <EditableField
                      value={screen.komponenten.join(", ")}
                      onChange={(v) => updateScreenKomponenten(i, j, v)}
                      placeholder="Komponenten (kommasepariert)"
                      className="text-[10px] text-[#c0c3c9]"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture — editable */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Server className="h-4 w-4 text-[#FFC62C]" />
          Architektur
        </h4>
        <div className="space-y-3">
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">Systemarchitektur</p>
            <EditableField value={plan.architektur.beschreibung} onChange={(v) => updateArchitektur("beschreibung", v)} multiline />
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">Datenfluss</p>
            <EditableField value={plan.architektur.datenfluss} onChange={(v) => updateArchitektur("datenfluss", v)} multiline />
          </div>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
            <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">Datenbankmodell</p>
            <EditableField value={plan.architektur.datenbankmodell} onChange={(v) => updateArchitektur("datenbankmodell", v)} multiline />
          </div>
        </div>
      </div>

      {/* Tech Stack — editable */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Code className="h-4 w-4 text-[#FFC62C]" />
          Technologie-Stack
        </h4>
        <div className="space-y-2">
          {plan.technologieStack.map((tech, i) => (
            <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 flex items-start gap-2">
              <div className="flex-1 grid grid-cols-3 gap-2">
                <EditableField value={tech.kategorie} onChange={(v) => updateTech(i, "kategorie", v)} placeholder="Kategorie" />
                <EditableField value={tech.technologie} onChange={(v) => updateTech(i, "technologie", v)} placeholder="Technologie" />
                <EditableField value={tech.begruendung} onChange={(v) => updateTech(i, "begruendung", v)} placeholder="Begründung" />
              </div>
              <button onClick={() => removeTech(i)} className="text-red-400/60 hover:text-red-400 shrink-0 mt-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button onClick={addTech} className="flex items-center gap-1.5 text-xs text-[#FFC62C] hover:text-[#e6b228] mt-1">
            <Plus className="h-3.5 w-3.5" /> Technologie hinzufügen
          </button>
        </div>
      </div>

      {/* Critical Points — editable */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-[#FFC62C]" />
          Kritische Punkte
        </h4>
        <div className="space-y-2">
          {plan.kritischePunkte.map((point, i) => (
            <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <EditableField value={point.kategorie} onChange={(v) => updateCritical(i, "kategorie", v)} placeholder="Kategorie (Security, Performance...)" />
                <EditableField value={point.beschreibung} onChange={(v) => updateCritical(i, "beschreibung", v)} placeholder="Beschreibung" />
                <EditableField value={point.empfehlung} onChange={(v) => updateCritical(i, "empfehlung", v)} placeholder="Empfehlung" />
              </div>
              <button onClick={() => removeCritical(i)} className="text-red-400/60 hover:text-red-400 shrink-0 mt-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button onClick={addCritical} className="flex items-center gap-1.5 text-xs text-[#FFC62C] hover:text-[#e6b228] mt-1">
            <Plus className="h-3.5 w-3.5" /> Kritischen Punkt hinzufügen
          </button>
        </div>
      </div>

      {/* Offene Punkte — editable */}
      <div>
        <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-orange-400" />
          Offene Punkte &amp; Vorschläge
        </h4>
        <div className="space-y-2">
          {(plan.offenePunkte || []).map((punkt, i) => (
            <div key={i} className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 flex items-start gap-2">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <select
                    value={punkt.typ}
                    onChange={(e) => updateOffenePunkte(i, "typ", e.target.value)}
                    className="rounded bg-white/[0.06] border border-white/[0.1] px-2 py-1 text-xs text-white focus:border-[#FFC62C]/50 focus:outline-none"
                  >
                    <option value="luecke">Lücke</option>
                    <option value="inkonsistenz">Inkonsistenz</option>
                    <option value="risiko">Risiko</option>
                    <option value="unklarheit">Unklarheit</option>
                  </select>
                  <select
                    value={punkt.prioritaet}
                    onChange={(e) => updateOffenePunkte(i, "prioritaet", e.target.value)}
                    className="rounded bg-white/[0.06] border border-white/[0.1] px-2 py-1 text-xs text-white focus:border-[#FFC62C]/50 focus:outline-none"
                  >
                    <option value="hoch">Hoch</option>
                    <option value="mittel">Mittel</option>
                    <option value="niedrig">Niedrig</option>
                  </select>
                </div>
                <EditableField value={punkt.titel} onChange={(v) => updateOffenePunkte(i, "titel", v)} placeholder="Titel" />
                <EditableField value={punkt.beschreibung} onChange={(v) => updateOffenePunkte(i, "beschreibung", v)} placeholder="Beschreibung" multiline />
                <EditableField value={punkt.vorschlag} onChange={(v) => updateOffenePunkte(i, "vorschlag", v)} placeholder="Vorschlag zur Lösung" multiline />
              </div>
              <button onClick={() => removeOffenerPunkt(i)} className="text-red-400/60 hover:text-red-400 shrink-0 mt-1">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button onClick={addOffenerPunkt} className="flex items-center gap-1.5 text-xs text-[#FFC62C] hover:text-[#e6b228] mt-1">
            <Plus className="h-3.5 w-3.5" /> Offenen Punkt hinzufügen
          </button>
        </div>
      </div>

      {/* Betrieb & Wartung — editable */}
      {plan.betriebUndWartung && (
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Server className="h-4 w-4 text-[#FFC62C]" />
            Betrieb &amp; Wartung
          </h4>
          <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3 space-y-3">
            <div>
              <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">Umfang</p>
              <EditableField
                value={plan.betriebUndWartung.umfang}
                onChange={(v) => setPlan({ ...plan, betriebUndWartung: { ...plan.betriebUndWartung, umfang: v } })}
                multiline
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">Vertragslaufzeit</p>
                <EditableField
                  value={plan.betriebUndWartung.vertragslaufzeit}
                  onChange={(v) => setPlan({ ...plan, betriebUndWartung: { ...plan.betriebUndWartung, vertragslaufzeit: v } })}
                />
              </div>
              <div>
                <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">Abo-Optionen</p>
                <EditableField
                  value={plan.betriebUndWartung.aboOptionen || "3 Monate: 69€/Monat, 6 Monate: 49€/Monat, 12 Monate: 29€/Monat"}
                  onChange={(v) => setPlan({ ...plan, betriebUndWartung: { ...plan.betriebUndWartung, aboOptionen: v } })}
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">SLA</p>
              <EditableField
                value={plan.betriebUndWartung.sla}
                onChange={(v) => setPlan({ ...plan, betriebUndWartung: { ...plan.betriebUndWartung, sla: v } })}
                multiline
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main AmendmentPanel ─────────────────────────────────────────────

export function AmendmentPanel({
  submissionId,
  existingPlan,
  existingPricing,
  existingNotes,
  autoEstimate,
  onSaved,
}: AmendmentPanelProps) {
  const [plan, setPlan] = useState<ProjectPlan | null>(existingPlan || null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [planGenerated, setPlanGenerated] = useState(!!existingPlan);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pricing inputs
  const [festpreis, setFestpreis] = useState(
    existingPricing?.festpreis || autoEstimate.festpreis
  );
  const [aufwand, setAufwand] = useState(
    existingPricing?.aufwand || autoEstimate.aufwand
  );
  const [adminNotes, setAdminNotes] = useState(existingNotes || "");

  // Collapsible sections
  const [planExpanded, setPlanExpanded] = useState(true);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    try {
      const res = await fetch(
        `/api/admin/submissions/${submissionId}/generate-plan`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        setGenerateError(data.error || "Fehler bei der Plan-Generierung");
        return;
      }
      setPlan(data.plan);
      setPlanGenerated(true);
      setEditMode(false);
    } catch {
      setGenerateError("Netzwerkfehler bei der Plan-Generierung");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!plan) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/submissions/${submissionId}/amend`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            plan,
            festpreis,
            aufwand,
            adminNotes: adminNotes || undefined,
          }),
        }
      );
      if (res.ok) {
        onSaved();
      }
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 border-t border-[#FFC62C]/20 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#FFC62C]" />
          Anfrage bearbeiten
        </h3>
        <Button
          onClick={handleGenerate}
          disabled={generating || (planGenerated && !generateError)}
          className="bg-[#FFC62C]/10 text-[#FFC62C] hover:bg-[#FFC62C]/20 rounded-xl border border-[#FFC62C]/20 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {generating ? (
            <>
              <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
              Generiere...
            </>
          ) : planGenerated && !generateError ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Plan generiert
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Projektplan generieren
            </>
          )}
        </Button>
      </div>

      {generateError && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/[0.05] p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Fehler</p>
            <p className="text-sm text-red-300/70 mt-1">{generateError}</p>
          </div>
        </div>
      )}

      {/* Plan display */}
      {plan && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
          <button
            type="button"
            onClick={() => setPlanExpanded(!planExpanded)}
            className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
          >
            <span className="font-semibold text-white flex items-center gap-2">
              <Code className="h-4 w-4 text-[#FFC62C]" />
              Projektplan
              {editMode && (
                <span className="text-[10px] font-normal text-[#FFC62C] ml-1 flex items-center gap-1">
                  <Pencil className="h-3 w-3" /> Bearbeitungsmodus
                </span>
              )}
              {!editMode && (
                <span className="text-[10px] font-normal text-[#8B8F97] ml-1 flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Nur-Lesen
                </span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {!editMode ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditMode(true); }}
                  className="flex items-center gap-1.5 rounded-lg border border-[#FFC62C]/20 bg-[#FFC62C]/10 px-3 py-1 text-xs font-medium text-[#FFC62C] hover:bg-[#FFC62C]/20 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Bearbeiten
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setEditMode(false); }}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] px-3 py-1 text-xs font-medium text-[#8B8F97] hover:text-white hover:border-white/20 transition-colors"
                >
                  <Eye className="h-3 w-3" />
                  Vorschau
                </button>
              )}
              {planExpanded ? (
                <ChevronUp className="h-4 w-4 text-[#8B8F97]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#8B8F97]" />
              )}
            </div>
          </button>

          {planExpanded && (
            <div className="border-t border-white/[0.06] p-4">
              {editMode ? (
                <EditablePlan plan={plan} setPlan={setPlan} />
              ) : (
                <ReadOnlyPlan plan={plan} />
              )}
            </div>
          )}
        </div>
      )}

      {/* Pricing Section */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
        <h4 className="text-sm font-semibold text-white">Preisgestaltung</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-[#6a6e76] uppercase tracking-wider mb-1">
              Festpreis (EUR)
            </label>
            <input
              type="number"
              value={festpreis}
              onChange={(e) => setFestpreis(Number(e.target.value))}
              className="w-full rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-sm text-white focus:border-[#FFC62C]/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#6a6e76] uppercase tracking-wider mb-1">
              Aufwand (Personentage)
            </label>
            <input
              type="number"
              value={aufwand}
              onChange={(e) => setAufwand(Number(e.target.value))}
              className="w-full rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-sm text-white focus:border-[#FFC62C]/50 focus:outline-none"
            />
          </div>
        </div>

        <p className="text-xs text-[#6a6e76]">
          Auto-Schätzung: {formatEur(autoEstimate.festpreis)} · {autoEstimate.aufwand} Personentage
        </p>

        {/* Zahlungsbedingungen (fixed, info only) */}
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-3">
          <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-2">Zahlungsbedingungen (Überweisung)</p>
          <div className="space-y-1 text-xs text-[#8B8F97]">
            <p>• 15% vor Projektstart — <span className="text-white font-medium">{formatEur(Math.round(festpreis * 0.15))}</span></p>
            <p>• 35% nach MVP-Lieferung — <span className="text-white font-medium">{formatEur(Math.round(festpreis * 0.35))}</span></p>
            <p>• 50% vor Go-Live / Übergabe — <span className="text-white font-medium">{formatEur(festpreis - Math.round(festpreis * 0.15) - Math.round(festpreis * 0.35))}</span></p>
          </div>
        </div>
      </div>

      {/* Admin Notes */}
      <div>
        <label className="block text-xs text-[#6a6e76] uppercase tracking-wider mb-2">
          Interne Notizen
        </label>
        <Textarea
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Anmerkungen zum Projekt, besondere Vereinbarungen..."
          rows={3}
          className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 resize-none"
        />
      </div>

      {/* Save button */}
      <Button
        onClick={handleSave}
        disabled={!plan || saving}
        className="bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl font-bold px-8 disabled:opacity-40"
      >
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Speichern..." : "Änderungen speichern"}
      </Button>
    </div>
  );
}
