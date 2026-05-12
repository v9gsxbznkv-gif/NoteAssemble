import { describe, expect, it, vi } from "vitest";
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
  getOpenActionItems: vi.fn().mockResolvedValue([
    {
      id: 1,
      sessionId: 1,
      sessionName: "Test Session",
      sessionTags: JSON.stringify(["Church"]),
      task: "Follow up on budget",
      priority: "high",
      context: "Urgent",
      owner: "Chad",
      completed: false,
      createdAt: new Date(),
    },
    {
      id: 2,
      sessionId: 1,
      sessionName: "Test Session",
      sessionTags: null,
      task: "Schedule review",
      priority: "medium",
      context: "Next week",
      owner: null,
      completed: false,
      createdAt: new Date(),
    },
  ]),
  upsertActionItemsForSession: vi.fn().mockResolvedValue(undefined),
  toggleActionItem: vi.fn().mockResolvedValue(undefined),
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
            actionItems: [
              { task: "Follow up", priority: "high", context: "Urgent", owner: "Chad" },
            ],
            insights: [{ insight: "Numbers may be off", source: "notes" }],
            watchItems: [{ item: "Budget accuracy", type: "risk" }],
          }),
        },
      },
    ],
  }),
}));

// ─── Mock Fireflies GraphQL API module ────────────────────────────────────────
vi.mock("./fireflies", () => ({
  getRecentMeetings: vi.fn().mockResolvedValue([
    { id: "abc123", title: "Staff Meeting", date: 1746093600000, duration: 3600 },
    { id: "def456", title: "Deal Call", date: 1746352800000, duration: 1800 },
  ]),
  searchMeetings: vi.fn().mockImplementation(async (keyword: string) => {
    if (keyword.toLowerCase().includes("staff")) {
      return [{ id: "abc123", title: "Staff Meeting", date: 1746093600000, duration: 3600 }];
    }
    return [{ id: "abc123", title: "Staff Meeting", date: 1746093600000, duration: 3600 }];
  }),
  getTranscriptText: vi.fn().mockResolvedValue({
    title: "Staff Meeting",
    text: "Speaker 1: We approved the budget.\nSpeaker 2: Agreed.",
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

  it("sessions include parsedTags array", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.sessions.list({});
    expect(Array.isArray(result[0]?.parsedTags)).toBe(true);
    expect(result[0]?.parsedTags).toContain("Church");
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

// ─── Action Items ────────────────────────────────────────────────────────────
describe("actionItems.list", () => {
  it("returns action items for the authenticated user", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.actionItems.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty("task");
    expect(result[0]).toHaveProperty("priority");
    expect(result[0]).toHaveProperty("sessionName");
  });

  it("action items include parsedTags from session", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.actionItems.list();
    expect(result[0]).toHaveProperty("parsedTags");
    expect(Array.isArray(result[0]?.parsedTags)).toBe(true);
  });
});

describe("actionItems.toggle", () => {
  it("marks an action item as completed", async () => {
    const { toggleActionItem } = await import("./db");
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.actionItems.toggle({ id: 1, completed: true });
    expect(result.success).toBe(true);
    expect(vi.mocked(toggleActionItem)).toHaveBeenCalledWith(1, 1, true);
  });

  it("marks an action item as uncompleted (toggle back)", async () => {
    const { toggleActionItem } = await import("./db");
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.actionItems.toggle({ id: 2, completed: false });
    expect(result.success).toBe(true);
    expect(vi.mocked(toggleActionItem)).toHaveBeenCalledWith(2, 1, false);
  });
});

// ─── Fireflies GraphQL API ─────────────────────────────────────────────────────
describe("fireflies.recent", () => {
  it("returns recent meetings list with id, title, date", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.recent();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("title");
    expect(result[0]).toHaveProperty("date");
    expect(result[0]?.id).toBe("abc123");
    expect(result[0]?.title).toBe("Staff Meeting");
  });

  it("returns two meetings from the mock", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.recent();
    expect(result.length).toBe(2);
    expect(result[1]?.title).toBe("Deal Call");
  });
});

describe("fireflies.search", () => {
  it("returns meetings matching a keyword", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.search({ keyword: "staff" });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.title).toBe("Staff Meeting");
  });

  it("returns results for any keyword (mock returns staff meeting)", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.search({ keyword: "payroll" });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("fireflies.getTranscript", () => {
  it("returns transcript text for a meeting id", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.getTranscript({ transcriptId: "abc123" });
    expect(typeof result.transcript).toBe("string");
    expect(result.transcript.length).toBeGreaterThan(0);
  });

  it("returns all speaker lines without truncation", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.getTranscript({ transcriptId: "abc123" });
    expect(result.transcript).toContain("Speaker 1: We approved the budget.");
    expect(result.transcript).toContain("Speaker 2: Agreed.");
  });

  it("returns the meeting title alongside the transcript", async () => {
    const caller = appRouter.createCaller(createCtx());
    const result = await caller.fireflies.getTranscript({ transcriptId: "abc123" });
    expect(result.title).toBe("Staff Meeting");
  });
});

// ─── Fireflies GraphQL API module unit tests ──────────────────────────────────
describe("fireflies GraphQL API module", () => {
  it("getRecentMeetings mock returns typed FirefliesMeeting array", async () => {
    const { getRecentMeetings } = await import("./fireflies");
    const meetings = await getRecentMeetings(10);
    expect(Array.isArray(meetings)).toBe(true);
    expect(meetings[0]).toHaveProperty("id");
    expect(meetings[0]).toHaveProperty("title");
    expect(meetings[0]).toHaveProperty("date");
    expect(meetings[0]).toHaveProperty("duration");
  });

  it("getTranscriptText mock returns title and text", async () => {
    const { getTranscriptText } = await import("./fireflies");
    const result = await getTranscriptText("abc123");
    expect(result.title).toBe("Staff Meeting");
    expect(result.text).toContain("Speaker 1:");
    expect(result.text).toContain("Speaker 2:");
  });
});

// ─── Transcript Truncation Regression ────────────────────────────────────────
describe("sessions.analyze — large transcript truncation", () => {
  it("accepts a transcript larger than the old TEXT limit (64KB) without throwing", async () => {
    const caller = appRouter.createCaller(createCtx());
    // Simulate a 24k-word transcript (~150k chars) — previously caused "Failed to save draft"
    const largeTranscript = "Speaker 1: This is a test sentence. ".repeat(5000); // ~180k chars
    const result = await caller.sessions.analyze({
      id: 1,
      transcript: largeTranscript,
      personalNotes: "Private notes here.",
    });
    expect(result.aiOutput).toBeDefined();
    expect(result.aiOutput.summary).toBe("Test summary.");
  });

  it("truncates transcript to 120k chars before sending to LLM", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const caller = appRouter.createCaller(createCtx());
    const largeTranscript = "A".repeat(150_000); // 150k chars — exceeds 120k limit
    await caller.sessions.analyze({
      id: 1,
      transcript: largeTranscript,
      personalNotes: "",
    });
    const callArg = vi.mocked(invokeLLM).mock.calls.at(-1)?.[0];
    const userContent = callArg?.messages?.find((m: { role: string }) => m.role === "user")?.content as string;
    expect(typeof userContent).toBe("string");
    // The truncated transcript should be at most 120k chars + the truncation notice
    expect(userContent.length).toBeLessThan(150_000);
    expect(userContent).toContain("[Transcript truncated to fit analysis window");
  });

  it("does not truncate transcripts under 120k chars", async () => {
    const { invokeLLM } = await import("./_core/llm");
    const caller = appRouter.createCaller(createCtx());
    const normalTranscript = "Speaker 1: Short meeting. Speaker 2: Agreed.";
    await caller.sessions.analyze({
      id: 1,
      transcript: normalTranscript,
      personalNotes: "",
    });
    const callArg = vi.mocked(invokeLLM).mock.calls.at(-1)?.[0];
    const userContent = callArg?.messages?.find((m: { role: string }) => m.role === "user")?.content as string;
    expect(userContent).toContain(normalTranscript);
    expect(userContent).not.toContain("[Transcript truncated");
  });
});
