# Conversion-Optimierung: Messaging, Onboarding & A/B Testing

## Übersicht

Umfassende Strategie zur Steigerung der Conversion von Landing → Onboarding → Schätzung → Aktion.
Zielgruppe: nicht-technische, frühe Phase (Ideengeber, Freelancer, kleine Projekte).

---

## 1. Hero-Varianten für A/B Testing

### Probleme mit dem aktuellen Hero
- **"Ihre App. In 48h live."** → zu technisch ("App"), 48h als Haupt-USP überbetont
- **"Web- und Mobile-Apps für Gründer und KMUs"** → technisch, exkludierend ("KMUs")
- **"Ohne Overhead, ohne Wartezeit"** → Fachsprache
- Rotierende Wörter (live/deployed/online/ready) → Entwickler-Sprache

### Variante A: „Automatisierung & Zeitgewinn"
**Fokus:** Problem = manuelle Arbeit frisst Zeit → Lösung = Automatisierung → Outcome = mehr Zeit

```
Headline:    „Weniger Aufwand. Mehr Zeit für das, was zählt."
Subheadline: „Wir digitalisieren Ihre Abläufe — von der Idee bis zum fertigen Produkt.
              Sie beschreiben, wir liefern. Alles aus einer Hand."
Primary CTA: „Jetzt starten — kostenlos & unverbindlich"
Secondary:   „Go-Live in 48h möglich →"
```

**Messaging-Logik:**
- Problem: „Zu viel läuft noch manuell oder umständlich"
- Lösung: „Wir bauen die digitale Lösung für Sie — komplett"
- Outcome: „Weniger Aufwand, mehr Freiraum"

---

### Variante B: „End-to-End Sorglos"
**Fokus:** Problem = Überforderung durch Technik → Lösung = wir kümmern uns → Outcome = Sorglosigkeit

```
Headline:    „Von der Idee zum fertigen Produkt — ohne Technik-Stress."
Subheadline: „Beschreiben Sie Ihr Vorhaben in wenigen Minuten.
              Wir übernehmen Planung, Umsetzung, Go-Live und Support. Komplett."
Primary CTA: „Vorhaben beschreiben"
Secondary:   „So funktioniert's →"
```

**Messaging-Logik:**
- Problem: „Technik ist kompliziert und ich weiß nicht, wo anfangen"
- Lösung: „Einfach beschreiben — wir machen den Rest"
- Outcome: „Kein Technik-Stress, alles erledigt"

---

### Variante C: „Transformation & Ergebnis"
**Fokus:** Problem = gute Idee, aber kein Weg zur Umsetzung → Lösung = klarer Prozess → Outcome = echtes Ergebnis

```
Headline:    „Ihre Idee verdient mehr als eine Notiz."
Subheadline: „In wenigen Minuten beschreiben Sie Ihr Vorhaben —
              wir liefern ein fertiges, funktionierendes Produkt.
              Planung, Umsetzung und Betrieb: alles inklusive."
Primary CTA: „Idee einreichen — in 3 Minuten"
Secondary:   „Kostenlose Ersteinschätzung erhalten →"
```

**Messaging-Logik:**
- Problem: „Ich habe eine Idee, aber sie bleibt liegen"
- Lösung: „Einfacher Prozess von der Beschreibung zum fertigen Produkt"
- Outcome: „Aus der Idee wird Realität"

---

## 2. A/B Testing Strategie

### Struktur im Code

```
src/data/hero-variants.ts     ← Varianten-Definitionen (Headline, Sub, CTAs)
src/components/sections/Hero.tsx  ← liest aktive Variante via useABTest('hero-messaging')
```

**Varianten-Datenmodell:**
```ts
interface HeroVariant {
  id: string;                    // 'automation' | 'sorglos' | 'transformation'
  headline: string;
  subheadline: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}
```

### Zuweisung
- Bestehende AB-Infrastruktur nutzen (`useABTest` Hook + Cookie `ncd-ab`)
- Deterministisch: gleicher Besucher sieht immer gleiche Variante
- Gewichtung: initial 33/33/34 (gleichmäßig)
- Neuer Test-Target: `hero-messaging` (statt nur `hero-cta`)

### Metriken

