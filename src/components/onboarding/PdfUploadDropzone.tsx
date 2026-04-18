"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, X, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UploadedFile {
  id: string;
  filename: string;
  fileSize: number;
  contentType: string;
  category: string;
}

interface Props {
  tempToken: string;
  onFileUploaded: (file: UploadedFile) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function PdfUploadDropzone({ tempToken, onFileUploaded }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);

      // Client-side validation
      if (file.type !== "application/pdf") {
        setError("Nur PDF-Dateien werden akzeptiert.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Maximale Dateigröße: 10 MB.");
        return;
      }

      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tempToken", tempToken);
        formData.append("category", "pdf_konzept");

        const res = await fetch("/api/onboarding/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Upload fehlgeschlagen.");
          return;
        }

        const result = (await res.json()) as UploadedFile;
        setUploadedFile(result);
        onFileUploaded(result);
      } catch {
        setError("Upload fehlgeschlagen. Bitte versuchen Sie es erneut.");
      } finally {
        setUploading(false);
      }
    },
    [tempToken, onFileUploaded]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!uploading && !uploadedFile) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploading || uploadedFile) return;

    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleRemove = async () => {
    if (!uploadedFile) return;
    try {
      await fetch(
        `/api/onboarding/upload?id=${uploadedFile.id}&tempToken=${tempToken}`,
        { method: "DELETE" }
      );
    } catch {
      // Continue with UI removal
    }
    setUploadedFile(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFC62C]/10">
          <FileText className="h-8 w-8 text-[#FFC62C]" />
        </div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">
          Laden Sie Ihr Konzept hoch
        </h1>
        <p className="mt-3 text-[#8B8F97] max-w-md mx-auto">
          Wir analysieren Ihr PDF mit KI und stellen Ihnen nur die fehlenden
          Fragen. Kein langes Formular.
        </p>
      </div>

      {/* Drop zone or uploaded file */}
      {!uploadedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-all ${
            isDragging
              ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.06]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-[#FFC62C] animate-spin" />
              <p className="text-sm text-[#8B8F97]">Wird hochgeladen...</p>
            </>
          ) : (
            <>
              <Upload
                className={`h-10 w-10 ${
                  isDragging ? "text-[#FFC62C]" : "text-[#6a6e76]"
                }`}
              />
              <div className="text-center">
                <p className="text-sm text-[#c8cad0]">
                  PDF hierher ziehen oder{" "}
                  <span className="text-[#FFC62C] font-medium">klicken</span>
                </p>
                <p className="mt-1 text-xs text-[#6a6e76]">
                  Max. 10 MB, nur PDF-Dateien
                </p>
              </div>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        /* Uploaded file preview */
        <div className="rounded-xl border border-[#FFC62C]/20 bg-[#FFC62C]/[0.04] p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 shrink-0 text-[#FFC62C]" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {uploadedFile.filename}
              </p>
              <p className="text-xs text-[#6a6e76]">
                {formatFileSize(uploadedFile.fileSize)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-full p-1.5 text-[#6a6e76] hover:text-red-400 hover:bg-white/[0.06] transition-colors"
              aria-label="Datei entfernen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}

      {/* Fallback link */}
      <div className="text-center pt-2">
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 text-sm text-[#8B8F97] hover:text-[#FFC62C] transition-colors"
        >
          Lieber Schritt für Schritt?
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
