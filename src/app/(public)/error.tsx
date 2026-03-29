"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="relative min-h-[70vh] flex items-center bg-[#111318]">
      <div className="container mx-auto px-4 text-center md:px-6">
        <p className="text-6xl font-black text-[#FFC62C]">Fehler</p>
        <h1 className="mt-4 text-2xl font-bold text-white">
          Etwas ist schiefgelaufen
        </h1>
        <p className="mt-4 text-[#8B8F97]">
          Bitte versuchen Sie es erneut oder kontaktieren Sie uns.
        </p>
        <Button
          onClick={reset}
          className="mt-8 bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl font-bold"
        >
          Erneut versuchen
        </Button>
      </div>
    </section>
  );
}