| Metrik | Event | Beschreibung |
|--------|-------|-------------|
| Hero-Impression | `impression` auf `hero-messaging` | Variante wurde gesehen |
| CTA-Klick | `conversion` mit `type: 'cta-click'` | Primary oder Secondary CTA geklickt |
| Onboarding-Start | `conversion` mit `type: 'onboarding-start'` | Nutzer beginnt Schritt 1 |
| Onboarding-Abschluss | `conversion` mit `type: 'onboarding-complete'` | Schritt 11 erreicht |
| Call gebucht | `conversion` mit `type: 'call-booked'` | Path A gewählt |
| Direkt gestartet | `conversion` mit `type: 'direct-start'` | Path B gewählt |

### Iteration
1. **Woche 1-2:** Gleichmäßige Verteilung, Daten sammeln
2. **Woche 3:** Verlierer eliminieren (< 50% der Top-Variante)
3. **Woche 4+:** Gewinner-Variante optimieren (Micro-Tests: CTA-Wording, Farben)
4. **Laufend:** Admin-Dashboard zeigt Conversion-Funnel pro Variante

---

## 3. Onboarding-Flow Refactoring

### Grundprinzipien
- Fühlt sich an wie ein **geführtes Gespräch**, nicht wie ein Formular
- Jeder Schritt hat einen **Kontext-Satz** der erklärt warum die Frage wichtig ist
- **Fortschrittsanzeige** bleibt (aber mit ermutigender Sprache)
- **Reassurance-Elemente** in kritischen Schritten

### Schritt-für-Schritt Überarbeitung

#### Schritt 1: Projekttyp → „Was möchten Sie umsetzen?"
**Aktuell:** „Was für eine Anwendung?" + technische Optionen (Web-App, Mobile App, Desktop App)
**Neu:**
```
Frage:    „Was schwebt Ihnen vor?"
Kontext:  „Damit wir wissen, wo Ihre Lösung zum Einsatz kommt."

Optionen:
  - „Etwas im Browser"        (Beschreibung: „Erreichbar über jeden Browser — PC, Tablet oder Handy")
  - „Eine Handy-App"          (Beschreibung: „Für iPhone, Android oder beides")
  - „Beides"                  (Beschreibung: „Browser + Handy-App")
  - „Ich bin mir noch unsicher" (Beschreibung: „Kein Problem — wir helfen Ihnen bei der Entscheidung")
```
**Reassurance:** „Keine technischen Kenntnisse nötig. Beschreiben Sie einfach, was Sie brauchen."

#### Schritt 2: Beschreibung → „Erzählen Sie uns von Ihrem Vorhaben"
**Aktuell:** „Was soll Ihre App können?"
**Neu:**
```
Frage:    „Beschreiben Sie Ihr Vorhaben in eigenen Worten."
Kontext:  „Was soll Ihre Lösung für Sie oder Ihre Kunden tun?
           Je mehr Sie erzählen, desto besser können wir helfen."

Placeholder: „z.B. Ich möchte eine Plattform, auf der Kunden Termine buchen
              und bezahlen können. Bisher mache ich das alles per Telefon
              und E-Mail — das kostet mich jeden Tag Zeit..."
```

#### Schritt 3: Zielgruppe → „Wer wird das nutzen?"
**Aktuell:** „Wer sind die Nutzer Ihrer App?"
**Neu:**
```
Frage:    „Wer soll Ihre Lösung nutzen?"
Kontext:  „Damit wir die Lösung genau auf die richtigen Personen zuschneiden."

Placeholder: „z.B. Meine Kunden, die online Termine buchen wollen.
              Und ich selbst, um alles im Blick zu behalten."
```

#### Schritt 4: Funktionen → „Was soll möglich sein?"
**Aktuell:** 12 technische Feature-Checkboxen (API-Integration, RBAC, etc.)
**Neu:**
```
Frage:    „Welche Möglichkeiten brauchen Sie? Wählen Sie alles Passende aus."
Kontext:  „Keine Sorge — wir beraten Sie auch gerne im Detail."

Optionen (nicht-technisch formuliert):
  - „Anmeldung & Benutzerkonten"      (statt Benutzer-Authentifizierung)
  - „Verwaltungsbereich"               (statt Admin-Dashboard)
  - „Online bezahlen"                  (statt Zahlungsintegration)
  - „E-Mail-Benachrichtigungen"        (bleibt verständlich)
  - „Push-Nachrichten aufs Handy"      (statt Push-Benachrichtigungen)
  - „Chat-Funktion"                    (statt Echtzeit-Chat)
  - „Suche & Filter"                   (bleibt verständlich)
  - „Dateien hochladen"               (statt Datei-Upload / Download)
  - „Anbindung an andere Systeme"      (statt API-Integration)
  - „Mehrere Sprachen"                 (statt Mehrsprachigkeit)
  - „Auswertungen & Statistiken"       (statt Reporting & Analytics)
  - „Unterschiedliche Zugriffsrechte"  (statt Rollenbasierte Zugriffskontrolle)
```
**Reassurance:** „Nicht sicher, was Sie brauchen? Kein Problem — wir beraten Sie gerne."

