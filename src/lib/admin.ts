// Who can see the owner dashboard: the email addresses listed in ADMIN_EMAILS
// in Vercel (comma separated). Nobody, until it's set.
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}
