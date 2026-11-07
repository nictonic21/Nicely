// Small line icons used across the app. 24x24, drawn with the current text
// colour so they follow whatever they sit in.

type P = { className?: string };
const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const IconMic = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);
export const IconStop = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <rect x="6" y="6" width="12" height="12" rx="2.5" fill="currentColor" stroke="none" />
  </svg>
);
export const IconCopy = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <rect x="9" y="9" width="11" height="11" rx="2.5" />
    <path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15" />
  </svg>
);
export const IconCheck = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const IconRefresh = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M20 11a8 8 0 0 0-14.6-4.5M4 4v3.5h3.5M4 13a8 8 0 0 0 14.6 4.5M20 20v-3.5h-3.5" />
  </svg>
);
export const IconPlus = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconX = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconReply = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M10 8 5 12.5l5 4.5" />
    <path d="M5.5 12.5H14a5 5 0 0 1 5 5V19" />
  </svg>
);
export const IconSparkle = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className} fill="currentColor" stroke="none">
    <path d="M12 2.5c.7 4.9 2.6 6.8 7.5 7.5-4.9.7-6.8 2.6-7.5 7.5-.7-4.9-2.6-6.8-7.5-7.5 4.9-.7 6.8-2.6 7.5-7.5Z" />
    <path d="M19 15.5c.3 1.9 1 2.6 2.9 2.9-1.9.3-2.6 1-2.9 2.9-.3-1.9-1-2.6-2.9-2.9 1.9-.3 2.6-1 2.9-2.9Z" opacity=".7" />
  </svg>
);
export const IconBulb = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3Z" />
  </svg>
);
export const IconHeartHand = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </svg>
);
export const IconBriefcase = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="7" width="18" height="13" rx="2.5" />
    <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18" />
  </svg>
);
export const IconShield = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M12 3 5 6v5.5c0 4.4 3 7.8 7 9.5 4-1.7 7-5.1 7-9.5V6l-7-3Z" />
  </svg>
);
export const IconBolt = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />
  </svg>
);
export const IconAlign = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M5 7h14M5 12h10M5 17h7" />
  </svg>
);
export const IconChat = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M7 18.5 4 21V7.5A3.5 3.5 0 0 1 7.5 4h9A3.5 3.5 0 0 1 20 7.5v7.5a3.5 3.5 0 0 1-3.5 3.5H7Z" />
  </svg>
);
export const IconMail = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
export const IconArrowRight = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconInfo = ({ className = "h-4 w-4" }: P) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);
