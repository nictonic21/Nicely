"use client";

import { openCookieSettings } from "@/lib/consent";
import { META_PIXEL_ID } from "@/components/MetaPixel";

export default function CookieSettingsLink() {
  if (!META_PIXEL_ID) return null;
  return (
    <button type="button" onClick={openCookieSettings} className="transition hover:text-white">
      Cookie settings
    </button>
  );
}
