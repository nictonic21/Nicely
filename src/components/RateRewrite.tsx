"use client";

import { useEffect, useState } from "react";
import { IconThumbDown, IconThumbUp } from "@/components/Icons";
import { FEEDBACK_REASONS, type FeedbackReason } from "@/lib/feedback";
import { track } from "@/lib/analytics";

// "Was this helpful?" under a rewrite. Saves only the thumb and, for a
// thumbs down, a reason from a fixed list.
export default function RateRewrite({ rewriteId }: { rewriteId: string }) {
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [reason, setReason] = useState<FeedbackReason | null>(null);

  // A new rewrite starts fresh.
  useEffect(() => {
    setRating(null);
    setReason(null);
  }, [rewriteId]);

  async function save(r: 1 | -1, why: FeedbackReason | null) {
    setRating(r);
    setReason(why);
    track("feedback", { rating: r, reason: why });
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewriteId, rating: r, reason: why }),
      });
    } catch {
      // Feedback is a nice-to-have; never bother the person if it fails.
    }
  }

  const thumb = (on: boolean) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
      on ? "border-accent bg-accent text-white" : "border-ink/10 bg-white text-ink/55 hover:border-accent/40 hover:text-ink"
    }`;

  return (
    <div className="card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink/75">
          {rating === 1 ? "Glad it helped. Thanks!" : rating === -1 && reason ? "Thanks, that helps us improve." : "Was this helpful?"}
        </p>
        <div className="flex gap-2">
          <button type="button" aria-label="Yes, helpful" aria-pressed={rating === 1} onClick={() => save(1, null)} className={thumb(rating === 1)}>
            <IconThumbUp />
          </button>
          <button type="button" aria-label="Not helpful" aria-pressed={rating === -1} onClick={() => save(-1, reason)} className={thumb(rating === -1)}>
            <IconThumbDown />
          </button>
        </div>
      </div>
      {rating === -1 ? (
        <div className="mt-3">
          <p className="text-xs text-ink/55">What was wrong? (Tip: a quick tweak or a different tone might fix it.)</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {FEEDBACK_REASONS.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={reason === r.id}
                onClick={() => save(-1, r.id)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  reason === r.id ? "border-accent bg-accent-soft text-accent-dark" : "border-ink/10 bg-white text-ink/65 hover:border-accent/40"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
