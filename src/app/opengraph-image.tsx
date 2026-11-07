import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { MARK_BUBBLE, MARK_SPARKLE, MARK_SPARKLE_SMALL } from "@/components/Logo";

// The preview image shown when a Nicelyy link is shared (WhatsApp, iMessage,
// Instagram, LinkedIn, X...).
export const alt = "Nicelyy: say difficult things the easy way";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fontDir = path.join(process.cwd(), "node_modules/@fontsource/inter/files");

export default async function OpengraphImage() {
  const [bold, medium] = await Promise.all([
    readFile(path.join(fontDir, "inter-latin-800-normal.woff")),
    readFile(path.join(fontDir, "inter-latin-500-normal.woff")),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0E0B1F",
          backgroundImage:
            "radial-gradient(circle at 10% 10%, rgba(124,58,237,.55), transparent 45%), radial-gradient(circle at 95% 20%, rgba(219,39,119,.45), transparent 40%), radial-gradient(circle at 50% 110%, rgba(245,158,11,.40), transparent 45%)",
          color: "white",
          fontFamily: "Inter",
          fontWeight: 500,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="88" height="88" viewBox="0 0 64 64">
            <defs>
              <linearGradient id="g" x1="4" y1="6" x2="60" y2="58" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7C3AED" />
                <stop offset="0.55" stopColor="#DB2777" />
                <stop offset="1" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <path d={MARK_BUBBLE} fill="url(#g)" />
            <path d={MARK_SPARKLE} fill="#fff" />
            <path d={MARK_SPARKLE_SMALL} fill="#fff" fillOpacity={0.85} />
          </svg>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 800, letterSpacing: "-0.03em" }}>
            nicely<span style={{ color: "#F9A8D4" }}>y</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
          Say it nicelyy.
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 34, color: "rgba(255,255,255,.75)" }}>
          Type it, paste it or say it. Get a calm, clear message, ready to send.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Inter", data: bold, weight: 800, style: "normal" },
        { name: "Inter", data: medium, weight: 500, style: "normal" },
      ],
    }
  );
}
