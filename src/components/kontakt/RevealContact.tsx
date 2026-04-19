"use client";

import { useState } from "react";
import { Mail, Phone } from "lucide-react";

interface RevealContactProps {
  type: "email" | "phone";
  /** Base64-encoded value to prevent bot scraping from HTML source */
  encoded: string;
  label: string;
}

export default function RevealContact({ type, encoded, label }: RevealContactProps) {
  const [revealed, setRevealed] = useState(false);

  const icon = type === "email" ? Mail : Phone;
  const Icon = icon;

  function handleReveal() {
    setRevealed(true);
  }

  const decoded = revealed ? atob(encoded) : null;
  const href = decoded
    ? type === "email"
      ? `mailto:${decoded}`
      : `tel:${decoded}`
    : undefined;

  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FFC62C]/10">
        <Icon className="h-4 w-4 text-[#FFC62C]" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {revealed ? (
          <a
            href={href}
            className="text-sm font-medium hover:text-[#FFC62C] transition-colors"
          >
            {decoded}
          </a>
        ) : (
          <button
            type="button"
            onClick={handleReveal}
            className="text-sm font-medium text-[#FFC62C] hover:text-[#e6b228] transition-colors cursor-pointer"
          >
            {label} anzeigen
          </button>
        )}
      </div>
    </div>
  );
}
