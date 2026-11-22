// Who can see the owner dashboard: the email addresses listed in ADMIN_EMAILS
// in Vercel. Nobody, until it's set. Forgiving about how it's typed: commas,
// semicolons or spaces between addresses, stray quote marks, capitals.
export function adminEmails(raw = process.env.ADMIN_EMAILS || ""): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.replace(/^["'<]+|["'>]+$/g, "").trim().toLowerCase())
    .filter((e) => e.includes("@"));
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return adminEmails().includes(email.trim().toLowerCase());
}
