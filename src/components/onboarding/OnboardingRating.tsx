"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface Props {
  submissionId?: string;
}

export function OnboardingRating({ submissionId }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showComment, setShowComment] = useState(false);

  function handleSelectRating(value: number) {
    setRating(value);
    setShowComment(true);
  }

  async function handleSubmit() {
    if (!rating) return;
    setSubmitted(true);

    // Fire-and-forget — log the rating + comment
    try {
      await fetch("/api/onboarding/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          submissionId,
        }),
      });
    } catch {
      // Silently fail — rating is non-critical
    }
  }

  if (submitted) {
    return (
      <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <p className="text-sm text-[#FFC62C] font-semibold">
          Vielen Dank für Ihr Feedback!
        </p>
        <div className="flex items-center justify-center gap-1 mt-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-6 w-6 ${
                star <= (rating || 0)
                  ? "fill-[#FFC62C] text-[#FFC62C]"
                  : "text-[#3a3d44]"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
      <p className="text-sm font-semibold text-white mb-1">
        Wie war Ihr Onboarding-Erlebnis?
      </p>
      <p className="text-xs text-[#6a6e76] mb-4">
        Ihre Bewertung hilft uns, den Prozess zu verbessern.
      </p>
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleSelectRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(null)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hoveredRating || rating || 0)
                  ? "fill-[#FFC62C] text-[#FFC62C]"
                  : "text-[#3a3d44] hover:text-[#6a6e76]"
              }`}
            />
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 px-1">
        <span className="text-[10px] text-[#5a5e66]">Schlecht</span>
        <span className="text-[10px] text-[#5a5e66]">Ausgezeichnet</span>
      </div>

      {/* Comment + submit — appears after selecting stars */}
      {showComment && (
        <div className="mt-5 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Möchten Sie uns noch etwas mitteilen? (optional)"
            rows={3}
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder:text-[#5a5e66] focus:border-[#FFC62C]/50 focus:outline-none resize-none px-4 py-3"
          />
          <button
            onClick={handleSubmit}
            className="rounded-xl bg-[#FFC62C] px-5 py-2 text-sm font-bold text-[#111318] hover:bg-[#e6b228] transition-colors"
          >
            Absenden
          </button>
        </div>
      )}
    </div>
  );
}
