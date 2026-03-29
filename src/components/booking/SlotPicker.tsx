"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

interface SlotPickerProps {
  /** If provided, booking is linked to this submission (onboarding flow) */
  submissionId?: string;
  /** Dark theme (onboarding) or light theme (kontakt page) */
  theme?: "dark" | "light";
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
const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatDateGerman(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return `${DAY_NAMES_FULL[d.getDay()]}, ${d.getDate()}. ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

/** Generate array of next N days starting from today */
function getNextDays(count: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }
  return days;
}

// ---------------------------------------------------------------------------
// Theme helpers
// ---------------------------------------------------------------------------

function t(theme: "dark" | "light") {
  const isDark = theme === "dark";
  return {
    // Text
    heading: isDark ? "text-white" : "text-[#111318]",
    muted: isDark ? "text-[#8B8F97]" : "text-muted-foreground",
    subtle: isDark ? "text-[#6a6e76]" : "text-muted-foreground/70",
    // Cards / backgrounds
    card: isDark
      ? "border-white/[0.08] bg-white/[0.03]"
      : "border-gray-200 bg-white",
    // Day buttons
    daySelected: "bg-[#FFC62C] text-[#111318] ring-1 ring-[#FFC62C]",
    dayAvailable: isDark
      ? "bg-white/[0.03] text-white ring-1 ring-white/[0.08] hover:bg-white/[0.06]"
      : "bg-white text-[#111318] ring-1 ring-gray-200 hover:bg-gray-50",
    dayDisabled: isDark
      ? "bg-white/[0.01] text-white/20 ring-1 ring-white/[0.04] cursor-not-allowed"
      : "bg-gray-50 text-gray-300 ring-1 ring-gray-100 cursor-not-allowed",
    daySelectedMuted: isDark ? "text-[#111318]/70" : "text-[#111318]/70",
    dayMuted: isDark ? "text-[#8B8F97]" : "text-gray-500",
    dayMutedDisabled: isDark ? "text-white/10" : "text-gray-300",
    daySelectedSub: isDark ? "text-[#111318]/60" : "text-[#111318]/60",
    daySub: isDark ? "text-[#6a6e76]" : "text-gray-400",
    // Slot buttons
    slotSelected:
      "bg-[#FFC62C] text-[#111318] ring-1 ring-[#FFC62C] shadow-lg shadow-[#FFC62C]/20",
    slotDefault: isDark
      ? "bg-white/[0.03] text-white ring-1 ring-white/[0.08] hover:bg-white/[0.06] hover:ring-[#FFC62C]/30"
      : "bg-white text-[#111318] ring-1 ring-gray-200 hover:bg-gray-50 hover:ring-[#FFC62C]/30",
    // Nav arrows
    arrow: isDark
      ? "bg-[#1a1d24] text-white/60 ring-1 ring-white/10 hover:text-white"
      : "bg-white text-gray-400 ring-1 ring-gray-200 shadow-sm hover:text-gray-700",
    // Ghost button
    ghost: isDark
      ? "text-[#8B8F97] hover:text-white hover:bg-white/5"
      : "text-gray-500 hover:text-[#111318] hover:bg-gray-100",
    // Success icon
    successBg: isDark
      ? "bg-emerald-500/20 ring-1 ring-emerald-500/30"
      : "bg-emerald-100 ring-1 ring-emerald-200",
    successIcon: isDark ? "text-emerald-400" : "text-emerald-600",
    // Input
    input: isDark
      ? "bg-white/[0.05] border-white/[0.1] text-white placeholder:text-[#6a6e76] focus:border-[#FFC62C]/50 focus:ring-[#FFC62C]/20"
      : "bg-white border-gray-200 text-[#111318] placeholder:text-gray-400 focus:border-[#FFC62C] focus:ring-[#FFC62C]/20",
    label: isDark ? "text-[#8B8F97]" : "text-gray-600",
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type PickerState = "picking" | "contact" | "confirming" | "booking" | "booked";

export default function SlotPicker({ submissionId, theme = "dark" }: SlotPickerProps) {
  const [state, setState] = useState<PickerState>("picking");
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Contact info (used when no submissionId)
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const days = getNextDays(14);
  const styles = t(theme);

  // Fetch available slots
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const from = formatDate(days[0]);
      const to = formatDate(days[days.length - 1]);
      const res = await fetch(`/api/bookings/available?from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots);

