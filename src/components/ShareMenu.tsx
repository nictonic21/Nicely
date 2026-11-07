"use client";

import { useEffect, useState } from "react";
import { IconMail, IconShare, IconSms, IconChat } from "@/components/Icons";
import { track } from "@/lib/analytics";

// Send the message straight from Nicelyy: WhatsApp, Messages, email, or the
// phone's own share sheet (which lists every app they have).
export default function ShareMenu({ message, subject }: { message: string; subject: string }) {
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const enc = encodeURIComponent;
  const body = message;
  const links = [
    { label: "WhatsApp", href: `https://wa.me/?text=${enc(body)}`, Icon: IconChat, id: "whatsapp" },
    { label: "Messages", href: `sms:?&body=${enc(body)}`, Icon: IconSms, id: "sms" },
    {
      label: "Email",
      href: `mailto:?${subject ? `subject=${enc(subject)}&` : ""}body=${enc(body)}`,
      Icon: IconMail,
      id: "email",
    },
  ];

  async function nativeShare() {
    try {
      await navigator.share({ text: subject ? `${subject}\n\n${message}` : message });
      track("share", { via: "native" });
    } catch {
      // They closed the share sheet: nothing to do.
    }
  }

  const chip =
    "inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold text-ink/75 transition hover:border-accent/40 hover:text-ink";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold uppercase tracking-wider text-ink/40">Send via</span>
      {links.map(({ label, href, Icon, id }) => (
        <a
          key={id}
          href={href}
          target={id === "whatsapp" ? "_blank" : undefined}
          rel="noopener noreferrer"
          onClick={() => track("share", { via: id })}
          className={chip}
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </a>
      ))}
      {canShare ? (
        <button type="button" onClick={nativeShare} className={chip}>
          <IconShare className="h-3.5 w-3.5" /> More
        </button>
      ) : null}
    </div>
  );
}
