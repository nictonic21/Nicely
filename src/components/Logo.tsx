import { useId } from "react";

// Nicelyy logo: a speech bubble (a message) with a sparkle (made nicer),
// in the brand gradient, plus the "nicelyy" wordmark with a gradient final y.
// The same mark is in public/brand/ and src/app/icon.svg. Keep them in step.

export const MARK_BUBBLE =
  "M20 6H44A16 16 0 0 1 60 22V34A16 16 0 0 1 44 50H29L17.2 58.6C15.9 59.5 14.2 58.3 14.6 56.8L16.4 49.6A16 16 0 0 1 4 34V22A16 16 0 0 1 20 6Z";
export const MARK_SPARKLE =
  "M32 14.5C33.3 23.4 35.6 25.7 44.5 27C35.6 28.3 33.3 30.6 32 39.5C30.7 30.6 28.4 28.3 19.5 27C28.4 25.7 30.7 23.4 32 14.5Z";
export const MARK_SPARKLE_SMALL =
  "M45.5 11C46 13.8 46.7 14.5 49.5 15C46.7 15.5 46 16.2 45.5 19C45 16.2 44.3 15.5 41.5 15C44.3 14.5 45 13.8 45.5 11Z";

export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={className}
    >
      <defs>
        <linearGradient id={`g${id}`} x1="4" y1="6" x2="60" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" />
          <stop offset="0.55" stopColor="#DB2777" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <path d={MARK_BUBBLE} fill={`url(#g${id})`} />
      <path d={MARK_SPARKLE} fill="#fff" />
      <path d={MARK_SPARKLE_SMALL} fill="#fff" fillOpacity=".85" />
    </svg>
  );
}

export default function Logo({ light = false, size = 30 }: { light?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span
        className={`text-[1.4rem] font-extrabold leading-none tracking-[-0.03em] ${light ? "text-white" : "text-ink"}`}
      >
        nicely<span className={light ? "bg-gradient-to-r from-pink-400 to-amber-300 bg-clip-text text-transparent" : "text-gradient"}>y</span>
      </span>
    </span>
  );
}
