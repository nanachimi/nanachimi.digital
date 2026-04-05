import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { RechnungPdfData } from "./generate";

// Print-friendly color palette (white background, German standard invoice)
const C = {
  bg: "#ffffff",
  text: "#1a1a1a",
  textLight: "#555555",
  textMuted: "#888888",
  accent: "#FFC62C",
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
  // ── Sender line (small, above recipient) ──
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
  // Left: recipient address block
  recipientBlock: {
    width: 260,
  },
  recipientText: {
    fontSize: 10,
    color: C.text,
    lineHeight: 1.5,
  },
  // Right: company details
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
  // ── Meta info row ──
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
  // ── Table ──
  tableHeader: {
    flexDirection: "row",
    backgroundColor: C.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 20,
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
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableText: {
    fontSize: 9,
    color: C.text,
  },
  tableTextRight: {
    fontSize: 9,
    color: C.text,
    textAlign: "right",
  },
  // ── Total section ──
  totalSection: {
    borderTopWidth: 2,
    borderTopColor: C.border,
    marginTop: 4,
    paddingTop: 8,
  },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  totalLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: "bold",
    color: C.text,
  },
  totalValue: {
    width: 100,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "bold",
    color: C.text,
  },
  // ── Notices ──
  noticeBox: {
    backgroundColor: C.cardBg,
    borderWidth: 1,
    borderColor: C.borderLight,
    borderRadius: 3,
    padding: 10,
    marginTop: 16,
  },
  noticeText: {
    fontSize: 8,
    color: C.textLight,
    lineHeight: 1.5,
  },
  // ── Payment confirmation ──
  paymentBox: {
    borderWidth: 1,
    borderColor: "#c8e6c9",
    backgroundColor: "#f1f8e9",
    borderRadius: 3,
    padding: 10,
    marginTop: 12,
  },
  paymentTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: C.success,
    marginBottom: 3,
  },
  paymentText: {
    fontSize: 9,
    color: C.textLight,
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

function getPaymentTypeLabel(paymentType: string): string {
  switch (paymentType) {
    case "full": return "Gesamtzahlung";
    case "half": return "50% Anzahlung";
    case "tranche_1": return "15% Anzahlung (1. Tranche)";
    default: return paymentType;
  }
}

export function RechnungPdfDocument({ data }: { data: RechnungPdfData }) {
  const { company } = data;
  const nettoBeforeDiscount = data.amount;
  const discountAmount = data.discount;
  const nettoBetrag = nettoBeforeDiscount - discountAmount;
  const ustSatz = company.vatRate; // e.g. 19
  const ustBetrag = Math.round(nettoBetrag * (ustSatz / 100) * 100) / 100;
  const bruttoBetrag = nettoBetrag + ustBetrag;

  const senderLine = [company.ownerName, company.companyName, `${company.plz} ${company.city}`]
    .filter(Boolean).join(" \u00B7 ");

  const addressLine = [company.street, `${company.plz} ${company.city}`, company.country]
    .filter(Boolean).join(", ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Sender address line (small, above recipient per DIN 5008) ── */}
        <Text style={styles.senderLine}>{senderLine}</Text>

        {/* ── Two-column: Recipient (left) + Company (right) ── */}
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

        {/* ── Document title ── */}
        <Text style={styles.docTitle}>RECHNUNG</Text>

        {/* ── Invoice meta data (Pflichtangaben §14 UStG) ── */}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Rechnungsnummer</Text>
          <Text style={styles.metaValue}>{data.rechnungNummer}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Rechnungsdatum</Text>
          <Text style={styles.metaValue}>{formatDate(data.createdAt)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Leistungsdatum</Text>
          <Text style={styles.metaValue}>{formatDate(data.paidAt)}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Bezug</Text>
          <Text style={styles.metaValue}>Angebot {data.angebotId}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Zahlungsart</Text>
          <Text style={styles.metaValue}>{getPaymentTypeLabel(data.paymentType)}</Text>
        </View>
        {/* Steuer-IDs (§14 UStG — mandatory) */}
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

        {/* ── Line items table ── */}
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.tableHeaderText, width: 40 }}>Pos.</Text>
          <Text style={{ ...styles.tableHeaderText, flex: 1 }}>Beschreibung</Text>
          <Text style={{ ...styles.tableHeaderText, width: 100, textAlign: "right" }}>Netto</Text>
        </View>

        {/* Main line item */}
        <View style={styles.tableRow}>
          <Text style={{ ...styles.tableText, width: 40 }}>1</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.tableText}>{data.projektBeschreibung}</Text>
            <Text style={{ fontSize: 8, color: C.textMuted, marginTop: 2 }}>
              {getPaymentTypeLabel(data.paymentType)}
            </Text>
          </View>
          <Text style={{ ...styles.tableTextRight, width: 100 }}>{formatEur(nettoBeforeDiscount)}</Text>
        </View>

        {/* Discount line */}
        {discountAmount > 0 && (
          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableText, width: 40 }}></Text>
            <Text style={{ ...styles.tableText, flex: 1, color: C.textLight }}>
              Rabatt{data.discountLabel ? ` (${data.discountLabel})` : ""}
            </Text>
            <Text style={{ ...styles.tableTextRight, width: 100, color: C.success }}>
              -{formatEur(discountAmount)}
            </Text>
          </View>
        )}

        {/* ── Totals with VAT ── */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={{ ...styles.totalLabel, fontSize: 9, fontWeight: "normal", color: C.textLight }}>
              Nettobetrag
            </Text>
            <Text style={{ ...styles.totalValue, fontSize: 9, fontWeight: "normal", color: C.textLight }}>
              {formatEur(nettoBetrag)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={{ ...styles.totalLabel, fontSize: 9, fontWeight: "normal", color: C.textLight }}>
              {ustSatz}% MwSt.
            </Text>
            <Text style={{ ...styles.totalValue, fontSize: 9, fontWeight: "normal", color: C.textLight }}>
              {formatEur(ustBetrag)}
            </Text>
          </View>
          <View style={{ ...styles.totalRow, borderTopWidth: 2, borderTopColor: C.text, marginTop: 2, paddingTop: 6 }}>
            <Text style={styles.totalLabel}>Gesamtbetrag (brutto)</Text>
            <Text style={styles.totalValue}>{formatEur(bruttoBetrag)}</Text>
          </View>
        </View>

        {/* ── Payment terms ── */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            Zahlbar innerhalb von 14 Tagen ohne Abzug.
          </Text>
          <Text style={{ ...styles.noticeText, marginTop: 4 }}>
            Verwendungszweck: {data.rechnungNummer}
          </Text>
        </View>

        {/* ── Payment confirmation ── */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentTitle}>Zahlung erhalten</Text>
          <Text style={styles.paymentText}>
            Der Rechnungsbetrag in H\u00F6he von {formatEur(bruttoBetrag)} wurde am {formatDate(data.paidAt)} beglichen. Vielen Dank f\u00FCr Ihr Vertrauen.
          </Text>
        </View>

        {/* ── Footer with business details (German invoice standard) ── */}
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
      </Page>
    </Document>
  );
}
