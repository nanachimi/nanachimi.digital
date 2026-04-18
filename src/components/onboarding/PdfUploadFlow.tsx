"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { OnboardingData } from "@/lib/onboarding-schema";
import { PdfUploadDropzone } from "./PdfUploadDropzone";
import { PdfAnalysisLoading } from "./PdfAnalysisLoading";
import { PdfExtractionReview } from "./PdfExtractionReview";
import { PdfFollowUpForm } from "./PdfFollowUpForm";
import { PdfSubmitStep } from "./PdfSubmitStep";

type Phase =
  | "upload"
  | "analyzing"
  | "review"
  | "followup"
  | "contact"
  | "submitting";

interface AnalysisResult {
  extracted: Partial<OnboardingData>;
  confidence: Record<string, "high" | "medium" | "low">;
  missing: string[];
  summary: string;
}

interface UploadedFile {
  id: string;
  filename: string;
  fileSize: number;
  contentType: string;
  category: string;
}

export function PdfUploadFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("upload");
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tempTokenRef = useRef(
    typeof crypto !== "undefined" ? crypto.randomUUID() : ""
  );

  const handleChange = useCallback(
    (partial: Partial<OnboardingData>) => {
      setData((prev) => ({ ...prev, ...partial }));
    },
    []
  );

  // Phase 1 → 2: File uploaded, start analysis
  const handleFileUploaded = useCallback(
    async (file: UploadedFile) => {
      setUploadedFile(file);
      setPhase("analyzing");
      setError(null);

      try {
        const res = await fetch("/api/onboarding/analyze-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileId: file.id,
            tempToken: tempTokenRef.current,
          }),
        });

        const result = await res.json();

        if (!res.ok) {
          // Check if we should fallback to wizard
          if (result.fallback) {
            setError(result.error);
            setPhase("upload");
            return;
          }
          setError(result.error || "Analyse fehlgeschlagen.");
          setPhase("upload");
          return;
        }

        // Merge extracted data
        setData((prev) => ({ ...prev, ...result.extracted }));
        setAnalysis(result);
        setPhase("review");
      } catch {
        setError(
          "Die Analyse konnte nicht durchgeführt werden. Bitte versuchen Sie es erneut."
        );
        setPhase("upload");
      }
    },
    []
  );

  // Phase 3 → 3b or 4: Review confirmed
  const handleReviewConfirm = useCallback(() => {
    if (analysis && analysis.missing.length > 0) {
      setPhase("followup");
    } else {
      setPhase("contact");
    }
  }, [analysis]);

  // Restart: go back to upload
  const handleRestart = useCallback(() => {
    setPhase("upload");
    setAnalysis(null);
    setUploadedFile(null);
    setData({});
    setError(null);
  }, []);

  // Phase 3b → 4: Follow-up complete
  const handleFollowUpComplete = useCallback(() => {
    setPhase("contact");
  }, []);

  // Submit to the same onboarding API
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setPhase("submitting");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          onboardingPath: "pdf_upload",
          fileIds: uploadedFile ? [uploadedFile.id] : [],
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Absenden fehlgeschlagen.");
        setPhase("contact");
        return;
      }

      // Redirect to confirmation page
      const typ = data.naechsterSchritt || "angebot";
      router.push(`/onboarding/bestaetigung?typ=${typ}&sid=${result.id}`);
    } catch {
      setError("Netzwerkfehler. Bitte versuchen Sie es erneut.");
      setPhase("contact");
    } finally {
      setIsSubmitting(false);
    }
  }, [data, uploadedFile, router]);

  return (
    <div>
      {/* Error banner (dismissible) */}
      {error && phase === "upload" && (
        <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/[0.04] p-4">
          <p className="text-sm text-red-400">{error}</p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                if (uploadedFile) {
                  handleFileUploaded(uploadedFile);
                }
              }}
              className="text-xs text-[#FFC62C] hover:text-[#FFD44D] font-medium"
            >
              Erneut versuchen
            </button>
            <button
              type="button"
              onClick={() => router.push("/onboarding")}
              className="text-xs text-[#8B8F97] hover:text-white"
            >
              Zum klassischen Formular
            </button>
          </div>
        </div>
      )}

      {phase === "upload" && (
        <PdfUploadDropzone
          tempToken={tempTokenRef.current}
          onFileUploaded={handleFileUploaded}
        />
      )}

      {phase === "analyzing" && uploadedFile && (
        <PdfAnalysisLoading filename={uploadedFile.filename} />
      )}

      {phase === "review" && analysis && (
        <PdfExtractionReview
          summary={analysis.summary}
          extracted={data}
          confidence={analysis.confidence}
          missing={analysis.missing}
          onConfirm={handleReviewConfirm}
          onRestart={handleRestart}
        />
      )}

      {phase === "followup" && analysis && (
        <PdfFollowUpForm
          missing={analysis.missing}
          data={data}
          onChange={handleChange}
          onComplete={handleFollowUpComplete}
          onBack={() => setPhase("review")}
        />
      )}

      {(phase === "contact" || phase === "submitting") && (
        <PdfSubmitStep
          data={data}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onBack={() =>
            analysis && analysis.missing.length > 0
              ? setPhase("followup")
              : setPhase("review")
          }
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
