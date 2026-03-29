"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Mail,
  User,
  Building2,
  AlertTriangle,
  Calendar,
  Plus,
  Trash2,
  Save,
  Brain,
  Send,
  FileEdit,
  FilePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Submission } from "@/lib/submissions";
import type { Booking, AvailabilitySlot } from "@/lib/bookings";
import { AmendmentPanel, ReadOnlyPlan } from "@/components/admin/AmendmentPanel";
import { Code, Eye, LogOut } from "lucide-react";
import { AngebotHistory } from "@/components/admin/AngebotHistory";
import { useRouter } from "next/navigation";

const PROJEKTTYP_LABELS: Record<string, string> = {
  web: "Web-App",
  mobile: "Mobile App",
  desktop: "Desktop App",
  beides: "Mehrere Plattformen",
  unsicher: "Noch unsicher",
};

const DESIGN_LABELS: Record<string, string> = {
  standard: "Standard",
  individuell: "Individuell",
  premium: "Premium",
};

const ZEITRAHMEN_MVP_LABELS: Record<string, string> = {
  "48h": "48 Stunden",
  "1-2wochen": "1-2 Wochen",
  "1monat": "1 Monat",
  flexibel: "Flexibel",
};

const ZEITRAHMEN_FINAL_LABELS: Record<string, string> = {
  "1monat": "1 Monat",
  "2-3monate": "2-3 Monate",
  "6monate": "6 Monate",
  laufend: "Laufende Entwicklung",
};

const BUDGET_LABELS: Record<string, string> = {
  "unter-399": "Unter 399 EUR",
  "399-1000": "399 - 1.000 EUR",
  "1000-5000": "1.000 - 5.000 EUR",
  "5000-10000": "5.000 - 10.000 EUR",
  "10000-plus": "Über 10.000 EUR",
  unsicher: "Noch unsicher",
};

const BETRIEB_LABELS: Record<string, string> = {
  ja: "Ja, bitte übernehmen",
  teilweise: "Teilweise",
  nein: "Nein, selbst",
  unsicher: "Noch unsicher",
};

const RISK_COLORS: Record<string, string> = {
  low: "text-green-400 bg-green-400/10",
  medium: "text-yellow-400 bg-yellow-400/10",
  high: "text-red-400 bg-red-400/10",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatEur(n: number) {
  return n.toLocaleString("de-DE") + " EUR";
}

function StatusBadge({ status }: { status: Submission["status"] }) {
  const config: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
    pending: { icon: <Clock className="h-3 w-3" />, label: "Neu", cls: "bg-yellow-400/10 text-yellow-400" },
    call_requested: { icon: <Clock className="h-3 w-3" />, label: "Call gewünscht", cls: "bg-cyan-400/10 text-cyan-400" },
    sla_active: { icon: <Clock className="h-3 w-3" />, label: "SLA läuft", cls: "bg-yellow-400/10 text-yellow-400" },
    sla_breached: { icon: <XCircle className="h-3 w-3" />, label: "SLA überschritten", cls: "bg-red-400/10 text-red-400" },
    auto_generated: { icon: <Send className="h-3 w-3" />, label: "Auto-Angebot", cls: "bg-indigo-400/10 text-indigo-400" },
    amended: { icon: <FileEdit className="h-3 w-3" />, label: "Bearbeitet", cls: "bg-purple-400/10 text-purple-400" },
    angebot_sent: { icon: <Send className="h-3 w-3" />, label: "Angebot gesendet", cls: "bg-blue-400/10 text-blue-400" },
    rejected: { icon: <XCircle className="h-3 w-3" />, label: "Abgelehnt", cls: "bg-red-400/10 text-red-400" },
    accepted: { icon: <CheckCircle2 className="h-3 w-3" />, label: "Angenommen", cls: "bg-green-400/10 text-green-400" },
    rejected_by_client: { icon: <XCircle className="h-3 w-3" />, label: "Vom Kunden abgelehnt", cls: "bg-orange-400/10 text-orange-400" },
    project_bootstrapped: { icon: <CheckCircle2 className="h-3 w-3" />, label: "Projekt aufgesetzt", cls: "bg-emerald-400/10 text-emerald-400" },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  );
}

function PreferenceBadge({ pref }: { pref?: "call" | "angebot" }) {
  if (!pref) return null;
  return pref === "call" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-purple-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-purple-400">
      📞 Call
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-400">
      📩 Angebot
    </span>
  );
}

