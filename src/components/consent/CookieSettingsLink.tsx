"use client";

import { useConsent } from "./ConsentProvider";

export function CookieSettingsLink() {
  const { openBanner } = useConsent();

  return (
    <button
      onClick={openBanner}
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Cookie-Einstellungen
    </button>
  );
}
