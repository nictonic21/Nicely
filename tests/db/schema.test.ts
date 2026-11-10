import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "pg";

// Runs supabase/schema.sql on a real Postgres database and checks the limits
// behave. Needs DATABASE_URL (a throwaway database; it is wiped). Skipped
// otherwise. CI provides one automatically.
const url = process.env.DATABASE_URL;
const root = path.resolve(__dirname, "../..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8");

const U = "00000000-0000-0000-0000-000000000001";

describe.skipIf(!url)("database schema", () => {
  const db = new Client({ connectionString: url });
  const one = async <T = any>(sql: string, params: unknown[] = []) => (await db.query(sql, params)).rows[0] as T;
  const claim = (limit: number, burst: number, hash: string, since = "1970-01-01") =>
    one<{ r: any }>("select public.claim_rewrite($1, $2, $3, $4, 'kind', 'work', $5) as r", [U, since, limit, burst, hash]).then((x) => x.r);

  beforeAll(async () => {
    await db.connect();
    await db.query("drop schema if exists public cascade; create schema public; drop schema if exists auth cascade;");
    await db.query(read("tests/db/supabase-stub.sql"));
    await db.query(read("supabase/schema.sql"));
    await db.query(read("supabase/schema.sql")); // safe to run twice
    await db.query("insert into auth.users (id, email) values ($1, 'a@b.com')", [U]);
  });
  afterAll(async () => {
    await db.end();
  });

  it("creates a users row on sign-up", async () => {
    expect((await one("select count(*)::int n from public.users")).n).toBe(1);
  });

  it("enforces the plan limit and the burst limit", async () => {
    expect((await claim(3, 8, "h1")).used).toBe(1);
    expect((await claim(3, 8, "h2")).used).toBe(2);
    expect((await claim(3, 8, "h3")).used).toBe(3);
    expect(await claim(3, 8, "h4")).toMatchObject({ ok: false, reason: "limit" });
    expect(await claim(99, 3, "h5")).toMatchObject({ ok: false, reason: "slow_down" });
  });

  it("only counts messages inside the current month", async () => {
    expect((await claim(3, 99, "h6", "2999-01-01")).ok).toBe(true);
  });

  it("allows 3 free tweaks per message, only for the same words, within the monthly cap", async () => {
    const id = (await one("select id from public.rewrites where input_hash = 'h1'")).id;
    const tweak = (hash: string, cap = 200) =>
      one("select public.use_refine($1, $2, $3, 3, '1970-01-01', $4) as r", [U, id, hash, cap]).then((x) => x.r);
    expect(await tweak("WRONG")).toBe("used");
    expect([await tweak("h1"), await tweak("h1"), await tweak("h1"), await tweak("h1")]).toEqual(["ok", "ok", "ok", "used"]);
    await db.query("select public.give_back_refine($1)", [id]);
    expect((await one("select refines from public.rewrites where id = $1", [id])).refines).toBe(2);
    expect(await tweak("h1", 2)).toBe("month_cap");
  });

  it("gives one free try per visitor and respects the daily cap", async () => {
    const t = (ip: string) => one("select public.claim_trial($1, 1, 2) as r", [ip]).then((x) => x.r);
    expect((await t("ip1")).ok).toBe(true);
    expect(await t("ip1")).toMatchObject({ ok: false, reason: "used" });
    expect((await t("ip2")).ok).toBe(true);
    expect(await t("ip3")).toMatchObject({ ok: false, reason: "busy" });
  });

  it("rate-limits the contact form", async () => {
    const hit = () => one("select public.hit_rate_limit('k', 3600, 2) as r").then((x) => x.r);
    expect([await hit(), await hit(), await hit()]).toEqual([true, true, false]);
  });

  it("only stores allowed feedback reasons", async () => {
    await db.query("update public.rewrites set rating = -1, rating_reason = 'too_long' where input_hash = 'h1'");
    await expect(db.query("update public.rewrites set rating_reason = 'rude words' where input_hash = 'h1'")).rejects.toThrow();
    await expect(db.query("update public.rewrites set rating = 5 where input_hash = 'h1'")).rejects.toThrow();
  });

  it("produces dashboard numbers", async () => {
    const s = (await one("select public.admin_stats() as s")).s;
    expect(s.users_total).toBe(1);
    expect(s.daily).toHaveLength(14);
    expect(s.messages_30d).toBeGreaterThanOrEqual(4);
    expect(s.reasons).toEqual({ too_long: 1 });
  });

  it("blocks visitors from calling the server-only functions", async () => {
    for (const role of ["anon", "authenticated"]) {
      await db.query(`set role ${role}`);
      for (const sql of [
        "select public.claim_trial('x', 1, 1)",
        "select public.admin_stats()",
        `select public.claim_rewrite('${U}', now(), 1, 1, 'kind', 'work', 'h')`,
      ]) {
        await expect(db.query(sql)).rejects.toThrow(/permission denied/);
      }
      await db.query("reset role");
    }
  });
});