        // Auto-select first available date
        if (data.slots.length > 0 && !selectedDate) {
          setSelectedDate(data.slots[0].date);
        }
      }
    } catch {
      setError("Termine konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Slots for selected date
  const slotsForDate = slots.filter((s) => s.date === selectedDate);

  // Dates that have slots
  const datesWithSlots = new Set(slots.map((s) => s.date));

  // Handle "Weiter" after slot selection
  function handleSlotContinue() {
    if (!selectedSlot) return;
    if (submissionId) {
      // Onboarding flow: skip contact form
      setState("confirming");
    } else {
      // Kontakt page: collect name + email first
      setState("contact");
    }
  }

  // Handle booking
  async function handleBook() {
    if (!selectedSlot) return;
    setState("booking");
    setError(null);

    try {
      const bookingBody: Record<string, string | undefined> = {
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
      };

      if (submissionId) {
        bookingBody.submissionId = submissionId;
      } else {
        bookingBody.name = contactName;
        bookingBody.email = contactEmail;
        bookingBody.telefon = contactPhone;
      }

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(bookingBody),
      });

      if (res.ok) {
        setState("booked");
      } else {
        const data = await res.json();
        setError(data.error || "Buchung fehlgeschlagen.");
        setState("confirming");
        fetchSlots();
      }
    } catch {
      setError("Buchung fehlgeschlagen. Bitte versuchen Sie es erneut.");
      setState("confirming");
    }
  }

  // ---------------------------------------------------------------------------
  // Render: Success state
  // ---------------------------------------------------------------------------

  if (state === "booked" && selectedSlot) {
    return (
      <div className="mt-8 text-center">
        <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full ${styles.successBg}`}>
          <CheckCircle2 className={`h-8 w-8 ${styles.successIcon}`} />
        </div>
        <h3 className={`text-2xl font-bold ${styles.heading}`}>
          Termin gebucht!
        </h3>
        <p className={`mt-2 ${styles.muted}`}>
          Wir freuen uns auf das Gespräch mit Ihnen.
        </p>
        <div className={`mx-auto mt-6 max-w-sm rounded-xl border p-5 ${styles.card}`}>
          <div className="flex items-center gap-3 text-left">
            <Calendar className="h-5 w-5 shrink-0 text-[#FFC62C]" />
            <span className={`font-medium ${styles.heading}`}>
              {formatDateGerman(selectedSlot.date)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-left">
            <Clock className="h-5 w-5 shrink-0 text-[#FFC62C]" />
            <span className={`font-medium ${styles.heading}`}>
              {selectedSlot.startTime} – {selectedSlot.endTime} Uhr
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Contact info step (only for kontakt page bookings)
  // ---------------------------------------------------------------------------

  if (state === "contact" && selectedSlot) {
    return (
      <div className="mt-8">
        <h3 className={`text-xl font-bold text-center ${styles.heading}`}>
          Ihre Kontaktdaten
        </h3>
        <p className={`mt-2 text-sm text-center ${styles.muted}`}>
          Damit wir den Termin bestätigen können.
        </p>

        <div className={`mx-auto mt-6 max-w-md rounded-xl border p-6 ${styles.card}`}>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${styles.label}`}>
                Name *
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ihr vollständiger Name"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 ${styles.input}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${styles.label}`}>
                E-Mail *
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="ihre@email.de"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 ${styles.input}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${styles.label}`}>
                Telefon *
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+49 123 456 789"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 ${styles.input}`}
              />
            </div>
          </div>

          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                setState("picking");
                setError(null);
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${styles.ghost}`}
            >
              Zurück
            </button>
            <button
              onClick={() => {
                if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
                  setError("Bitte füllen Sie alle Pflichtfelder aus.");
                  return;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) {
                  setError("Bitte geben Sie eine gültige E-Mail-Adresse ein.");
                  return;
                }
                setError(null);
                setState("confirming");
              }}
              className="flex-1 rounded-xl bg-[#FFC62C] px-6 py-2.5 text-sm font-bold text-[#111318] transition-colors hover:bg-[#e6b228]"
            >
              Weiter zur Bestätigung
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Confirmation step
  // ---------------------------------------------------------------------------

  if ((state === "confirming" || state === "booking") && selectedSlot) {
    const isBooking = state === "booking";
    return (
      <div className="mt-8">
        <h3 className={`text-xl font-bold text-center ${styles.heading}`}>
          Termin bestätigen
        </h3>

        <div className={`mx-auto mt-6 max-w-md rounded-xl border p-6 ${styles.card}`}>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 shrink-0 text-[#FFC62C]" />
            <span className={`font-medium ${styles.heading}`}>
              {formatDateGerman(selectedSlot.date)}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Clock className="h-5 w-5 shrink-0 text-[#FFC62C]" />
            <span className={`font-medium ${styles.heading}`}>
              {selectedSlot.startTime} – {selectedSlot.endTime} Uhr
            </span>
          </div>

          <p className={`mt-4 text-sm ${styles.subtle}`}>
            30-minütiges Beratungsgespräch — wir besprechen Ihr Projekt
            und klären offene Fragen.
          </p>

          {error && (
            <p className="mt-3 text-sm text-red-400">{error}</p>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                setState(submissionId ? "picking" : "contact");
                setError(null);
              }}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${styles.ghost}`}
            >
              Zurück
            </button>
            <button
              onClick={handleBook}
              disabled={isBooking}
              className="flex-1 rounded-xl bg-[#FFC62C] px-6 py-2.5 text-sm font-bold text-[#111318] transition-colors hover:bg-[#e6b228] disabled:opacity-50"
            >
              {isBooking ? "Wird gebucht..." : "Termin verbindlich buchen"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render: Slot picker
  // ---------------------------------------------------------------------------

  const visibleDays = 7;
  const maxOffset = Math.max(0, days.length - visibleDays);

  return (
    <div className="mt-8">
      <h3 className={`text-xl font-bold text-center mb-6 ${styles.heading}`}>
        Wählen Sie Ihren Wunschtermin
      </h3>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FFC62C] border-t-transparent" />
        </div>
      ) : slots.length === 0 ? (
        <div className={`rounded-xl border p-8 text-center ${styles.card}`}>
          <Calendar className={`mx-auto h-10 w-10 ${styles.muted}`} />
          <p className={`mt-4 ${styles.muted}`}>
            Aktuell sind keine Termine verfügbar. Bitte kontaktieren Sie uns
            direkt.
          </p>
        </div>
      ) : (
        <>
          {/* Date selector — horizontal scrollable row */}
          <div className="relative">
            {scrollOffset > 0 && (
              <button
                onClick={() =>
                  setScrollOffset(Math.max(0, scrollOffset - 1))
                }
                className={`absolute -left-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5 shadow-lg transition-colors ${styles.arrow}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}

            <div className="flex gap-2 overflow-hidden px-1">
              {days
                .slice(scrollOffset, scrollOffset + visibleDays)
                .map((day) => {
                  const dateStr = formatDate(day);
                  const hasSlots = datesWithSlots.has(dateStr);
                  const isSelected = selectedDate === dateStr;
                  const isToday =
                    formatDate(new Date()) === dateStr;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => {
                        if (hasSlots) {
                          setSelectedDate(dateStr);
                          setSelectedSlot(null);
                        }
                      }}
                      disabled={!hasSlots}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-3 text-sm transition-all ${
                        isSelected
                          ? styles.daySelected
                          : hasSlots
                            ? styles.dayAvailable
                            : styles.dayDisabled
                      }`}
                    >
                      <span
                        className={`text-xs font-medium ${
                          isSelected ? styles.daySelectedMuted : hasSlots ? styles.dayMuted : styles.dayMutedDisabled
                        }`}
                      >
                        {DAY_NAMES[day.getDay()]}
                      </span>
                      <span className="text-lg font-bold">
                        {day.getDate()}
                      </span>
                      <span
                        className={`text-xs ${
                          isSelected ? styles.daySelectedSub : hasSlots ? styles.daySub : styles.dayMutedDisabled
                        }`}
                      >
                        {isToday
                          ? "Heute"
                          : `${pad(day.getMonth() + 1)}.`}
                      </span>
                    </button>
                  );
                })}
            </div>

            {scrollOffset < maxOffset && (
              <button
                onClick={() =>
                  setScrollOffset(
                    Math.min(maxOffset, scrollOffset + 1)
                  )
                }
                className={`absolute -right-3 top-1/2 z-10 -translate-y-1/2 rounded-full p-1.5 shadow-lg transition-colors ${styles.arrow}`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Time slots grid */}
          {selectedDate && (
            <div className="mt-6">
              <p className={`mb-3 text-sm ${styles.muted}`}>
                Verfügbare Zeiten am{" "}
                <span className={`font-medium ${styles.heading}`}>
                  {formatDateGerman(selectedDate)}
                </span>
              </p>

              {slotsForDate.length === 0 ? (
                <p className={`text-sm py-4 ${styles.subtle}`}>
                  Keine Zeiten verfügbar an diesem Tag.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slotsForDate.map((slot) => {
                    const isSlotSelected =
                      selectedSlot?.date === slot.date &&
                      selectedSlot?.startTime === slot.startTime;

                    return (
                      <button
                        key={`${slot.date}-${slot.startTime}`}
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                          isSlotSelected
                            ? styles.slotSelected
                            : styles.slotDefault
                        }`}
                      >
                        {slot.startTime}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Continue button */}
              {selectedSlot && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleSlotContinue}
                    className="rounded-xl bg-[#FFC62C] px-8 py-3 text-sm font-bold text-[#111318] transition-colors hover:bg-[#e6b228] shadow-lg shadow-[#FFC62C]/20"
                  >
                    Weiter — {selectedSlot.startTime} Uhr
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {error && (
        <p className="mt-4 text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
