import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft, Sparkles, Copy, FileDown, Trash2, AlertTriangle,
  CheckCircle2, Eye, Lightbulb, ShieldAlert, FileText, Lock,
  ChevronDown, ChevronUp, RotateCcw
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import AppShell from "@/components/AppShell";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ActionItem {
  task: string;
  priority: "high" | "medium" | "low";
  context: string;
  owner: string;
}

interface Insight {
  insight: string;
  source: "transcript" | "notes" | "synthesis";
}

interface WatchItem {
  item: string;
  type: "risk" | "open-question" | "tension" | "dependency";
}

interface KeyDecision {
  decision: string;
  context: string;
}

interface AiOutput {
  summary: string;
  keyDecisions: KeyDecision[];
  actionItems: ActionItem[];
  insights: Insight[];
  watchItems: WatchItem[];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
      {icon}
      <h3
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: "15px",
          fontWeight: 600,
          color: "oklch(88% 0 0)",
          margin: 0,
          flex: 1,
        }}
      >
        {title}
      </h3>
      {count !== undefined && (
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "oklch(55% 0 0)",
            background: "oklch(18% 0 0)",
            padding: "2px 8px",
            borderRadius: "20px",
            fontFamily: "var(--font-sans)",
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    high: { bg: "oklch(45% 0.18 25 / 0.25)", color: "oklch(75% 0.15 25)", border: "oklch(55% 0.18 25 / 0.4)" },
    medium: { bg: "oklch(55% 0.12 75 / 0.2)", color: "oklch(75% 0.12 75)", border: "oklch(68% 0.12 75 / 0.35)" },
    low: { bg: "oklch(45% 0.1 160 / 0.2)", color: "oklch(70% 0.1 160)", border: "oklch(55% 0.1 160 / 0.35)" },
  };
  const s = styles[priority] ?? styles.medium;
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        padding: "2px 7px",
        borderRadius: "4px",
        fontFamily: "var(--font-sans)",
        flexShrink: 0,
      }}
    >
      {priority}
    </span>
  );
}

function WatchTypeBadge({ type }: { type: string }) {
  const labels: Record<string, string> = {
    "risk": "Risk",
    "open-question": "Open Question",
    "tension": "Tension",
    "dependency": "Dependency",
  };
  return (
    <span
      style={{
        fontSize: "10px",
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: "oklch(65% 0.15 45)",
        background: "oklch(45% 0.15 45 / 0.15)",
        border: "1px solid oklch(55% 0.15 45 / 0.3)",
        padding: "2px 7px",
        borderRadius: "4px",
        fontFamily: "var(--font-sans)",
        flexShrink: 0,
      }}
    >
      {labels[type] ?? type}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    transcript: { label: "Transcript", color: "oklch(60% 0.1 220)" },
    notes: { label: "Private Notes", color: "oklch(68% 0.12 75)" },
    synthesis: { label: "Synthesis", color: "oklch(65% 0.1 280)" },
  };
  const s = labels[source] ?? labels.synthesis;
  return (
    <span style={{ fontSize: "11px", color: s.color, fontFamily: "var(--font-sans)" }}>
      {s.label}
    </span>
  );
}

const PRESET_TAGS = ["Church", "Real Estate", "Consulting", "Construction", "STR", "Personal"];

function TagQuickAdd({ currentTags, onAdd }: { currentTags: string[]; onAdd: (tag: string) => void }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const available = PRESET_TAGS.filter((t) => !currentTags.includes(t));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: "4px",
          padding: "4px 10px", borderRadius: "20px",
          background: "oklch(14% 0 0)", border: "1px dashed oklch(28% 0 0)",
          color: "oklch(45% 0 0)", fontSize: "12px", fontFamily: "var(--font-sans)", cursor: "pointer",
        }}
      >
        + Tag
      </button>
    );
  }

  return (
    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
      {available.map((tag) => (
        <button key={tag} onClick={() => { onAdd(tag); setOpen(false); }}
          style={{ padding: "4px 10px", borderRadius: "20px", background: "oklch(16% 0 0)", border: "1px solid oklch(26% 0 0)", color: "oklch(60% 0 0)", fontSize: "12px", fontFamily: "var(--font-sans)", cursor: "pointer" }}
        >{tag}</button>
      ))}
      <input
        autoFocus
        placeholder="Custom..."
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && custom.trim()) { onAdd(custom.trim()); setCustom(""); setOpen(false); }
          if (e.key === "Escape") setOpen(false);
        }}
        style={{ width: "80px", background: "oklch(13% 0 0)", border: "1px solid oklch(28% 0 0)", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", color: "oklch(88% 0 0)", fontFamily: "var(--font-sans)", outline: "none" }}
      />
      <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "oklch(40% 0 0)", fontSize: "12px", fontFamily: "var(--font-sans)" }}>×</button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────────────────────────
