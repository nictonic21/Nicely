"use client";

// Cookie consent for advertising (the Meta Pixel). UK law (PECR / UK GDPR)
// needs a visitor's permission before ad tracking. Nothing loads until they
// tap Accept; Reject is just as easy; they can change their mind any time
// from "Cookie settings" in the footer.

export type Consent = "granted" | "denied" | null;
const KEY = "nicelyy:ad-consent:v1";
export const CONSENT_EVENT = "nicelyy-consent-change";
export const OPEN_SETTINGS_EVENT = "nicelyy-open-cookie-settings";

export function getConsent(): Consent {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: Exclude<Consent, null>) {
  try {
    window.localStorage.setItem(KEY, v);
  } catch {}
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}
