"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Building2,
  Phone,
  XCircle,
  RefreshCw,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Booking {
  id: string;
  submissionId?: string;
  createdAt: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled";
  name: string;
  email: string;
  firma?: string;
  telefon?: string;
}

interface AvailabilitySlot {
  dayOfWeek: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

interface BookingSettings {
  meetingDurationMinutes: number;
  bufferMinutes: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const DAY_NAMES_FULL = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatSlotTime(slot: AvailabilitySlot): string {
  return `${pad(slot.startHour)}:${pad(slot.startMinute)} – ${pad(slot.endHour)}:${pad(slot.endMinute)}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function isUpcoming(dateStr: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return dateStr >= today;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editedAvailability, setEditedAvailability] = useState<AvailabilitySlot[]>([]);
  const [editedSettings, setEditedSettings] = useState<BookingSettings>({ meetingDurationMinutes: 30, bufferMinutes: 0 });
  const [hasChanges, setHasChanges] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [tab, setTab] = useState<"bookings" | "availability">("bookings");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/bookings");
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      const data = await res.json();
      setBookings(data.bookings);
      setAvailability(data.availability);
      setEditedAvailability(data.availability);
      setEditedSettings(data.settings || { meetingDurationMinutes: 30, bufferMinutes: 0 });
      setHasChanges(false);
    } catch {
      setError("Termine konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cancel a booking
  const handleCancel = async (id: string) => {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (!res.ok) throw new Error();
      await fetchData();
    } catch {
      setError("Stornierung fehlgeschlagen.");
    } finally {
      setCancellingId(null);
    }
  };

  // Save availability + settings
  const handleSaveAvailability = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          availability: editedAvailability,
          settings: editedSettings,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAvailability(data.availability);
      setEditedAvailability(data.availability);
      setEditedSettings(data.settings);
      setHasChanges(false);
    } catch {
      setError("Verfügbarkeit konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  };

  // Add a new availability slot
  const addSlot = () => {
    setEditedAvailability([
      ...editedAvailability,
      { dayOfWeek: 1, startHour: 9, startMinute: 0, endHour: 12, endMinute: 0 },
    ]);
    setHasChanges(true);
  };

  // Remove a slot
  const removeSlot = (index: number) => {
    setEditedAvailability(editedAvailability.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  // Update a slot field
  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: number) => {
    const updated = [...editedAvailability];
    updated[index] = { ...updated[index], [field]: value };
    setEditedAvailability(updated);
    setHasChanges(true);
  };

  // Split bookings into upcoming and past
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && isUpcoming(b.date)
  );
  const past = bookings.filter(
    (b) => b.status === "cancelled" || !isUpcoming(b.date)
  );

  // Group availability by day
  const slotsByDay = editedAvailability.reduce(
    (acc, slot, idx) => {
      if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
      acc[slot.dayOfWeek].push({ slot, idx });
      return acc;
    },
    {} as Record<number, { slot: AvailabilitySlot; idx: number }[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-[#8B8F97]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#FFC62C]" />
            Termine
          </h1>
          <p className="text-sm text-[#8B8F97] mt-1">
            Gebuchte Gespräche und Verfügbarkeit verwalten
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          className="border-white/10 text-[#c8cad0] hover:bg-white/5"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Aktualisieren
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/[0.03] rounded-lg p-1">
        <button
          onClick={() => setTab("bookings")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            tab === "bookings"
              ? "bg-[#FFC62C]/10 text-[#FFC62C] border border-[#FFC62C]/20"
              : "text-[#8B8F97] hover:text-white"
          }`}
        >
          Gebuchte Termine ({upcoming.length})
        </button>
        <button
          onClick={() => setTab("availability")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            tab === "availability"
              ? "bg-[#FFC62C]/10 text-[#FFC62C] border border-[#FFC62C]/20"
              : "text-[#8B8F97] hover:text-white"
          }`}
        >
          Verfügbarkeit ({availability.length} Zeitfenster)
        </button>
      </div>

      {/* Bookings Tab */}
      {tab === "bookings" && (
        <div className="space-y-4">
          {/* Upcoming */}
          {upcoming.length > 0 ? (
            <>
              <h2 className="text-sm font-semibold text-[#c8cad0] uppercase tracking-wider">
                Anstehende Termine
              </h2>
              {upcoming.map((b) => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  onCancel={handleCancel}
                  cancelling={cancellingId === b.id}
                />
              ))}
            </>
          ) : (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
              <Calendar className="h-10 w-10 text-[#6a6e76] mx-auto mb-3" />
              <p className="text-[#8B8F97]">Keine anstehenden Termine</p>
              <p className="text-xs text-[#6a6e76] mt-1">
                Termine werden automatisch erstellt, wenn Kunden einen Gesprächstermin buchen.
              </p>
            </div>
          )}

          {/* Past / Cancelled */}
          {past.length > 0 && (
            <>
              <h2 className="text-sm font-semibold text-[#c8cad0] uppercase tracking-wider mt-8">
                Vergangene & stornierte Termine
              </h2>
              {past.map((b) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </>
          )}
        </div>
      )}

      {/* Availability Tab */}
      {tab === "availability" && (
        <div className="space-y-4">
          {/* Meeting Settings */}
          <div className="rounded-xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.03] p-4">
            <h2 className="text-sm font-semibold text-[#FFC62C] uppercase tracking-wider mb-3">
              Termineinstellungen
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs text-[#8B8F97] block mb-1">Termindauer</label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setEditedSettings({ ...editedSettings, meetingDurationMinutes: mins });
                        setHasChanges(true);
                      }}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        editedSettings.meetingDurationMinutes === mins
                          ? "bg-[#FFC62C]/20 text-[#FFC62C] border border-[#FFC62C]/40"
                          : "bg-white/[0.04] text-[#8B8F97] border border-white/10 hover:border-white/20"
                      }`}
                    >
                      {mins} Min
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-[#8B8F97] block mb-1">Pause zwischen Terminen</label>
                <div className="flex gap-2">
                  {[0, 5, 10, 15].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setEditedSettings({ ...editedSettings, bufferMinutes: mins });
                        setHasChanges(true);
                      }}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                        editedSettings.bufferMinutes === mins
                          ? "bg-[#FFC62C]/20 text-[#FFC62C] border border-[#FFC62C]/40"
                          : "bg-white/[0.04] text-[#8B8F97] border border-white/10 hover:border-white/20"
                      }`}
                    >
                      {mins === 0 ? "Keine" : `${mins} Min`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#c8cad0] uppercase tracking-wider">
              Wöchentliche Verfügbarkeit
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={addSlot}
                className="border-white/10 text-[#c8cad0] hover:bg-white/5"
              >
                <Plus className="h-4 w-4 mr-1" />
                Zeitfenster
              </Button>
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={handleSaveAvailability}
                  disabled={saving}
                  className="bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228]"
                >
                  {saving ? (
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Speichern
                </Button>
              )}
            </div>
          </div>

          {/* Slots grouped by day */}
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const daySlots = slotsByDay[day] || [];
            if (daySlots.length === 0 && !editedAvailability.some((s) => s.dayOfWeek === day)) {
              return null;
            }
            return (
              <div
                key={day}
                className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
              >
                <h3 className="text-sm font-semibold text-white mb-3">
                  {DAY_NAMES_FULL[day]}
                </h3>
                <div className="space-y-2">
                  {daySlots.map(({ slot, idx }) => (
                    <div key={idx} className="flex items-center gap-3">
                      <select
                        value={slot.startHour}
                        onChange={(e) => updateSlot(idx, "startHour", +e.target.value)}
                        className="bg-white/[0.04] border border-white/10 rounded-md px-2 py-1.5 text-sm text-white"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {pad(i)}
                          </option>
                        ))}
                      </select>
                      <span className="text-[#6a6e76]">:</span>
                      <select
                        value={slot.startMinute}
                        onChange={(e) => updateSlot(idx, "startMinute", +e.target.value)}
                        className="bg-white/[0.04] border border-white/10 rounded-md px-2 py-1.5 text-sm text-white"
                      >
                        <option value={0}>00</option>
                        <option value={30}>30</option>
                      </select>
                      <span className="text-[#8B8F97]">–</span>
                      <select
                        value={slot.endHour}
                        onChange={(e) => updateSlot(idx, "endHour", +e.target.value)}
                        className="bg-white/[0.04] border border-white/10 rounded-md px-2 py-1.5 text-sm text-white"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>
                            {pad(i)}
                          </option>
                        ))}
                      </select>
                      <span className="text-[#6a6e76]">:</span>
                      <select
                        value={slot.endMinute}
                        onChange={(e) => updateSlot(idx, "endMinute", +e.target.value)}
                        className="bg-white/[0.04] border border-white/10 rounded-md px-2 py-1.5 text-sm text-white"
                      >
                        <option value={0}>00</option>
                        <option value={30}>30</option>
                      </select>
                      <button
                        onClick={() => removeSlot(idx)}
                        className="ml-auto text-red-400/60 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {editedAvailability.length === 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-8 text-center">
              <Clock className="h-10 w-10 text-[#6a6e76] mx-auto mb-3" />
              <p className="text-[#8B8F97]">Keine Verfügbarkeit definiert</p>
              <p className="text-xs text-[#6a6e76] mt-1">
                Fügen Sie Zeitfenster hinzu, damit Kunden Termine buchen können.
              </p>
            </div>
          )}

          {/* Quick summary */}
          {editedAvailability.length > 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <h3 className="text-sm font-semibold text-[#c8cad0] mb-2">Übersicht</h3>
              <div className="text-xs text-[#8B8F97] space-y-1">
                {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                  const daySlots = (slotsByDay[day] || []).map(({ slot }) => slot);
                  if (daySlots.length === 0) return null;
                  return (
                    <div key={day} className="flex gap-2">
                      <span className="w-8 text-[#c8cad0] font-medium">{DAY_NAMES[day]}</span>
                      <span>
                        {daySlots.map((s) => formatSlotTime(s)).join(", ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BookingCard
// ---------------------------------------------------------------------------

function BookingCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel?: (id: string) => void;
  cancelling?: boolean;
}) {
  const isCancelled = booking.status === "cancelled";
  const isPast = !isUpcoming(booking.date);

  return (
    <div
      className={`rounded-xl border p-4 ${
        isCancelled
          ? "border-red-400/20 bg-red-400/[0.03] opacity-60"
          : isPast
            ? "border-white/[0.06] bg-white/[0.01] opacity-60"
            : "border-white/[0.08] bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          {/* Date & Time */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-white">
              <Calendar className="h-4 w-4 text-[#FFC62C]" />
              <span className="font-medium">{formatDate(booking.date)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#c8cad0]">
              <Clock className="h-4 w-4 text-[#8B8F97]" />
              <span>
                {booking.startTime} – {booking.endTime}
              </span>
            </div>
            {isCancelled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-400/10 px-2 py-0.5 text-xs text-red-400 border border-red-400/20">
                <XCircle className="h-3 w-3" />
                Storniert
              </span>
            )}
            {!isCancelled && !isPast && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-400 border border-emerald-400/20">
                <CheckCircle2 className="h-3 w-3" />
                Bestätigt
              </span>
            )}
          </div>

          {/* Contact info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#8B8F97]">
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              {booking.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {booking.email}
            </span>
            {booking.firma && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {booking.firma}
              </span>
            )}
            {booking.telefon && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {booking.telefon}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {onCancel && !isCancelled && !isPast && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(booking.id)}
            disabled={cancelling}
            className="border-red-400/20 text-red-400 hover:bg-red-400/10 shrink-0"
          >
            {cancelling ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-1" />
                Stornieren
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
