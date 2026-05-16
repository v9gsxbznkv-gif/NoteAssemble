import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { extractFileHandler } from "./fileExtract";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRes() {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

function makeReq(file?: Express.Multer.File): Partial<Request> {
  return { file } as Partial<Request>;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("extractFileHandler", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when no file is uploaded", async () => {
    const req = makeReq(undefined);
    const res = makeRes();
    await extractFileHandler(req as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "No file uploaded" }));
  });

  it("extracts plain text from a TXT file", async () => {
    const content = "Hello, this is a plain text meeting note.";
    const file: Express.Multer.File = {
      buffer: Buffer.from(content, "utf-8"),
      originalname: "notes.txt",
      fieldname: "file",
      encoding: "7bit",
      mimetype: "text/plain",
      size: content.length,
      destination: "",
      filename: "notes.txt",
      path: "",
      stream: null as unknown as NodeJS.ReadableStream,
    };
    const req = makeReq(file);
    const res = makeRes();
    await extractFileHandler(req as Request, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        text: content,
        filename: "notes.txt",
        chars: content.length,
      })
    );
  });

  it("extracts plain text from a MD file", async () => {
    const content = "# Meeting Notes\n\n- Action item 1\n- Action item 2";
    const file: Express.Multer.File = {
      buffer: Buffer.from(content, "utf-8"),
      originalname: "notes.md",
      fieldname: "file",
      encoding: "7bit",
      mimetype: "text/markdown",
      size: content.length,
      destination: "",
      filename: "notes.md",
      path: "",
      stream: null as unknown as NodeJS.ReadableStream,
    };
    const req = makeReq(file);
    const res = makeRes();
    await extractFileHandler(req as Request, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        text: content,
        filename: "notes.md",
      })
    );
  });

  it("returns 422 when extracted text is too short", async () => {
    const file: Express.Multer.File = {
      buffer: Buffer.from("Hi", "utf-8"),
      originalname: "empty.txt",
      fieldname: "file",
      encoding: "7bit",
      mimetype: "text/plain",
      size: 2,
      destination: "",
      filename: "empty.txt",
      path: "",
      stream: null as unknown as NodeJS.ReadableStream,
    };
    const req = makeReq(file);
    const res = makeRes();
    await extractFileHandler(req as Request, res);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining("Could not extract") })
    );
  });
});