#### Schritt 5: Nutzerrollen → „Wer arbeitet mit der Lösung?"
**Aktuell:** Technische Fragen zu Rollen und App-Struktur
**Neu:**
```
Frage:    „Wie viele verschiedene Personengruppen nutzen Ihre Lösung?"
Kontext:  „Z.B. Kunden und Mitarbeiter — oder nur Sie selbst."

Optionen:
  - „Nur ich / eine Gruppe"
  - „Zwei Gruppen" (z.B. Kunden + Verwaltung)
  - „Drei oder mehr Gruppen"

Folgefrage (bei >1):
  „Beschreiben Sie kurz jede Gruppe und was sie tun soll."
```
→ Die technische Frage „Gemeinsame App vs. Separate Apps" wird **entfernt** — das entscheiden wir intern.

#### Schritt 6: Design → „Wie soll es aussehen?"
**Aktuell:** Standard / Individuell / Premium mit Preisbezug
**Neu:**
```
Frage:    „Welchen Look wünschen Sie sich?"
Kontext:  „Wir gestalten alles für Sie — Sie müssen nur die Richtung vorgeben."

Optionen:
  - „Sauber & funktional"   (Beschreibung: „Bewährtes Design, schnell einsatzbereit")
  - „Nach meinen Vorgaben"  (Beschreibung: „Eigene Farben, Logo und Stil")
  - „Besonders hochwertig"  (Beschreibung: „Individuelles Design mit Animationen und Details")
```

#### Schritt 7: Zeitrahmen → „Wann soll es fertig sein?"
**Aktuell:** Zwei separate Fragen (MVP + Final)
**Neu:**
```
Frage 1:  „Wann brauchen Sie die erste Version?"
Kontext:  „Die erste Version enthält die wichtigsten Funktionen — wir bauen danach weiter aus."

Optionen:
  - „So schnell wie möglich" (Beschreibung: „In 48 Stunden möglich bei klarem Umfang")
  - „In 1–2 Wochen"         (Beschreibung: „Der häufigste Zeitrahmen")
  - „In einem Monat"        (Beschreibung: „Mehr Zeit für Details")
  - „Kein fester Termin"    (Beschreibung: „Wir finden gemeinsam den richtigen Zeitpunkt")

Frage 2:  „Und die fertige Version?"
(Optionen bleiben ähnlich, Wording vereinfacht)
```

#### Schritt 8: Budget → „Wie viel möchten Sie investieren?"
**Aktuell:** OK, aber Wording kann vereinfacht werden
**Neu:**
```
Frage:    „In welchem Rahmen möchten Sie starten?"
Kontext:  „Nur zur Orientierung — wir passen das Angebot an Ihr Budget an."

Optionen:
  - „Unter 399 €"          (Beschreibung: „Kleine Projekte & erste Schritte")
  - „399 – 1.000 €"        (Beschreibung: „Standard-Projekte")
  - „1.000 – 5.000 €"      (Beschreibung: „Umfangreichere Lösungen")
  - „5.000 – 10.000 €"     (Beschreibung: „Große Projekte")
  - „Über 10.000 €"        (Beschreibung: „Komplexe Lösungen")
  - „Noch unsicher"        (Beschreibung: „Wir helfen Ihnen bei der Einschätzung")
```
**Reassurance:** „Es gibt keine falschen Antworten — wir finden die beste Lösung für Ihr Budget."

#### Schritt 9: Betrieb & Wartung → „Und nach dem Start?"
**Aktuell:** Technische Begriffe (Monitoring, Incident Response)
**Neu:**
```
Frage:    „Sollen wir uns auch nach dem Start um alles kümmern?"
Kontext:  „Damit Ihre Lösung sicher und zuverlässig läuft — rund um die Uhr."

Optionen:
  - „Ja, bitte komplett"    (Beschreibung: „Wir kümmern uns um alles: Technik, Sicherheit, Updates — 24/7")
  - „Nur das Wichtigste"    (Beschreibung: „Sicherheit und kritische Updates")
  - „Nein danke"            (Beschreibung: „Ich habe eigene Leute dafür")
  - „Noch unsicher"        (Beschreibung: „Besprechen wir später")
```

