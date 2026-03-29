"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image, Archive, Loader2 } from "lucide-react";

interface UploadedFile {
  id: string;
  filename: string;
  fileSize: number;
  contentType: string;
  category: string;
}

interface Props {
  tempToken: string;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  category?: string;
}

const ALLOWED_EXTENSIONS = ".png,.jpg,.jpeg,.webp,.svg,.pdf,.zip";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(contentType: string) {
  if (contentType.startsWith("image/")) return Image;
  if (contentType === "application/pdf") return FileText;
  if (contentType.includes("zip")) return Archive;
  return FileText;
}

export function FileUpload({
  tempToken,
  files,
  onFilesChange,
  maxFiles = 5,
  category = "branding",
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const canUpload = files.length < maxFiles;

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tempToken", tempToken);
        formData.append("category", category);

        const res = await fetch("/api/onboarding/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          setError(err.error || "Upload fehlgeschlagen");
          return null;
        }

        return (await res.json()) as UploadedFile;
      } catch {
        setError("Upload fehlgeschlagen. Bitte versuchen Sie es erneut.");
        return null;
      } finally {
        setUploading(false);
      }
    },
    [tempToken, category]
  );

  const filesRef = useRef(files);
  filesRef.current = files;

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const remaining = maxFiles - filesRef.current.length;
      const toUpload = Array.from(fileList).slice(0, remaining);

      for (const file of toUpload) {
        const result = await uploadFile(file);
        if (result) {
          const updated = [...filesRef.current, result];
          filesRef.current = updated;
          onFilesChange(updated);
        }
      }
    },
    [maxFiles, uploadFile, onFilesChange]
  );

  const removeFile = useCallback(
    async (fileId: string) => {
      try {
        await fetch(
          `/api/onboarding/upload?id=${fileId}&tempToken=${tempToken}`,
          { method: "DELETE" }
        );
      } catch {
        // Continue with UI removal even if API fails
      }
      onFilesChange(files.filter((f) => f.id !== fileId));
    },
    [files, tempToken, onFilesChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (canUpload) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!canUpload) return;
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
      e.target.value = ""; // reset for re-upload of same file
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {canUpload && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 cursor-pointer transition-all ${
            isDragging
              ? "border-[#FFC62C]/50 bg-[#FFC62C]/[0.06]"
              : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 text-[#FFC62C] animate-spin" />
          ) : (
            <Upload
              className={`h-8 w-8 ${
                isDragging ? "text-[#FFC62C]" : "text-[#6a6e76]"
              }`}
            />
          )}
          <p className="text-sm text-[#8B8F97] text-center">
            {uploading
              ? "Wird hochgeladen..."
              : "Dateien hierher ziehen oder klicken"}
          </p>
          <p className="text-xs text-[#6a6e76]">
            Bilder, PDF, ZIP — max. 10 MB pro Datei
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ALLOWED_EXTENSIONS}
            multiple
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const Icon = getFileIcon(file.contentType);
            return (
              <div
                key={file.id}
                className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3"
              >
                <Icon className="h-5 w-5 shrink-0 text-[#FFC62C]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{file.filename}</p>
                  <p className="text-xs text-[#6a6e76]">
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="rounded-full p-1 text-[#6a6e76] hover:text-red-400 hover:bg-white/[0.06] transition-colors"
                  aria-label={`${file.filename} entfernen`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })}
          <p className="text-xs text-[#6a6e76]">
            {files.length} von {maxFiles} Dateien
          </p>
        </div>
      )}
    </div>
  );
}
