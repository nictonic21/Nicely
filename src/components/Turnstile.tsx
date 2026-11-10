"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Cloudflare's "are you human" check. Renders nothing until
// NEXT_PUBLIC_TURNSTILE_SITE_KEY is set. Usually invisible: it only shows a
// tick box if Cloudflare isn't sure.

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

export interface TurnstileHandle {
  reset: () => void;
}

const Turnstile = forwardRef<TurnstileHandle, { onToken: (t: string | null) => void; className?: string }>(
  function Turnstile({ onToken, className }, ref) {
    const el = useRef<HTMLDivElement>(null);
    const id = useRef<string | undefined>(undefined);
    const cb = useRef(onToken);
    cb.current = onToken;

    useImperativeHandle(ref, () => ({
      reset() {
        window.turnstile?.reset(id.current);
        cb.current(null);
      },
    }));

    useEffect(() => {
      if (!TURNSTILE_SITE_KEY) return;
      const render = () => {
        if (window.turnstile && el.current && !id.current) {
          id.current = window.turnstile.render(el.current, {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (t: string) => cb.current(t),
            "expired-callback": () => cb.current(null),
            appearance: "interaction-only",
          });
        }
      };
      if (window.turnstile) return render();
      const existing = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
      if (existing) {
        existing.addEventListener("load", render);
        return () => existing.removeEventListener("load", render);
      }
      const s = document.createElement("script");
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.dataset.turnstile = "1";
      s.onload = render;
      document.head.appendChild(s);
    }, []);

    return <div ref={el} className={className} />;
  }
);

export default Turnstile;
