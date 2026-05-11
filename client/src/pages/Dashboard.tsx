import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Search, Plus, ChevronRight, Brain, Calendar, Tag } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/AppShell";

// ─── Tag filter chips ──────────────────────────────────────────────────────────
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
    <div
      style={{
        display: "flex",
        gap: "6px",
        overflowX: "auto",
        paddingBottom: "4px",
        marginBottom: "16px",
        scrollbarWidth: "none",
      }}
    >
      <style>{`.tag-scroll::-webkit-scrollbar { display: none; }`}</style>
      <button
        className="tag-scroll"
        onClick={() => onSelect(null)}
        style={{
          flexShrink: 0,
          padding: "5px 12px",
          borderRadius: "20px",
          background: activeTag === null ? "oklch(68% 0.12 75 / 0.18)" : "oklch(14% 0 0)",
          border: `1px solid ${activeTag === null ? "oklch(68% 0.12 75 / 0.6)" : "oklch(22% 0 0)"}`,
          color: activeTag === null ? "oklch(68% 0.12 75)" : "oklch(55% 0 0)",
          fontSize: "12px",
          fontWeight: activeTag === null ? 600 : 400,
          fontFamily: "var(--font-sans)",
          cursor: "pointer",
          transition: "all 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        All
      </button>
      {allTags.map((tag) => {
        const active = activeTag === tag;
        return (
          <button
            key={tag}
            onClick={() => onSelect(active ? null : tag)}
            style={{
              flexShrink: 0,
              padding: "5px 12px",
              borderRadius: "20px",
              background: active ? "oklch(68% 0.12 75 / 0.18)" : "oklch(14% 0 0)",
              border: `1px solid ${active ? "oklch(68% 0.12 75 / 0.6)" : "oklch(22% 0 0)"}`,
              color: active ? "oklch(68% 0.12 75)" : "oklch(55% 0 0)",
              fontSize: "12px",
              fontWeight: active ? 600 : 400,
              fontFamily: "var(--font-sans)",
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

// ─── Session Card ──────────────────────────────────────────────────────────────
function SessionCard({
  session,
  onClick,
}: {
  session: { id: number; name: string; createdAt: Date; status: string; tags: string | null };
  onClick: () => void;
}) {
  const isAnalyzed = session.status === "analyzed";
  const date = new Date(session.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const tags: string[] = (() => {
    try { return session.tags ? JSON.parse(session.tags) : []; }
    catch { return []; }
  })();

  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-all duration-200 active:scale-[0.98]"
      style={{
        background: "oklch(11% 0 0)",
        border: "1px solid oklch(20% 0 0)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "40px", height: "40px", borderRadius: "10px",
          background: isAnalyzed ? "oklch(68% 0.12 75 / 0.15)" : "oklch(16% 0 0)",
          border: `1px solid ${isAnalyzed ? "oklch(68% 0.12 75 / 0.3)" : "oklch(22% 0 0)"}`,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <Brain size={18} style={{ color: isAnalyzed ? "oklch(68% 0.12 75)" : "oklch(45% 0 0)" }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-serif)", fontSize: "15px", fontWeight: 600,
            color: "oklch(90% 0 0)", margin: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {session.name}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
          <Calendar size={11} style={{ color: "oklch(45% 0 0)" }} />
          <span style={{ fontSize: "12px", color: "oklch(45% 0 0)", fontFamily: "var(--font-sans)" }}>{date}</span>
          {isAnalyzed && (
            <span style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "oklch(68% 0.12 75)", background: "oklch(68% 0.12 75 / 0.12)", padding: "2px 6px", borderRadius: "4px", fontFamily: "var(--font-sans)" }}>
              Analyzed
            </span>
          )}
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: "10px", fontWeight: 500, letterSpacing: "0.04em",
                color: "oklch(55% 0 0)", background: "oklch(16% 0 0)",
                border: "1px solid oklch(24% 0 0)",
                padding: "2px 6px", borderRadius: "4px", fontFamily: "var(--font-sans)",
              }}
            >
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span style={{ fontSize: "10px", color: "oklch(42% 0 0)", fontFamily: "var(--font-sans)" }}>
              +{tags.length - 2}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} style={{ color: "oklch(35% 0 0)", flexShrink: 0 }} />
    </button>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const { data: sessions, isLoading } = trpc.sessions.list.useQuery(
    { search: search || undefined },
    { enabled: isAuthenticated }
  );

  // Collect all unique tags across all sessions for the filter chips
  const allTags = useMemo(() => {
    if (!sessions) return [];
    const tagSet = new Set<string>();
    sessions.forEach((s) => {
      try {
        const tags: string[] = s.tags ? JSON.parse(s.tags) : [];
        tags.forEach((t) => tagSet.add(t));
      } catch { /* ignore */ }
    });
    // Sort: preset tags first, then alphabetical
    return Array.from(tagSet).sort((a, b) => {
      const ai = PRESET_TAGS.indexOf(a);
      const bi = PRESET_TAGS.indexOf(b);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return a.localeCompare(b);
    });
  }, [sessions]);

  // Client-side tag filter
  const filteredSessions = useMemo(() => {
    if (!sessions || !activeTag) return sessions;
    return sessions.filter((s) => {
      try {
        const tags: string[] = s.tags ? JSON.parse(s.tags) : [];
        return tags.includes(activeTag);
      } catch { return false; }
    });
  }, [sessions, activeTag]);

  if (authLoading) {
    return (
      <AppShell>
        <div className="container py-8">
          <div className="skeleton h-8 w-48 mb-6" />
          <div className="skeleton h-12 w-full mb-4" />
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full mb-3" />)}
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) { navigate("/login"); return null; }

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-6">
          <p style={{ fontSize: "12px", color: "oklch(50% 0 0)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>
            {greeting}
          </p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "26px", fontWeight: 600, color: "oklch(92% 0 0)", margin: 0, lineHeight: 1.2 }}>
            {firstName}
          </h1>
          <p style={{ fontSize: "13px", color: "oklch(50% 0 0)", marginTop: "4px", fontFamily: "var(--font-sans)" }}>
            {filteredSessions?.length ?? 0} session{filteredSessions?.length !== 1 ? "s" : ""}{activeTag ? ` · ${activeTag}` : " captured"}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "oklch(45% 0 0)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", background: "oklch(13% 0 0)", border: "1px solid oklch(22% 0 0)",
              borderRadius: "10px", padding: "12px 14px 12px 40px", fontSize: "14px",
              color: "oklch(88% 0 0)", fontFamily: "var(--font-sans)", outline: "none", transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "oklch(68% 0.12 75 / 0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "oklch(22% 0 0)")}
          />
        </div>

        {/* Tag filter chips */}
        <TagFilterChips allTags={allTags} activeTag={activeTag} onSelect={setActiveTag} />

        {/* New Session CTA */}
        <button
          onClick={() => navigate("/new")}
          className="w-full mb-6 transition-all duration-200 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, oklch(68% 0.12 75) 0%, oklch(60% 0.1 75) 100%)",
            border: "none", borderRadius: "12px", padding: "14px 20px",
            display: "flex", alignItems: "center", gap: "10px",
            cursor: "pointer", boxShadow: "0 4px 20px oklch(68% 0.12 75 / 0.2)",
          }}
        >
          <Plus size={20} style={{ color: "#0e0e0e" }} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 600, color: "#0e0e0e" }}>
            New Session
          </span>
        </button>

        {/* Session list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
          </div>
        ) : filteredSessions && filteredSessions.length > 0 ? (
          <div className="space-y-3 animate-fade-in-up">
            {filteredSessions.map((s) => (
              <SessionCard key={s.id} session={s} onClick={() => navigate(`/session/${s.id}`)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "oklch(13% 0 0)", border: "1px solid oklch(20% 0 0)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              {activeTag ? <Tag size={28} style={{ color: "oklch(40% 0 0)" }} /> : <Brain size={28} style={{ color: "oklch(40% 0 0)" }} />}
            </div>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "17px", fontWeight: 600, color: "oklch(60% 0 0)", marginBottom: "8px" }}>
              {search ? "No sessions found" : activeTag ? `No ${activeTag} sessions` : "No sessions yet"}
            </p>
            <p style={{ fontSize: "13px", color: "oklch(40% 0 0)", fontFamily: "var(--font-sans)", maxWidth: "220px", lineHeight: 1.5 }}>
              {search ? "Try a different search term." : activeTag ? `No sessions tagged "${activeTag}" yet.` : "Capture your first meeting intelligence session."}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
