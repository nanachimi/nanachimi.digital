"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="de">
      <body style={{ backgroundColor: "#111318", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: "3rem", fontWeight: 900, color: "#FFC62C" }}>Fehler</p>
            <h1 style={{ marginTop: "1rem", fontSize: "1.5rem", fontWeight: 700 }}>
              Etwas ist schiefgelaufen
            </h1>
            <p style={{ marginTop: "1rem", color: "#8B8F97" }}>
              Bitte versuchen Sie es erneut oder kontaktieren Sie uns.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "2rem",
                padding: "0.75rem 2rem",
                backgroundColor: "#FFC62C",
                color: "#111318",
                border: "none",
                borderRadius: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "1rem",
              }}
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
