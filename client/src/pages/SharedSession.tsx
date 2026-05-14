import { trpc } from "@/lib/trpc";
import { useParams } from "wouter";
import { Eye, CheckCircle2, Lightbulb, ShieldAlert, Loader2 } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AiOutput {
  summary: string;
  keyDecisions: Array<{ decision: string; context: string }>;
  actionItems: Array<{ task: string; priority: string; context: string; owner: string }>;
  insights: Array<{ insight: string; source: string }>;
  watchItems: Array<{ item: string; type: string }>;
}

const PRIORITY_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  high: { bg: "oklch(45% 0.18 25 / 0.25)", color: "oklch(75% 0.15 25)", border: "oklch(55% 0.18 25 / 0.4)" },
  medium: { bg: "color-mix(in oklch, var(--primary) 15%, transparent)", color: "var(--primary)", border: "color-mix(in oklch, var(--primary) 35%, transparent)" },
  low: { bg: "oklch(45% 0.1 160 / 0.2)", color: "oklch(70% 0.1 160)", border: "oklch(55% 0.1 160 / 0.35)" },
};

export default function SharedSession() {
  const params = useParams<{ token: string }>();
  const token = params.token ?? "";

  const { data: session, isLoading, error } = trpc.sessions.getShared.useQuery(
    { token },
    { enabled: !!token, retry: false }
  );

  const aiOutput: AiOutput | null = (() => {
    try { return session?.aiOutput ? JSON.parse(session.aiOutput) : null; } catch { return null; }
  })();

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "24px" }}>
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "20px", color: "var(--foreground)", margin: 0 }}>Link Not Found</p>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "14px", color: "var(--muted-foreground)", textAlign: "center", margin: 0 }}>
          This share link has been revoked or doesn't exist.
        </p>
        <a href="/" style={{ color: "var(--primary)", fontFamily: "var(--font-sans)", fontSize: "13px", marginTop: "8px" }}>
          Open NoteAssemble
        </a>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--background)", padding: "0 0 60px" }}>
      {/* Header bar */}
      <div style={{ borderBottom: "1px solid var(--input)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: "16px", fontWeight: 700, color: "var(--primary)", letterSpacing: "-0.01em" }}>
          NoteAssemble
        </span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--muted-foreground)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Read-only
        </span>
      </div>

      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Session title */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "22px", fontWeight: 700, color: "var(--foreground)", margin: "0 0 6px", lineHeight: 1.3 }}>
            {session.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--muted-foreground)" }}>
              {new Date(session.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
            {session.parsedTags.map((tag) => (
              <span key={tag} style={{ padding: "2px 8px", borderRadius: "20px", background: "color-mix(in oklch, var(--primary) 12%, transparent)", border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)", color: "var(--primary)", fontSize: "11px", fontFamily: "var(--font-sans)" }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {!aiOutput ? (
          <div style={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
            <p style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", fontSize: "14px", margin: 0 }}>
              This session hasn't been analyzed yet.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Summary */}
            <div style={{ background: "var(--card)", border: "1px solid color-mix(in oklch, var(--primary) 20%, transparent)", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <Eye size={14} style={{ color: "var(--primary)" }} />
                <span style={{ fontFamily: "var(--font-serif)", fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>Executive Summary</span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.7, margin: 0, fontFamily: "var(--font-sans)" }}>{aiOutput.summary}</p>
            </div>

            {/* Key Decisions */}
            {aiOutput.keyDecisions?.length > 0 && (
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <CheckCircle2 size={14} style={{ color: "oklch(55% 0.15 160)" }} />
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>Key Decisions</span>
                  <span style={{ fontSize: "11px", color: "var(--muted-foreground)", background: "var(--secondary)", padding: "1px 7px", borderRadius: "20px", fontFamily: "var(--font-sans)" }}>{aiOutput.keyDecisions.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {aiOutput.keyDecisions.map((d, i) => (
                    <div key={i} style={{ paddingLeft: "12px", borderLeft: "2px solid oklch(55% 0.15 160 / 0.4)" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--foreground)", margin: "0 0 3px", fontFamily: "var(--font-sans)" }}>{d.decision}</p>
                      {d.context && <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0, fontFamily: "var(--font-sans)" }}>{d.context}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {aiOutput.actionItems?.length > 0 && (
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <CheckCircle2 size={14} style={{ color: "var(--primary)" }} />
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>Action Items</span>
                  <span style={{ fontSize: "11px", color: "var(--muted-foreground)", background: "var(--secondary)", padding: "1px 7px", borderRadius: "20px", fontFamily: "var(--font-sans)" }}>{aiOutput.actionItems.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {aiOutput.actionItems.map((a, i) => {
                    const pc = PRIORITY_COLORS[a.priority] ?? PRIORITY_COLORS.medium;
                    return (
                      <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        <span style={{ padding: "2px 7px", borderRadius: "4px", background: pc.bg, border: `1px solid ${pc.border}`, color: pc.color, fontSize: "10px", fontWeight: 700, fontFamily: "var(--font-sans)", letterSpacing: "0.06em", flexShrink: 0, marginTop: "2px" }}>
                          {a.priority.toUpperCase()}
                        </span>
                        <div>
                          <p style={{ fontSize: "13px", color: "var(--foreground)", margin: "0 0 2px", fontFamily: "var(--font-sans)", fontWeight: 500 }}>{a.task}</p>
                          {a.context && <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0, fontFamily: "var(--font-sans)" }}>{a.context}</p>}
                          {a.owner && a.owner !== "Not specified" && <p style={{ fontSize: "11px", color: "var(--muted-foreground)", margin: "2px 0 0", fontFamily: "var(--font-sans)" }}>→ {a.owner}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Insights */}
            {aiOutput.insights?.length > 0 && (
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <Lightbulb size={14} style={{ color: "var(--primary)" }} />
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>Insights</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {aiOutput.insights.map((ins, i) => (
                    <div key={i} style={{ paddingLeft: "12px", borderLeft: "2px solid color-mix(in oklch, var(--primary) 30%, transparent)" }}>
                      <p style={{ fontSize: "13px", color: "var(--foreground)", margin: "0 0 2px", fontFamily: "var(--font-sans)" }}>{ins.insight}</p>
                      <span style={{ fontSize: "11px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>{ins.source}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Watch Items */}
            {aiOutput.watchItems?.length > 0 && (
              <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <ShieldAlert size={14} style={{ color: "oklch(60% 0.15 45)" }} />
                  <span style={{ fontFamily: "var(--font-serif)", fontSize: "14px", fontWeight: 600, color: "var(--foreground)" }}>Watch Items</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {aiOutput.watchItems.map((w, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                      <span style={{ padding: "2px 7px", borderRadius: "4px", background: "oklch(55% 0.15 45 / 0.12)", border: "1px solid oklch(55% 0.15 45 / 0.3)", color: "oklch(60% 0.15 45)", fontSize: "10px", fontWeight: 600, fontFamily: "var(--font-sans)", letterSpacing: "0.05em", flexShrink: 0, marginTop: "2px", textTransform: "uppercase" }}>
                        {w.type}
                      </span>
                      <p style={{ fontSize: "13px", color: "var(--foreground)", margin: 0, fontFamily: "var(--font-sans)" }}>{w.item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--border)" }}>
            Shared via{" "}
            <a href="/" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>NoteAssemble</a>
            {" "}· Read-only view
          </p>
        </div>
      </div>
    </div>
  );
}
