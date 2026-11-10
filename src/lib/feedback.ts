// Reasons people can pick when a rewrite missed the mark. A fixed list, so
// no free text (and so none of what they wrote) is ever stored.
export const FEEDBACK_REASONS = [
  { id: "too_long", label: "Too long" },
  { id: "wrong_tone", label: "Wrong tone" },
  { id: "missed_point", label: "Missed my point" },
  { id: "robotic", label: "Sounds robotic" },
  { id: "other", label: "Something else" },
] as const;
export type FeedbackReason = (typeof FEEDBACK_REASONS)[number]["id"];
export function isFeedbackReason(v: unknown): v is FeedbackReason {
  return FEEDBACK_REASONS.some((r) => r.id === v);
}
