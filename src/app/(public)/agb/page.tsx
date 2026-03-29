import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Allgemeine Geschäftsbedingungen",
  description:
    "Allgemeine Geschäftsbedingungen (AGB) von nanachimi.digital.",
};

export default function AGBPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl prose prose-gray">
          <h1 className="text-3xl font-bold">
            Allgemeine Geschäftsbedingungen (AGB)
          </h1>

          <h2>1. Geltungsbereich</h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen gelten für alle
            Geschäftsbeziehungen zwischen Achille Nana Chimi, nanachimi.digital,
            Mannheim, Deutschland (nachfolgend &bdquo;Anbieter&ldquo;) und dem Kunden
            (nachfolgend &bdquo;Auftraggeber&ldquo;).
          </p>

          <h2>2. Leistungen</h2>
          <p>
            Der Anbieter erbringt Dienstleistungen im Bereich
            Softwareentwicklung, Web- und Mobile-App-Entwicklung sowie
            Beratung. Der genaue Leistungsumfang ergibt sich aus dem
            jeweiligen Angebot.
          </p>

          <h2>3. Onboarding und Angebotserstellung</h2>
          <p>
            Über das Online-Onboarding-Formular können Interessenten
            Projektanforderungen beschreiben und eine unverbindliche
            Aufwandsschätzung erhalten. Die im Onboarding eingegebenen Daten
            dienen ausschließlich der Angebotserstellung und werden gemäß
            unserer{" "}
            <a
              href="/datenschutz"
              className="text-[#FFC62C] hover:underline"
            >
              Datenschutzerklärung
            </a>{" "}
            verarbeitet.
          </p>

          <h2>4. Browser-Speicher</h2>
          <p>
            Zur Verbesserung der Nutzererfahrung bieten wir die Möglichkeit,
            den Fortschritt im Onboarding-Formular im Browser
            zwischenzuspeichern (SessionStorage). Diese Funktion wird nur mit
            ausdrücklicher Einwilligung des Nutzers aktiviert.
          </p>
          <ul>
            <li>
              Die Daten verbleiben ausschließlich im Browser des Nutzers.
            </li>
            <li>
              Sie werden automatisch gelöscht, wenn der Browser-Tab
              geschlossen wird.
            </li>
            <li>
              Es findet keine Übertragung an Dritte statt.
            </li>
            <li>
              Die Einwilligung kann jederzeit durch Schließen des Tabs oder
              Löschen der Browserdaten widerrufen werden.
            </li>
          </ul>

          <h2>5. Angebote und Vertragsschluss</h2>
          <p>
            Angebote des Anbieters sind unverbindlich, sofern nicht
            ausdrücklich anders vereinbart. Ein Vertrag kommt erst durch
            schriftliche Bestätigung oder durch beidseitige Unterzeichnung
            eines Projektvertrags zustande.
          </p>

          <h2>6. Preise und Zahlung</h2>
          <p>
            Alle Preise verstehen sich in Euro und netto zuzüglich der
            gesetzlichen Mehrwertsteuer. Zahlungsmodalitäten werden im
            jeweiligen Angebot festgelegt.
          </p>

          <h2>7. Mitwirkungspflichten des Auftraggebers</h2>
          <p>
            Der Auftraggeber stellt dem Anbieter alle für die
            Leistungserbringung erforderlichen Informationen, Materialien und
            Zugänge rechtzeitig zur Verfügung. Verzögerungen durch fehlende
            Mitwirkung gehen nicht zu Lasten des Anbieters.
          </p>

          <h2>8. Urheberrecht und Nutzungsrechte</h2>
          <p>
            Nach vollständiger Bezahlung erhält der Auftraggeber die
            vereinbarten Nutzungsrechte an den erstellten Werken. Bis zur
            vollständigen Bezahlung verbleiben alle Rechte beim Anbieter.
          </p>

          <h2>9. Haftung</h2>
          <p>
            Die Haftung des Anbieters ist auf Vorsatz und grobe
            Fahrlässigkeit beschränkt. Für leichte Fahrlässigkeit haftet der
            Anbieter nur bei Verletzung wesentlicher Vertragspflichten
            (Kardinalpflichten) und ist der Höhe nach auf den
            vertragstypisch vorhersehbaren Schaden begrenzt.
          </p>

          <h2>10. Vertraulichkeit</h2>
          <p>
            Beide Parteien verpflichten sich, alle im Rahmen der
            Zusammenarbeit erhaltenen vertraulichen Informationen geheim zu
            halten und nicht an Dritte weiterzugeben.
          </p>

          <h2>11. Schlussbestimmungen</h2>
          <p>
            Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand
            ist, soweit gesetzlich zulässig, Mannheim.
          </p>
          <p>
            Sollte eine Bestimmung dieser AGB unwirksam sein oder werden,
            bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
          </p>

          <p className="text-sm text-muted-foreground mt-8">
            Stand: März 2026
          </p>
        </div>
      </div>
    </section>
  );
}
