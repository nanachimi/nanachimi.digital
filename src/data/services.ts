import { Service } from "@/lib/types";

export const services: Service[] = [
  {
    slug: "48h-mvp",
    title: "In 48 Stunden online",
    shortDescription:
      "Sie beschreiben Ihre Idee — wir bringen sie in 48 Stunden live. Für klare Vorhaben mit definiertem Umfang.",
    icon: "Zap",
    idealFor:
      "Gründer und Kleingewerbe, die eine klare Idee haben und schnell starten wollen — ohne monatelanges Warten.",
    features: [
      "Ihre Idee wird in 48 Stunden umgesetzt",
      "Sie müssen nichts Technisches verstehen",
      "Sofort online und für Ihre Kunden nutzbar",
      "1 Monat Betreuung nach dem Start inklusive",
      "Alles aus einer Hand — ein Ansprechpartner",
      "Auf Wunsch: laufende Weiterentwicklung",
    ],
    process: [
      {
        step: 1,
        title: "Sie beschreiben Ihr Vorhaben",
        description:
          "In 3 Minuten online — ohne technische Kenntnisse. Wir klären den Rest.",
      },
      {
        step: 2,
        title: "Wir bauen Ihre Lösung",
        description:
          "Konzentrierte Umsetzung in 48 Stunden. Sie werden regelmäßig informiert.",
      },
      {
        step: 3,
        title: "Ihre Lösung ist live",
        description:
          "Online, nutzbar, betreut. Sie können sofort loslegen — wir kümmern uns um den Rest.",
      },
    ],
  },
  {
    slug: "individuelle-loesung",
    title: "Ihre individuelle Lösung",
    shortDescription:
      "Von der Idee bis zur fertigen Lösung — wir übernehmen alles. Planung, Umsetzung, Start und Betreuung. Komplett.",
    icon: "Code",
    idealFor:
      "Gründer und Kleingewerbe, die eine professionelle digitale Lösung brauchen — von einfachen Tools bis zu komplexen Plattformen. Keine technischen Vorkenntnisse nötig.",
    features: [
      "Wir verstehen Ihr Vorhaben und planen die Umsetzung",
      "Sie sehen regelmäßig den Fortschritt",
      "Design nach Ihren Wünschen oder unseren Vorschlägen",
      "Qualität wird automatisch geprüft",
      "Wir bringen Ihre Lösung online",
      "Dokumentation und Einweisung inklusive",
    ],
    process: [
      {
        step: 1,
        title: "Wir verstehen Ihr Vorhaben",
        description:
          "Sie beschreiben, was Sie brauchen. Wir planen die Umsetzung — verständlich und transparent.",
      },
      {
        step: 2,
        title: "Sie sehen erste Ergebnisse",
        description:
          "Wir zeigen Ihnen Entwürfe und Prototypen. Sie geben Feedback — wir passen an.",
      },
      {
        step: 3,
        title: "Schrittweise Umsetzung",
        description:
          "Ihre Lösung entsteht Schritt für Schritt. Sie werden regelmäßig über den Stand informiert.",
      },
      {
        step: 4,
        title: "Ihre Lösung geht live",
        description:
          "Wir bringen alles online, testen gründlich und übergeben — inklusive 1 Monat Betreuung.",
      },
    ],
  },
  {
    slug: "betrieb-und-wartung",
    title: "Wir kümmern uns um den Betrieb",
    shortDescription:
      "Ihre Lösung läuft — wir sorgen dafür, dass das so bleibt. Überwachung, Updates, Sicherheit und schnelle Hilfe bei Problemen.",
    icon: "Shield",
    idealFor:
      "Kleingewerbe und Gründer, die sich nicht um Technik kümmern wollen. Wir übernehmen den laufenden Betrieb — Sie konzentrieren sich auf Ihr Vorhaben.",
    features: [
      "Ihre Lösung wird rund um die Uhr überwacht",
      "Sicherheitsupdates werden automatisch eingespielt",
      "Bei Problemen reagieren wir sofort",
      "Regelmäßige Verbesserungen und Optimierungen",
      "Ihre Daten werden täglich gesichert",
      "Monatlicher Statusbericht für Sie",
    ],
    process: [
      {
        step: 1,
        title: "Wir prüfen Ihre Lösung",
        description:
          "Bestandsaufnahme: Was läuft gut? Wo gibt es Risiken? Was können wir verbessern?",
      },
      {
        step: 2,
        title: "Wir richten alles ein",
        description:
          "Überwachung, Sicherheitsnetze und automatische Backups — alles wird eingerichtet.",
      },
      {
        step: 3,
        title: "Wir kümmern uns — Sie nicht",
        description:
          "Laufende Überwachung, proaktive Wartung und schnelle Hilfe. 24/7, auch am Wochenende.",
      },
    ],
  },
];
