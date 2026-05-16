import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  createSession: vi.fn().mockResolvedValue(1),
  deleteSession: vi.fn().mockResolvedValue(undefined),
  getOpenActionItems: vi.fn().mockResolvedValue([]),
  getSessionById: vi.fn(),
  getSessionByShareToken: vi.fn(),
  getSessionsByUser: vi.fn().mockResolvedValue([]),
  setActionItemDueDate: vi.fn().mockResolvedValue(undefined),
  toggleActionItem: vi.fn().mockResolvedValue(undefined),
  updateSession: vi.fn().mockResolvedValue(undefined),
  upsertActionItemsForSession: vi.fn().mockResolvedValue(undefined),
  getUserIntegrationKeys: vi.fn().mockResolvedValue({ firefliesApiKey: 'test-key', notionApiKey: null, otterApiKey: null }),
  setUserIntegrationKey: vi.fn().mockResolvedValue(undefined),
  clearUserIntegrationKey: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./fireflies", () => ({
  getRecentMeetings: vi.fn().mockResolvedValue([]),
  searchMeetings: vi.fn().mockResolvedValue([]),
  getTranscriptText: vi.fn().mockResolvedValue({ title: "Test", text: "transcript" }),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import * as db from "./db";
import { invokeLLM } from "./_core/llm";

// ─── Context factory ──────────────────────────────────────────────────────────
function makeCtx(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "test-user",
      email: "chad@example.com",
      name: "Chad",
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

// ─── Feature 2: Action Item Due Dates ─────────────────────────────────────────
describe("actionItems.setDueDate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls setActionItemDueDate with the correct args", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.actionItems.setDueDate({ id: 7, dueDate: 1_700_000_000_000 });
    expect(result).toEqual({ success: true });
    expect(db.setActionItemDueDate).toHaveBeenCalledWith(7, 42, 1_700_000_000_000);
  });

  it("accepts null to clear a due date", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.actionItems.setDueDate({ id: 7, dueDate: null });
    expect(result).toEqual({ success: true });
    expect(db.setActionItemDueDate).toHaveBeenCalledWith(7, 42, null);
  });
});

// ─── Feature 3: Session Sharing ───────────────────────────────────────────────
describe("sessions.generateShareLink", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a new token when none exists", async () => {
    const ctx = makeCtx();
    vi.mocked(db.getSessionById).mockResolvedValueOnce({
      id: 1, name: "Test", userId: 42, status: "analyzed",
      transcript: null, personalNotes: null, aiOutput: null,
      tags: null, shareToken: null, createdAt: new Date(), updatedAt: new Date(),
    } as Parameters<typeof db.updateSession>[2] & { id: number; name: string; userId: number; status: string; shareToken: null; createdAt: Date; updatedAt: Date });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sessions.generateShareLink({ id: 1 });
    expect(typeof result.token).toBe("string");
    expect(result.token.length).toBeGreaterThan(20);
    expect(db.updateSession).toHaveBeenCalledWith(1, 42, expect.objectContaining({ shareToken: result.token }));
  });

  it("reuses existing token if already set", async () => {
    const ctx = makeCtx();
    const existingToken = "abc123existingtoken";
    vi.mocked(db.getSessionById).mockResolvedValueOnce({
      id: 1, name: "Test", userId: 42, status: "analyzed",
      transcript: null, personalNotes: null, aiOutput: null,
      tags: null, shareToken: existingToken, createdAt: new Date(), updatedAt: new Date(),
    } as Parameters<typeof db.updateSession>[2] & { id: number; name: string; userId: number; status: string; shareToken: string; createdAt: Date; updatedAt: Date });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sessions.generateShareLink({ id: 1 });
    expect(result.token).toBe(existingToken);
    expect(db.updateSession).not.toHaveBeenCalled();
  });
});

describe("sessions.revokeShareLink", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sets shareToken to null", async () => {
    const ctx = makeCtx();
    vi.mocked(db.getSessionById).mockResolvedValueOnce({
      id: 1, name: "Test", userId: 42, status: "analyzed",
      transcript: null, personalNotes: null, aiOutput: null,
      tags: null, shareToken: "sometoken", createdAt: new Date(), updatedAt: new Date(),
    } as Parameters<typeof db.updateSession>[2] & { id: number; name: string; userId: number; status: string; shareToken: string; createdAt: Date; updatedAt: Date });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sessions.revokeShareLink({ id: 1 });
    expect(result).toEqual({ success: true });
    expect(db.updateSession).toHaveBeenCalledWith(1, 42, { shareToken: null });
  });
});

