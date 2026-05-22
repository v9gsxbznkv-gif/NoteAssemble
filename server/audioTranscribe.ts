import multer from "multer";
import type { Request, Response } from "express";
import { storagePut } from "./storage";
import { transcribeAudio } from "./_core/voiceTranscription";

const ALLOWED_MIME = new Set([
  "audio/webm",
  "audio/mp4",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/ogg",
  "audio/m4a",
]);

const MAX_SIZE_BYTES = 16 * 1024 * 1024; // 16 MB

export const audioUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    // Accept by mimetype or by extension (webm often comes as video/webm from MediaRecorder)
    const mime = file.mimetype.toLowerCase();
    const isAudioMime = ALLOWED_MIME.has(mime) || mime.startsWith("audio/");
    const isWebm = mime === "video/webm" || file.originalname.endsWith(".webm");
    if (isAudioMime || isWebm) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`));
    }
  },
}).single("audio");

export async function audioTranscribeHandler(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided" });
    }

    const file = req.file;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > 16) {
      return res.status(413).json({ error: `File too large (${sizeMB.toFixed(1)} MB). Maximum is 16 MB.` });
    }

    // Determine extension — MediaRecorder on Chrome/iOS produces webm or mp4
    const mimeToExt: Record<string, string> = {
      "audio/webm": "webm",
      "video/webm": "webm",
      "audio/mp4": "mp4",
      "audio/mpeg": "mp3",
      "audio/mp3": "mp3",
      "audio/wav": "wav",
      "audio/wave": "wav",
      "audio/ogg": "ogg",
      "audio/m4a": "m4a",
    };
    const ext = mimeToExt[file.mimetype.toLowerCase()] ?? "webm";
    const userId = (req as Request & { user?: { id: number } }).user?.id ?? "anon";
    const key = `audio/${userId}/${Date.now()}.${ext}`;

    // Upload to S3
    const { url } = await storagePut(key, file.buffer, file.mimetype || "audio/webm");

    // Transcribe via Whisper
    const result = await transcribeAudio({
      audioUrl: url,
      language: "en",
      prompt: "Transcribe this meeting recording accurately.",
    });

    if ("error" in result) {
      return res.status(500).json({ error: result.error, details: result.details });
    }

    return res.json({
      transcript: result.text,
      language: result.language,
      duration: result.duration,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Transcription failed";
    return res.status(500).json({ error: msg });
  }
}
