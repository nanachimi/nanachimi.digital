import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OnboardingData } from "@/lib/onboarding-schema";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function StepKontaktdaten({ data, onChange }: Props) {
  const emailFilled = data.email && isValidEmail(data.email);
  const nameFilled = data.name && data.name.trim().length >= 2;

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#8B8F97] mb-2">
        Fast geschafft — nur noch Ihre Kontaktdaten. Damit wir Ihnen Ihre persönliche Einschätzung schicken können.
      </p>

      {/* Email — always visible */}
      <div className="space-y-2">
        <Label className="text-[#c8cad0]">E-Mail *</Label>
        <Input
          type="email"
          value={data.email || ""}
          onChange={(e) => onChange({ email: e.target.value })}
          placeholder="max@beispiel.de"
          autoFocus
          className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50"
        />
        <p className="text-xs text-[#6a6e76] mt-1">
          Wir schicken Ihnen nur projektbezogene Infos. Kein Spam.
        </p>
      </div>

      {/* Name — appears after email is valid */}
      {emailFilled && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Label className="text-[#c8cad0]">Name *</Label>
          <Input
            value={data.name || ""}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Max Mustermann"
            className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50"
          />
        </div>
      )}

      {/* Optional fields — appear after name is filled */}
      {emailFilled && nameFilled && (
        <div className="grid gap-5 sm:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="space-y-2">
            <Label className="text-[#c8cad0]">Firma (optional)</Label>
            <Input
              value={data.firma || ""}
              onChange={(e) => onChange({ firma: e.target.value })}
              placeholder="Ihre Firma"
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[#c8cad0]">Telefon (optional)</Label>
            <Input
              value={data.telefon || ""}
              onChange={(e) => onChange({ telefon: e.target.value })}
              placeholder="+49 ..."
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50"
            />
          </div>
        </div>
      )}
    </div>
  );
}
