import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { OnboardingData } from "@/lib/onboarding-schema";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function StepBeschreibung({ data, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label className="text-[#c8cad0]">
        Beschreiben Sie Ihr Vorhaben in eigenen Worten.
      </Label>
      <p className="text-sm text-[#8B8F97] mb-3">
        Was soll Ihre Lösung für Sie oder Ihre Kunden tun? Je mehr Sie erzählen, desto besser können wir helfen.
      </p>
      <Textarea
        value={data.beschreibung || ""}
        onChange={(e) => onChange({ beschreibung: e.target.value })}
        placeholder="z.B. Ich möchte eine Plattform, auf der Kunden Termine buchen und bezahlen können. Bisher mache ich das alles per Telefon und E-Mail — das kostet mich jeden Tag Zeit..."
        rows={6}
        className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 resize-none"
      />
    </div>
  );
}
