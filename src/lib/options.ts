// The choices people pick in the app. Shared by browser and server.

export const TONES = [
  { id: "professional", label: "Professional", hint: "Polite, firm, work-ready" },
  { id: "kind", label: "Kind", hint: "Warm and gentle" },
  { id: "firm", label: "Firm", hint: "Clear boundaries, no drama" },
  { id: "comeback", label: "Strong comeback", hint: "Confident and sharp" },
  { id: "simple", label: "Clear & simple", hint: "Short and plain" },
] as const;

export const RECIPIENTS = [
  { id: "work", label: "Boss or colleague" },
  { id: "partner", label: "Partner or ex" },
  { id: "family", label: "Friend or family" },
  { id: "company", label: "Company or customer" },
  { id: "other", label: "Someone else" },
] as const;

export const FORMATS = [
  { id: "text", label: "Text / WhatsApp" },
  { id: "email", label: "Email" },
] as const;

export type ToneId = (typeof TONES)[number]["id"];
export type RecipientId = (typeof RECIPIENTS)[number]["id"];
export type FormatId = (typeof FORMATS)[number]["id"];

export const MAX_CHARS = 4000;

export function isTone(v: unknown): v is ToneId {
  return TONES.some((t) => t.id === v);
}
export function isRecipient(v: unknown): v is RecipientId {
  return RECIPIENTS.some((r) => r.id === v);
}
export function isFormat(v: unknown): v is FormatId {
  return FORMATS.some((f) => f.id === v);
}
