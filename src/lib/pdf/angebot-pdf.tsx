import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { AngebotPdfData } from "./generate";
import {
  shouldShowToCustomer,
  formatOffenerPunktForCustomer,
} from "@/lib/offene-punkte-utils";

// Print-friendly color palette (white background)
const C = {
  bg: "#ffffff",
  text: "#1a1a1a",
  textLight: "#555555",
  textMuted: "#888888",
  accent: "#FFC62C",
  accentDark: "#d4a520",
  border: "#e0e0e0",
  borderLight: "#f0f0f0",
  cardBg: "#fafafa",
  success: "#2e7d32",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: C.bg,
    paddingTop: 50,
    paddingBottom: 70,
    paddingHorizontal: 50,
    fontFamily: "Helvetica",
    color: C.text,
    fontSize: 10,
  },
  // ── Sender line (small, above recipient per DIN 5008) ──
  senderLine: {
    fontSize: 7,
    color: C.textMuted,
    borderBottomWidth: 0.5,
    borderBottomColor: C.textMuted,
    paddingBottom: 2,
    marginBottom: 6,
    width: 260,
  },
  // ── Two-column header ──
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
  },
  recipientBlock: {
    width: 260,
  },
  recipientText: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.5,
  },
  companyBlock: {
    textAlign: "right",
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: C.text,
  },
  companyDot: {
    color: C.accent,
  },
  companyDetails: {
    fontSize: 8,
    color: C.textMuted,
    marginTop: 3,
    lineHeight: 1.5,
  },
  // ── Document title ──
  docTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: C.text,
    letterSpacing: 1,
    marginBottom: 16,
  },
  // ── Meta info ──
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    width: 140,
    fontSize: 9,
    color: C.textMuted,
  },
  metaValue: {
    fontSize: 9,
    color: C.text,
    fontWeight: "bold",
  },
  // ── Section title ──
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: C.text,
    marginBottom: 8,
    marginTop: 18,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: C.accent,
    paddingBottom: 4,
  },
  // ── Description ──
  description: {
    fontSize: 10,
    color: C.textLight,
    lineHeight: 1.6,
    marginBottom: 16,
  },
  // ── Table ──
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
    color: C.textMuted,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 9,
    color: C.text,
  },
  tableCellRight: {
    fontSize: 9,
    color: C.text,
    textAlign: "right",
  },
  tableCellBold: {
    fontSize: 9,
    color: C.text,
    textAlign: "right",
    fontWeight: "bold",
  },
  // ── Total section ──
  totalSection: {
    borderTopWidth: 2,
    borderTopColor: C.border,
    marginTop: 4,
    paddingTop: 6,
  },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  // ── Scope items ──
  scopeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  scopeBullet: {
    fontSize: 9,
    color: C.accent,
    marginRight: 8,
    fontWeight: "bold",
  },
  scopeText: {
    fontSize: 9,
    color: C.text,
    flex: 1,
    lineHeight: 1.4,
  },
  scopePriority: {
    fontSize: 7,
    color: C.textMuted,
    textTransform: "uppercase",
    marginLeft: 8,
  },
  // ── Tech stack ──
  techRow: {
    flexDirection: "row",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  techCategory: {
    width: 80,
    fontSize: 8,
    color: C.textMuted,
    textTransform: "uppercase",
  },
  techName: {
    fontSize: 9,
    fontWeight: "bold",
    color: C.text,
    width: 100,
  },
  techReason: {
    fontSize: 8,
    color: C.textLight,
    flex: 1,
  },
  // ── B&W ──
  buwHighlight: {
    backgroundColor: "#fffbeb",
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  buwBox: {
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.borderLight,
    borderRadius: 4,
    padding: 12,
    marginBottom: 12,
  },
  // ── Critical points ──
  criticalBox: {
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
    paddingLeft: 10,
    paddingVertical: 6,
    marginBottom: 6,
  },
  // ── Deadline ──
  deadlineNote: {
    fontSize: 8,
    color: C.textMuted,
    fontStyle: "italic",
    marginBottom: 16,
  },
  // ── Terms ──
  termsText: {
    fontSize: 8,
    color: C.textLight,
    lineHeight: 1.6,
    marginBottom: 4,
  },
  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 25,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerCol: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 6,
    fontWeight: "bold",
    color: C.textMuted,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  footerText: {
    fontSize: 7,
    color: C.textMuted,
    lineHeight: 1.4,
  },
  footerPage: {
    fontSize: 7,
    color: C.textMuted,
    textAlign: "right",
  },
});

