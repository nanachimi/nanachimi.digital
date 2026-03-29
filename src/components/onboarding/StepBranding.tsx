"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "./FileUpload";
import type { OnboardingData } from "@/lib/onboarding-schema";

interface UploadedFile {
  id: string;
  filename: string;
  fileSize: number;
  contentType: string;
  category: string;
}

interface Props {
  data: Partial<OnboardingData>;
  onChange: (d: Partial<OnboardingData>) => void;
}

export function StepBranding({ data, onChange }: Props) {
  // Generate a stable tempToken per session for file uploads
  const [tempToken] = useState(() => {
    if (typeof window !== "undefined") {
      const key = "nanachimi_upload_token";
      let token = sessionStorage.getItem(key);
      if (!token) {
        token = crypto.randomUUID();
        sessionStorage.setItem(key, token);
      }
      return token;
    }
    return crypto.randomUUID();
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Sync file IDs to form data
  useEffect(() => {
    const ids = uploadedFiles.map((f) => f.id);
    const currentIds = data.fileIds || [];
    if (JSON.stringify(ids) !== JSON.stringify(currentIds)) {
      onChange({ fileIds: ids });
    }
  }, [uploadedFiles]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      {/* Brand name */}
      <div>
        <Label htmlFor="markenname" className="text-[#c8cad0]">
          Wie heißt Ihr Produkt oder Service?
        </Label>
        <p className="text-xs text-[#6a6e76] mt-1 mb-2">
          Falls schon bekannt — sonst lassen Sie das Feld einfach frei.
        </p>
        <Input
          id="markenname"
          value={data.markenname || ""}
          onChange={(e) => onChange({ markenname: e.target.value })}
          placeholder="z.B. MeinService, BrandName"
          maxLength={100}
          className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50"
        />
      </div>

      {/* Domain */}
      <div>
        <Label htmlFor="domain" className="text-[#c8cad0]">
          Haben Sie bereits eine Domain?
        </Label>
        <p className="text-xs text-[#6a6e76] mt-1 mb-2">
          Falls bereits reserviert oder im Besitz.
        </p>
        <Input
          id="domain"
          value={data.domain || ""}
          onChange={(e) => onChange({ domain: e.target.value })}
          placeholder="z.B. meinprodukt.de"
          maxLength={253}
          className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50"
        />
      </div>

      {/* Branding info */}
      <div>
        <Label htmlFor="brandingInfo" className="text-[#c8cad0]">
          Bestehende Markenvorgaben?
        </Label>
        <p className="text-xs text-[#6a6e76] mt-1 mb-2">
          Schriften, Farben, Styleguide oder andere Designvorgaben.
        </p>
        <Textarea
          id="brandingInfo"
          value={data.brandingInfo || ""}
          onChange={(e) => onChange({ brandingInfo: e.target.value })}
          placeholder="z.B. Hauptfarbe #FF5733, Schrift: Inter, Logo existiert bereits..."
          rows={3}
          maxLength={2000}
          className="bg-white/[0.04] border-white/10 text-white placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 resize-none"
        />
      </div>

      {/* File upload */}
      <div>
        <Label className="text-[#c8cad0]">
          Dateien hochladen
        </Label>
        <p className="text-xs text-[#6a6e76] mt-1 mb-3">
          Logos, Styleguides, Mockups oder Referenzmaterial (optional, max. 5 Dateien).
        </p>
        <FileUpload
          tempToken={tempToken}
          files={uploadedFiles}
          onFilesChange={setUploadedFiles}
          maxFiles={5}
          category="branding"
        />
      </div>
    </div>
  );
}
