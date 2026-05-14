import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Search, Brain, Calendar, ChevronRight, Clock, Tag } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/AppShell";

const PRESET_TAGS = ["Church", "Real Estate", "Consulting", "Construction", "STR", "Personal"];

function TagFilterChips({
  allTags,
  activeTag,
  onSelect,
}: {
  allTags: string[];
  activeTag: string | null;
  onSelect: (tag: string | null) => void;
}) {
  if (allTags.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "4px", marginBottom: "16px", scrollbarWidth: "none" }}>
      <button
        onClick={() => onSelect(null)}
        style={{
          flexShrink: 0, padding: "5px 12px", borderRadius: "20px",
          background: activeTag === null ? "var(--primary)" : "var(--secondary)",
          border: `1px solid ${activeTag === null ? "var(--primary)" : "var(--border)"}`,
          color: activeTag === null ? "var(--primary-foreground)" : "var(--muted-foreground)",
          fontSize: "12px", fontWeight: activeTag === null ? 600 : 400,
          fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
        }}
      >All</button>
      {allTags.map((tag) => {
        const active = activeTag === tag;
        return (
          <button
            key={tag}
            onClick={() => onSelect(active ? null : tag)}
            style={{
              flexShrink: 0, padding: "5px 12px", borderRadius: "20px",
              background: active ? "var(--primary)" : "var(--secondary)",
              border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
              color: active ? "var(--primary-foreground)" : "var(--muted-foreground)",
              fontSize: "12px", fontWeight: active ? 600 : 400,
              fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            }}
          >{tag}</button>
        );
      })}
    </div>
  );
}

export default function History() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const { data: sessions, isLoading } = trpc.sessions.list.useQuery(
    { search: search || undefined },
    { enabled: isAuthenticated }
  );

  const allTags = useMemo(() => {
    if (!sessions) return [];
    const tagSet = new Set<string>();
    sessions.forEach((s) => {
      try {
        const tags: string[] = s.tags ? JSON.parse(s.tags) : [];
        tags.forEach((t) => tagSet.add(t));
      } catch { /* ignore */ }
    });
    return Array.from(tagSet).sort((a, b) => {
      const ai = PRESET_TAGS.indexOf(a);
      const bi = PRESET_TAGS.indexOf(b);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (!sessions || !activeTag) return sessions;
    return sessions.filter((s) => {
      try {
        const tags: string[] = s.tags ? JSON.parse(s.tags) : [];
        return tags.includes(activeTag);
      } catch { return false; }
    });
  }, [sessions, activeTag]);

  if (authLoading) return null;

  return (
    <AppShell>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} style={{ color: "var(--primary)" }} />
            <p style={{ fontSize: "11px", color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-sans)" }}>
              Session History
            </p>
          </div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "24px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
            All Sessions
          </h1>
          {activeTag && (
            <p style={{ fontSize: "12px", color: "var(--primary)", marginTop: "4px", fontFamily: "var(--font-sans)" }}>
              Filtered: {activeTag}
            </p>
          )}
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search sessions, transcripts, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", background: "var(--input)", border: "1px solid var(--border)",
              borderRadius: "10px", padding: "12px 14px 12px 40px", fontSize: "14px",
              color: "var(--foreground)", fontFamily: "var(--font-sans)", outline: "none", transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--ring)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {/* Tag filter chips */}
        <TagFilterChips allTags={allTags} activeTag={activeTag} onSelect={setActiveTag} />

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        ) : filteredSessions && filteredSessions.length > 0 ? (
          <div className="space-y-3 animate-fade-in-up">
            {filteredSessions.map((s) => {
              const isAnalyzed = s.status === "analyzed";
              const date = new Date(s.createdAt).toLocaleDateString("en-US", {
                weekday: "short", month: "short", day: "numeric", year: "numeric",
              });
              const tags: string[] = (() => {
                try { return s.tags ? JSON.parse(s.tags) : []; }
                catch { return []; }
              })();
              return (
                <button
                  key={s.id}
                  onClick={() => navigate(`/session/${s.id}`)}
                  className="w-full text-left transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: "var(--card)", border: "1px solid var(--border)",
                    borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px",
                  }}
                >
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "10px",
                    background: isAnalyzed ? "color-mix(in oklch, var(--primary) 15%, transparent)" : "var(--secondary)",
                    border: `1px solid ${isAnalyzed ? "color-mix(in oklch, var(--primary) 35%, transparent)" : "var(--border)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Brain size={18} style={{ color: isAnalyzed ? "var(--primary)" : "var(--muted-foreground)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: "var(--font-serif)", fontSize: "15px", fontWeight: 600, color: "var(--foreground)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                      <Calendar size={11} style={{ color: "var(--muted-foreground)" }} />
                      <span style={{ fontSize: "12px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>{date}</span>
                      {isAnalyzed && (
                        <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--primary)", background: "color-mix(in oklch, var(--primary) 12%, transparent)", padding: "2px 6px", borderRadius: "4px", fontFamily: "var(--font-sans)" }}>
                          Analyzed
                        </span>
                      )}
                      {tags.slice(0, 2).map((tag) => (
                        <span key={tag} style={{ fontSize: "10px", fontWeight: 500, color: "var(--muted-foreground)", background: "var(--secondary)", border: "1px solid var(--border)", padding: "2px 6px", borderRadius: "4px", fontFamily: "var(--font-sans)" }}>
                          {tag}
                        </span>
                      ))}
                      {tags.length > 2 && (
                        <span style={{ fontSize: "10px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>+{tags.length - 2}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              {activeTag ? <Tag size={28} style={{ color: "var(--muted-foreground)" }} /> : <Brain size={28} style={{ color: "var(--muted-foreground)" }} />}
            </div>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "17px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "8px" }}>
              {search ? "No results found" : activeTag ? `No ${activeTag} sessions` : "No sessions yet"}
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", maxWidth: "220px", lineHeight: 1.5 }}>
              {search ? "Try different keywords." : activeTag ? `No sessions tagged "${activeTag}" yet.` : "Create your first session to get started."}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
