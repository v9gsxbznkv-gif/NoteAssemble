import { describe, expect, it } from "vitest";

describe("OpenAI API Key", () => {
  it("should have OPENAI_API_KEY set in environment", () => {
    const key = process.env.OPENAI_API_KEY;
    expect(key).toBeDefined();
    expect(key?.length).toBeGreaterThan(10);
    expect(key?.startsWith("sk-")).toBe(true);
  });
});
