import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partnerprogramm — Teilnahmebedingungen",
  description:
    "Teilnahmebedingungen des Partnerprogramms von nanachimi.digital.",
};

export default function PartnerAGBPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl prose prose-gray">
          <h1 className="text-3xl font-bold">
            Teilnahmebedingungen — Partnerprogramm
          </h1>

          <h2>1. Geltungsbereich</h2>
          <p>
            Diese Teilnahmebedingungen regeln die Rechte und Pflichten zwischen
            Achille Nana Chimi, nanachimi.digital, Mannheim, Deutschland
            (nachfolgend &bdquo;Anbieter&ldquo;) und dem Teilnehmer des
            Partnerprogramms (nachfolgend &bdquo;Partner&ldquo;). Mit der
            Bewerbung zum Partnerprogramm erklärt der Partner sein
            Einverständnis mit diesen Bedingungen.
          </p>

          <h2>2. Teilnahmevoraussetzungen</h2>
          <p>
            Zur Teilnahme am Partnerprogramm ist eine Bewerbung über das
            Bewerbungsformular auf der Website erforderlich. Der Anbieter
            behält sich das Recht vor, Bewerbungen ohne Angabe von Gründen
            abzulehnen. Die Teilnahme ist erst nach schriftlicher
            Bestätigung (Freischaltung des Partner-Accounts) wirksam.
          </p>

          <h2>3. Kommission und Auszahlung</h2>
          <ul>
            <li>
              Der Partner erhält eine Kommission auf qualifizierte Vermittlungen,
              die über seinen persönlichen Empfehlungslink oder Promo-Code
              erfolgen.
            </li>
            <li>
              Die Höhe der Kommission wird bei der Freischaltung des
              Partner-Accounts individuell festgelegt und dem Partner mitgeteilt.
            </li>
            <li>
              Eine Vermittlung gilt als qualifiziert, wenn der vermittelte Kunde
              innerhalb von 2 Jahren nach dem ersten Kontakt (Cookie-Laufzeit)
              ein bezahltes Projekt beauftragt.
            </li>
            <li>
              Kommissionen werden nach Zahlungseingang des Kunden berechnet
              und gemäß den vereinbarten Auszahlungsmodalitäten ausgezahlt.
            </li>
            <li>
              Der Anbieter behält sich das Recht vor, Kommissionen bei
              Verstoß gegen diese Teilnahmebedingungen zu stornieren.
            </li>
          </ul>

          <h2>4. Selbstvermittlung</h2>
          <p>
            <strong>
              Die Selbstvermittlung ist ausdrücklich untersagt.
            </strong>{" "}
            Der Partner darf sich nicht selbst über seinen eigenen
            Empfehlungslink oder Promo-Code als Kunde vermitteln, um
            Kommissionen zu generieren. Als Selbstvermittlung gilt
            insbesondere:
          </p>
          <ul>
            <li>
              Das Absenden des Onboarding-Formulars unter Verwendung des eigenen
              Empfehlungslinks oder Promo-Codes.
            </li>
            <li>
              Das Absenden des Onboarding-Formulars von derselben IP-Adresse,
              die dem Partner zugeordnet ist.
            </li>
            <li>
              Das Absenden des Onboarding-Formulars während einer aktiven
              Partner-Sitzung (Login im Partner-Portal).
            </li>
          </ul>
          <p>
            Bei erkannter Selbstvermittlung wird die Partnerzuordnung
            automatisch entfernt. Die Kundenanfrage selbst bleibt davon
            unberührt und wird normal bearbeitet. Wiederholte Verstöße
            können zur Kündigung des Partner-Accounts führen.
          </p>

          <h2>5. IP-Datenerfassung</h2>
          <p>
            Zur Erkennung und Verhinderung von Selbstvermittlung erfasst der
            Anbieter die IP-Adressen des Partners bei folgenden Ereignissen:
          </p>
          <ul>
            <li>Bei der Bewerbung zum Partnerprogramm.</li>
            <li>Bei jeder Anmeldung im Partner-Portal.</li>
          </ul>
          <p>
            Diese IP-Adressen werden ausschließlich zum Zweck der
            Betrugsprävention gespeichert und mit der IP-Adresse eingehender
            Kundenanfragen abgeglichen. Die Rechtsgrundlage ist Art. 6 Abs. 1
            lit. f DSGVO (berechtigtes Interesse an der Verhinderung von
            Betrug und dem Schutz der Integrität des Partnerprogramms).
          </p>
          <p>
            Die gespeicherten IP-Daten werden nach Beendigung der
            Partnerschaft oder auf Widerruf gelöscht. Weitergehende
            Informationen zum Datenschutz finden Sie in unserer{" "}
            <a
              href="/datenschutz"
              className="text-[#FFC62C] hover:underline"
            >
              Datenschutzerklärung
            </a>
            .
          </p>

          <h2>6. Pflichten des Partners</h2>
          <ul>
            <li>
              Der Partner verpflichtet sich, keine irreführenden oder falschen
              Angaben über die Leistungen des Anbieters zu machen.
            </li>
            <li>
              Der Partner darf keine Spam-Methoden, irreführende Werbung oder
              sonstige unlautere Mittel zur Gewinnung von Vermittlungen
              einsetzen.
            </li>
            <li>
              Der Partner ist verpflichtet, seinen Empfehlungslink und
              Promo-Code vertraulich zu behandeln und nicht an Dritte zur
              Eigennutzung weiterzugeben.
            </li>
          </ul>

          <h2>7. Kündigung</h2>
          <p>
            Beide Parteien können die Teilnahme am Partnerprogramm jederzeit
            ohne Angabe von Gründen kündigen. Bereits entstandene und
            berechtigte Kommissionsansprüche bleiben von der Kündigung
            unberührt. Bei Verstoß gegen diese Teilnahmebedingungen kann
            der Anbieter den Partner-Account mit sofortiger Wirkung
            sperren oder löschen.
          </p>

          <h2>8. Haftung</h2>
          <p>
            Die Haftung des Anbieters gegenüber dem Partner ist auf Vorsatz
            und grobe Fahrlässigkeit beschränkt. Der Anbieter haftet nicht
            für entgangene Kommissionen aufgrund technischer Störungen,
            Cookie-Blockierung durch Browser oder VPN-Nutzung des Kunden.
          </p>

          <h2>9. Schlussbestimmungen</h2>
          <p>
            Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand
            ist, soweit gesetzlich zulässig, Mannheim.
          </p>
          <p>
            Sollte eine Bestimmung dieser Teilnahmebedingungen unwirksam sein
            oder werden, bleibt die Wirksamkeit der übrigen Bestimmungen
            unberührt.
          </p>
          <p>
            Der Anbieter behält sich das Recht vor, diese
            Teilnahmebedingungen jederzeit zu ändern. Der Partner wird über
            Änderungen per E-Mail informiert. Die fortgesetzte Teilnahme am
            Partnerprogramm nach Benachrichtigung gilt als Zustimmung zu
            den geänderten Bedingungen.
          </p>

          <p className="text-sm text-muted-foreground mt-8">
            Stand: April 2026
          </p>
        </div>
      </div>
    </section>
  );
}