export default function SessionDetail() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const sessionId = parseInt(params.id ?? "0");

  const [showTranscript, setShowTranscript] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editTranscript, setEditTranscript] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [tagsDirty, setTagsDirty] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const utils = trpc.useUtils();
  const { data: session, isLoading } = trpc.sessions.get.useQuery(
    { id: sessionId },
    { enabled: isAuthenticated && sessionId > 0 }
  );

  useEffect(() => {
    if (session) {
      setEditTranscript(session.transcript ?? "");
      setEditNotes(session.personalNotes ?? "");
      setEditTags(session.parsedTags ?? []);
    }
  }, [session]);

  const analyzeSession = trpc.sessions.analyze.useMutation();
  const deleteSession = trpc.sessions.delete.useMutation();
  const updateSession = trpc.sessions.update.useMutation();

  const handleSaveTags = async (newTags: string[]) => {
    setEditTags(newTags);
    setTagsDirty(true);
    try {
      await updateSession.mutateAsync({ id: sessionId, tags: newTags });
      await utils.sessions.get.invalidate({ id: sessionId });
      setTagsDirty(false);
      toast.success("Tags updated.");
    } catch {
      toast.error("Failed to save tags.");
    }
  };

  const aiOutput: AiOutput | null = (() => {
    try {
      return session?.aiOutput ? JSON.parse(session.aiOutput) : null;
    } catch {
      return null;
    }
  })();

  const handleAnalyze = async () => {
    if (!editTranscript.trim() && !editNotes.trim()) {
      toast.error("Please add a transcript or personal notes before analyzing.");
      return;
    }
    setIsAnalyzing(true);
    try {
      await analyzeSession.mutateAsync({
        id: sessionId,
        transcript: editTranscript,
        personalNotes: editNotes,
      });
      await utils.sessions.get.invalidate({ id: sessionId });
      toast.success("Analysis complete.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed.";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteSession.mutateAsync({ id: sessionId });
      await utils.sessions.list.invalidate();
      toast.success("Session deleted.");
      navigate("/history");
    } catch {
      toast.error("Failed to delete session.");
    }
  };

  const buildExportText = (): string => {
    if (!session || !aiOutput) return "";
    const lines: string[] = [
      `NoteAssemble — ${session.name}`,
      `Date: ${new Date(session.createdAt).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
      "",
      "═══ EXECUTIVE SUMMARY ═══",
      aiOutput.summary,
      "",
    ];
    if (aiOutput.keyDecisions?.length) {
      lines.push("═══ KEY DECISIONS ═══");
      aiOutput.keyDecisions.forEach((d, i) => {
        lines.push(`${i + 1}. ${d.decision}`);
        if (d.context) lines.push(`   Context: ${d.context}`);
      });
      lines.push("");
    }
    if (aiOutput.actionItems?.length) {
      lines.push("═══ ACTION ITEMS ═══");
      aiOutput.actionItems.forEach((a, i) => {
        lines.push(`${i + 1}. [${a.priority.toUpperCase()}] ${a.task}`);
        if (a.context) lines.push(`   Why: ${a.context}`);
        if (a.owner && a.owner !== "Not specified") lines.push(`   Owner: ${a.owner}`);
      });
      lines.push("");
    }
    if (aiOutput.insights?.length) {
      lines.push("═══ INSIGHTS ═══");
      aiOutput.insights.forEach((ins, i) => {
        lines.push(`${i + 1}. ${ins.insight} (${ins.source})`);
      });
      lines.push("");
    }
    if (aiOutput.watchItems?.length) {
      lines.push("═══ WATCH ITEMS ═══");
      aiOutput.watchItems.forEach((w, i) => {
        lines.push(`${i + 1}. [${w.type.toUpperCase()}] ${w.item}`);
      });
    }
    return lines.join("\n");
  };

  const handleCopy = async () => {
    const text = buildExportText();
    if (!text) { toast.error("No analysis to copy."); return; }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard.");
    } catch {
      toast.error("Copy failed. Please try manually.");
    }
  };

  const handlePdfExport = () => {
    if (!session || !aiOutput) { toast.error("No analysis to export."); return; }
    const text = buildExportText();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${session.name.replace(/[^a-z0-9]/gi, "_")}_NoteAssemble.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded.");
  };

  if (authLoading || isLoading) {
    return (
      <AppShell hideNav>
        <div className="container py-6">
          <div className="skeleton h-10 w-full mb-4" />
          <div className="skeleton h-24 w-full mb-4" />
          <div className="skeleton h-40 w-full mb-4" />
          <div className="skeleton h-40 w-full" />
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return (
      <AppShell hideNav>
        <div className="container py-6 text-center">
          <p style={{ color: "oklch(55% 0 0)", fontFamily: "var(--font-sans)" }}>Session not found.</p>
          <button onClick={() => navigate("/history")} style={{ color: "oklch(68% 0.12 75)", marginTop: "12px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            ← Back to History
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell hideNav>
      <div className="container py-6">
        {/* Header */}
        <div className="flex items-start gap-3 mb-6">
          <button
            onClick={() => navigate("/history")}
            style={{
              background: "oklch(14% 0 0)",
              border: "1px solid oklch(22% 0 0)",
              borderRadius: "10px",
              width: "38px",
              height: "38px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              marginTop: "2px",
            }}
          >
            <ArrowLeft size={18} style={{ color: "oklch(65% 0 0)" }} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "20px",
                fontWeight: 600,
                color: "oklch(92% 0 0)",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {session.name}
            </h1>
            <p style={{ fontSize: "12px", color: "oklch(45% 0 0)", margin: "4px 0 0", fontFamily: "var(--font-sans)" }}>
              {new Date(session.createdAt).toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric", year: "numeric",
              })}
              {session.status === "analyzed" && (
                <span style={{ color: "oklch(68% 0.12 75)", marginLeft: "8px" }}>· Analyzed</span>
              )}
            </p>
          </div>
          {/* Delete */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "oklch(40% 0 0)",
            }}
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Tags row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px", alignItems: "center" }}>
          {editTags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "4px 10px", borderRadius: "20px",
                background: "oklch(68% 0.12 75 / 0.12)", border: "1px solid oklch(68% 0.12 75 / 0.35)",
                color: "oklch(68% 0.12 75)", fontSize: "12px", fontFamily: "var(--font-sans)",
              }}
            >
              {tag}
              <button
                onClick={() => handleSaveTags(editTags.filter((t) => t !== tag))}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "oklch(68% 0.12 75 / 0.7)" }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </span>
          ))}
          {/* Quick add tag */}
          <TagQuickAdd currentTags={editTags} onAdd={(tag) => handleSaveTags([...editTags, tag])} />
        </div>

        {/* Delete Confirm */}
        {showDeleteConfirm && (
          <div
            style={{
              background: "oklch(13% 0 0)",
              border: "1px solid oklch(55% 0.2 25 / 0.3)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <p style={{ fontSize: "14px", color: "oklch(80% 0 0)", fontFamily: "var(--font-sans)", marginBottom: "12px" }}>
              Delete this session permanently?
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "oklch(18% 0 0)", border: "1px solid oklch(25% 0 0)", color: "oklch(70% 0 0)", fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{ flex: 1, padding: "10px", borderRadius: "8px", background: "oklch(55% 0.2 25 / 0.2)", border: "1px solid oklch(55% 0.2 25 / 0.4)", color: "oklch(75% 0.15 25)", fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Input Collapsibles */}
        <div style={{ marginBottom: "16px" }}>
          {/* Transcript */}
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            style={{
              width: "100%",
              background: "oklch(13% 0 0)",
              border: "1px solid oklch(22% 0 0)",
              borderRadius: showTranscript ? "10px 10px 0 0" : "10px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              marginBottom: showTranscript ? "0" : "8px",
            }}
          >
            <FileText size={14} style={{ color: "oklch(55% 0 0)" }} />
            <span style={{ flex: 1, fontSize: "13px", color: "oklch(65% 0 0)", fontFamily: "var(--font-sans)", textAlign: "left" }}>
              Transcript {editTranscript ? `(${editTranscript.length} chars)` : "(empty)"}
            </span>
            {showTranscript ? <ChevronUp size={14} style={{ color: "oklch(45% 0 0)" }} /> : <ChevronDown size={14} style={{ color: "oklch(45% 0 0)" }} />}
          </button>
          {showTranscript && (
            <textarea
              value={editTranscript}
              onChange={(e) => setEditTranscript(e.target.value)}
              rows={6}
              style={{
                width: "100%",
                background: "oklch(11% 0 0)",
                border: "1px solid oklch(22% 0 0)",
                borderTop: "none",
                borderRadius: "0 0 10px 10px",
                padding: "12px 14px",
                fontSize: "13px",
                color: "oklch(80% 0 0)",
                fontFamily: "var(--font-sans)",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.6,
                marginBottom: "8px",
              }}
            />
          )}

          {/* Personal Notes */}
          <button
            onClick={() => setShowNotes(!showNotes)}
            style={{
              width: "100%",
              background: "oklch(11.5% 0.005 75)",
              border: "1px solid oklch(68% 0.12 75 / 0.2)",
              borderRadius: showNotes ? "10px 10px 0 0" : "10px",
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
          >
            <Lock size={14} style={{ color: "oklch(68% 0.12 75)" }} />
            <span style={{ flex: 1, fontSize: "13px", color: "oklch(68% 0.12 75)", fontFamily: "var(--font-sans)", textAlign: "left" }}>
              Private Notes {editNotes ? `(${editNotes.length} chars)` : "(empty)"}
            </span>
            {showNotes ? <ChevronUp size={14} style={{ color: "oklch(68% 0.12 75)" }} /> : <ChevronDown size={14} style={{ color: "oklch(68% 0.12 75)" }} />}
          </button>
          {showNotes && (
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              rows={5}
              style={{
                width: "100%",
                background: "oklch(10.5% 0.005 75)",
                border: "1px solid oklch(68% 0.12 75 / 0.2)",
                borderTop: "none",
                borderRadius: "0 0 10px 10px",
                padding: "12px 14px",
                fontSize: "13px",
                color: "oklch(80% 0 0)",
                fontFamily: "var(--font-sans)",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.6,
              }}
            />
          )}
        </div>

        {/* Analyze / Re-analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full mb-6 transition-all duration-200 active:scale-[0.98]"
          style={{
            background: isAnalyzing ? "oklch(50% 0.08 75)" : "oklch(68% 0.12 75)",
            border: "none",
            borderRadius: "10px",
            padding: "13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: isAnalyzing ? "not-allowed" : "pointer",
            boxShadow: isAnalyzing ? "none" : "0 4px 16px oklch(68% 0.12 75 / 0.2)",
          }}
        >
          {isAnalyzing ? (
            <>
              <span style={{ width: "16px", height: "16px", border: "2px solid #0e0e0e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#0e0e0e", fontFamily: "var(--font-sans)" }}>Analyzing...</span>
            </>
          ) : (
            <>
              {session.status === "analyzed" ? <RotateCcw size={16} style={{ color: "#0e0e0e" }} /> : <Sparkles size={16} style={{ color: "#0e0e0e" }} />}
              <span style={{ fontSize: "15px", fontWeight: 700, color: "#0e0e0e", fontFamily: "var(--font-sans)" }}>
                {session.status === "analyzed" ? "Re-Analyze" : "Analyze"}
              </span>
            </>
          )}
        </button>

        {/* AI Output */}
        {aiOutput && (
          <div className="animate-fade-in-up">
            {/* Export actions */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              <button
                onClick={handleCopy}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px",
                  background: "oklch(14% 0 0)", border: "1px solid oklch(24% 0 0)",
                  color: "oklch(70% 0 0)", fontSize: "13px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <Copy size={14} /> Copy
              </button>
              <button
                onClick={handlePdfExport}
                style={{
                  flex: 1, padding: "10px", borderRadius: "8px",
                  background: "oklch(14% 0 0)", border: "1px solid oklch(24% 0 0)",
                  color: "oklch(70% 0 0)", fontSize: "13px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  fontFamily: "var(--font-sans)",
                }}
              >
                <FileDown size={14} /> Export
              </button>
            </div>

            {/* Summary */}
            <div
              style={{
                background: "oklch(11% 0 0)",
                border: "1px solid oklch(68% 0.12 75 / 0.2)",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              <SectionHeader
                icon={<Eye size={15} style={{ color: "oklch(68% 0.12 75)" }} />}
                title="Executive Summary"
              />
              <p style={{ fontSize: "14px", color: "oklch(82% 0 0)", lineHeight: 1.7, margin: 0, fontFamily: "var(--font-sans)" }}>
                {aiOutput.summary}
              </p>
            </div>

            {/* Key Decisions */}
            {aiOutput.keyDecisions?.length > 0 && (
              <div
                style={{
                  background: "oklch(11% 0 0)",
                  border: "1px solid oklch(22% 0 0)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "12px",
                }}
              >
                <SectionHeader
                  icon={<CheckCircle2 size={15} style={{ color: "oklch(65% 0.1 160)" }} />}
                  title="Key Decisions"
                  count={aiOutput.keyDecisions.length}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {aiOutput.keyDecisions.map((d, i) => (
                    <div key={i} style={{ paddingLeft: "12px", borderLeft: "2px solid oklch(65% 0.1 160 / 0.4)" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "oklch(85% 0 0)", margin: "0 0 3px", fontFamily: "var(--font-sans)" }}>{d.decision}</p>
                      {d.context && <p style={{ fontSize: "12px", color: "oklch(50% 0 0)", margin: 0, fontFamily: "var(--font-sans)" }}>{d.context}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {aiOutput.actionItems?.length > 0 && (
              <div
                style={{
                  background: "oklch(11% 0 0)",
                  border: "1px solid oklch(22% 0 0)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "12px",
                }}
              >
                <SectionHeader
                  icon={<CheckCircle2 size={15} style={{ color: "oklch(68% 0.12 75)" }} />}
                  title="Action Items"
                  count={aiOutput.actionItems.length}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {aiOutput.actionItems.map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1.5px solid oklch(30% 0 0)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                        <span style={{ fontSize: "9px", color: "oklch(45% 0 0)", fontFamily: "var(--font-sans)" }}>{i + 1}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <PriorityBadge priority={a.priority} />
                          {a.owner && a.owner !== "Not specified" && (
                            <span style={{ fontSize: "11px", color: "oklch(50% 0 0)", fontFamily: "var(--font-sans)" }}>→ {a.owner}</span>
                          )}
                        </div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "oklch(85% 0 0)", margin: "0 0 3px", fontFamily: "var(--font-sans)" }}>{a.task}</p>
                        {a.context && <p style={{ fontSize: "12px", color: "oklch(50% 0 0)", margin: 0, fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>{a.context}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {aiOutput.insights?.length > 0 && (
              <div
                style={{
                  background: "oklch(11% 0 0)",
                  border: "1px solid oklch(22% 0 0)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "12px",
                }}
              >
                <SectionHeader
                  icon={<Lightbulb size={15} style={{ color: "oklch(68% 0.12 75)" }} />}
                  title="Insights"
                  count={aiOutput.insights.length}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {aiOutput.insights.map((ins, i) => (
                    <div key={i} style={{ paddingLeft: "12px", borderLeft: "2px solid oklch(68% 0.12 75 / 0.3)" }}>
                      <p style={{ fontSize: "13px", color: "oklch(82% 0 0)", margin: "0 0 4px", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>{ins.insight}</p>
                      <SourceBadge source={ins.source} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Watch Items */}
            {aiOutput.watchItems?.length > 0 && (
              <div
                style={{
                  background: "oklch(11% 0 0)",
                  border: "1px solid oklch(55% 0.15 45 / 0.2)",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "12px",
                }}
              >
                <SectionHeader
                  icon={<ShieldAlert size={15} style={{ color: "oklch(65% 0.15 45)" }} />}
                  title="Watch Items"
                  count={aiOutput.watchItems.length}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {aiOutput.watchItems.map((w, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                      <AlertTriangle size={14} style={{ color: "oklch(65% 0.15 45)", flexShrink: 0, marginTop: "2px" }} />
                      <div style={{ flex: 1 }}>
                        <WatchTypeBadge type={w.type} />
                        <p style={{ fontSize: "13px", color: "oklch(80% 0 0)", margin: "4px 0 0", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>{w.item}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state — no analysis yet */}
        {!aiOutput && session.status !== "analyzed" && (
          <div
            className="flex flex-col items-center justify-center py-12 text-center animate-fade-in-up"
            style={{
              background: "oklch(11% 0 0)",
              border: "1px solid oklch(20% 0 0)",
              borderRadius: "12px",
            }}
          >
            <Sparkles size={32} style={{ color: "oklch(40% 0 0)", marginBottom: "12px" }} />
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "16px", color: "oklch(60% 0 0)", marginBottom: "6px" }}>
              Ready to analyze
            </p>
            <p style={{ fontSize: "13px", color: "oklch(40% 0 0)", fontFamily: "var(--font-sans)", maxWidth: "200px", lineHeight: 1.5 }}>
              Add your transcript and/or notes above, then hit Analyze.
            </p>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </AppShell>
  );
}
