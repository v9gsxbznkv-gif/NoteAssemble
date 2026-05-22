import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CheckSquare, Square, ExternalLink, Calendar, X, Loader2, Search, ChevronDown } from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/AppShell";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

// ─── Priority config — uses CSS vars so it works in both themes ───────────────
const PRIORITY_CONFIG = {
  high: { label: "HIGH", color: "oklch(55% 0.18 25)", bg: "oklch(55% 0.18 25 / 0.12)", border: "oklch(55% 0.18 25 / 0.35)" },
  medium: { label: "MED", color: "var(--primary)", bg: "color-mix(in oklch, var(--primary) 12%, transparent)", border: "color-mix(in oklch, var(--primary) 35%, transparent)" },
  low: { label: "LOW", color: "var(--muted-foreground)", bg: "color-mix(in oklch, var(--muted-foreground) 10%, transparent)", border: "color-mix(in oklch, var(--muted-foreground) 25%, transparent)" },
};

type FilterMode = "all" | "open" | "done";
type PriorityFilter = "all" | "high" | "medium" | "low";

function isOverdue(dueDate: number | null | undefined, completed: boolean): boolean {
  if (!dueDate || completed) return false;
  return dueDate < Date.now();
}

function formatDueDate(dueDate: number | null | undefined): string | null {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dueMidnight = new Date(d);
  dueMidnight.setHours(0, 0, 0, 0);
  if (dueMidnight.getTime() === today.getTime()) return "Today";
  if (dueMidnight.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function msToDateInput(ms: number | null | undefined): string {
  if (!ms) return "";
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dateInputToMs(val: string): number | null {
  if (!val) return null;
  const [y, m, d] = val.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

export default function Actions() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [filterMode, setFilterMode] = useState<FilterMode>("open");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [activeTag, setActiveTag] = useState<string>("all"); // "all" or a tag name
  const [editingDueDateId, setEditingDueDateId] = useState<number | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

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
    onSettled: () => utils.actionItems.list.invalidate(),
  });

  const dueDateMutation = trpc.actionItems.setDueDate.useMutation({
    onMutate: async ({ id, dueDate }) => {
      await utils.actionItems.list.cancel();
      const prev = utils.actionItems.list.getData();
      utils.actionItems.list.setData(undefined, (old) =>
        old?.map((item) => (item.id === id ? { ...item, dueDate } : item))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.actionItems.list.setData(undefined, ctx.prev);
      toast.error("Failed to update due date");
    },
    onSettled: () => utils.actionItems.list.invalidate(),
  });

  const sessionNames = useMemo(() => {
    if (!items) return [];
    const names = Array.from(new Set(items.map((i) => i.sessionName).filter(Boolean)));
    return names.sort();
  }, [items]);

  // Collect all unique tags across all items
  const allTags = useMemo(() => {
    if (!items) return [];
    const tagSet = new Set<string>();
    items.forEach((i) => i.parsedTags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [items]);

  const hasActiveFilters = searchQuery.trim() !== "" || sessionFilter !== "all" || priorityFilter !== "all" || filterMode !== "open";

  const filtered = useMemo(() => {
    if (!items) return [];
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const modeMatch =
        filterMode === "all" ? true :
        filterMode === "open" ? !item.completed :
        item.completed;
      const priorityMatch = priorityFilter === "all" || item.priority === priorityFilter;
      const sessionMatch = sessionFilter === "all" || item.sessionName === sessionFilter;
      const tagMatch = activeTag === "all" || item.parsedTags.includes(activeTag);
      const searchMatch = !q || item.task.toLowerCase().includes(q) || (item.owner ?? "").toLowerCase().includes(q) || item.sessionName.toLowerCase().includes(q) || (item.context ?? "").toLowerCase().includes(q);
      return modeMatch && priorityMatch && sessionMatch && tagMatch && searchMatch;
    });
  }, [items, filterMode, priorityFilter, searchQuery, sessionFilter, activeTag]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setSessionFilter("all");
    setPriorityFilter("all");
    setFilterMode("open");
    setActiveTag("all");
  };

  const openCount = items?.filter((i) => !i.completed).length ?? 0;
  const doneCount = items?.filter((i) => i.completed).length ?? 0;
  const overdueCount = items?.filter((i) => isOverdue(i.dueDate, i.completed)).length ?? 0;

  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={24} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--background)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "24px" }}>
        <p style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", fontSize: "14px", textAlign: "center" }}>
          Sign in to view your action items.
        </p>
        <button
          onClick={() => window.location.href = getLoginUrl()}
          style={{ padding: "10px 24px", background: "var(--primary)", color: "var(--primary-foreground)", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "14px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <AppShell>
      <div style={{ minHeight: "100vh", background: "var(--background)", paddingBottom: "90px" }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
            <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "26px", fontWeight: 700, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>
              Open Actions
            </h1>
            {openCount > 0 && (
              <span style={{ background: "color-mix(in oklch, var(--primary) 15%, transparent)", color: "var(--primary)", border: "1px solid color-mix(in oklch, var(--primary) 40%, transparent)", borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-sans)" }}>
                {openCount} open
              </span>
            )}
            {overdueCount > 0 && (
              <span style={{ background: "oklch(55% 0.2 25 / 0.15)", color: "oklch(55% 0.2 25)", border: "1px solid oklch(55% 0.2 25 / 0.4)", borderRadius: "20px", padding: "2px 10px", fontSize: "12px", fontWeight: 700, fontFamily: "var(--font-sans)" }}>
                {overdueCount} overdue
              </span>
            )}
          </div>
          <p style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", fontSize: "13px", margin: "0 0 14px" }}>
            Action items extracted from all your sessions.
          </p>

          {/* Tag tabs — only show when there are tags */}
          {allTags.length > 0 && (
            <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px", marginBottom: "14px", scrollbarWidth: "none" }}>
              {(["all", ...allTags] as string[]).map((tag) => {
                const isActive = activeTag === tag;
                const count = tag === "all"
                  ? (items?.filter((i) => !i.completed).length ?? 0)
                  : (items?.filter((i) => !i.completed && i.parsedTags.includes(tag)).length ?? 0);
                return (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    style={{
                      flexShrink: 0,
                      padding: "6px 14px",
                      borderRadius: "20px",
                      background: isActive ? "var(--primary)" : "var(--secondary)",
                      border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                      color: isActive ? "var(--primary-foreground)" : "var(--muted-foreground)",
                      fontSize: "13px",
                      fontWeight: isActive ? 700 : 400,
                      fontFamily: "var(--font-sans)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "background 0.15s, color 0.15s, border-color 0.15s",
                    }}
                  >
                    {tag === "all" ? "All" : tag}
                    {count > 0 && (
                      <span style={{
                        marginLeft: "6px",
                        background: isActive ? "rgba(255,255,255,0.25)" : "color-mix(in oklch, var(--primary) 15%, transparent)",
                        color: isActive ? "var(--primary-foreground)" : "var(--primary)",
                        borderRadius: "10px",
                        padding: "1px 6px",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Search bar */}
          <div style={{ position: "relative", marginBottom: "10px" }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }} />
            <input
              type="text"
              placeholder="Search tasks, sessions, owners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "var(--input)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                padding: "9px 12px 9px 34px",
                fontSize: "13px",
                color: "var(--foreground)",
                fontFamily: "var(--font-sans)",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "var(--ring)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", display: "flex", alignItems: "center" }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Session filter dropdown */}
          {sessionNames.length > 1 && (
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
                style={{
                  width: "100%",
                  background: "var(--input)",
                  border: `1px solid ${sessionFilter !== "all" ? "var(--ring)" : "var(--border)"}`,
                  borderRadius: "10px",
                  padding: "8px 32px 8px 12px",
                  fontSize: "13px",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-sans)",
                  outline: "none",
                  appearance: "none",
                  cursor: "pointer",
                  boxSizing: "border-box",
                }}
              >
                <option value="all">All Sessions</option>
                {sessionNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown size={13} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }} />
            </div>
          )}

          {/* Filter chips row */}
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
                    background: active ? "var(--primary)" : "var(--secondary)",
                    border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
                    color: active ? "var(--primary-foreground)" : "var(--muted-foreground)",
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
            <div style={{ width: "1px", background: "var(--border)", margin: "0 2px" }} />
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
                    background: active && cfg ? cfg.bg : active ? "var(--secondary)" : "var(--secondary)",
                    border: `1px solid ${active && cfg ? cfg.border : active ? "var(--ring)" : "var(--border)"}`,
                    color: active && cfg ? cfg.color : active ? "var(--foreground)" : "var(--muted-foreground)",
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

        {/* Result count + clear filters */}
        {hasActiveFilters && (
          <div style={{ padding: "0 20px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
              {filtered.length} {filtered.length === 1 ? "item" : "items"} found
            </span>
            <button
              onClick={clearAllFilters}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary)", fontSize: "12px", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <X size={11} /> Clear filters
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: "0 20px" }}>
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "10px" }}>
              <Loader2 size={18} style={{ color: "var(--primary)", animation: "spin 1s linear infinite" }} />
              <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", fontSize: "13px" }}>Loading action items...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <CheckSquare size={36} style={{ color: "var(--muted-foreground)", margin: "0 auto 12px", display: "block" }} />
              <p style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", fontSize: "14px", margin: 0 }}>
                {searchQuery || sessionFilter !== "all"
                  ? "No items match your search."
                  : filterMode === "open" ? "No open action items. You're clear."
                  : filterMode === "done" ? "No completed items yet."
                  : "No action items found."}
              </p>
              {items?.length === 0 && (
                <p style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", fontSize: "12px", marginTop: "8px", opacity: 0.7 }}>
                  Analyze a session to auto-extract action items.
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map((item) => {
                const cfg = PRIORITY_CONFIG[item.priority];
                const overdue = isOverdue(item.dueDate, item.completed);
                const dueDateLabel = formatDueDate(item.dueDate);
                const isEditingThis = editingDueDateId === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      background: item.completed ? "var(--secondary)" : overdue ? "oklch(55% 0.18 25 / 0.06)" : "var(--card)",
                      border: `1px solid ${item.completed ? "var(--border)" : overdue ? "oklch(55% 0.18 25 / 0.4)" : "var(--border)"}`,
                      borderRadius: "12px",
                      padding: "14px 16px",
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      opacity: item.completed ? 0.6 : 1,
                      transition: "opacity 0.2s, border-color 0.2s",
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleMutation.mutate({ id: item.id, completed: !item.completed })}
                      disabled={toggleMutation.isPending}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 0 0", flexShrink: 0, color: item.completed ? "var(--primary)" : "var(--muted-foreground)" }}
                    >
                      {item.completed ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "14px", color: item.completed ? "var(--muted-foreground)" : overdue ? "oklch(55% 0.18 25)" : "var(--foreground)", fontFamily: "var(--font-sans)", fontWeight: 500, textDecoration: item.completed ? "line-through" : "none", flex: 1, minWidth: 0 }}>
                          {item.task}
                        </span>
                        <span style={{ padding: "2px 7px", borderRadius: "4px", background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, fontSize: "10px", fontWeight: 700, fontFamily: "var(--font-sans)", letterSpacing: "0.06em", flexShrink: 0 }}>
                          {cfg.label}
                        </span>
                      </div>

                      {item.context && (
                        <p style={{ fontSize: "12px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", margin: "0 0 6px", lineHeight: 1.5 }}>
                          {item.context}
                        </p>
                      )}

                      {/* Session context + due date row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                        <button
                          onClick={() => navigate(`/session/${item.sessionId}`)}
                          style={{ display: "flex", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", padding: 0, color: "var(--muted-foreground)", fontSize: "11px", fontFamily: "var(--font-sans)" }}
                        >
                          <ExternalLink size={10} />
                          {item.sessionName}
                        </button>
                        {item.parsedTags.slice(0, 2).map((tag) => (
                          <span key={tag} style={{ padding: "1px 6px", borderRadius: "10px", background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)", fontSize: "10px", fontFamily: "var(--font-sans)" }}>
                            {tag}
                          </span>
                        ))}
                        {item.owner && item.owner !== "Not specified" && (
                          <span style={{ fontSize: "11px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                            → {item.owner}
                          </span>
                        )}

                        {/* Due date display / editor */}
                        {!item.completed && (
                          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "4px" }}>
                            {isEditingThis ? (
                              <input
                                ref={dateInputRef}
                                type="date"
                                defaultValue={msToDateInput(item.dueDate)}
                                autoFocus
                                onChange={(e) => {
                                  const ms = dateInputToMs(e.target.value);
                                  dueDateMutation.mutate({ id: item.id, dueDate: ms });
                                  setEditingDueDateId(null);
                                }}
                                onBlur={() => setEditingDueDateId(null)}
                                style={{
                                  background: "var(--input)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "6px",
                                  color: "var(--foreground)",
                                  fontSize: "11px",
                                  padding: "2px 6px",
                                  fontFamily: "var(--font-sans)",
                                }}
                              />
                            ) : dueDateLabel ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                <button
                                  onClick={() => setEditingDueDateId(item.id)}
                                  style={{
                                    display: "flex", alignItems: "center", gap: "3px",
                                    background: overdue ? "oklch(55% 0.2 25 / 0.12)" : "var(--secondary)",
                                    border: `1px solid ${overdue ? "oklch(55% 0.2 25 / 0.5)" : "var(--border)"}`,
                                    borderRadius: "6px",
                                    color: overdue ? "oklch(55% 0.2 25)" : "var(--muted-foreground)",
                                    fontSize: "11px",
                                    padding: "2px 6px",
                                    cursor: "pointer",
                                    fontFamily: "var(--font-sans)",
                                    fontWeight: overdue ? 700 : 400,
                                  }}
                                >
                                  <Calendar size={9} />
                                  {overdue ? `Overdue · ${dueDateLabel}` : dueDateLabel}
                                </button>
                                <button
                                  onClick={() => dueDateMutation.mutate({ id: item.id, dueDate: null })}
                                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted-foreground)", padding: "2px", display: "flex", alignItems: "center" }}
                                  title="Clear due date"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setEditingDueDateId(item.id)}
                                style={{
                                  display: "flex", alignItems: "center", gap: "3px",
                                  background: "none",
                                  border: "1px dashed var(--border)",
                                  borderRadius: "6px",
                                  color: "var(--muted-foreground)",
                                  fontSize: "11px",
                                  padding: "2px 6px",
                                  cursor: "pointer",
                                  fontFamily: "var(--font-sans)",
                                }}
                              >
                                <Calendar size={9} />
                                Set due date
                              </button>
                            )}
                          </div>
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