#### Schritt 10: Kontaktdaten → „Fast geschafft!"
**Aktuell:** OK, Wording anpassen
**Neu:**
```
Überschrift: „Fast geschafft — nur noch Ihre Kontaktdaten."
Kontext:     „Damit wir Ihnen Ihre persönliche Einschätzung schicken können."

Felder bleiben gleich, aber:
  - Reassurance unter E-Mail: „Wir schicken Ihnen nur projektbezogene Infos. Kein Spam."
```

#### Schritt 11: Abschluss → „Ihre Einschätzung"
Bleibt weitgehend wie implementiert (Estimate + Dual Path). Wording-Anpassungen:
```
Überschrift:   „Ihre erste Projekteinschätzung"
Disclaimer:    „Diese Schätzung basiert auf Ihren Angaben und dient als erste Orientierung.
                Ihr endgültiger Festpreis wird individuell für Sie erstellt —
                transparent und ohne versteckte Kosten."
```

### Onboarding-Header Änderung
**Aktuell:** „KI-gestütztes Onboarding" + „Projekt beschreiben"
**Neu:** „Ihr Projekt in 3 Minuten beschreiben" (kein „KI-gestützt" — das verwirrt nicht-technische User)

**Fortschrittstext:**
**Aktuell:** „Schritt X von 11"
**Neu:** „Frage X von 11 — dauert nur noch kurz" (ab Schritt 7)

---

## 4. Onboarding-Einstieg auf der Homepage

### Aktuell: AIOnboardingPreview
- Zeigt animierten Chat-Mock → kann technisch wirken
- Heading: „Beschreiben Sie Ihr Projekt. Wir liefern den Plan." → OK

### Neu: Vereinfachter Einstiegsblock

```
Überschrift: „In 3 Minuten zur Einschätzung"
Unterüberschrift: „Beschreiben Sie Ihr Vorhaben — wir sagen Ihnen,
                   was es kostet und wie schnell es gehen kann."

3-Schritte-Darstellung:
  ① Vorhaben beschreiben      → „11 kurze Fragen — kein Fachwissen nötig"
  ② Einschätzung erhalten     → „Sofort einen ersten Kostenrahmen sehen"
  ③ Entscheiden, wie es weitergeht → „Gespräch buchen oder direkt loslegen"

CTA: „Jetzt starten — kostenlos"

Vertrauenssignal darunter:
  „✓ Keine technischen Kenntnisse nötig"
  „✓ Alles aus einer Hand — von der Idee bis zum Betrieb"
  „✓ Kostenlos und unverbindlich"
```

### Abstimmung mit Hero
- Hero-CTA führt zu `/onboarding`
- Einstiegsblock wiederholt das Wertversprechen auf mittlerer Seitenhöhe
- Gleiche Sprache wie Hero-Variante (z.B. „Vorhaben" statt „Projekt")

---

## 5. Schätzungs-Übergang (Estimate Transition)

### Nach dem Onboarding (Schritt 11)
**Aktuell:** Zeigt Preisrahmen + Aufwand → OK

**Verbesserung:**
```
Karte mit Einschätzung:
  ┌─────────────────────────────────────────────┐
  │  🎯 Ihre erste Einschätzung                 │
  │                                             │
  │  Preisrahmen:  ab 399 € — ca. 650 €        │
  │  Zeitaufwand:  ca. 4,5 Arbeitstage          │
  │                                             │
  │  Inkl. 1 Monat Betrieb & Wartung            │
  │  nach Go-Live                               │
  │                                             │
  │  ℹ️  Diese Schätzung ist eine erste          │
  │     Orientierung. Ihr endgültiger           │
  │     Festpreis folgt per E-Mail —            │
  │     transparent und verbindlich.            │
  └─────────────────────────────────────────────┘
```

### E-Mail nach Onboarding
- Bestätigt Eingang mit gleichem Preisrahmen
- Erklärt: „Wir prüfen Ihre Angaben und erstellen Ihnen ein verbindliches Angebot mit Festpreis."
- Nennt SLA-basierte Antwortzeit

---

## 6. Duale Conversion-Pfade

### Aktuelle Implementierung
Bereits vorhanden (StepAbschluss.tsx) mit risikobasierter Priorisierung. Wording-Optimierung:

### Path A: Gespräch vereinbaren
```
Überschrift:  „Persönlich besprechen"
Beschreibung: „Wir gehen Ihr Vorhaben gemeinsam durch und klären
               alles Offene — kostenlos und unverbindlich."
CTA:          „Gespräch buchen"
Wann betonen:  High-Risk-Projekte (>10 Features, >5.000€, unsicherer Scope)
```

### Path B: Direkt starten (Angebot anfordern)
```
Überschrift:  „Direkt loslegen"
Beschreibung: „Sie erhalten Ihr verbindliches Angebot mit Festpreis
               innerhalb von [SLA] per E-Mail — ein Klick zur Bestätigung."
CTA:          „Angebot anfordern"
Badge:        „Antwort in [SLA-Zeit]"
Wann betonen:  Low-Risk-Projekte (klarer Scope, moderate Komplexität)
```

### Darstellung
```
  Wie möchten Sie weitermachen?

  ┌──────────────────────┐  ┌──────────────────────┐
  │  💬 Persönlich       │  │  ⚡ Direkt loslegen   │
  │     besprechen       │  │                      │
  │                      │  │  Angebot mit         │
  │  Kostenlos &         │  │  Festpreis in [SLA]  │
  │  unverbindlich       │  │  per E-Mail          │
  │                      │  │                      │
  │  [Gespräch buchen]   │  │  [Angebot anfordern] │
  └──────────────────────┘  └──────────────────────┘

  Reihenfolge: Bei Low-Risk → Direkt links (primär)
               Bei High-Risk → Gespräch links (primär)
```

### Friction Reduction für Path B
- Kein zusätzlicher Schritt nötig (Daten bereits erfasst)
- SLA-Badge gibt Sicherheit (Antwortzeit-Versprechen)
- „Ein Klick zur Bestätigung" auf der Bestätigungsseite betonen

---

## 7. Konsistenz im gesamten Funnel

### Messaging-Alignment

| Touchpoint | Kernbotschaft | Ton |
|-----------|---------------|-----|
| Hero | Problem → „Wir machen das für Sie" | Klar, aktivierend |
| Onboarding-Einstieg | „3 Minuten, keine Vorkenntnisse" | Einladend, leicht |
| Onboarding-Fragen | Geführtes Gespräch, nicht Formular | Freundlich, ermutigend |
| Estimate | „Erste Orientierung, Festpreis folgt" | Transparent, vertrauenswürdig |
| Conversion-Pfade | „Ihr nächster Schritt, Ihr Tempo" | Respektvoll, ohne Druck |
| Bestätigungsseite | „Wir sind dran" + konkreter nächster Schritt | Professionell, verbindlich |

### Verbotene Begriffe (im gesamten Funnel)
- ~~App~~ → „Lösung", „Produkt", „Vorhaben"
- ~~Software~~ → „digitale Lösung"
- ~~Unternehmen~~ → „Vorhaben", „Projekt"
- ~~Geschäft~~ → „Alltag", „Abläufe"
- ~~KMUs~~ → entfernen oder „Gründer und Selbstständige"
- ~~API~~ → „Anbindung an andere Systeme"
- ~~RBAC~~ → „Unterschiedliche Zugriffsrechte"
- ~~Deployment~~ → „Go-Live"
- ~~MVP~~ → „erste Version"

### Wiederkehrende Vertrauens-Elemente
An jedem kritischen Punkt wiederholen:
1. „Keine technischen Kenntnisse nötig"
2. „Alles aus einer Hand"
3. „Kostenlos und unverbindlich" (beim Einstieg)
4. „Transparent und ohne versteckte Kosten" (bei Preisen)
5. „24/7 Support nach dem Start" (bei B&W)

---

## Implementierungsreihenfolge

1. **Hero-Varianten** in `src/data/hero-variants.ts` definieren + Hero.tsx anpassen
2. **A/B Test** `hero-messaging` erstellen (Admin oder Seed-Daten)
3. **Onboarding-Wording** Schritt für Schritt umschreiben (Komponenten + Constants)
4. **Onboarding-Header** anpassen (kein „KI-gestützt")
5. **Homepage-Einstiegsblock** `AIOnboardingPreview` refactoren
6. **Conversion-Pfade Wording** in StepAbschluss + Bestätigungsseite aktualisieren
7. **Metriken-Events** an allen Touchpoints implementieren
8. **Funnel-Dashboard** im Admin erweitern (pro Variante)
