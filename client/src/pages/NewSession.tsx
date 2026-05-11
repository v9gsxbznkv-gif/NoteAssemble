import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Sparkles, FileText, Lock, Flame, Search, X, Tag, Check, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/AppShell";
import { toast } from "sonner";

// ─── Preset tags ───────────────────────────────────────────────────────────────
const PRESET_TAGS = ["Church", "Real Estate", "Consulting", "Construction", "STR", "Personal"];

// ─── Fireflies Meeting Picker ──────────────────────────────────────────────────
function FirefliesPicker({ onSelect }: { onSelect: (transcript: string, title: string) => void }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm), 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Fetch recent meetings on open (no keyword)
  const recent = trpc.fireflies.recent.useQuery(undefined, {
    enabled: open && !debouncedTerm,
    staleTime: 60_000,
  });

  // Fetch search results when keyword present
  const search = trpc.fireflies.search.useQuery(
    { keyword: debouncedTerm },
    { enabled: open && debouncedTerm.length > 0, staleTime: 30_000 }
  );

  const getTranscript = trpc.fireflies.getTranscript.useQuery(
    { transcriptId: loadingId ?? "" },
    {
      enabled: !!loadingId,
      staleTime: 0,
    }
  );

  useEffect(() => {
    if (getTranscript.data && loadingId) {
      const meetings = debouncedTerm ? search.data : recent.data;
      const meeting = meetings?.find((m) => m.id === loadingId);
      onSelect(getTranscript.data.transcript, meeting?.title ?? "Fireflies Meeting");
      setLoadingId(null);
      setOpen(false);
      toast.success("Transcript imported from Fireflies");
    }
    if (getTranscript.error && loadingId) {
      toast.error("Failed to fetch transcript");
      setLoadingId(null);
    }
  }, [getTranscript.data, getTranscript.error, loadingId]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const meetings = debouncedTerm ? search.data : recent.data;
  const isLoading = debouncedTerm ? search.isLoading : recent.isLoading;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "7px 12px",
          borderRadius: "8px",
          background: open ? "oklch(68% 0.12 75 / 0.15)" : "oklch(14% 0 0)",
          border: `1px solid ${open ? "oklch(68% 0.12 75 / 0.5)" : "oklch(24% 0 0)"}`,
          color: "oklch(68% 0.12 75)",
          fontSize: "12px",
          fontWeight: 600,
          fontFamily: "var(--font-sans)",
          letterSpacing: "0.04em",
          cursor: "pointer",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
        }}
      >
        <Flame size={13} />
        Pull from Fireflies
        <ChevronDown size={12} style={{ opacity: 0.7, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            minWidth: "300px",
            maxWidth: "420px",
            background: "oklch(12% 0 0)",
            border: "1px solid oklch(22% 0 0)",
            borderRadius: "12px",
            boxShadow: "0 12px 40px oklch(0% 0 0 / 0.6)",
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {/* Search input */}
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid oklch(18% 0 0)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Search size={14} style={{ color: "oklch(50% 0 0)", flexShrink: 0 }} />
            <input
              autoFocus
              placeholder="Search by meeting title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "13px",
                color: "oklch(88% 0 0)",
                fontFamily: "var(--font-sans)",
              }}
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <X size={13} style={{ color: "oklch(50% 0 0)" }} />
              </button>
            )}
          </div>

          {/* Meeting list */}
          <div style={{ maxHeight: "260px", overflowY: "auto" }}>
            {isLoading && (
              <div style={{ padding: "16px", textAlign: "center", fontSize: "13px", color: "oklch(45% 0 0)", fontFamily: "var(--font-sans)" }}>
                Loading meetings...
              </div>
            )}
            {!isLoading && (!meetings || meetings.length === 0) && (
              <div style={{ padding: "16px", textAlign: "center", fontSize: "13px", color: "oklch(45% 0 0)", fontFamily: "var(--font-sans)" }}>
                {debouncedTerm ? "No meetings found" : "No recent meetings"}
              </div>
            )}
            {!isLoading && meetings?.map((m) => (
              <button
                key={m.id}
                type="button"
                disabled={!!loadingId}
                onClick={() => setLoadingId(m.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "2px",
                  padding: "10px 14px",
                  background: loadingId === m.id ? "oklch(68% 0.12 75 / 0.1)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid oklch(16% 0 0)",
                  cursor: loadingId ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!loadingId) (e.currentTarget as HTMLButtonElement).style.background = "oklch(16% 0 0)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = loadingId === m.id ? "oklch(68% 0.12 75 / 0.1)" : "transparent"; }}
              >
                <span style={{ fontSize: "13px", color: "oklch(88% 0 0)", fontFamily: "var(--font-sans)", fontWeight: 500 }}>
                  {loadingId === m.id ? "Importing..." : m.title}
                </span>
                {m.date && (
                  <span style={{ fontSize: "11px", color: "oklch(45% 0 0)", fontFamily: "var(--font-sans)" }}>
                    {new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ padding: "8px 12px", borderTop: "1px solid oklch(18% 0 0)" }}>
            <p style={{ fontSize: "11px", color: "oklch(38% 0 0)", fontFamily: "var(--font-sans)", margin: 0 }}>
              Showing your recent Fireflies meetings
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tag Selector ──────────────────────────────────────────────────────────────
function TagSelector({ selected, onChange }: { selected: string[]; onChange: (tags: string[]) => void }) {
  const [customInput, setCustomInput] = useState("");

  const toggle = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  };

  const addCustom = () => {
    const val = customInput.trim();
    if (val && !selected.includes(val)) {
      onChange([...selected, val]);
    }
    setCustomInput("");
  };

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
        {PRESET_TAGS.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "5px 10px",
                borderRadius: "20px",
                background: active ? "oklch(68% 0.12 75 / 0.18)" : "oklch(14% 0 0)",
                border: `1px solid ${active ? "oklch(68% 0.12 75 / 0.6)" : "oklch(22% 0 0)"}`,
                color: active ? "oklch(68% 0.12 75)" : "oklch(55% 0 0)",
                fontSize: "12px",
                fontWeight: active ? 600 : 400,
                fontFamily: "var(--font-sans)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {active && <Check size={10} />}
              {tag}
            </button>
          );
        })}
      </div>

      {/* Custom tag input */}
      <div style={{ display: "flex", gap: "6px" }}>
        <input
          type="text"
          placeholder="Add custom tag..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
          style={{
            flex: 1,
            background: "oklch(13% 0 0)",
            border: "1px solid oklch(22% 0 0)",
            borderRadius: "8px",
            padding: "7px 10px",
            fontSize: "12px",
            color: "oklch(88% 0 0)",
            fontFamily: "var(--font-sans)",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "oklch(68% 0.12 75 / 0.4)")}
          onBlur={(e) => (e.target.style.borderColor = "oklch(22% 0 0)")}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customInput.trim()}
          style={{
            padding: "7px 12px",
            borderRadius: "8px",
            background: "oklch(14% 0 0)",
            border: "1px solid oklch(22% 0 0)",
            color: "oklch(60% 0 0)",
            fontSize: "12px",
            fontFamily: "var(--font-sans)",
            cursor: customInput.trim() ? "pointer" : "not-allowed",
            opacity: customInput.trim() ? 1 : 0.5,
          }}
        >
          Add
        </button>
      </div>

      {/* Selected custom tags (non-preset) */}
      {selected.filter((t) => !PRESET_TAGS.includes(t)).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
          {selected.filter((t) => !PRESET_TAGS.includes(t)).map((tag) => (
            <span
              key={tag}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "4px 8px",
                borderRadius: "20px",
                background: "oklch(68% 0.12 75 / 0.12)",
                border: "1px solid oklch(68% 0.12 75 / 0.4)",
                color: "oklch(68% 0.12 75)",
                fontSize: "12px",
                fontFamily: "var(--font-sans)",
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(selected.filter((t2) => t2 !== tag))}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
              >
                <X size={10} style={{ color: "oklch(68% 0.12 75 / 0.7)" }} />
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const utils = trpc.useUtils();
  const createSession = trpc.sessions.create.useMutation();
  const analyzeSession = trpc.sessions.analyze.useMutation();

  const handleFirefliesSelect = (importedTranscript: string, meetingTitle: string) => {
    setTranscript(importedTranscript);
    if (!name.trim()) setName(meetingTitle);
  };

  const handleAnalyze = async () => {
    if (!name.trim()) { toast.error("Please give this session a name."); return; }
    if (!transcript.trim() && !personalNotes.trim()) {
      toast.error("Please add a transcript or personal notes before analyzing.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const { id } = await createSession.mutateAsync({ name: name.trim(), transcript, personalNotes, tags });
      await analyzeSession.mutateAsync({ id, transcript, personalNotes });
      await utils.sessions.list.invalidate();
      toast.success("Analysis complete.");
      navigate(`/session/${id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!name.trim()) { toast.error("Please give this session a name."); return; }
    try {
      const { id } = await createSession.mutateAsync({ name: name.trim(), transcript, personalNotes, tags });
      await utils.sessions.list.invalidate();
      toast.success("Draft saved.");
      navigate(`/session/${id}`);
    } catch {
      toast.error("Failed to save draft.");
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
            style={{
              background: "oklch(14% 0 0)", border: "1px solid oklch(22% 0 0)",
              borderRadius: "10px", width: "38px", height: "38px",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}
          >
            <ArrowLeft size={18} style={{ color: "oklch(65% 0 0)" }} />
          </button>
          <div>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "20px", fontWeight: 600, color: "oklch(92% 0 0)", margin: 0 }}>
              New Session
            </h1>
            <p style={{ fontSize: "12px", color: "oklch(45% 0 0)", margin: 0, fontFamily: "var(--font-sans)" }}>
              Capture your meeting intelligence
            </p>
          </div>
        </div>

        {/* Session Name */}
        <div className="mb-5">
          <label style={{ display: "block", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(55% 0 0)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>
            Session Name
          </label>
          <input
            type="text"
            placeholder="e.g. Sunday Staff Meeting"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%", background: "oklch(13% 0 0)", border: "1px solid oklch(22% 0 0)",
              borderRadius: "10px", padding: "13px 14px", fontSize: "15px",
              color: "oklch(90% 0 0)", fontFamily: "var(--font-serif)", outline: "none", transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "oklch(68% 0.12 75 / 0.6)")}
            onBlur={(e) => (e.target.style.borderColor = "oklch(22% 0 0)")}
          />
        </div>

        {/* Tags */}
        <div className="mb-5">
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(55% 0 0)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>
            <Tag size={12} />
            Tags
          </label>
          <TagSelector selected={tags} onChange={setTags} />
        </div>

        {/* Transcript — with Fireflies pull */}
        <div className="mb-5">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(55% 0 0)", fontFamily: "var(--font-sans)" }}>
              <FileText size={12} />
              Meeting Transcript
            </label>
            <FirefliesPicker onSelect={handleFirefliesSelect} />
          </div>
          <textarea
            placeholder="Paste your Fireflies, Otter, or other transcript here — or use the Pull from Fireflies button above..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={7}
            style={{
              width: "100%", background: "oklch(13% 0 0)", border: "1px solid oklch(22% 0 0)",
              borderRadius: "10px", padding: "13px 14px", fontSize: "14px",
              color: "oklch(88% 0 0)", fontFamily: "var(--font-sans)", outline: "none",
              resize: "vertical", lineHeight: 1.6, transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "oklch(68% 0.12 75 / 0.6)")}
            onBlur={(e) => (e.target.style.borderColor = "oklch(22% 0 0)")}
          />
          {transcript && (
            <p style={{ fontSize: "11px", color: "oklch(45% 0 0)", marginTop: "5px", fontFamily: "var(--font-sans)" }}>
              {transcript.split(/\s+/).filter(Boolean).length.toLocaleString()} words
            </p>
          )}
        </div>

        {/* Private Notes */}
        <div className="mb-6">
          <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(68% 0.12 75)", marginBottom: "8px", fontFamily: "var(--font-sans)" }}>
            <Lock size={12} />
            Private Notes
          </label>
          <textarea
            placeholder="Your private thoughts, reactions, and observations — what you were thinking but didn't say aloud..."
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            rows={6}
            style={{
              width: "100%", background: "oklch(11.5% 0.005 75)", border: "1px solid oklch(68% 0.12 75 / 0.2)",
              borderRadius: "10px", padding: "13px 14px", fontSize: "14px",
              color: "oklch(88% 0 0)", fontFamily: "var(--font-sans)", outline: "none",
              resize: "vertical", lineHeight: 1.6, transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "oklch(68% 0.12 75 / 0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "oklch(68% 0.12 75 / 0.2)")}
          />
          <p style={{ fontSize: "11px", color: "oklch(40% 0 0)", marginTop: "6px", fontFamily: "var(--font-sans)" }}>
            These notes are private and treated with equal weight in the AI analysis.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={isAnalyzing || createSession.isPending}
            style={{
              flex: 1, padding: "13px", borderRadius: "10px",
              background: "oklch(14% 0 0)", border: "1px solid oklch(24% 0 0)",
              color: "oklch(70% 0 0)", fontSize: "14px", fontWeight: 500,
              fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 0.2s",
            }}
          >
            Save Draft
          </button>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || createSession.isPending}
            style={{
              flex: 2, padding: "13px", borderRadius: "10px",
              background: isAnalyzing ? "oklch(50% 0.08 75)" : "oklch(68% 0.12 75)",
              border: "none", color: "#0e0e0e", fontSize: "15px", fontWeight: 700,
              fontFamily: "var(--font-sans)", cursor: isAnalyzing ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              boxShadow: isAnalyzing ? "none" : "0 4px 16px oklch(68% 0.12 75 / 0.25)",
              transition: "all 0.2s",
            }}
          >
            {isAnalyzing ? (
              <>
                <span style={{ width: "16px", height: "16px", border: "2px solid #0e0e0e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Analyzing...
              </>
            ) : (
              <><Sparkles size={16} />Analyze</>
            )}
          </button>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppShell>
  );
}
