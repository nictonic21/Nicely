"use client";

import { useEffect, useRef, useState } from "react";
import { IconMic, IconStop } from "@/components/Icons";

// Voice notes, using the browser's built-in speech-to-text (Chrome, Edge,
// Safari on iPhone, Mac and iPad). Nothing is recorded or stored by Nicelyy:
// the words simply appear in the box as you speak.

// Minimal typing for the Web Speech API, which TypeScript doesn't ship.
interface SpeechResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechEvent {
  resultIndex: number;
  results: ArrayLike<SpeechResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function VoiceButton({
  onFinal,
  onInterim,
  onNote,
  disabled,
}: {
  onFinal: (text: string) => void;
  onInterim: (text: string) => void;
  onNote: (note: string | null) => void;
  disabled?: boolean;
}) {
  const [ready, setReady] = useState(false);
  const [listening, setListening] = useState(false);
  const rec = useRef<Recognition | null>(null);

  useEffect(() => {
    setReady(true);
    return () => rec.current?.stop();
  }, []);

  function start() {
    const Ctor = getCtor();
    if (!Ctor) {
      onNote(
        "Voice isn't available in this browser. Try Chrome or Safari, or tap the microphone on your phone's keyboard."
      );
      return;
    }
    onNote(null);
    const r = new Ctor();
    r.lang = "en-GB";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) onFinal(res[0].transcript.trim());
        else interim += res[0].transcript;
      }
      onInterim(interim);
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        onNote("Please allow microphone access in your browser settings, then try again.");
      } else if (e.error === "no-speech") {
        onNote("We didn't hear anything. Tap Voice note and try again.");
      }
    };
    r.onend = () => {
      setListening(false);
      onInterim("");
    };
    rec.current = r;
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  if (!ready) return null;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={listening ? () => rec.current?.stop() : start}
      aria-pressed={listening}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${
        listening
          ? "bg-red-500 text-white shadow-[0_0_0_4px_rgba(239,68,68,.18)]"
          : "bg-ink/[.05] text-ink/80 hover:bg-ink/[.08]"
      }`}
    >
      {listening ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Listening
          <IconStop className="h-3.5 w-3.5" />
        </>
      ) : (
        <>
          <IconMic />
          Voice note
        </>
      )}
    </button>
  );
}
