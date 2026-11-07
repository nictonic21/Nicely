"use client";

import { useEffect, useRef, useState } from "react";

// Voice notes, using the browser's built-in speech-to-text (Chrome, Edge,
// Safari on iPhone, Mac and iPad). Nothing is recorded or stored by Nicely:
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
  disabled,
}: {
  onFinal: (text: string) => void;
  onInterim: (text: string) => void;
  disabled?: boolean;
}) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(!!getCtor());
    return () => rec.current?.stop();
  }, []);

  function start() {
    const Ctor = getCtor();
    if (!Ctor) {
      setNote(
        "Voice isn't available in this browser. Try Chrome or Safari, or tap the microphone on your phone's keyboard."
      );
      return;
    }
    setNote(null);
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
        setNote("Please allow microphone access in your browser settings, then try again.");
      } else if (e.error === "no-speech") {
        setNote("We didn't hear anything. Tap the mic and try again.");
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

  function stop() {
    rec.current?.stop();
  }

  if (supported === null) return null;

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        disabled={disabled}
        onClick={listening ? stop : start}
        aria-pressed={listening}
        aria-label={listening ? "Stop voice note" : "Start voice note"}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
          listening
            ? "animate-pulse bg-red-500 text-white"
            : "bg-accent-soft text-accent-dark hover:bg-accent/20"
        }`}
      >
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z" />
        </svg>
        {listening ? "Listening… tap to stop" : "Voice note"}
      </button>
      {note ? <p className="mt-2 max-w-xs text-right text-xs text-ink/60">{note}</p> : null}
    </div>
  );
}
