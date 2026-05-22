import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Sparkles, FileText, Lock, Flame, Search, X, Tag, ChevronDown, Camera, ClipboardPaste, Loader2, Paperclip, Zap, Mic, MicOff, Square } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/AppShell";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// ─── Preset tags ───────────────────────────────────────────────────────────────
const PRESET_TAGS = ["Church", "Real Estate", "Consulting", "Construction", "STR", "Personal"];

// ─── Fireflies Meeting Picker ──────────────────────────────────────────────────
function FirefliesPicker({ onSelect }: { onSelect: (transcript: string, title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const recent = trpc.fireflies.recent.useQuery(undefined, {
    enabled: open && !debouncedTerm,
    staleTime: 60_000,
    retry: 1,
  });

  const search = trpc.fireflies.search.useQuery(
    { keyword: debouncedTerm },
    { enabled: open && debouncedTerm.length > 0, staleTime: 30_000, retry: 1 }
  );

  const getTranscript = trpc.fireflies.getTranscript.useQuery(
    { transcriptId: loadingId ?? "" },
    { enabled: !!loadingId, staleTime: 0 }
  );

  useEffect(() => {
    if (getTranscript.data && loadingId) {
      const meetings = debouncedTerm ? search.data : recent.data;
      const meeting = meetings?.find((m) => m.id === loadingId);
      const resolvedTitle = getTranscript.data.title || meeting?.title || "Fireflies Meeting";
      onSelect(getTranscript.data.transcript, resolvedTitle);
      setLoadingId(null);
      setOpen(false);
      toast.success("Transcript imported from Fireflies");
    }
    if (getTranscript.error && loadingId) {
      toast.error("Failed to fetch transcript");
      setLoadingId(null);
    }
  }, [getTranscript.data, getTranscript.error, loadingId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const meetings = debouncedTerm ? search.data : recent.data;
  const queryError = debouncedTerm ? search.error : recent.error;
  const isLoading = debouncedTerm
    ? (search.isFetching || search.isLoading)
    : (recent.isFetching || recent.isLoading);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px",
          borderRadius: "8px", background: open ? "color-mix(in oklch, var(--primary) 15%, transparent)" : "var(--secondary)",
          border: `1px solid ${open ? "color-mix(in oklch, var(--primary) 50%, transparent)" : "var(--border)"}`,
          color: "var(--primary)", fontSize: "12px", fontWeight: 600,
          fontFamily: "var(--font-sans)", letterSpacing: "0.04em", cursor: "pointer",
          transition: "all 0.2s", whiteSpace: "nowrap",
        }}
      >
        <Flame size={13} />
        Pull from Fireflies
        <ChevronDown size={12} style={{ opacity: 0.7, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          minWidth: "300px", maxWidth: "420px", background: "var(--card)",
          border: "1px solid var(--border)", borderRadius: "12px",
          boxShadow: "0 12px 40px color-mix(in oklch, var(--background) 40%, transparent)", zIndex: 100, overflow: "hidden",
        }}>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <input
              autoFocus
              placeholder="Search by meeting title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "var(--foreground)", fontFamily: "var(--font-sans)" }}
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <X size={13} style={{ color: "var(--muted-foreground)" }} />
              </button>
            )}
          </div>
          <div style={{ maxHeight: "260px", overflowY: "auto" }}>
            {isLoading && <div style={{ padding: "16px", textAlign: "center", fontSize: "13px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>Loading meetings...</div>}
            {!isLoading && queryError && <div style={{ padding: "16px", textAlign: "center", fontSize: "13px", color: "oklch(60% 0.15 25)", fontFamily: "var(--font-sans)" }}>Could not load meetings. Check your Fireflies connection.</div>}
            {!isLoading && !queryError && (!meetings || meetings.length === 0) && <div style={{ padding: "16px", textAlign: "center", fontSize: "13px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>{debouncedTerm ? "No meetings found" : "No recent meetings"}</div>}
            {!isLoading && meetings?.map((m) => (
              <button
                key={m.id} type="button" disabled={!!loadingId}
                onClick={() => setLoadingId(m.id)}
                style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px", padding: "10px 14px", background: loadingId === m.id ? "color-mix(in oklch, var(--primary) 10%, transparent)" : "transparent", border: "none", borderBottom: "1px solid var(--input)", cursor: loadingId ? "not-allowed" : "pointer", textAlign: "left", transition: "background 0.15s" }}
                onMouseEnter={(e) => { if (!loadingId) (e.currentTarget as HTMLButtonElement).style.background = "var(--input)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = loadingId === m.id ? "color-mix(in oklch, var(--primary) 10%, transparent)" : "transparent"; }}
              >
                <span style={{ fontSize: "13px", color: "var(--foreground)", fontFamily: "var(--font-sans)", fontWeight: 500 }}>{loadingId === m.id ? "Importing..." : m.title}</span>
                {m.date && <span style={{ fontSize: "11px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>{new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>}
              </button>
            ))}
          </div>
          <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border)" }}>
            <p style={{ fontSize: "11px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", margin: 0 }}>Showing your recent Fireflies meetings</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OCR Photo Import Button ──────────────────────────────────────────────────
function PhotoImportButton({ onExtracted }: { onExtracted: (text: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const extractMutation = trpc.notes.extractFromImage.useMutation();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPG, PNG, HEIC, etc.)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image too large — please use a file under 10MB");
      return;
    }
    setIsProcessing(true);
    try {
      // Convert to base64 data URL for the vision API
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { text } = await extractMutation.mutateAsync({ imageUrl: dataUrl });
      onExtracted(text);
      toast.success("Text extracted from image.");
    } catch {
      toast.error("Could not extract text from this image. Try a clearer photo.");
    } finally {
      setIsProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <button
        type="button"
        disabled={isProcessing}
        onClick={() => fileRef.current?.click()}
        style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px",
          borderRadius: "8px", background: "var(--secondary)",
          border: "1px solid var(--border)",
          color: isProcessing ? "oklch(55% 0 0)" : "var(--muted-foreground)",
          fontSize: "12px", fontWeight: 500, fontFamily: "var(--font-sans)",
          cursor: isProcessing ? "not-allowed" : "pointer", whiteSpace: "nowrap",
        }}
      >
        {isProcessing ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <Camera size={13} />}
        {isProcessing ? "Reading..." : "Import Photo"}
      </button>
    </>
  );
}

// ─── Paste Import Modal ───────────────────────────────────────────────────────
function PasteImportModal({ onImport, onClose }: { onImport: (text: string) => void; onClose: () => void }) {
  const [text, setText] = useState("");
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 20px" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: "640px", background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px 16px 12px 12px", padding: "20px", boxShadow: "0 -8px 40px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "16px", fontWeight: 600, color: "var(--foreground)" }}>Paste from Note App</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: "4px" }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: "12px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
          Paste text from Apple Notes, Notion, Bear, Obsidian, or any note-taking app.
        </p>
        <textarea
          autoFocus
          placeholder="Paste your notes here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          style={{
            width: "100%", background: "var(--input)", border: "1px solid var(--border)",
            borderRadius: "10px", padding: "12px 14px", fontSize: "14px",
            color: "var(--foreground)", fontFamily: "var(--font-sans)", outline: "none",
            resize: "none", lineHeight: 1.6,
          }}
        />
        <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "11px", borderRadius: "10px", background: "var(--input)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: "14px", fontFamily: "var(--font-sans)", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={() => { if (text.trim()) { onImport(text.trim()); onClose(); } }}
            disabled={!text.trim()}
            style={{ flex: 2, padding: "11px", borderRadius: "10px", background: text.trim() ? "var(--primary)" : "var(--border)", border: "none", color: text.trim() ? "var(--primary-foreground)" : "var(--muted-foreground)", fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-sans)", cursor: text.trim() ? "pointer" : "not-allowed" }}
          >
            Import Notes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tag Selector ──────────────────────────────────────────────────────────────
function TagSelector({ selected, onChange }: { selected: string[]; onChange: (tags: string[]) => void }) {
  const [customInput, setCustomInput] = useState("");

  const toggle = (tag: string) => {
    if (selected.includes(tag)) onChange(selected.filter((t) => t !== tag));
    else onChange([...selected, tag]);
  };

  const addCustom = () => {
    const val = customInput.trim();
    if (val && !selected.includes(val)) onChange([...selected, val]);
    setCustomInput("");
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
        {PRESET_TAGS.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button key={tag} type="button" onClick={() => toggle(tag)}
              style={{ display: "flex", alignItems: "center", gap: "4px", padding: "5px 10px", borderRadius: "20px", background: active ? "color-mix(in oklch, var(--primary) 18%, transparent)" : "var(--secondary)", border: `1px solid ${active ? "color-mix(in oklch, var(--primary) 60%, transparent)" : "var(--border)"}`, color: active ? "var(--primary)" : "var(--muted-foreground)", fontSize: "12px", fontWeight: active ? 600 : 400, fontFamily: "var(--font-sans)", cursor: "pointer" }}
            >
              {active && <X size={10} />}
              {tag}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        <input
          placeholder="Custom tag..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          style={{ flex: 1, background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "8px", padding: "7px 10px", fontSize: "12px", color: "var(--foreground)", fontFamily: "var(--font-sans)", outline: "none" }}
          onFocus={(e) => (e.target.style.borderColor = "color-mix(in oklch, var(--primary) 40%, transparent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
        <button type="button" onClick={addCustom} disabled={!customInput.trim()}
          style={{ padding: "7px 12px", borderRadius: "8px", background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: "12px", fontFamily: "var(--font-sans)", cursor: customInput.trim() ? "pointer" : "not-allowed", opacity: customInput.trim() ? 1 : 0.5 }}
        >
          Add
        </button>
      </div>
      {selected.filter((t) => !PRESET_TAGS.includes(t)).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
          {selected.filter((t) => !PRESET_TAGS.includes(t)).map((tag) => (
            <span key={tag} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "20px", background: "color-mix(in oklch, var(--primary) 12%, transparent)", border: "1px solid color-mix(in oklch, var(--primary) 40%, transparent)", color: "var(--primary)", fontSize: "12px", fontFamily: "var(--font-sans)" }}>
              {tag}
              <button type="button" onClick={() => onChange(selected.filter((t2) => t2 !== tag))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={10} style={{ color: "color-mix(in oklch, var(--primary) 70%, transparent)" }} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function NewSession() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [personalNotes, setPersonalNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Audio recording state ─────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Microphone access denied. Please allow microphone access in your browser settings.");
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.onstop = async () => {
      // Stop all tracks to release mic
      recorder.stream.getTracks().forEach((t) => t.stop());
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecording(false);
      const mimeType = recorder.mimeType || "audio/webm";
      const blob = new Blob(audioChunksRef.current, { type: mimeType });
      if (blob.size > 16 * 1024 * 1024) {
        toast.error("Recording too large (max 16 MB). Please record shorter segments.");
        return;
      }
      setIsTranscribing(true);
      try {
        const formData = new FormData();
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        formData.append("audio", blob, `recording.${ext}`);
        const res = await fetch("/api/transcribe-audio", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Transcription failed");
        setTranscript((prev) => prev ? prev + "\n\n" + data.transcript : data.transcript);
        const dur = data.duration ? ` (${Math.round(data.duration)}s)` : "";
        toast.success(`Recording transcribed${dur}`);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Failed to transcribe recording");
      } finally {
        setIsTranscribing(false);
      }
    };
    recorder.stop();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 10MB.");
      return;
    }
    setIsExtractingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract-file", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Extraction failed");
      const header = `--- Imported from ${file.name} ---\n`;
      setPersonalNotes((prev) => prev ? prev + "\n\n" + header + data.text : header + data.text);
      toast.success(`Extracted ${data.chars.toLocaleString()} characters from ${file.name}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to extract file");
    } finally {
      setIsExtractingFile(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const utils = trpc.useUtils();
  const createSession = trpc.sessions.create.useMutation();
  const analyzeSession = trpc.sessions.analyze.useMutation();
  const generateTitle = trpc.sessions.generateTitle.useMutation();
  const createCheckout = trpc.billing.createCheckoutSession.useMutation();

  const handleUpgrade = async () => {
    try {
      const { url } = await createCheckout.mutateAsync({ planKey: "pro", origin: window.location.origin });
      if (url) window.open(url, "_blank");
    } catch {
      toast.error("Could not open checkout. Please try again.");
    }
  };

  /** Returns the name to use — auto-generates one if the field is blank. */
  const resolveTitle = async (): Promise<string | null> => {
    if (name.trim()) return name.trim();
    if (!transcript.trim() && !personalNotes.trim()) {
      toast.error("Please add a transcript or personal notes before saving.");
      return null;
    }
    setIsGeneratingTitle(true);
    try {
      const { title } = await generateTitle.mutateAsync({ transcript, personalNotes });
      setName(title);
      return title;
    } catch {
      const fallback = "Untitled Session";
      setName(fallback);
      return fallback;
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleFirefliesSelect = (importedTranscript: string, meetingTitle: string) => {
    setTranscript(importedTranscript);
    if (!name.trim()) setName(meetingTitle);
  };

  const handleAnalyze = async () => {
    if (!transcript.trim() && !personalNotes.trim()) {
      toast.error("Please add a transcript or personal notes before analyzing.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const resolvedName = await resolveTitle();
      if (!resolvedName) { setIsAnalyzing(false); return; }
      const { id } = await createSession.mutateAsync({ name: resolvedName, transcript, personalNotes, tags });
      await analyzeSession.mutateAsync({ id, transcript, personalNotes });
      await utils.sessions.list.invalidate();
      toast.success("Analysis complete.");
      navigate(`/session/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("FREE_LIMIT_REACHED")) {
        setShowUpgradeDialog(true);
      } else {
        toast.error(msg || "Analysis failed. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDraft = async () => {
    const resolvedName = await resolveTitle();
    if (!resolvedName) return;
    try {
      const { id } = await createSession.mutateAsync({ name: resolvedName, transcript, personalNotes, tags });
      await utils.sessions.list.invalidate();
      toast.success("Draft saved.");
      navigate(`/session/${id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("FREE_LIMIT_REACHED")) {
        setShowUpgradeDialog(true);
      } else {
        toast.error("Failed to save draft.");
      }
    }
  };

  if (authLoading) return null;

  return (
    <AppShell>
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate("/")}
            style={{ background: "var(--secondary)", border: "1px solid var(--border)", borderRadius: "10px", width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
          >
            <ArrowLeft size={18} style={{ color: "var(--muted-foreground)" }} />
          </button>
          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>New Session</h1>
            <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0, fontFamily: "var(--font-sans)" }}>Capture your meeting intelligence</p>
          </div>
        </div>

        {/* Session Name */}
        <div className="mb-5">
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>
            Session Name
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder={isGeneratingTitle ? "Generating title…" : "e.g. Sunday Staff Meeting (auto-generated if blank)"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isGeneratingTitle}
              style={{ width: "100%", background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "10px", padding: "13px 14px", paddingRight: isGeneratingTitle ? "42px" : "14px", fontSize: "15px", color: "var(--foreground)", fontFamily: "var(--font-serif)", outline: "none", transition: "border-color 0.2s", opacity: isGeneratingTitle ? 0.6 : 1 }}
              onFocus={(e) => (e.target.style.borderColor = "color-mix(in oklch, var(--primary) 60%, transparent)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            {isGeneratingTitle && (
              <Loader2 size={16} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", animation: "spin 0.8s linear infinite", color: "var(--muted-foreground)" }} />
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="mb-5">
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>
            <Tag size={12} />
            Tags
          </label>
          <TagSelector selected={tags} onChange={setTags} />
        </div>

        {/* Transcript — with Fireflies pull */}
        <div className="mb-5">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
              <FileText size={12} />
              Meeting Transcript
            </label>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isTranscribing}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", borderRadius: "8px", background: isRecording ? "color-mix(in oklch, #ef4444 15%, var(--secondary))" : "var(--secondary)", border: `1px solid ${isRecording ? "color-mix(in oklch, #ef4444 50%, transparent)" : "var(--border)"}`, color: isRecording ? "#ef4444" : "var(--muted-foreground)", fontSize: "12px", fontWeight: 500, fontFamily: "var(--font-sans)", cursor: isTranscribing ? "not-allowed" : "pointer", whiteSpace: "nowrap", opacity: isTranscribing ? 0.5 : 1, transition: "all 0.2s" }}
              >
                {isTranscribing ? (
                  <><Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />Transcribing…</>
                ) : isRecording ? (
                  <><Square size={11} fill="#ef4444" style={{ flexShrink: 0 }} /><span style={{ animation: "pulse 1s ease-in-out infinite" }}>{formatTime(recordingSeconds)}</span> Stop</>
                ) : (
                  <><Mic size={13} />Record</>  
                )}
              </button>
              <FirefliesPicker onSelect={handleFirefliesSelect} />
            </div>
          </div>
          <textarea
            placeholder="Paste your Fireflies, Otter, or other transcript here — or tap Record to capture audio directly..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={7}
            style={{ width: "100%", background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "10px", padding: "13px 14px", fontSize: "14px", color: "var(--foreground)", fontFamily: "var(--font-sans)", outline: "none", resize: "vertical", lineHeight: 1.6, transition: "border-color 0.2s" }}
            onFocus={(e) => (e.target.style.borderColor = "color-mix(in oklch, var(--primary) 60%, transparent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
          {transcript && (
            <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "5px", fontFamily: "var(--font-sans)" }}>
              {transcript.split(/\s+/).filter(Boolean).length.toLocaleString()} words
            </p>
          )}
        </div>

        {/* Record button — above transcript */}
        {(isRecording || isTranscribing) && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "10px", background: isRecording ? "color-mix(in oklch, #ef4444 12%, var(--card))" : "color-mix(in oklch, var(--primary) 10%, var(--card))", border: `1px solid ${isRecording ? "color-mix(in oklch, #ef4444 40%, transparent)" : "color-mix(in oklch, var(--primary) 30%, transparent)"}`, marginBottom: "12px" }}>
            {isRecording ? (
              <>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", animation: "pulse 1s ease-in-out infinite", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", fontWeight: 600, color: "#ef4444", letterSpacing: "0.05em" }}>{formatTime(recordingSeconds)}</span>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--muted-foreground)", flex: 1 }}>Recording… tap Stop when done</span>
                <button type="button" onClick={stopRecording} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", borderRadius: "7px", background: "#ef4444", border: "none", color: "#fff", fontSize: "12px", fontWeight: 600, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                  <Square size={11} fill="#fff" />Stop
                </button>
              </>
            ) : (
              <>
                <Loader2 size={14} style={{ animation: "spin 0.8s linear infinite", color: "var(--primary)", flexShrink: 0 }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: "13px", color: "var(--muted-foreground)" }}>Transcribing recording…</span>
              </>
            )}
          </div>
        )}

        {/* Private Notes — with Photo OCR + Paste import */}
        <div className="mb-6">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--primary)", fontFamily: "var(--font-sans)" }}>
              <Lock size={12} />
              Private Notes
            </label>
            {/* Import buttons */}
            <div style={{ display: "flex", gap: "6px" }}>
              <PhotoImportButton onExtracted={(text) => setPersonalNotes((prev) => prev ? prev + "\n\n" + text : text)} />
              {/* File upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.md,.docx"
                style={{ display: "none" }}
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isExtractingFile}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", borderRadius: "8px", background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: "12px", fontWeight: 500, fontFamily: "var(--font-sans)", cursor: isExtractingFile ? "not-allowed" : "pointer", whiteSpace: "nowrap", opacity: isExtractingFile ? 0.6 : 1 }}
              >
                {isExtractingFile ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} /> : <Paperclip size={13} />}
                {isExtractingFile ? "Extracting…" : "Upload File"}
              </button>
              <button
                type="button"
                onClick={() => setShowPasteModal(true)}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 12px", borderRadius: "8px", background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: "12px", fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                <ClipboardPaste size={13} />
                Paste from App
              </button>
            </div>
          </div>
          <textarea
            placeholder="Your private thoughts, reactions, and observations — what you were thinking but didn't say aloud..."
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            rows={6}
            style={{ width: "100%", background: "var(--card)", border: "1px solid color-mix(in oklch, var(--primary) 20%, transparent)", borderRadius: "10px", padding: "13px 14px", fontSize: "14px", color: "var(--foreground)", fontFamily: "var(--font-sans)", outline: "none", resize: "vertical", lineHeight: 1.6, transition: "border-color 0.2s" }}
            onFocus={(e) => (e.target.style.borderColor = "color-mix(in oklch, var(--primary) 50%, transparent)")}
            onBlur={(e) => (e.target.style.borderColor = "color-mix(in oklch, var(--primary) 20%, transparent)")}
          />
          <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "6px", fontFamily: "var(--font-sans)" }}>
            These notes are private and treated with equal weight in the AI analysis. Use the buttons above to import from a photo or note-taking app.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={isAnalyzing || createSession.isPending}
            style={{ flex: 1, padding: "13px", borderRadius: "10px", background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)", fontSize: "14px", fontWeight: 500, fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 0.2s" }}
          >
            Save Draft
          </button>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || createSession.isPending}
            style={{ flex: 2, padding: "13px", borderRadius: "10px", background: isAnalyzing ? "color-mix(in oklch, var(--primary) 70%, transparent)" : "var(--primary)", border: "none", color: "#0e0e0e", fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-sans)", cursor: isAnalyzing ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", boxShadow: isAnalyzing ? "none" : "0 4px 16px color-mix(in oklch, var(--primary) 25%, transparent)", transition: "all 0.2s" }}
          >
            {isAnalyzing ? (
              <><span style={{ width: "16px", height: "16px", border: "2px solid #0e0e0e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />Analyzing...</>
            ) : (
              <><Sparkles size={16} />Analyze</>
            )}
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      </div>

      {/* Paste from App modal */}
      {showPasteModal && (
        <PasteImportModal
          onImport={(text) => setPersonalNotes((prev) => prev ? prev + "\n\n" + text : text)}
          onClose={() => setShowPasteModal(false)}
        />
      )}

      {/* Free Plan Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap size={18} className="text-amber-500" />
              You've hit your free limit
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Free accounts can create up to <strong>10 sessions per month</strong>. Upgrade to Pro for unlimited sessions, all integrations, and priority support.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Button
              onClick={handleUpgrade}
              disabled={createCheckout.isPending}
              className="w-full"
            >
              {createCheckout.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : <Zap size={16} className="mr-2" />}
              Upgrade to Pro — $12/mo
            </Button>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} className="w-full">
              Maybe later
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
