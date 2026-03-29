import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
  description: "Datenschutzerklärung für nanachimi.digital gemäß DSGVO.",
};

export default function DatenschutzPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl prose prose-gray">
          <h1 className="text-3xl font-bold">Datenschutzerklärung</h1>

          <h2>1. Datenschutz auf einen Blick</h2>
          <h3>Allgemeine Hinweise</h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber,
            was mit Ihren personenbezogenen Daten passiert, wenn Sie diese
            Website besuchen. Personenbezogene Daten sind alle Daten, mit
            denen Sie persönlich identifiziert werden können.
          </p>

          <h3>Datenerfassung auf dieser Website</h3>
          <p>
            <strong>
              Wer ist verantwortlich für die Datenerfassung auf dieser Website?
            </strong>
          </p>
          <p>
            Die Datenverarbeitung auf dieser Website erfolgt durch den
            Websitebetreiber: Achille Nana Chimi, Mannheim, Deutschland.
            E-Mail: info@nanachimi.digital
          </p>

          <h2>2. Hosting</h2>
          <p>
            Wir hosten die Inhalte unserer Website bei Hetzner Online GmbH,
            Industriestr. 25, 91710 Gunzenhausen, Deutschland. Details
            entnehmen Sie der Datenschutzerklärung von Hetzner:{" "}
            <a
              href="https://www.hetzner.com/de/legal/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FFC62C] hover:underline"
            >
              hetzner.com/legal/privacy-policy
            </a>
          </p>

          <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>
          <h3>Datenschutz</h3>
          <p>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen
            Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten
            vertraulich und entsprechend der gesetzlichen
            Datenschutzvorschriften sowie dieser Datenschutzerklärung.
          </p>

          <h2>4. Cookies</h2>
          <p>
            Unsere Website verwendet Cookies. Beim ersten Besuch werden Sie
            gefragt, welche Cookies Sie zulassen möchten. Ihre Auswahl können
            Sie jederzeit über den Link &bdquo;Cookie-Einstellungen&ldquo; im
            Footer der Website ändern.
          </p>

          <h3>Übersicht der verwendeten Cookies</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Cookie</th>
                  <th className="text-left py-2 pr-4">Zweck</th>
                  <th className="text-left py-2 pr-4">Dauer</th>
                  <th className="text-left py-2">Kategorie</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono text-xs">ncd-consent</td>
                  <td className="py-2 pr-4">
                    Speichert Ihre Cookie-Einstellungen
                  </td>
                  <td className="py-2 pr-4">365 Tage</td>
                  <td className="py-2">Notwendig</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-mono text-xs">ncd-ab</td>
                  <td className="py-2 pr-4">
                    Anonyme Zuordnung zu Optimierungsvarianten
                  </td>
                  <td className="py-2 pr-4">90 Tage</td>
                  <td className="py-2">Analyse</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>5. Analyse &amp; Optimierung</h2>
          <p>
            Mit Ihrer Einwilligung erfassen wir anonymisierte Nutzungsdaten,
            um unsere Website und den Onboarding-Prozess kontinuierlich zu
            verbessern.
          </p>

          <h3>Was wird erfasst?</h3>
          <ul>
            <li>Seitenaufrufe und besuchte Seiten</li>
            <li>Verweildauer auf einzelnen Seiten</li>
            <li>Scrolltiefe</li>
            <li>Fortschritt im Onboarding-Formular (Schritte und Verweildauer pro Schritt)</li>
            <li>Klicks auf Handlungsaufforderungen (Buttons)</li>
            <li>Herkunft des Besuchs (Referrer, UTM-Parameter)</li>
          </ul>

          <h3>Warum?</h3>
          <p>
            Die Daten helfen uns zu verstehen, welche Inhalte relevant sind,
            wo Besucher Schwierigkeiten haben und wie wir das Nutzererlebnis
            verbessern können.
          </p>

          <h3>Rechtsgrundlage</h3>
          <p>
            Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Die Erfassung erfolgt
            erst nach Ihrer ausdrücklichen Zustimmung über den Cookie-Banner.
          </p>

          <h3>Keine Weitergabe an Dritte</h3>
          <p>
            Alle Daten werden ausschließlich auf unseren eigenen Servern bei
            Hetzner in Deutschland verarbeitet und gespeichert. Es findet
            keine Weitergabe an Drittanbieter oder externe Analyse-Dienste
            statt.
          </p>

          <h3>Widerruf</h3>
          <p>
            Sie können Ihre Einwilligung jederzeit widerrufen, indem Sie über
            den Link &bdquo;Cookie-Einstellungen&ldquo; im Footer der Website
            Ihre Auswahl ändern.
          </p>

          <h2>6. Datenerfassung auf dieser Website</h2>
          <h3>Kontaktformular</h3>
          <p>
            Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden
            Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort
            angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für
            den Fall von Anschlussfragen bei uns gespeichert. Diese Daten
            geben wir nicht ohne Ihre Einwilligung weiter.
          </p>

          <h3>Onboarding-Formular</h3>
          <p>
            Bei Nutzung unseres Onboarding-Formulars werden die von Ihnen
            eingegebenen Projektanforderungen und Kontaktdaten gespeichert,
            um Ihnen eine Aufwandsschätzung zu erstellen und Sie
            gegebenenfalls zu kontaktieren. Rechtsgrundlage ist Art. 6 Abs.
            1 lit. b DSGVO (Vertragsanbahnung).
          </p>

          <h2>7. Browser-Speicher (SessionStorage)</h2>
          <p>
            Unser Onboarding-Formular bietet Ihnen die Möglichkeit, Ihren
            Fortschritt im Browser zwischenzuspeichern (SessionStorage). Diese
            Funktion wird nur aktiviert, wenn Sie ausdrücklich zustimmen.
          </p>
          <p>
            <strong>Was wird gespeichert?</strong> Ihre Eingaben aus dem
            Onboarding-Formular (Projektanforderungen, gewählte Optionen).
            Personenbezogene Daten wie Name und E-Mail werden erst gespeichert,
            wenn Sie diese im Formular eingeben.
          </p>
          <p>
            <strong>Wie lange?</strong> Die Daten im SessionStorage werden
            automatisch gelöscht, sobald Sie den Browser-Tab schließen. Sie
            werden nicht an Server übertragen, nicht mit Dritten geteilt und
            verbleiben ausschließlich in Ihrem Browser.
          </p>
          <p>
            <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO
            (Einwilligung). Sie können Ihre Einwilligung jederzeit widerrufen,
            indem Sie den Browser-Tab schließen oder die Browserdaten löschen.
          </p>

          <h2>8. Ihre Rechte</h2>
          <p>
            Sie haben jederzeit das Recht, unentgeltlich Auskunft über
            Herkunft, Empfänger und Zweck Ihrer gespeicherten
            personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht,
            die Berichtigung oder Löschung dieser Daten zu verlangen.
          </p>
          <p>
            Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie
            sich jederzeit an uns wenden: info@nanachimi.digital
          </p>

          <p className="text-sm text-muted-foreground mt-8">
            Stand: März 2026
          </p>
        </div>
      </div>
    </section>
  );
}
