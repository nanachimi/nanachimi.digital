"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <p className="text-5xl font-black text-[#FFC62C]">Fehler</p>
        <h1 className="mt-4 text-xl font-bold text-white">
          Im Admin-Bereich ist ein Fehler aufgetreten
        </h1>
        <p className="mt-3 text-[#8B8F97]">
          Bitte versuchen Sie es erneut.
        </p>
        <Button
          onClick={reset}
          className="mt-6 bg-[#FFC62C] text-[#111318] hover:bg-[#e6b228] rounded-xl font-bold"
        >
          Erneut versuchen
        </Button>
      </div>
    </div>
  );
}