describe("sessions.getShared", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns session data for a valid token", async () => {
    const ctx = makeCtx();
    vi.mocked(db.getSessionByShareToken).mockResolvedValueOnce({
      id: 5, name: "Shared Session", userId: 42, status: "analyzed",
      transcript: null, personalNotes: null,
      aiOutput: JSON.stringify({ summary: "test", keyDecisions: [], actionItems: [], insights: [], watchItems: [] }),
      tags: '["Church"]', shareToken: "validtoken", createdAt: new Date(), updatedAt: new Date(),
    } as Parameters<typeof db.updateSession>[2] & { id: number; name: string; userId: number; status: string; shareToken: string; createdAt: Date; updatedAt: Date });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.sessions.getShared({ token: "validtoken" });
    expect(result.name).toBe("Shared Session");
    expect(result.parsedTags).toEqual(["Church"]);
  });

  it("throws NOT_FOUND for an invalid token", async () => {
    const ctx = makeCtx();
    vi.mocked(db.getSessionByShareToken).mockResolvedValueOnce(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.sessions.getShared({ token: "badtoken" })).rejects.toThrow("Shared session not found");
  });
});// ─── Integrations procedures ─────────────────────────────────────────────────
describe("integrations.getKeys", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns masked keys for connected services", async () => {
    const ctx = makeCtx();
    vi.mocked(db.getUserIntegrationKeys).mockResolvedValueOnce({
      firefliesApiKey: "ff-abc123xyz",
      notionApiKey: null,
      otterApiKey: null,
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.integrations.getKeys();
    expect(result.fireflies.connected).toBe(true);
    expect(result.fireflies.masked).toContain("3xyz"); // masked shows last 4 chars
    expect(result.notion.connected).toBe(false);
    expect(result.otter.connected).toBe(false);
  });

  it("returns all disconnected when no keys set", async () => {
    const ctx = makeCtx();
    vi.mocked(db.getUserIntegrationKeys).mockResolvedValueOnce({
      firefliesApiKey: null,
      notionApiKey: null,
      otterApiKey: null,
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.integrations.getKeys();
    expect(result.fireflies.connected).toBe(false);
    expect(result.notion.connected).toBe(false);
    expect(result.otter.connected).toBe(false);
  });
});

describe("integrations.setKey", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves a Fireflies key for the current user", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.integrations.setKey({ service: "fireflies", apiKey: "ff-newkey" });
    expect(result).toEqual({ success: true });
    expect(db.setUserIntegrationKey).toHaveBeenCalledWith(42, "firefliesApiKey", "ff-newkey");
  });
});

describe("integrations.clearKey", () => {
  beforeEach(() => vi.clearAllMocks());

  it("clears a Notion key for the current user", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.integrations.clearKey({ service: "notion" });
    expect(result).toEqual({ success: true });
    expect(db.clearUserIntegrationKey).toHaveBeenCalledWith(42, "notionApiKey");
  });
});

describe("fireflies.recent — per-user key", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws PRECONDITION_FAILED when user has no Fireflies key", async () => {
    const ctx = makeCtx();
    vi.mocked(db.getUserIntegrationKeys).mockResolvedValueOnce({
      firefliesApiKey: null,
      notionApiKey: null,
      otterApiKey: null,
    });
    const caller = appRouter.createCaller(ctx);
    await expect(caller.fireflies.recent()).rejects.toThrow();
  });

  it("succeeds when user has a Fireflies key", async () => {
    const ctx = makeCtx();
    vi.mocked(db.getUserIntegrationKeys).mockResolvedValueOnce({
      firefliesApiKey: "ff-userkey",
      notionApiKey: null,
      otterApiKey: null,
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.fireflies.recent();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Feature 4: OCR Extract ─────────────────────────────────────────────────────
describe("notes.extractFromImage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns extracted text from the LLM response", async () => {
    const ctx = makeCtx();
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: "Meeting notes: discuss budget\n- Item 1\n- Item 2" } }],
    } as ReturnType<typeof invokeLLM> extends Promise<infer T> ? T : never);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notes.extractFromImage({ imageUrl: "https://example.com/photo.jpg" });
    expect(result.text).toContain("Meeting notes");
    expect(invokeLLM).toHaveBeenCalledOnce();
  });

  it("throws UNPROCESSABLE_CONTENT when LLM returns empty text", async () => {
    const ctx = makeCtx();
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      choices: [{ message: { content: "   " } }],
    } as ReturnType<typeof invokeLLM> extends Promise<infer T> ? T : never);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notes.extractFromImage({ imageUrl: "https://example.com/blank.jpg" })).rejects.toThrow("No text could be extracted");
  });
});
