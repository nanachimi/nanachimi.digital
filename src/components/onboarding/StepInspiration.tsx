import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2, X, Plus } from "lucide-react";
import type { OnboardingData } from "@/lib/onboarding-schema";
import { MAX_INSPIRATION_URLS } from "@/lib/onboarding-schema";

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function StepInspiration({ data, onChange }: Props) {
  const urls = data.inspirationUrls || [];
  const [newUrl, setNewUrl] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [error, setError] = useState("");

  const canAdd = urls.length < MAX_INSPIRATION_URLS;

  function isValidUrl(str: string): boolean {
    try {
      const url = new URL(str);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function addUrl() {
    const trimmedUrl = newUrl.trim();
    const trimmedDesc = newDesc.trim();

    if (!trimmedUrl) {
      setError("Bitte geben Sie eine URL ein.");
      return;
    }
    if (!isValidUrl(trimmedUrl)) {
      setError("Bitte geben Sie eine gültige URL ein (z.B. https://example.com).");
      return;
    }
    if (!trimmedDesc || trimmedDesc.length < 5) {
      setError("Bitte beschreiben Sie kurz, was Sie an dieser Seite inspiriert (mind. 5 Zeichen).");
      return;
    }

    onChange({
      inspirationUrls: [...urls, { url: trimmedUrl, beschreibung: trimmedDesc }],
    });
    setNewUrl("");
    setNewDesc("");
    setError("");
  }

  function removeUrl(idx: number) {
    onChange({
      inspirationUrls: urls.filter((_, i) => i !== idx),
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-[#8B8F97]">
        Kennen Sie Websites oder Apps, die Ihnen gefallen? Teilen Sie uns diese
        mit — das hilft uns, Ihren Geschmack zu verstehen.
      </p>

      {/* Existing entries */}
      {urls.length > 0 && (
        <div className="space-y-3">
          {urls.map((entry, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 relative"
            >
              <button
                type="button"
                onClick={() => removeUrl(idx)}
                className="absolute top-3 right-3 text-[#6a6e76] hover:text-red-400 transition-colors"
                aria-label="Entfernen"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <Link2 className="h-4 w-4 text-[#FFC62C]" />
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#FFC62C] underline truncate max-w-[80%]"
                >
                  {entry.url}
                </a>
              </div>
              <p className="text-sm text-[#8B8F97] pl-6">{entry.beschreibung}</p>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {canAdd && (
        <div className="rounded-xl border border-dashed border-white/10 p-4 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-[#c8cad0] text-sm">URL</Label>
            <Input
              type="url"
              value={newUrl}
              onChange={(e) => {
                setNewUrl(e.target.value);
                if (error) setError("");
              }}
              placeholder="https://example.com"
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[#c8cad0] text-sm">
              Was gefällt Ihnen daran?
            </Label>
            <Input
              value={newDesc}
              onChange={(e) => {
                setNewDesc(e.target.value);
                if (error) setError("");
              }}
              placeholder="z.B. Schlichtes Design, einfache Navigation, gute Übersicht"
              maxLength={200}
              className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 text-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <button
            type="button"
            onClick={addUrl}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-[#8B8F97] hover:border-[#FFC62C]/30 hover:text-[#FFC62C] transition-all"
          >
            <Plus className="h-4 w-4" />
            Hinzufügen
          </button>
        </div>
      )}

      <p className="text-xs text-[#6a6e76]">
        Optional — Sie können bis zu {MAX_INSPIRATION_URLS} Beispiele angeben.
        {urls.length > 0 && ` (${urls.length}/${MAX_INSPIRATION_URLS})`}
      </p>
    </div>
  );
}
