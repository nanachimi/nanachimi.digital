"use client";

import { useState } from "react";
import { CalendarDays, ArrowRight } from "lucide-react";
import SlotPicker from "@/components/booking/SlotPicker";

export default function KontaktBooking() {
  const [showPicker, setShowPicker] = useState(false);

  if (!showPicker) {
    return (
      <div className="rounded-xl border bg-[#111318] p-8 md:p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FFC62C]/10">
          <CalendarDays className="h-8 w-8 text-[#FFC62C]" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-white md:text-3xl">
          Termin vereinbaren
        </h2>
        <p className="mt-4 text-[#8B8F97] leading-relaxed max-w-md mx-auto">
          Buchen Sie ein kostenloses 30-minütiges Beratungsgespräch. Wir
          besprechen Ihre Idee, klären offene Fragen und definieren die
          nächsten Schritte.
        </p>
        <button
          onClick={() => setShowPicker(true)}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#FFC62C] px-8 py-3 text-sm font-semibold text-[#111318] transition-colors hover:bg-[#e6b228]"
        >
          Termin buchen
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-[#111318] p-8 md:p-10">
      <SlotPicker theme="dark" />
    </div>
  );
}
