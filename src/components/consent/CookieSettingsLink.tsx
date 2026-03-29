"use client";

import { useConsent } from "./ConsentProvider";

export function CookieSettingsLink() {
  const { openBanner } = useConsent();

  return (
    <button
      onClick={openBanner}
      className="text-[10px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
    >
      Cookie-Einstellungen
    </button>
  );
}
