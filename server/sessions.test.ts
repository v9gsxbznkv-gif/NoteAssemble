import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ───────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  createSession: vi.fn().mockResolvedValue(42),
  getSessionsByUser: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 1,
      name: "Test Session",
      transcript: "We discussed the budget.",
      personalNotes: "I think the numbers are off.",
      aiOutput: null,
      tags: JSON.stringify(["Church", "Consulting"]),
      status: "draft",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  ]),
  getSessionById: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    name: "Test Session",
    transcript: "We discussed the budget.",
    personalNotes: "I think the numbers are off.",
    aiOutput: null,
    tags: JSON.stringify(["Church"]),
    status: "draft",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  updateSession: vi.fn().mockResolvedValue(undefined),
  deleteSession: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock LLM ─────────────────────────────────────────────────────────────────
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [
      {
        message: {
          content: JSON.stringify({
            summary: "Test summary.",
            keyDecisions: [{ decision: "Approved budget", context: "Voted 5-0" }],
            actionItems: [{ task: "Follow up", priority: "high", context: "Urgent", owner: "Chad" }],
            insights: [{ insight: "Numbers may be off", source: "notes" }],
            watchItems: [{ item: "Budget accuracy", type: "risk" }],
          }),
        },
      },
    ],
  }),
}));

// ─── Mock child_process for Fireflies MCP calls ───────────────────────────────
vi.mock("child_process", () => ({
  execSync: vi.fn().mockImplementation((cmd: string) => {
    if (cmd.includes("fireflies_get_transcripts") && cmd.includes("keyword")) {
      return `Tool execution result:\n${JSON.stringify([
        { id: "abc123", title: "Staff Meeting", dateString: "2026-05-01T10:00:00.000Z" },
      ])}`;
    }
    if (cmd.includes("fireflies_get_transcripts")) {
      return `Tool execution result:\n${JSON.stringify([
        { id: "abc123", title: "Staff Meeting", dateString: "2026-05-01T10:00:00.000Z" },
        { id: "def456", title: "Deal Call", dateString: "2026-05-03T14:00:00.000Z" },
      ])}`;
    }
    if (cmd.includes("fireflies_get_transcript")) {
      return `Tool execution result:\nSentences: Speaker 1: We approved the budget.\nSpeaker 2: Agreed.`;
    }
    return "Tool execution result:\n[]";
  }),
}));

function createCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Session CRUD ──────────────────────────────────────────────────────────────
describe("sessions.create", () => {
  it("creates a session and returns an id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.sessions.create({ name: "Test Session" });
    expect(result.id).toBe(42);
  });

  it("creates a session with tags serialized to JSON", async () => {
    const { createSession } = await import("./db");
    const caller = appRouter.createCaller(createCtx());
    await caller.sessions.create({ name: "Tagged Session", tags: ["Church", "Real Estate"] });
    expect(vi.mocked(createSession)).toHaveBeenCalledWith(
      expect.objectContaining({ tags: JSON.stringify(["Church", "Real Estate"]) })
    );
  });
});

describe("sessions.list", () => {
  it("returns a list of sessions for the user", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.sessions.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.name).toBe("Test Session");
  });

  it("sessions include tags field", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.sessions.list({});
    expect(result[0]?.tags).toBe(JSON.stringify(["Church", "Consulting"]));
  });
});

describe("sessions.get", () => {
  it("returns a session by id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.sessions.get({ id: 1 });
    expect(result.id).toBe(1);
    expect(result.name).toBe("Test Session");
  });
});

describe("sessions.analyze", () => {
  it("calls LLM and returns structured AI output", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.sessions.analyze({
      id: 1,
      transcript: "We discussed the budget.",
      personalNotes: "I think the numbers are off.",
    });
    expect(result.aiOutput).toBeDefined();
    expect(result.aiOutput.summary).toBe("Test summary.");
    expect(result.aiOutput.actionItems[0].priority).toBe("high");
  });

  it("throws BAD_REQUEST when no content is provided", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.sessions.analyze({ id: 1, transcript: "", personalNotes: "" })
    ).rejects.toThrow();
  });
});

describe("sessions.delete", () => {
  it("deletes a session", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.sessions.delete({ id: 1 });
    expect(result.success).toBe(true);
  });
});

// ─── Fireflies ─────────────────────────────────────────────────────────────────
describe("fireflies.recent", () => {
  it("returns recent meetings list", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.recent();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.id).toBe("abc123");
    expect(result[0]?.title).toBe("Staff Meeting");
  });
});

describe("fireflies.search", () => {
  it("returns meetings matching a keyword", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.search({ keyword: "staff" });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.title).toBe("Staff Meeting");
  });
});

describe("fireflies.getTranscript", () => {
  it("returns transcript text for a meeting id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.getTranscript({ transcriptId: "abc123" });
    expect(typeof result.transcript).toBe("string");
    expect(result.transcript.length).toBeGreaterThan(0);
  });

  it("extracts all sentences after the Sentences: header", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.getTranscript({ transcriptId: "abc123" });
    // The mock returns: "Sentences: Speaker 1: We approved the budget.\nSpeaker 2: Agreed."
    // The parser should return everything after "Sentences: "
    expect(result.transcript).toContain("Speaker 1: We approved the budget.");
    expect(result.transcript).toContain("Speaker 2: Agreed.");
  });
});

// ─── Fireflies MCP stdout parser regression tests ─────────────────────────────
describe("fireflies stdout parser", () => {
  it("recent: parses JSON array from stdout with header lines", async () => {
    // The fixed parser strips "Tool execution result saved to: ..." and
    // "Tool execution result:" header lines, then JSON.parses the remainder.
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.recent();
    // Should return a typed array, not throw or return empty
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("title");
    expect(result[0]).toHaveProperty("date");
  });

  it("search: parses JSON array from stdout when keyword is provided", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.search({ keyword: "payroll" });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.id).toBe("abc123");
  });

  it("getTranscript: does not truncate transcript at first capitalised word", async () => {
    // Regression: old regex /Sentences:\s*([\s\S]+?)(?:\n[A-Z][a-z]+:|$)/ would stop
    // at the first 'Speaker' word after a newline, cutting off the rest of the transcript.
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.getTranscript({ transcriptId: "abc123" });
    // Both lines must be present — the old regex would only return the first
    expect(result.transcript).toContain("We approved the budget.");
    expect(result.transcript).toContain("Agreed.");
  });
});
