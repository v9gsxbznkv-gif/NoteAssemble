import { Request, Response } from "express";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

// ─── Multer config (memory storage, 10MB limit) ───────────────────────────────

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";
    const allowedExts = ["pdf", "docx", "txt", "md"];
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: .${ext}. Supported: PDF, DOCX, TXT, MD`));
    }
  },
});

// ─── Text extraction ──────────────────────────────────────────────────────────

async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "pdf") {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    return result.text.trim();
  }

  if (ext === "docx") {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  // Plain text / markdown
  return buffer.toString("utf-8").trim();
}

// ─── Route handler ────────────────────────────────────────────────────────────

export const extractFileMiddleware = upload.single("file");

export async function extractFileHandler(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { buffer, originalname } = req.file;
    const text = await extractText(buffer, originalname);

    if (!text || text.length < 10) {
      return res.status(422).json({ error: "Could not extract readable text from this file." });
    }

    return res.json({
      text,
      filename: originalname,
      chars: text.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "File extraction failed";
    return res.status(500).json({ error: message });
  }
}
