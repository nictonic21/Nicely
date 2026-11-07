"use client";

// Things remembered on this device only (browser storage). Nothing here is
// sent to Nicelyy's servers. Every read and write is guarded, because private
// browsing or blocked storage can make storage unavailable.

import type { FormatId, RecipientId, ToneId } from "@/lib/options";

const PREFS = "nicelyy:prefs:v1";
const HISTORY = "nicelyy:history:v1";
const HISTORY_ON = "nicelyy:history-on:v1";
const DRAFT = "nicelyy:draft:v1";
const MAX_HISTORY = 50;

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export interface Prefs {
  tone: ToneId;
  recipient: RecipientId;
  format: FormatId;
}
export const loadPrefs = () => read<Prefs>(PREFS);
export const savePrefs = (p: Prefs) => write(PREFS, p);

export interface HistoryItem {
  id: string;
  at: string;
  tone: ToneId;
  recipient: RecipientId;
  format: FormatId;
  text: string;
  received: string;
  message: string;
  subject: string;
}

export function historyEnabled(): boolean {
  return read<boolean>(HISTORY_ON) !== false;
}
export function setHistoryEnabled(on: boolean) {
  write(HISTORY_ON, on);
  if (!on) write(HISTORY, null);
}
export function loadHistory(): HistoryItem[] {
  return read<HistoryItem[]>(HISTORY) ?? [];
}
// Adds an item, or updates it if the same id is already saved (e.g. when the
// person picks a different version or applies a tweak).
export function saveToHistory(item: HistoryItem) {
  if (!historyEnabled()) return;
  const list = loadHistory().filter((h) => h.id !== item.id);
  write(HISTORY, [item, ...list].slice(0, MAX_HISTORY));
}
export function removeFromHistory(id: string) {
  write(HISTORY, loadHistory().filter((h) => h.id !== id));
}
export function clearHistory() {
  write(HISTORY, null);
}

// "Use again" from history: hands the old message to the app screen.
export interface Draft {
  text: string;
  received: string;
  tone: ToneId;
  recipient: RecipientId;
  format: FormatId;
}
export const setDraft = (d: Draft) => write(DRAFT, d);
export function takeDraft(): Draft | null {
  const d = read<Draft>(DRAFT);
  write(DRAFT, null);
  return d;
}
