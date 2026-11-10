import { beforeEach, describe, expect, it, vi } from "vitest";

// A pretend AI, so tests are free and predictable.
const create = vi.fn();
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    beta = { messages: { create } };
  },
}));

process.env.ANTHROPIC_API_KEY = "test";
const { rewriteMessage, RewriteDeclined, inputHash, MODEL } = await import("@/lib/rewrite");

const reply = (json: unknown, stop_reason = "end_turn") => ({
  stop_reason,
  content: [{ type: "text", text: typeof json === "string" ? json : JSON.stringify(json) }],
});
const base = { text: "you always do this", received: "", tone: "firm", recipient: "partner", format: "text" } as const;

describe("rewriteMessage", () => {
  beforeEach(() => create.mockReset());

  it("returns up to three tidy versions", async () => {
    create.mockResolvedValue(
      reply({
        versions: [
          { label: " Balanced ", message: " One. " },
          { label: "", message: "Two." },
          { label: "Warmer", message: "Three." },
          { label: "Extra", message: "Four." },
        ],
        subject: "Ignored for texts",
        tip: " Calm and clear. ",
        safety: "none",
      })
    );
    const r = await rewriteMessage({ ...base });
    expect(r.versions).toEqual([
      { label: "Balanced", message: "One." },
      { label: "Option 2", message: "Two." },
      { label: "Warmer", message: "Three." },
    ]);
    expect(r.subject).toBe("");
    expect(r.tip).toBe("Calm and clear.");
  });

  it("keeps the subject line for emails", async () => {
    create.mockResolvedValue(reply({ versions: [{ label: "A", message: "Hi," }], subject: "Friday", tip: "", safety: "none" }));
    expect((await rewriteMessage({ ...base, format: "email" })).subject).toBe("Friday");
  });

  it("passes on a crisis flag", async () => {
    create.mockResolvedValue(reply({ versions: [{ label: "A", message: "x" }], subject: "", tip: "", safety: "crisis" }));
    expect((await rewriteMessage({ ...base })).safety).toBe("crisis");
  });

  it("treats a refusal as declined, and a cut-off or empty reply as an error", async () => {
    create.mockResolvedValue(reply("", "refusal"));
    await expect(rewriteMessage({ ...base })).rejects.toBeInstanceOf(RewriteDeclined);
    create.mockResolvedValue(reply("{", "max_tokens"));
    await expect(rewriteMessage({ ...base })).rejects.toThrow();
    create.mockResolvedValue(reply({ versions: [], subject: "", tip: "", safety: "none" }));
    await expect(rewriteMessage({ ...base })).rejects.toThrow();
  });

  it("sends the right request, with the message they're replying to and any tweak", async () => {
    create.mockResolvedValue(reply({ versions: [{ label: "A", message: "x" }], subject: "", tip: "", safety: "none" }));
    await rewriteMessage({ ...base, received: "why are you late", current: "Old version", tweak: "shorter" });
    const req = create.mock.calls[0][0];
    expect(req.model).toBe(MODEL);
    expect(req.fallbacks).toBe("default");
    expect(req.output_config.format.type).toBe("json_schema");
    const msg = req.messages[0].content as string;
    expect(msg).toContain("<received_message>\nwhy are you late");
    expect(msg).toContain("<what_i_want_to_say>\nyou always do this");
    expect(msg).toContain("<current_message>\nOld version");
    expect(msg).toContain("Make it shorter.");
  });
});

describe("inputHash", () => {
  it("is stable, one-way and changes when the words change", async () => {
    const a = await inputHash(base);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await inputHash({ ...base, text: " you always do this " })).toBe(a);
    expect(await inputHash({ ...base, text: "something else" })).not.toBe(a);
    expect(a).not.toContain("always");
  });
});
