import { createAdminClient } from "@/lib/supabase/admin";
import { sign } from "@/lib/secret";
import type { Plan } from "@/lib/plans";

// Friendly emails, sent through Resend (resend.com). They switch on by
// themselves once RESEND_API_KEY and EMAIL_FROM are set in Vercel; until
// then nothing is sent and nothing breaks.
//
// - Welcome: once, when someone first opens the app.
// - "1 free message left": once, to free users.
// - "Nearly out this month": once per month, to Starter and Plus users.
// Every reminder email has a one-click unsubscribe link.

const BASE = () => process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

function configured() {
  return !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

async function send(to: string, subject: string, html: string, text: string, unsubscribe?: string) {
  if (!configured()) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text,
        ...(unsubscribe
          ? {
              headers: {
                "List-Unsubscribe": `<${unsubscribe}>`,
                "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
              },
            }
          : {}),
      }),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function unsubscribeUrl(userId: string): string | undefined {
  try {
    return `${BASE()}/api/emails/unsubscribe?u=${userId}&s=${sign(`unsub:${userId}`)}`;
  } catch {
    return undefined; // No secret set: fall back to the account page link.
  }
}

function layout(heading: string, body: string, cta: { label: string; url: string }, unsub?: string) {
  const footer = unsub
    ? `<p style="margin:24px 0 0;font-size:12px;color:#8b8799">Don't want these reminders? <a href="${unsub}" style="color:#8b8799">Unsubscribe</a>.</p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#FBF9F6;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#15122B">
<div style="max-width:520px;margin:0 auto;padding:32px 20px">
<p style="margin:0 0 24px;font-size:22px;font-weight:800;letter-spacing:-0.5px">nicely<span style="color:#DB2777">y</span></p>
<div style="background:#fff;border-radius:20px;padding:28px;border:1px solid #eee">
<h1 style="margin:0 0 12px;font-size:22px">${heading}</h1>
${body}
<p style="margin:24px 0 0"><a href="${cta.url}" style="display:inline-block;background:linear-gradient(120deg,#7C3AED,#DB2777 55%,#F59E0B);background-color:#7C3AED;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">${cta.label}</a></p>
</div>${footer}
<p style="margin:16px 0 0;font-size:12px;color:#8b8799">Nicelyy · Say it nicelyy.</p>
</div></body></html>`;
}

const p = (t: string) => `<p style="margin:0 0 12px;font-size:16px;line-height:1.55;color:#4a4660">${t}</p>`;

// Claims a "sent" flag atomically, so each email goes once even if two
// requests race. Returns the email address to send to, or null.
async function claim(userId: string, column: string, value: string, extra?: (q: any) => any) {
  const admin = createAdminClient();
  let q = admin.from("users").update({ [column]: value }).eq("id", userId);
  q = extra ? extra(q) : q.is(column, null);
  const { data } = await q.select("email, email_opt_out").maybeSingle();
  return data?.email ? (data as { email: string; email_opt_out: boolean }) : null;
}

export async function maybeSendWelcome(userId: string) {
  if (!configured()) return;
  const row = await claim(userId, "welcome_sent_at", new Date().toISOString());
  if (!row) return;
  const url = `${BASE()}/app`;
  await send(
    row.email,
    "Welcome to Nicelyy",
    layout(
      "Welcome to Nicelyy",
      p("Next time a message is hard to write, just get it off your chest. Type it, paste it or say it out loud, pick a tone, and we'll turn it into something clear and calm that's ready to send.") +
        p("Tip: add the message you're replying to, and the rewrite will answer it properly."),
      { label: "Write a message", url }
    ),
    `Welcome to Nicelyy. Type it, paste it or say it out loud, pick a tone, and we'll make it clear and calm. ${url}`
  );
}

export async function maybeSendNudge(userId: string, plan: Plan, used: number, since: Date) {
  if (!configured()) return;
  const left = plan.limit - used;
  const unsub = unsubscribeUrl(userId);
  const plans = `${BASE()}/account`;

  if (plan.tier === "free" && left === 1) {
    const row = await claim(userId, "free_nudge_sent_at", new Date().toISOString(), (q) =>
      q.is("free_nudge_sent_at", null).eq("email_opt_out", false)
    );
    if (!row) return;
    await send(
      row.email,
      "You've 1 free message left",
      layout(
        "You've 1 free message left",
        p("Glad Nicelyy's been useful. You've one free message left.") +
          p("Plans start at £7 a month for 10 messages, and you can cancel any time."),
        { label: "See plans", url: plans },
        unsub
      ),
      `You've 1 free Nicelyy message left. Plans start at £7 a month: ${plans}`,
      unsub
    );
    return;
  }

  if ((plan.tier === "starter" || plan.tier === "plus") && left === 2) {
    const month = since.toISOString();
    const row = await claim(userId, "limit_nudge_for", month, (q) =>
      q.or(`limit_nudge_for.is.null,limit_nudge_for.neq."${month}"`).eq("email_opt_out", false)
    );
    if (!row) return;
    await send(
      row.email,
      "2 messages left this month",
      layout(
        "2 messages left this month",
        p(`You've used ${used} of your ${plan.limit} ${plan.name} messages this month.`) +
          p("Need more? Move up a plan and keep going straight away. Or wait, and your messages top up when your plan renews."),
        { label: "See plans", url: plans },
        unsub
      ),
      `You've 2 Nicelyy messages left this month. See plans: ${plans}`,
      unsub
    );
  }
}
