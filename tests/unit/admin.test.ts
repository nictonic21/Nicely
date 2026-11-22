import { describe, expect, it } from "vitest";
import { adminEmails, isAdmin } from "@/lib/admin";

describe("owner access", () => {
  it("reads emails however they're typed", () => {
    expect(adminEmails(' "Owner@Example.com" ; second@example.com,third@example.com ')).toEqual([
      "owner@example.com",
      "second@example.com",
      "third@example.com",
    ]);
  });
  it("only lets listed people in", () => {
    process.env.ADMIN_EMAILS = "owner@example.com";
    expect(isAdmin("Owner@Example.com ")).toBe(true);
    expect(isAdmin("someone@example.com")).toBe(false);
    expect(isAdmin(null)).toBe(false);
    delete process.env.ADMIN_EMAILS;
    expect(isAdmin("owner@example.com")).toBe(false);
  });
});
