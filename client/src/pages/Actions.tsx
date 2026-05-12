import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CheckSquare, Square, ExternalLink, Filter, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/AppShell";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY_CONFIG = {
  high: { label: "HIGH", color: "oklch(65% 0.18 25)", bg: "oklch(65% 0.18 25 / 0.12)", border: "oklch(65% 0.18 25 / 0.35)" },
  medium: { label: "MED", color: "oklch(68% 0.12 75)", bg: "oklch(68% 0.12 75 / 0.12)", border: "oklch(68% 0.12 75 / 0.35)" },
  low: { label: "LOW", color: "oklch(55% 0 0)", bg: "oklch(55% 0 0 / 0.1)", border: "oklch(55% 0 0 / 0.25)" },
};

type FilterMode = "all" | "open" | "done";
type PriorityFilter = "all" | "high" | "medium" | "low";

export default function Actions() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [filterMode, setFilterMode] = useState<FilterMode>("open");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  const utils = trpc.useUtils();
  const { data: items, isLoading } = trpc.actionItems.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const toggleMutation = trpc.actionItems.toggle.useMutation({
    onMutate: async ({ id, completed }) => {
      await utils.actionItems.list.cancel();
      const prev = utils.actionItems.list.getData();
      utils.actionItems.list.setData(undefined, (old) =>
        old?.map((item) => (item.id === id ? { ...item, completed } : item))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.actionItems.list.setData(undefined, ctx.prev);
      toast.error("Failed to update action item");
    },
    onSettled: () => {
      utils.actionItems.list.invalidate();
    },
  });

  const filtered = useMemo(() => {
    if (!items) return [];
    return items.filter((item) => {
      const modeMatch =
        filterMode === "all" ? true :
        filterMode === "open" ? !item.completed :
        item.completed;
      const priorityMatch = priorityFilter === "all" || item.priority === priorityFilter;
      return modeMatch && priorityMatch;
    });
  }, [items, filterMode, priorityFilter]);

  const openCount = items?.filter((i) => !i.completed).length ?? 0;
  const doneCount = items?.filter((i) => i.completed).length ?? 0;

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0e0e", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} style={{ color: "oklch(68% 0.12 75)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "#0e0e0e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "24px" }}>
        <p style={{ color: "oklch(55% 0 0)", fontFamily: "var(--font-sans)", fontSize: "14px", textAlign: "center" }}>
          Sign in to view your action items.
        </p>
        <button
          onClick={() => window.location.href = getLoginUrl()}
          style={{ padding: "10px 24px", background: "oklch(68% 0.12 75)", color: "#0e0e0e", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <AppShell>
      <div style={{ minHeight: "100vh", background: "#0e0e0e", paddingBottom: "90px" }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "26px", fontWeight: 700, color: "oklch(92% 0 0)", margin: 0, letterSpacing: "-0.02em" }}>
              Open Actions
            </h1>
            {openCount > 0 && (
              <span style={{ background: "oklch(68% 0.12 75 / 0.18)", color: "oklch(68% 0.12 75)", border: "1px solid oklch(68% 0.12 75 / 0.4)", borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-sans)" }}>
                {openCount} open
              </span>
            )}
          </div>
          <p style={{ color: "oklch(45% 0 0)", fontFamily: "var(--font-sans)", fontSize: "13px", margin: "0 0 20px" }}>
            Action items extracted from all your sessions.
          </p>

          {/* Filter row */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
            {(["open", "done", "all"] as FilterMode[]).map((mode) => {
              const active = filterMode === mode;
              const label = mode === "open" ? `Open (${openCount})` : mode === "done" ? `Done (${doneCount})` : "All";
              return (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "20px",
                    background: active ? "oklch(68% 0.12 75 / 0.18)" : "oklch(14% 0 0)",
                    border: `1px solid ${active ? "oklch(68% 0.12 75 / 0.5)" : "oklch(22% 0 0)"}`,
                    color: active ? "oklch(68% 0.12 75)" : "oklch(50% 0 0)",
                    fontSize: "12px",
                    fontWeight: active ? 700 : 400,
                    fontFamily: "var(--font-sans)",
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                >
                  {label}
                </button>
              );
            })}
            <div style={{ width: "1px", background: "oklch(20% 0 0)", margin: "0 2px" }} />
            {(["all", "high", "medium", "low"] as PriorityFilter[]).map((p) => {
              const active = priorityFilter === p;
              const cfg = p === "all" ? null : PRIORITY_CONFIG[p];
              return (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: "20px",
                    background: active && cfg ? cfg.bg : active ? "oklch(20% 0 0)" : "oklch(14% 0 0)",
                    border: `1px solid ${active && cfg ? cfg.border : active ? "oklch(30% 0 0)" : "oklch(22% 0 0)"}`,
                    color: active && cfg ? cfg.color : active ? "oklch(70% 0 0)" : "oklch(45% 0 0)",
                    fontSize: "11px",
                    fontWeight: active ? 700 : 400,
                    fontFamily: "var(--font-sans)",
                    cursor: "pointer",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {p === "all" ? "All Priority" : cfg?.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "0 20px" }}>
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "10px" }}>
              <Loader2 size={18} style={{ color: "oklch(68% 0.12 75)", animation: "spin 1s linear infinite" }} />
              <span style={{ color: "oklch(45% 0 0)", fontFamily: "var(--font-sans)", fontSize: "13px" }}>Loading action items...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <CheckSquare size={36} style={{ color: "oklch(25% 0 0)", margin: "0 auto 12px", display: "block" }} />
              <p style={{ color: "oklch(40% 0 0)", fontFamily: "var(--font-sans)", fontSize: "14px", margin: 0 }}>
                {filterMode === "open" ? "No open action items. You're clear." :
                 filterMode === "done" ? "No completed items yet." :
                 "No action items found."}
              </p>
              {items?.length === 0 && (
                <p style={{ color: "oklch(35% 0 0)", fontFamily: "var(--font-sans)", fontSize: "12px", marginTop: "8px" }}>
                  Analyze a session to auto-extract action items.
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map((item) => {
                const cfg = PRIORITY_CONFIG[item.priority];
                return (
                  <div
                    key={item.id}
                    style={{
                      background: item.completed ? "oklch(11% 0 0)" : "oklch(13% 0 0)",
                      border: `1px solid ${item.completed ? "oklch(18% 0 0)" : "oklch(20% 0 0)"}`,
                      borderRadius: "12px",
                      padding: "14px 16px",
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      opacity: item.completed ? 0.55 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleMutation.mutate({ id: item.id, completed: !item.completed })}
                      disabled={toggleMutation.isPending}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0 0", flexShrink: 0, color: item.completed ? "oklch(68% 0.12 75)" : "oklch(35% 0 0)" }}
                    >
                      {item.completed
                        ? <CheckSquare size={18} />
                        : <Square size={18} />}
                    </button>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", color: item.completed ? "oklch(45% 0 0)" : "oklch(88% 0 0)", fontFamily: "var(--font-sans)", fontWeight: 500, textDecoration: item.completed ? "line-through" : "none", flex: 1, minWidth: 0 }}>
                          {item.task}
                        </span>
                        <span style={{ padding: "2px 7px", borderRadius: "4px", background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: "10px", fontWeight: 700, fontFamily: "var(--font-sans)", letterSpacing: "0.06em", flexShrink: 0 }}>
                          {cfg.label}
                        </span>
                      </div>

                      {item.context && (
                        <p style={{ fontSize: "12px", color: "oklch(48% 0 0)", fontFamily: "var(--font-sans)", margin: "0 0 6px", lineHeight: 1.5 }}>
                          {item.context}
                        </p>
                      )}

                      {/* Session context */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => navigate(`/session/${item.sessionId}`)}
                          style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", padding: 0, color: "oklch(40% 0 0)", fontSize: "11px", fontFamily: "var(--font-sans)" }}
                        >
                          <ExternalLink size={10} />
                          {item.sessionName}
                        </button>
                        {item.parsedTags.slice(0, 2).map((tag) => (
                          <span key={tag} style={{ padding: "1px 6px", borderRadius: "10px", background: "oklch(16% 0 0)", border: "1px solid oklch(22% 0 0)", color: "oklch(42% 0 0)", fontSize: "10px", fontFamily: "var(--font-sans)" }}>
                            {tag}
                          </span>
                        ))}
                        {item.owner && item.owner !== "Chad" && (
                          <span style={{ fontSize: "11px", color: "oklch(38% 0 0)", fontFamily: "var(--font-sans)" }}>
                            → {item.owner}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
