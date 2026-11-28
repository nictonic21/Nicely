import { describe, expect, it } from "vitest";
import { nextFromEmailLink, safeNext } from "@/lib/next-path";

const CHECKOUT = "/account?plan=starter&interval=year";
const callback = `https://www.nicelyy.co.uk/auth/callback?next=${encodeURIComponent(CHECKOUT)}`;
const base = "https://www.nicelyy.co.uk/auth/confirm?token_hash=abc&type=email";

describe("safeNext", () => {
  it("keeps same-site paths", () => {
    expect(safeNext(CHECKOUT)).toBe(CHECKOUT);
  });
  it("refuses other sites", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "", null, undefined]) {
      expect(safeNext(bad)).toBe("/app");
    }
  });
});

describe("nextFromEmailLink", () => {
  it("reads the plan when Supabase inserts redirect_to as-is", () => {
    expect(nextFromEmailLink(`${base}&redirect_to=${callback}`)).toBe(CHECKOUT);
  });
  it("reads the plan when Supabase percent-encodes redirect_to", () => {
    expect(nextFromEmailLink(`${base}&redirect_to=${encodeURIComponent(callback)}`)).toBe(CHECKOUT);
  });
  it("falls back to the app when redirect_to is just the site address", () => {
    expect(nextFromEmailLink(`${base}&redirect_to=https://www.nicelyy.co.uk`)).toBe("/app");
    expect(nextFromEmailLink(base)).toBe("/app");
  });
  it("still honours an explicit next (older emails, password reset)", () => {
    expect(nextFromEmailLink(`${base}&next=/reset/update`)).toBe("/reset/update");
  });
  it("never leaves the site", () => {
    const evil = `https://www.nicelyy.co.uk/auth/callback?next=${encodeURIComponent("//evil.com")}`;
    expect(nextFromEmailLink(`${base}&redirect_to=${evil}`)).toBe("/app");
    expect(nextFromEmailLink(`${base}&redirect_to=not a url`)).toBe("/app");
  });
});