function formatEur(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20AC";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function gueltigBis(createdAt: string): string {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 14);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/* ── Shared footer component (fixed on every page) ── */

function PageFooter({ company }: { company: AngebotPdfData["company"] }) {
  return (
    <View style={styles.footer} fixed>
      <View style={styles.footerCol}>
        <Text style={styles.footerLabel}>Anbieter</Text>
        <Text style={styles.footerText}>
          {company.ownerName}{"\n"}
          {company.companyName}{"\n"}
          {company.plz} {company.city}
        </Text>
      </View>
      <View style={styles.footerCol}>
        <Text style={styles.footerLabel}>Kontakt</Text>
        <Text style={styles.footerText}>
          {company.email}{"\n"}
          {company.website}
        </Text>
      </View>
      <View style={styles.footerCol}>
        <Text style={styles.footerLabel}>Bankverbindung</Text>
        <Text style={styles.footerText}>
          {company.bankName}{"\n"}
          IBAN: {company.iban}{"\n"}
          BIC: {company.bic}
        </Text>
      </View>
      <View style={{ width: 40 }}>
        <Text style={styles.footerPage} render={({ pageNumber, totalPages }) => `${pageNumber}/${totalPages}`} />
      </View>
    </View>
  );
}

/* ══════════════════════════════════════════════════════ */

export function AngebotPdfDocument({ data }: { data: AngebotPdfData }) {
  const { company, plan } = data;
  const nettoBetrag = data.festpreis;
  const ustSatz = company.vatRate; // e.g. 19
  const ustBetrag = Math.round(nettoBetrag * (ustSatz / 100) * 100) / 100;
  const bruttoBetrag = nettoBetrag + ustBetrag;

  const t1 = Math.round(nettoBetrag * 0.15);
  const t2 = Math.round(nettoBetrag * 0.35);
  const t3 = nettoBetrag - t1 - t2;

  const senderLine = [company.ownerName, company.companyName, `${company.plz} ${company.city}`]
    .filter(Boolean).join(" \u00B7 ");

  const addressLine = [company.street, `${company.plz} ${company.city}`, company.country]
    .filter(Boolean).join(", ");

  return (
    <Document>
      {/* ═══ Page 1: Angebot header + pricing ═══ */}
      <Page size="A4" style={styles.page}>
        {/* Sender line (DIN 5008) */}
        <Text style={styles.senderLine}>{senderLine}</Text>

        {/* Recipient (left) + Company (right) */}
        <View style={styles.headerRow}>
          <View style={styles.recipientBlock}>
            {data.firma && (
              <Text style={styles.recipientText}>{data.firma}</Text>
            )}
            <Text style={styles.recipientText}>{data.kundenName}</Text>
            {data.kundenAdresse && (
              <Text style={{ ...styles.recipientText, fontSize: 9, color: C.textLight }}>
                {data.kundenAdresse}
              </Text>
            )}
            <Text style={{ ...styles.recipientText, fontSize: 9, color: C.textLight }}>
              {data.email}
            </Text>
          </View>
          <View style={styles.companyBlock}>
            <Text style={styles.companyName}>
              {company.companyName.includes(".") ? (
                <>
                  {company.companyName.split(".")[0]}
                  <Text style={styles.companyDot}>.{company.companyName.split(".").slice(1).join(".")}</Text>
                </>
              ) : (
                company.companyName
              )}
            </Text>
            <Text style={styles.companyDetails}>
              {company.ownerName}{"\n"}
              {addressLine}{"\n"}
              {company.email}
            </Text>
          </View>
        </View>

        {/* Document title */}
        <Text style={styles.docTitle}>ANGEBOT</Text>

        {/* Meta info (Pflichtangaben) */}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Angebotsnummer</Text>
          <Text style={styles.metaValue}>{data.angebotId}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Angebotsdatum</Text>
          <Text style={styles.metaValue}>{formatDate(data.createdAt)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>G\u00FCltig bis</Text>
          <Text style={styles.metaValue}>{gueltigBis(data.createdAt)}</Text>
        </View>
        {data.deadline && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Geplanter Liefertermin</Text>
            <Text style={styles.metaValue}>{formatDate(data.deadline)}</Text>
          </View>
        )}
        {/* Steuer-IDs */}
        {company.steuernummer && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Steuernummer</Text>
            <Text style={styles.metaValue}>{company.steuernummer}</Text>
          </View>
        )}
        {company.ustIdNr && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>USt-IdNr.</Text>
            <Text style={styles.metaValue}>{company.ustIdNr}</Text>
          </View>
        )}

        {/* Project description */}
        <Text style={styles.sectionTitle}>Leistungsbeschreibung</Text>
        <Text style={styles.description}>{data.projektBeschreibung}</Text>

        {/* ── Position table (German standard: Pos, Beschreibung, Menge, Einzelpreis, Gesamtpreis) ── */}
        <Text style={styles.sectionTitle}>Positionen</Text>
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.tableHeaderText, width: 30 }}>Pos.</Text>
          <Text style={{ ...styles.tableHeaderText, flex: 1 }}>Beschreibung</Text>
          <Text style={{ ...styles.tableHeaderText, width: 45, textAlign: "center" }}>Menge</Text>
          <Text style={{ ...styles.tableHeaderText, width: 75, textAlign: "right" }}>Einzelpreis</Text>
          <Text style={{ ...styles.tableHeaderText, width: 75, textAlign: "right" }}>Gesamt</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={{ ...styles.tableCell, width: 30 }}>1</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tableCell}>Projektentwicklung (Festpreis)</Text>
            <Text style={{ fontSize: 8, color: C.textMuted, marginTop: 1 }}>
              Aufwand: {data.aufwand} Personentage
            </Text>
          </View>
          <Text style={{ ...styles.tableCellRight, width: 45, textAlign: "center" }}>1</Text>
          <Text style={{ ...styles.tableCellRight, width: 75 }}>{formatEur(nettoBetrag)}</Text>
          <Text style={{ ...styles.tableCellBold, width: 75 }}>{formatEur(nettoBetrag)}</Text>
        </View>

        {/* ── Total summary (Netto, MwSt, Brutto) ── */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={{ flex: 1, fontSize: 9, color: C.textLight }}>Nettobetrag</Text>
            <Text style={{ width: 75, textAlign: "right", fontSize: 9, color: C.textLight }}>{formatEur(nettoBetrag)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={{ flex: 1, fontSize: 9, color: C.textLight }}>{ustSatz}% MwSt.</Text>
            <Text style={{ width: 75, textAlign: "right", fontSize: 9, color: C.textLight }}>{formatEur(ustBetrag)}</Text>
          </View>
          <View style={{ ...styles.totalRow, borderTopWidth: 2, borderTopColor: C.text, marginTop: 2, paddingTop: 6 }}>
            <Text style={{ flex: 1, fontSize: 12, fontWeight: "bold", color: C.text }}>Gesamtbetrag (brutto)</Text>
            <Text style={{ width: 75, textAlign: "right", fontSize: 12, fontWeight: "bold", color: C.text }}>{formatEur(bruttoBetrag)}</Text>
          </View>
        </View>

        {/* ── Zahlungsbedingungen ── */}
        <Text style={styles.sectionTitle}>Zahlungsbedingungen</Text>
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.tableHeaderText, flex: 1 }}>Meilenstein</Text>
          <Text style={{ ...styles.tableHeaderText, width: 50, textAlign: "center" }}>Anteil</Text>
          <Text style={{ ...styles.tableHeaderText, width: 80, textAlign: "right" }}>Netto</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={{ ...styles.tableCell, flex: 1 }}>Vor Projektstart</Text>
          <Text style={{ ...styles.tableCell, width: 50, textAlign: "center" }}>15%</Text>
          <Text style={{ ...styles.tableCellBold, width: 80 }}>{formatEur(t1)}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={{ ...styles.tableCell, flex: 1 }}>Nach MVP-Lieferung</Text>
          <Text style={{ ...styles.tableCell, width: 50, textAlign: "center" }}>35%</Text>
          <Text style={{ ...styles.tableCellBold, width: 80 }}>{formatEur(t2)}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={{ ...styles.tableCell, flex: 1 }}>Vor Go-Live / \u00DCbergabe</Text>
          <Text style={{ ...styles.tableCell, width: 50, textAlign: "center" }}>50%</Text>
          <Text style={{ ...styles.tableCellBold, width: 80 }}>{formatEur(t3)}</Text>
        </View>
        <Text style={{ fontSize: 8, color: C.textMuted, marginTop: 4 }}>
          Bei Gesamtzahlung vorab: 12% Rabatt \u00B7 Bei 50% Anzahlung: 5% Rabatt \u00B7 Zahlbar per \u00DCberweisung oder Kreditkarte. Alle Betr\u00E4ge zzgl. {ustSatz}% MwSt.
        </Text>

        {/* Deadline note */}
        {data.deadline && (
          <Text style={styles.deadlineNote}>
            Jede \u00C4nderung am vereinbarten Umfang f\u00FCgt automatisch mindestens 2 Arbeitstage zur Deadline hinzu.
          </Text>
        )}

        <PageFooter company={company} />
      </Page>

      {/* ═══ Page 2: Leistungsumfang + Technik ═══ */}
      <Page size="A4" style={styles.page}>
        {/* Leistungsumfang */}
        <Text style={styles.sectionTitle}>Leistungsumfang</Text>
        {plan.anforderungen.userStories.map((story, i) => (
          <View key={i} style={styles.scopeItem}>
            <Text style={styles.scopeBullet}>{"\u2022"}</Text>
            <Text style={styles.scopeText}>{story.aktion}</Text>
            <Text style={styles.scopePriority}>{story.prioritaet}</Text>
          </View>
        ))}

        {/* Technologie-Stack */}
        <Text style={styles.sectionTitle}>Technologie-Stack</Text>
        {plan.technologieStack.map((tech, i) => (
          <View key={i} style={styles.techRow}>
            <Text style={styles.techCategory}>{tech.kategorie}</Text>
            <Text style={styles.techName}>{tech.technologie}</Text>
            <Text style={styles.techReason}>{tech.begruendung}</Text>
          </View>
        ))}

        {/* Architektur */}
        <Text style={styles.sectionTitle}>Architektur</Text>
        <Text style={{ fontSize: 9, color: C.textLight, lineHeight: 1.5, marginBottom: 6 }}>
          {plan.architektur.beschreibung}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: "bold", color: C.textMuted, textTransform: "uppercase", marginBottom: 3 }}>
              Datenfluss
            </Text>
            <Text style={{ fontSize: 8, color: C.textLight, lineHeight: 1.4 }}>
              {plan.architektur.datenfluss}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 8, fontWeight: "bold", color: C.textMuted, textTransform: "uppercase", marginBottom: 3 }}>
              Datenmodell
            </Text>
            <Text style={{ fontSize: 8, color: C.textLight, lineHeight: 1.4 }}>
              {plan.architektur.datenbankmodell}
            </Text>
          </View>
        </View>

        {/* Wichtige Hinweise */}
        <Text style={styles.sectionTitle}>Wichtige Hinweise</Text>
        {plan.kritischePunkte.map((point, i) => (
          <View key={i} style={styles.criticalBox}>
            <Text style={{ fontSize: 7, fontWeight: "bold", color: C.accentDark, textTransform: "uppercase", marginBottom: 2 }}>
              {point.kategorie}
            </Text>
            <Text style={{ fontSize: 9, color: C.text, marginBottom: 2 }}>
              {point.beschreibung}
            </Text>
            <Text style={{ fontSize: 8, color: C.success }}>
              {"\u2192"} {point.empfehlung}
            </Text>
          </View>
        ))}

        {/* Unsere Annahmen (from offenePunkte) */}
        {plan.offenePunkte && plan.offenePunkte.filter(shouldShowToCustomer).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Unsere Annahmen</Text>
            <Text style={{ fontSize: 8, color: C.textLight, lineHeight: 1.5, marginBottom: 8 }}>
              Basierend auf Ihren Angaben haben wir folgende Annahmen getroffen. Falls eine Annahme nicht zutrifft, sprechen Sie uns gerne an.
            </Text>
            {plan.offenePunkte.filter(shouldShowToCustomer).map((punkt, i) => {
              const formatted = formatOffenerPunktForCustomer(punkt);
              return (
                <View key={i} style={{ borderLeftWidth: 3, borderLeftColor: "#4a90d9", paddingLeft: 10, paddingVertical: 5, marginBottom: 5 }}>
                  <Text style={{ fontSize: 9, fontWeight: "bold", color: C.text, marginBottom: 2 }}>
                    {formatted.icon === "warning" ? "\u26A0" : "\u2713"} {formatted.titel}
                  </Text>
                  <Text style={{ fontSize: 8, color: C.textLight, lineHeight: 1.4 }}>
                    {formatted.text}
                  </Text>
                </View>
              );
            })}
          </>
        )}

        {/* Betrieb & Wartung */}
        {plan.betriebUndWartung && (
          <>
            <Text style={styles.sectionTitle}>Betrieb &amp; Wartung</Text>
            <View style={styles.buwHighlight}>
              <Text style={{ fontSize: 9, color: C.accentDark, fontWeight: "bold" }}>
                1 Monat Betrieb &amp; Wartung nach Go-Live im Festpreis enthalten.
              </Text>
              <Text style={{ fontSize: 8, color: C.textLight, marginTop: 3 }}>
                Danach optional als Abo: 3 Monate (69 \u20AC/Mo), 6 Monate (49 \u20AC/Mo), 12 Monate (29 \u20AC/Mo).
              </Text>
            </View>
            <View style={styles.buwBox}>
              <Text style={{ fontSize: 8, fontWeight: "bold", color: C.textMuted, textTransform: "uppercase", marginBottom: 4 }}>
                Leistungen
              </Text>
              <Text style={{ fontSize: 9, color: C.textLight, lineHeight: 1.5, marginBottom: 6 }}>
                {plan.betriebUndWartung.umfang}
              </Text>
              <Text style={{ fontSize: 8, fontWeight: "bold", color: C.textMuted, textTransform: "uppercase", marginBottom: 3 }}>
                SLA
              </Text>
              <Text style={{ fontSize: 9, color: C.textLight, lineHeight: 1.5 }}>
                {plan.betriebUndWartung.sla}
              </Text>
            </View>
          </>
        )}

        <PageFooter company={company} />
      </Page>

      {/* ═══ Page 3: AGB + Unterschrift ═══ */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Allgemeine Bedingungen</Text>

        <Text style={styles.termsText}>
          1. G\u00FCltigkeit: Dieses Angebot ist freibleibend und 14 Tage ab Erstellungsdatum g\u00FCltig (bis {gueltigBis(data.createdAt)}).
        </Text>
        <Text style={styles.termsText}>
          2. Zahlungsbedingungen: 15% vor Projektstart, 35% nach MVP-Lieferung, 50% vor Go-Live bzw. \u00DCbergabe. Zahlbar innerhalb von 14 Tagen ohne Abzug. Bei Gesamtzahlung vorab: 12% Rabatt, bei 50% Anzahlung: 5% Rabatt. Alle Betr\u00E4ge verstehen sich netto zzgl. {ustSatz}% MwSt.
        </Text>
        <Text style={styles.termsText}>
          3. \u00C4nderungen am Umfang: Jede \u00C4nderung am vereinbarten Leistungsumfang nach Projektstart f\u00FCgt automatisch mindestens 2 Arbeitstage zur Deadline hinzu. Gr\u00F6\u00DFere \u00C4nderungen werden separat kalkuliert und schriftlich best\u00E4tigt.
        </Text>
        <Text style={styles.termsText}>
          4. Lieferung: Die Lieferung erfolgt digital. Projektstart innerhalb von 5 Werktagen nach Zahlungseingang der 1. Tranche.
        </Text>
        <Text style={styles.termsText}>
          5. Betrieb und Wartung: 1 Monat Betrieb und Wartung nach Go-Live ist im Festpreis enthalten. Danach optional als Abo: 3 Monate (69 \u20AC/Monat), 6 Monate (49 \u20AC/Monat), 12 Monate (29 \u20AC/Monat).
        </Text>
        <Text style={styles.termsText}>
          6. Stornierung: Eine Stornierung ist bis zum Projektstart kostenfrei m\u00F6glich. Nach Projektstart wird die bereits erbrachte Leistung in Rechnung gestellt.
        </Text>
        <Text style={styles.termsText}>
          7. Geistiges Eigentum: Nach vollst\u00E4ndiger Zahlung gehen alle Nutzungsrechte am erstellten Quellcode an den Auftraggeber \u00FCber.
        </Text>
        <Text style={styles.termsText}>
          8. Gew\u00E4hrleistung: M\u00E4ngel werden innerhalb der inkludierten Betreuungszeit (1 Monat) kostenfrei behoben.
        </Text>
        <Text style={styles.termsText}>
          9. Haftung: Die Haftung ist auf den Auftragswert begrenzt. F\u00FCr indirekte Sch\u00E4den, entgangenen Gewinn oder Datenverlust wird keine Haftung \u00FCbernommen.
        </Text>
        <Text style={styles.termsText}>
          10. Gerichtsstand: Frankenthal (Pfalz), Deutschland.
        </Text>
        <Text style={styles.termsText}>
          11. Umsatzsteuer: Alle Preise verstehen sich netto zzgl. {ustSatz}% Umsatzsteuer.
        </Text>
        <Text style={styles.termsText}>
          12. Es gelten die Allgemeinen Gesch\u00E4ftsbedingungen (AGB) von {company.companyName}, einsehbar unter {company.website}/agb.
        </Text>

        {/* ── Acceptance section (Annahme) ── */}
        <View style={{ marginTop: 30 }}>
          <Text style={{ fontSize: 10, fontWeight: "bold", color: C.text, marginBottom: 10 }}>
            Auftragserteilung
          </Text>
          <Text style={{ fontSize: 9, color: C.textLight, marginBottom: 20, lineHeight: 1.5 }}>
            Hiermit erteile ich den Auftrag gem\u00E4\u00DF den oben beschriebenen Leistungen und Bedingungen.
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16 }}>
            <View>
              <Text style={{ fontSize: 8, color: C.textMuted, marginBottom: 25 }}>Ort, Datum</Text>
              <View style={{ borderBottomWidth: 1, borderBottomColor: C.border, width: 180 }} />
              <Text style={{ fontSize: 8, color: C.textMuted, marginTop: 4 }}>Auftraggeber (Unterschrift)</Text>
            </View>
            <View>
              <Text style={{ fontSize: 8, color: C.textMuted, marginBottom: 25 }}>{company.city}, {formatDate(data.createdAt)}</Text>
              <View style={{ borderBottomWidth: 1, borderBottomColor: C.border, width: 180 }} />
              <Text style={{ fontSize: 8, color: C.textMuted, marginTop: 4 }}>{company.ownerName} {"\u00B7"} {company.companyName}</Text>
            </View>
          </View>
        </View>

        <PageFooter company={company} />
      </Page>
    </Document>
  );
}
