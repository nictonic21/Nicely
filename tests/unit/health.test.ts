import { describe, expect, it, beforeEach } from "vitest";
import { runHealthChecks } from "@/lib/health";

const stripeGroup = async () => (await runHealthChecks()).find((g) => g.title === "Payments (Stripe)")!.checks;

describe("setup check (no network needed)", () => {
  beforeEach(() => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  });

  it("explains a missing Stripe key", async () => {
    const [c] = await stripeGroup();
    expect(c).toMatchObject({ status: "problem" });
    expect(c.detail).toContain("isn't set");
  });

  it("spots a publishable key used by mistake, without showing it", async () => {
    process.env.STRIPE_SECRET_KEY = "pk_test_secretvalue123";
    const [c] = await stripeGroup();
    expect(c.detail).toContain("publishable key");
    expect(JSON.stringify(await runHealthChecks())).not.toContain("secretvalue123");
  });

  it("flags missing core settings in plain English", async () => {
    const core = (await runHealthChecks()).find((g) => g.title === "Core")!.checks;
    expect(core.find((c) => c.name === "AI key")).toMatchObject({ status: "problem" });
    expect(core.find((c) => c.name === "Database")).toMatchObject({ status: "problem" });
  });
});
