import { describe, expect, it } from "vitest";
import { parseRewriteBody } from "@/lib/input";
import { MAX_CHARS } from "@/lib/options";

const ok = { text: "hello", tone: "kind", recipient: "work", format: "text" };

describe("parseRewriteBody", () => {
  it("accepts a valid request", () => {
    expect(parseRewriteBody(ok)).toEqual({ ...ok, received: "" });
  });
  it("needs some text", () => {
    expect(parseRewriteBody({ ...ok, text: "   " })).toHaveProperty("error");
  });
  it("rejects text that's too long", () => {
    expect(parseRewriteBody({ ...ok, text: "x".repeat(MAX_CHARS + 1) })).toHaveProperty("error");
    expect(parseRewriteBody({ ...ok, received: "x".repeat(MAX_CHARS + 1) })).toHaveProperty("error");
  });
  it("rejects unknown tones, recipients and formats", () => {
    expect(parseRewriteBody({ ...ok, tone: "rude" })).toHaveProperty("error");
    expect(parseRewriteBody({ ...ok, recipient: "boss" })).toHaveProperty("error");
    expect(parseRewriteBody({ ...ok, format: "fax" })).toHaveProperty("error");
  });
});
