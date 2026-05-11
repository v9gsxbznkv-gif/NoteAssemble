import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock DB helpers
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
    status: "draft",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  }),
  updateSession: vi.fn().mockResolvedValue(undefined),
  deleteSession: vi.fn().mockResolvedValue(undefined),
}));

// Mock LLM
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

describe("sessions.create", () => {
  it("creates a session and returns an id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.sessions.create({ name: "Test Session" });
    expect(result.id).toBe(42);
  });
});

describe("sessions.list", () => {
  it("returns a list of sessions for the user", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.sessions.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.name).toBe("Test Session");
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
