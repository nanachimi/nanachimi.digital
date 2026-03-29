import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { OnboardingData } from "@/lib/onboarding-schema";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function StepZielgruppe({ data, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label className="text-[#c8cad0]">
        Wer soll Ihre Lösung nutzen?
      </Label>
      <p className="text-sm text-[#8B8F97] mb-3">
        Damit wir die Lösung genau auf die richtigen Personen zuschneiden.
      </p>
      <Textarea
        value={data.zielgruppe || ""}
        onChange={(e) => onChange({ zielgruppe: e.target.value })}
        placeholder="z.B. Meine Kunden, die online Termine buchen wollen. Und ich selbst, um alles im Blick zu behalten."
        rows={4}
        className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 resize-none"
      />
    </div>
  );
}