function SubmissionCard({
  submission,
  onStatusChange,
  onRefresh,
}: {
  submission: Submission;
  onStatusChange: (id: string, status: "rejected") => void;
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showAmendment, setShowAmendment] = useState(false);
  const [planExpanded, setPlanExpanded] = useState(true);
  const [creatingAngebot, setCreatingAngebot] = useState(false);

  async function handleReject() {
    setUpdating(true);
    await onStatusChange(submission.id, "rejected");
    setUpdating(false);
  }

  async function handleCreateAngebot() {
    setCreatingAngebot(true);
    try {
      const res = await fetch("/api/admin/angebote", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ submissionId: submission.id }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch {
      // Handle error
    } finally {
      setCreatingAngebot(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
            <User className="h-5 w-5 text-[#8B8F97]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="font-semibold text-white truncate">{submission.name}</p>
              <StatusBadge status={submission.status} />
              <PreferenceBadge pref={submission.naechsterSchritt} />
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-sm text-[#6a6e76]">
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" /> {submission.email}
              </span>
              {submission.firma && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {submission.firma}
                </span>
              )}
              <span>{formatDate(submission.createdAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-[#FFC62C]">
              {formatEur(submission.estimate.festpreis)}
            </p>
            <p className="text-xs text-[#6a6e76]">
              ~{submission.estimate.aufwand} PT · {PROJEKTTYP_LABELS[submission.projekttyp]}
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-[#8B8F97]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#8B8F97]" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-white/[0.06] p-5 space-y-6">
          {/* Estimate overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg bg-white/[0.04] p-4">
              <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">Auto-Schätzung</p>
              <p className="text-lg font-bold text-[#FFC62C]">
                {formatEur(submission.estimate.festpreis)}
              </p>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-4">
              <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">Geschätzter Aufwand</p>
              <p className="text-lg font-bold text-white">{submission.estimate.aufwand} Personentage</p>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-4">
              <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-1">Risiko</p>
              <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold ${RISK_COLORS[submission.estimate.riskLevel]}`}>
                {submission.estimate.riskLevel === "high" && <AlertTriangle className="h-3.5 w-3.5" />}
                {submission.estimate.riskLevel === "low" ? "Niedrig" : submission.estimate.riskLevel === "medium" ? "Mittel" : "Hoch"}
              </p>
            </div>
          </div>

          {/* Project details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Projekttyp" value={PROJEKTTYP_LABELS[submission.projekttyp]} />
            <InfoRow label="Design-Level" value={DESIGN_LABELS[submission.designLevel]} />
            <InfoRow label="MVP-Lieferung" value={ZEITRAHMEN_MVP_LABELS[submission.zeitrahmenMvp]} />
            <InfoRow label="Finale Lieferung" value={ZEITRAHMEN_FINAL_LABELS[submission.zeitrahmenFinal]} />
            <InfoRow label="Budget" value={BUDGET_LABELS[submission.budget]} />
            <InfoRow label="Betrieb & Wartung" value={BETRIEB_LABELS[submission.betriebUndWartung]} />
            <InfoRow label="Nutzerrollen" value={submission.rollenAnzahl} />
            {submission.appStruktur && (
              <InfoRow label="App-Struktur" value={submission.appStruktur === "shared" ? "Gemeinsame App" : "Separate Apps"} />
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-2">Projektbeschreibung</p>
            <p className="text-sm text-[#c0c3c9] bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
              {submission.beschreibung}
            </p>
          </div>

          {/* Target audience */}
          <div>
            <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-2">Zielgruppe</p>
            <p className="text-sm text-[#c0c3c9] bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
              {submission.zielgruppe}
            </p>
          </div>

          {/* Features */}
          <div>
            <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-2">Gewählte Funktionen</p>
            <div className="flex flex-wrap gap-2">
              {submission.funktionen.map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-[#FFC62C]/[0.08] border border-[#FFC62C]/20 px-3 py-1 text-xs font-medium text-[#FFC62C]"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Per-role apps */}
          {submission.rollenApps && submission.rollenApps.length > 0 && (
            <div>
              <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-2">Apps pro Rolle</p>
              <div className="flex flex-wrap gap-2">
                {submission.rollenApps.map((app, i) => (
                  <span
                    key={i}
                    className="rounded-full bg-purple-400/[0.08] border border-purple-400/20 px-3 py-1 text-xs font-medium text-purple-400"
                  >
                    {app.rolle}: {Array.isArray(app.appTyp) ? app.appTyp.join(", ") : app.appTyp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Per-role descriptions */}
          {submission.rollenApps && submission.rollenApps.some(a => a.beschreibung) && (
            <div>
              <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-2">Rollenbeschreibungen</p>
              <div className="space-y-2">
                {submission.rollenApps.filter(a => a.beschreibung).map((app, i) => (
                  <div key={i} className="text-sm text-[#c0c3c9] bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                    <span className="text-white font-medium">{app.rolle}:</span>{" "}
                    {app.beschreibung}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Single role description (legacy/single role) */}
          {submission.rollenBeschreibung && !submission.rollenApps?.some(a => a.beschreibung) && (
            <div>
              <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-2">Rollenbeschreibung</p>
              <p className="text-sm text-[#c0c3c9] bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                {submission.rollenBeschreibung}
              </p>
            </div>
          )}

          {/* Additional info */}
          {submission.zusatzinfo && (
            <div>
              <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-2">Zusätzliche Informationen</p>
              <p className="text-sm text-[#c0c3c9] bg-white/[0.03] rounded-lg p-3 border border-white/[0.06]">
                {submission.zusatzinfo}
              </p>
            </div>
          )}

          {/* Internal estimate details */}
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-4">
            <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-3">
              Interne Kalkulation (nicht für Kunden)
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-[#6a6e76]">Wochenrate:</span>
              <span className="text-white font-medium">{formatEur(submission.estimate.weeklyRate)}/Woche</span>
              <span className="text-[#6a6e76]">Personentage:</span>
              <span className="text-white font-medium">{submission.estimate.aufwand}</span>
            </div>
          </div>

          {/* Client feedback (if rejected by client) */}
          {submission.status === "rejected_by_client" && submission.clientFeedback && (
            <div className="rounded-lg border border-orange-400/20 bg-orange-400/[0.05] p-4">
              <p className="text-xs text-[#6a6e76] uppercase tracking-wider mb-2">Kundenfeedback zur Ablehnung</p>
              <p className="text-sm text-orange-300">{submission.clientFeedback}</p>
            </div>
          )}

          {/* Angebot History (for non-pending submissions) */}
          {!["pending", "rejected", "call_requested"].includes(submission.status) && (
            <AngebotHistory submissionId={submission.id} />
          )}

          {/* Read-only plan display (when plan exists but amendment panel is closed) */}
          {!showAmendment && submission.amendment?.plan && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
              <button
                type="button"
                onClick={() => setPlanExpanded(!planExpanded)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <span className="font-semibold text-white flex items-center gap-2">
                  <Code className="h-4 w-4 text-[#FFC62C]" />
                  Projektplan
                  <span className="text-[10px] font-normal text-[#8B8F97] ml-1 flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Nur-Lesen
                  </span>
                </span>
                {planExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[#8B8F97]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#8B8F97]" />
                )}
              </button>
              {planExpanded && (
                <div className="border-t border-white/[0.06] p-4">
                  <ReadOnlyPlan plan={submission.amendment.plan} />
                </div>
              )}
            </div>
          )}

          {/* Amendment Panel (inline) */}
          {showAmendment && (
            <AmendmentPanel
              submissionId={submission.id}
              existingPlan={submission.amendment?.plan}
              existingPricing={
                submission.amendment
                  ? {
                      festpreis: submission.amendment.adminFestpreis,
                      aufwand: submission.amendment.adminAufwand,
                    }
                  : undefined
              }
              existingNotes={submission.amendment?.adminNotes}
              autoEstimate={{
                festpreis: submission.estimate.festpreis,
                aufwand: submission.estimate.aufwand,
              }}
              onSaved={() => {
                setShowAmendment(false);
                onRefresh();
              }}
            />
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 flex-wrap">
            {/* PENDING/CALL_REQUESTED/SLA_ACTIVE/SLA_BREACHED: Show "Anfrage bearbeiten" + "Ablehnen" */}
            {["pending", "call_requested", "sla_active", "sla_breached"].includes(submission.status) && !showAmendment && (
              <>
                <Button
                  onClick={() => setShowAmendment(true)}
                  className="bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl font-bold px-6"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Anfrage bearbeiten
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={updating}
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {updating ? "..." : "Ablehnen"}
                </Button>
              </>
            )}

            {/* AMENDED/AUTO_GENERATED: Show "Angebot erstellen" + "Bearbeiten" */}
            {["amended", "auto_generated"].includes(submission.status) && (
              <>
                <Button
                  onClick={handleCreateAngebot}
                  disabled={creatingAngebot}
                  className="bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold px-6"
                >
                  <FilePlus className="mr-2 h-4 w-4" />
                  {creatingAngebot ? "Wird erstellt..." : "Angebot erstellen"}
                </Button>
                {!showAmendment && (
                  <Button
                    onClick={() => setShowAmendment(true)}
                    variant="ghost"
                    className="text-[#8B8F97] hover:text-white hover:bg-white/5 rounded-xl"
                  >
                    <FileEdit className="mr-2 h-4 w-4" />
                    Bearbeiten
                  </Button>
                )}
              </>
            )}

            {/* REJECTED BY CLIENT: Allow creating a revised Angebot */}
            {submission.status === "rejected_by_client" && (
              <>
                {!showAmendment ? (
                  <Button
                    onClick={() => setShowAmendment(true)}
                    className="bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl font-bold px-6"
                  >
                    <Brain className="mr-2 h-4 w-4" />
                    Neues Angebot vorbereiten
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center rounded-lg bg-white/[0.03] px-4 py-2.5">
      <span className="text-xs text-[#6a6e76]">{label}</span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bookings Panel
// ---------------------------------------------------------------------------

const DAY_NAMES_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const DAY_NAMES_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function formatBookingDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return `${DAY_NAMES_DE[d.getDay()]}, ${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
}

function BookingsPanel() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function handleCancel(id: string) {
    setCancelling(id);
    try {
      await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      await fetchBookings();
    } catch {
      // Handle error
    } finally {
      setCancelling(null);
    }
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;
  const upcoming = bookings.filter((b) => b.date >= todayStr && b.status === "confirmed");
  const past = bookings.filter((b) => b.date < todayStr || b.status === "cancelled");

  if (loading) {
    return (
      <div className="text-center py-20">
        <RefreshCw className="mx-auto h-8 w-8 text-[#8B8F97] animate-spin" />
        <p className="mt-4 text-[#8B8F97]">Lade Termine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Availability Editor */}
      <AvailabilityEditor />

      {/* Upcoming bookings */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">
          Anstehende Termine ({upcoming.length})
        </h3>
        {upcoming.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <Calendar className="mx-auto h-10 w-10 text-[#6a6e76]" />
            <p className="mt-3 text-[#8B8F97]">Keine anstehenden Termine.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-[#FFC62C]/[0.1] text-[#FFC62C]">
                    <span className="text-xs font-medium leading-none">
                      {DAY_NAMES_SHORT[new Date(b.date + "T12:00:00").getDay()]}
                    </span>
                    <span className="text-lg font-bold leading-none mt-0.5">
                      {new Date(b.date + "T12:00:00").getDate()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{b.name}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-400/10 px-2.5 py-0.5 text-[10px] font-semibold text-green-400">
                        Bestätigt
                      </span>
                    </div>
                    <p className="text-sm text-[#8B8F97]">
                      {formatBookingDate(b.date)} · {b.startTime} – {b.endTime} Uhr
                    </p>
                    <p className="text-xs text-[#6a6e76]">
                      {b.email}{b.firma ? ` · ${b.firma}` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => handleCancel(b.id)}
                  disabled={cancelling === b.id}
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl text-xs"
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  {cancelling === b.id ? "..." : "Absagen"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / cancelled bookings */}
      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-[#6a6e76] hover:text-[#8B8F97] transition-colors">
            Vergangene / abgesagte Termine ({past.length})
          </summary>
          <div className="mt-3 space-y-2">
            {past.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.01] p-3 opacity-60"
              >
                <div>
                  <p className="text-sm text-white">{b.name}</p>
                  <p className="text-xs text-[#6a6e76]">
                    {formatBookingDate(b.date)} · {b.startTime} – {b.endTime} Uhr
                  </p>
                </div>
                <span
                  className={`text-xs font-medium ${
                    b.status === "cancelled" ? "text-red-400" : "text-[#6a6e76]"
                  }`}
                >
                  {b.status === "cancelled" ? "Abgesagt" : "Vergangen"}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Availability Editor
// ---------------------------------------------------------------------------

interface DayBlock {
  dayOfWeek: number;
  slots: { startHour: number; startMinute: number; endHour: number; endMinute: number }[];
}

function AvailabilityEditor() {
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/availability");
        const data = await res.json();
        setAvailability(data.slots || []);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Group by day
  const dayBlocks: DayBlock[] = [1, 2, 3, 4, 5].map((day) => ({
    dayOfWeek: day,
    slots: availability
      .filter((s) => s.dayOfWeek === day)
      .map((s) => ({
        startHour: s.startHour,
        startMinute: s.startMinute,
        endHour: s.endHour,
        endMinute: s.endMinute,
      })),
  }));

  function updateSlot(
    dayOfWeek: number,
    slotIndex: number,
    field: "startHour" | "startMinute" | "endHour" | "endMinute",
    value: number
  ) {
    setAvailability((prev) => {
      const daySlots = prev.filter((s) => s.dayOfWeek === dayOfWeek);
      const otherSlots = prev.filter((s) => s.dayOfWeek !== dayOfWeek);
      const updated = [...daySlots];
      if (updated[slotIndex]) {
        updated[slotIndex] = { ...updated[slotIndex], [field]: value };
      }
      return [...otherSlots, ...updated];
    });
  }

  function addSlot(dayOfWeek: number) {
    setAvailability((prev) => [
      ...prev,
      { dayOfWeek, startHour: 14, startMinute: 0, endHour: 16, endMinute: 0 },
    ]);
  }

  function removeSlot(dayOfWeek: number, slotIndex: number) {
    setAvailability((prev) => {
      const daySlots = prev.filter((s) => s.dayOfWeek === dayOfWeek);
      const otherSlots = prev.filter((s) => s.dayOfWeek !== dayOfWeek);
      daySlots.splice(slotIndex, 1);
      return [...otherSlots, ...daySlots];
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/admin/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ slots: availability }),
      });
    } catch {
      // Handle error
    } finally {
      setSaving(false);
    }
  }

  const timeOptions: { label: string; hour: number; minute: number }[] = [];
  for (let h = 7; h <= 20; h++) {
    timeOptions.push({ label: `${h.toString().padStart(2, "0")}:00`, hour: h, minute: 0 });
    if (h < 20) {
      timeOptions.push({ label: `${h.toString().padStart(2, "0")}:30`, hour: h, minute: 30 });
    }
  }

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-[#FFC62C]" />
          <span className="font-semibold text-white">Verfügbarkeit bearbeiten</span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#8B8F97]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#8B8F97]" />
        )}
      </button>

      {expanded && !loading && (
        <div className="border-t border-white/[0.06] p-4 space-y-4">
          {dayBlocks.map((block) => (
            <div key={block.dayOfWeek} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {DAY_NAMES_DE[block.dayOfWeek]}
                </span>
                <button
                  onClick={() => addSlot(block.dayOfWeek)}
                  className="inline-flex items-center gap-1 text-xs text-[#FFC62C] hover:text-[#e6b228] transition-colors"
                >
                  <Plus className="h-3 w-3" /> Zeitblock
                </button>
              </div>

              {block.slots.length === 0 ? (
                <p className="text-xs text-[#6a6e76] italic">Keine Verfügbarkeit</p>
              ) : (
                block.slots.map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={`${slot.startHour}:${slot.startMinute}`}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(":").map(Number);
                        updateSlot(block.dayOfWeek, idx, "startHour", h);
                        updateSlot(block.dayOfWeek, idx, "startMinute", m);
                      }}
                      className="rounded-lg bg-white/[0.06] border border-white/[0.1] px-2 py-1.5 text-xs text-white"
                    >
                      {timeOptions.map((t) => (
                        <option key={t.label} value={`${t.hour}:${t.minute}`}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-[#6a6e76]">bis</span>
                    <select
                      value={`${slot.endHour}:${slot.endMinute}`}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(":").map(Number);
                        updateSlot(block.dayOfWeek, idx, "endHour", h);
                        updateSlot(block.dayOfWeek, idx, "endMinute", m);
                      }}
                      className="rounded-lg bg-white/[0.06] border border-white/[0.1] px-2 py-1.5 text-xs text-white"
                    >
                      {timeOptions.map((t) => (
                        <option key={t.label} value={`${t.hour}:${t.minute}`}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeSlot(block.dayOfWeek, idx)}
                      className="p-1 text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          ))}

          <div className="pt-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl font-bold px-6 text-sm"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Speichern..." : "Verfügbarkeit speichern"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admin Page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"anfragen" | "termine">("anfragen");

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/submissions");
      const data = await res.json();
      setSubmissions(data);
    } catch {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  async function handleStatusChange(id: string, status: "rejected") {
    try {
      await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ status }),
      });
      await fetchSubmissions();
    } catch {
      // Handle error
    }
  }

  const filtered = (() => {
    if (filter === "all") return submissions;
    if (filter === "pending") return submissions.filter((s) => ["pending", "call_requested", "sla_active"].includes(s.status));
    if (filter === "amended") return submissions.filter((s) => ["amended", "auto_generated"].includes(s.status));
    if (filter === "accepted") return submissions.filter((s) => ["accepted", "project_bootstrapped"].includes(s.status));
    return submissions.filter((s) => s.status === filter);
  })();

  const counts: Record<string, number> = {
    all: submissions.length,
    pending: submissions.filter((s) => ["pending", "call_requested", "sla_active"].includes(s.status)).length,
    sla_breached: submissions.filter((s) => s.status === "sla_breached").length,
    amended: submissions.filter((s) => ["amended", "auto_generated"].includes(s.status)).length,
    angebot_sent: submissions.filter((s) => s.status === "angebot_sent").length,
    accepted: submissions.filter((s) => ["accepted", "project_bootstrapped"].includes(s.status)).length,
    rejected_by_client: submissions.filter((s) => s.status === "rejected_by_client").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  return (
    <section className="min-h-screen bg-[#111318]">
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white md:text-3xl">
              Backoffice
            </h1>
            <p className="mt-1 text-sm text-[#8B8F97]">
              Anfragen bearbeiten und Angebote erstellen
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={activeTab === "anfragen" ? fetchSubmissions : undefined}
              variant="ghost"
              className="text-[#8B8F97] hover:text-white hover:bg-white/5 rounded-xl"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Aktualisieren
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-[#8B8F97] hover:text-red-400 hover:bg-red-400/5 rounded-xl"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>

        {/* Top-level tabs: Anfragen / Termine */}
        <div className="flex gap-1 mb-6 rounded-xl bg-white/[0.03] p-1 border border-white/[0.08] w-fit">
          <button
            onClick={() => setActiveTab("anfragen")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
              activeTab === "anfragen"
                ? "bg-[#FFC62C] text-[#111318]"
                : "text-[#8B8F97] hover:text-white"
            }`}
          >
            Anfragen
          </button>
          <button
            onClick={() => setActiveTab("termine")}
            className={`rounded-lg px-5 py-2 text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === "termine"
                ? "bg-[#FFC62C] text-[#111318]"
                : "text-[#8B8F97] hover:text-white"
            }`}
          >
            <Calendar className="h-4 w-4" />
            Termine
          </button>
        </div>

        {activeTab === "termine" ? (
          <BookingsPanel />
        ) : (
        <>
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {(["all", "pending", "sla_breached", "amended", "angebot_sent", "accepted", "rejected_by_client", "rejected"] as const).map((f) => {
            const labels: Record<string, string> = {
              all: "Alle",
              pending: "Offen",
              sla_breached: "SLA überschritten",
              amended: "Bearbeitet",
              angebot_sent: "Angebot gesendet",
              accepted: "Angenommen",
              rejected_by_client: "Kunde abgelehnt",
              rejected: "Abgelehnt",
            };
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                  filter === f
                    ? "bg-[#FFC62C]/[0.15] text-[#FFC62C] border border-[#FFC62C]/30"
                    : "bg-white/[0.04] text-[#8B8F97] border border-white/[0.08] hover:bg-white/[0.06]"
                }`}
              >
                {labels[f]}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    filter === f ? "bg-[#FFC62C]/20" : "bg-white/[0.08]"
                  }`}
                >
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Submissions list */}
        {loading ? (
          <div className="text-center py-20">
            <RefreshCw className="mx-auto h-8 w-8 text-[#8B8F97] animate-spin" />
            <p className="mt-4 text-[#8B8F97]">Lade Anfragen...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 rounded-xl border border-white/[0.08] bg-white/[0.02]">
            <Clock className="mx-auto h-12 w-12 text-[#6a6e76]" />
            <p className="mt-4 text-[#8B8F97]">
              {filter === "all"
                ? "Noch keine Anfragen eingegangen."
                : "Keine Anfragen in dieser Kategorie."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                onStatusChange={handleStatusChange}
                onRefresh={fetchSubmissions}
              />
            ))}
          </div>
        )}
        </>
        )}
      </div>
    </section>
  );
}
