import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Sparkles, FileText, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/AppShell";
import { toast } from "sonner";

export default function NewSession() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [personalNotes, setPersonalNotes] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const utils = trpc.useUtils();

  const createSession = trpc.sessions.create.useMutation();
  const analyzeSession = trpc.sessions.analyze.useMutation();

  const handleAnalyze = async () => {
    if (!name.trim()) {
      toast.error("Please give this session a name.");
      return;
    }
    if (!transcript.trim() && !personalNotes.trim()) {
      toast.error("Please add a transcript or personal notes before analyzing.");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Create session first
      const { id } = await createSession.mutateAsync({
        name: name.trim(),
        transcript,
        personalNotes,
      });

      // Run AI analysis
      const result = await analyzeSession.mutateAsync({ id, transcript, personalNotes });

      // Invalidate session list
      await utils.sessions.list.invalidate();

      toast.success("Analysis complete.");
      navigate(`/session/${id}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Analysis failed. Please try again.";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!name.trim()) {
      toast.error("Please give this session a name.");
      return;
    }
    try {
      const { id } = await createSession.mutateAsync({
        name: name.trim(),
        transcript,
        personalNotes,
      });
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
            }}
          >
            <ArrowLeft size={18} style={{ color: "oklch(65% 0 0)" }} />
          </button>
          <div>
            <h1
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "20px",
                fontWeight: 600,
                color: "oklch(92% 0 0)",
                margin: 0,
              }}
            >
              New Session
            </h1>
            <p style={{ fontSize: "12px", color: "oklch(45% 0 0)", margin: 0, fontFamily: "var(--font-sans)" }}>
              Capture your meeting intelligence
            </p>
          </div>
        </div>

        {/* Session Name */}
        <div className="mb-5">
          <label
            style={{
              display: "block",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "oklch(55% 0 0)",
              marginBottom: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            Session Name
          </label>
          <input
            type="text"
            placeholder="e.g. Sunday Staff Meeting"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%",
              background: "oklch(13% 0 0)",
              border: "1px solid oklch(22% 0 0)",
              borderRadius: "10px",
              padding: "13px 14px",
              fontSize: "15px",
              color: "oklch(90% 0 0)",
              fontFamily: "var(--font-serif)",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "oklch(68% 0.12 75 / 0.6)")}
            onBlur={(e) => (e.target.style.borderColor = "oklch(22% 0 0)")}
          />
        </div>

        {/* Transcript */}
        <div className="mb-5">
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "oklch(55% 0 0)",
              marginBottom: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            <FileText size={12} />
            Meeting Transcript
          </label>
          <textarea
            placeholder="Paste your Fireflies, Otter, or other transcript here — or type what was discussed..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={7}
            style={{
              width: "100%",
              background: "oklch(13% 0 0)",
              border: "1px solid oklch(22% 0 0)",
              borderRadius: "10px",
              padding: "13px 14px",
              fontSize: "14px",
              color: "oklch(88% 0 0)",
              fontFamily: "var(--font-sans)",
              outline: "none",
              resize: "vertical",
              lineHeight: 1.6,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "oklch(68% 0.12 75 / 0.6)")}
            onBlur={(e) => (e.target.style.borderColor = "oklch(22% 0 0)")}
          />
        </div>

        {/* Personal Notes */}
        <div className="mb-6">
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "oklch(68% 0.12 75)",
              marginBottom: "8px",
              fontFamily: "var(--font-sans)",
            }}
          >
            <Lock size={12} />
            Private Notes
          </label>
          <textarea
            placeholder="Your private thoughts, reactions, and observations — what you were thinking but didn't say aloud..."
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              background: "oklch(11.5% 0.005 75)",
              border: "1px solid oklch(68% 0.12 75 / 0.2)",
              borderRadius: "10px",
              padding: "13px 14px",
              fontSize: "14px",
              color: "oklch(88% 0 0)",
              fontFamily: "var(--font-sans)",
              outline: "none",
              resize: "vertical",
              lineHeight: 1.6,
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "oklch(68% 0.12 75 / 0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "oklch(68% 0.12 75 / 0.2)")}
          />
          <p
            style={{
              fontSize: "11px",
              color: "oklch(40% 0 0)",
              marginTop: "6px",
              fontFamily: "var(--font-sans)",
            }}
          >
            These notes are private and treated with equal weight in the AI analysis.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={isAnalyzing || createSession.isPending}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: "10px",
              background: "oklch(14% 0 0)",
              border: "1px solid oklch(24% 0 0)",
              color: "oklch(70% 0 0)",
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            Save Draft
          </button>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || createSession.isPending}
            style={{
              flex: 2,
              padding: "13px",
              borderRadius: "10px",
              background: isAnalyzing
                ? "oklch(50% 0.08 75)"
                : "oklch(68% 0.12 75)",
              border: "none",
              color: "#0e0e0e",
              fontSize: "15px",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              cursor: isAnalyzing ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: isAnalyzing ? "none" : "0 4px 16px oklch(68% 0.12 75 / 0.25)",
              transition: "all 0.2s",
            }}
          >
            {isAnalyzing ? (
              <>
                <span
                  style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid #0e0e0e",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    display: "inline-block",
                  }}
                />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Analyze
              </>
            )}
          </button>
        </div>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </AppShell>
  );
}
