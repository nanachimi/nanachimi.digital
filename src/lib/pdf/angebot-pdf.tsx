import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { AngebotPdfData } from "./generate";

// Color palette matching nanachimi.digital branding
const COLORS = {
  bg: "#111318",
  card: "#1a1d24",
  gold: "#FFC62C",
  white: "#ffffff",
  gray: "#8B8F97",
  lightGray: "#c0c3c9",
  dimGray: "#6a6e76",
  border: "#2a2d34",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.bg,
    padding: 40,
    fontFamily: "Helvetica",
    color: COLORS.white,
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  brandDot: {
    color: COLORS.gold,
  },
  headerRight: {
    textAlign: "right",
  },
  headerDate: {
    fontSize: 9,
    color: COLORS.gray,
  },
  headerId: {
    fontSize: 8,
    color: COLORS.dimGray,
    marginTop: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.gray,
    textAlign: "center",
    marginBottom: 30,
  },
  // Client info
  clientBox: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clientRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  clientLabel: {
    width: 80,
    fontSize: 9,
    color: COLORS.dimGray,
    textTransform: "uppercase",
  },
  clientValue: {
    fontSize: 10,
    color: COLORS.white,
    flex: 1,
  },
  // Price section
  priceBox: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#3d3520", // gold-ish border
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 9,
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.gold,
    marginBottom: 4,
  },
  priceSubtext: {
    fontSize: 10,
    color: COLORS.gray,
  },
  // Payment terms
  paymentBox: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  paymentTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  paymentLabel: {
    fontSize: 9,
    color: COLORS.gray,
  },
  paymentAmount: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.white,
  },
  paymentPercent: {
    fontSize: 8,
    color: COLORS.gold,
    marginRight: 6,
  },
  // Section
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.gold,
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionBox: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  storyText: {
    fontSize: 9,
    color: COLORS.lightGray,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  storyPriority: {
    fontSize: 7,
    fontWeight: "bold",
    color: COLORS.gold,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  // Tech stack
  techRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  techCategory: {
    width: 80,
    fontSize: 8,
    color: COLORS.dimGray,
    textTransform: "uppercase",
  },
  techName: {
    fontSize: 9,
    fontWeight: "bold",
    color: COLORS.white,
    width: 100,
  },
  techReason: {
    fontSize: 8,
    color: COLORS.gray,
    flex: 1,
  },
  // Betrieb & Wartung
  buwHighlight: {
    backgroundColor: "#1e1c15",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#3d3520",
  },
  buwText: {
    fontSize: 9,
    color: COLORS.gold,
    lineHeight: 1.4,
  },
  buwGrid: {
    flexDirection: "row",
    gap: 8,
  },
  buwCell: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buwLabel: {
    fontSize: 7,
    color: COLORS.dimGray,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  buwValue: {
    fontSize: 8,
    color: COLORS.lightGray,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 8,
    color: COLORS.dimGray,
  },
});

function formatEur(n: number): string {
  return n.toLocaleString("de-DE") + " €";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function AngebotPdfDocument({ data }: { data: AngebotPdfData }) {
  const t1 = Math.round(data.festpreis * 0.15);
  const t2 = Math.round(data.festpreis * 0.35);
  const t3 = data.festpreis - t1 - t2;
  const { plan } = data;

  return (
    <Document>
      {/* Page 1: Pricing + Client Info */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandName}>
            nanachimi<Text style={styles.brandDot}>.digital</Text>
          </Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>{formatDate(data.createdAt)}</Text>
            <Text style={styles.headerId}>ID: {data.angebotId}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Angebot</Text>
        <Text style={styles.subtitle}>Individuelles Projektangebot für {data.kundenName}</Text>

        {/* Client Info */}
        <View style={styles.clientBox}>
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>Kunde</Text>
            <Text style={styles.clientValue}>{data.kundenName}</Text>
          </View>
          {data.firma && (
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Firma</Text>
              <Text style={styles.clientValue}>{data.firma}</Text>
            </View>
          )}
          <View style={styles.clientRow}>
            <Text style={styles.clientLabel}>E-Mail</Text>
            <Text style={styles.clientValue}>{data.email}</Text>
          </View>
        </View>

        {/* Project Description */}
        <View style={styles.sectionBox}>
          <Text style={{ fontSize: 9, color: COLORS.dimGray, textTransform: "uppercase", marginBottom: 4 }}>
            Projektbeschreibung
          </Text>
          <Text style={{ fontSize: 10, color: COLORS.lightGray, lineHeight: 1.5 }}>
            {data.projektBeschreibung}
          </Text>
        </View>

        {/* Festpreis */}
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Festpreis</Text>
          <Text style={styles.priceValue}>{formatEur(data.festpreis)}</Text>
          <Text style={styles.priceSubtext}>Aufwand: {data.aufwand} Personentage</Text>
        </View>

        {/* Zahlungsbedingungen */}
        <View style={styles.paymentBox}>
          <Text style={styles.paymentTitle}>Zahlungsbedingungen (Überweisung)</Text>
          <View style={styles.paymentRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.paymentPercent}>15%</Text>
              <Text style={styles.paymentLabel}>Vor Projektstart</Text>
            </View>
            <Text style={styles.paymentAmount}>{formatEur(t1)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.paymentPercent}>35%</Text>
              <Text style={styles.paymentLabel}>Nach MVP-Lieferung</Text>
            </View>
            <Text style={styles.paymentAmount}>{formatEur(t2)}</Text>
          </View>
          <View style={{ ...styles.paymentRow, borderBottomWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.paymentPercent}>50%</Text>
              <Text style={styles.paymentLabel}>Vor Go-Live / Übergabe</Text>
            </View>
            <Text style={styles.paymentAmount}>{formatEur(t3)}</Text>
          </View>
        </View>

        {/* Betrieb & Wartung */}
        {plan.betriebUndWartung && (
          <>
            <Text style={styles.sectionTitle}>Betrieb &amp; Wartung</Text>
            <View style={styles.buwHighlight}>
              <Text style={styles.buwText}>
                Inkl. 1 Monat Betrieb &amp; Wartung nach Go-Live. Danach optional als Abo: ab 29€/Monat.
              </Text>
            </View>
            <View style={{ ...styles.sectionBox, padding: 10 }}>
              <Text style={{ fontSize: 8, color: COLORS.dimGray, textTransform: "uppercase", marginBottom: 4 }}>
                Umfang
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.lightGray, marginBottom: 8 }}>
                {plan.betriebUndWartung.umfang}
              </Text>
              <View style={styles.buwGrid}>
                <View style={styles.buwCell}>
                  <Text style={styles.buwLabel}>Laufzeit</Text>
                  <Text style={styles.buwValue}>{plan.betriebUndWartung.vertragslaufzeit}</Text>
                </View>
                <View style={styles.buwCell}>
                  <Text style={styles.buwLabel}>Abo-Optionen</Text>
                  <Text style={styles.buwValue}>{plan.betriebUndWartung.aboOptionen || "3 Monate: 69€/Mo, 6 Monate: 49€/Mo, 12 Monate: 29€/Mo"}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 8, color: COLORS.dimGray, textTransform: "uppercase", marginTop: 8, marginBottom: 3 }}>
                SLA
              </Text>
              <Text style={{ fontSize: 9, color: COLORS.lightGray }}>
                {plan.betriebUndWartung.sla}
              </Text>
            </View>
          </>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            nanachimi.digital · Mannheim, Deutschland · info@nanachimi.digital
          </Text>
        </View>
      </Page>

      {/* Page 2: Project Plan */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brandName}>
            nanachimi<Text style={styles.brandDot}>.digital</Text>
          </Text>
          <View style={styles.headerRight}>
            <Text style={styles.headerDate}>Projektplan</Text>
          </View>
        </View>

        {/* User Stories */}
        <Text style={styles.sectionTitle}>Anforderungen</Text>
        {plan.anforderungen.userStories.map((story, i) => (
          <View key={i} style={{ ...styles.sectionBox, padding: 8, marginBottom: 4 }}>
            <Text style={styles.storyPriority}>{story.prioritaet}</Text>
            <Text style={styles.storyText}>
              Als {story.rolle} möchte ich {story.aktion}, damit {story.nutzen}
            </Text>
          </View>
        ))}

        {/* Tech Stack */}
        <Text style={styles.sectionTitle}>Technologie-Stack</Text>
        <View style={styles.sectionBox}>
          {plan.technologieStack.map((tech, i) => (
            <View key={i} style={styles.techRow}>
              <Text style={styles.techCategory}>{tech.kategorie}</Text>
              <Text style={styles.techName}>{tech.technologie}</Text>
              <Text style={styles.techReason}>{tech.begruendung}</Text>
            </View>
          ))}
        </View>

        {/* Architecture */}
        <Text style={styles.sectionTitle}>Architektur</Text>
        <View style={styles.sectionBox}>
          <Text style={{ fontSize: 9, color: COLORS.lightGray, lineHeight: 1.4, marginBottom: 6 }}>
            {plan.architektur.beschreibung}
          </Text>
          <Text style={{ fontSize: 8, color: COLORS.dimGray, textTransform: "uppercase", marginBottom: 2 }}>
            Datenfluss
          </Text>
          <Text style={{ fontSize: 9, color: COLORS.lightGray, lineHeight: 1.4, marginBottom: 6 }}>
            {plan.architektur.datenfluss}
          </Text>
          <Text style={{ fontSize: 8, color: COLORS.dimGray, textTransform: "uppercase", marginBottom: 2 }}>
            Datenmodell
          </Text>
          <Text style={{ fontSize: 9, color: COLORS.lightGray, lineHeight: 1.4 }}>
            {plan.architektur.datenbankmodell}
          </Text>
        </View>

        {/* Critical Points */}
        <Text style={styles.sectionTitle}>Wichtige Hinweise</Text>
        {plan.kritischePunkte.map((point, i) => (
          <View key={i} style={{ ...styles.sectionBox, padding: 8, marginBottom: 4 }}>
            <Text style={{ fontSize: 7, color: COLORS.gold, textTransform: "uppercase", marginBottom: 2 }}>
              {point.kategorie}
            </Text>
            <Text style={{ fontSize: 9, color: COLORS.lightGray, marginBottom: 2 }}>
              {point.beschreibung}
            </Text>
            <Text style={{ fontSize: 8, color: "#4ade80" }}>
              → {point.empfehlung}
            </Text>
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            nanachimi.digital · Mannheim, Deutschland · info@nanachimi.digital
          </Text>
        </View>
      </Page>
    </Document>
  );
}
