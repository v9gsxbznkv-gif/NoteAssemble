import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Search, Plus, ChevronRight, Brain, Calendar, Tag, Zap } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/AppShell";
import { toast } from "sonner";

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
      <style>{`.tag-scroll::-webkit-scrollbar { display: none; }`}</style>
      <button
        className="tag-scroll"
        onClick={() => onSelect(null)}
        style={{
          flexShrink: 0, padding: "5px 12px", borderRadius: "20px",
          background: activeTag === null ? "var(--primary)" : "var(--secondary)",
          border: `1px solid ${activeTag === null ? "var(--primary)" : "var(--border)"}`,
          color: activeTag === null ? "var(--primary-foreground)" : "var(--muted-foreground)",
          fontSize: "12px", fontWeight: activeTag === null ? 600 : 400,
          fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
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
              flexShrink: 0, padding: "5px 12px", borderRadius: "20px",
              background: active ? "var(--primary)" : "var(--secondary)",
              border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
              color: active ? "var(--primary-foreground)" : "var(--muted-foreground)",
              fontSize: "12px", fontWeight: active ? 600 : 400,
              fontFamily: "var(--font-sans)", cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
            }}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

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
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div style={{
        width: "40px", height: "40px", borderRadius: "10px",
        background: isAnalyzed ? "color-mix(in oklch, var(--primary) 15%, transparent)" : "var(--secondary)",
        border: `1px solid ${isAnalyzed ? "color-mix(in oklch, var(--primary) 40%, transparent)" : "var(--border)"}`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Brain size={18} style={{ color: isAnalyzed ? "var(--primary)" : "var(--muted-foreground)" }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: "var(--font-serif)", fontSize: "15px", fontWeight: 600,
          color: "var(--foreground)", margin: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {session.name}
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
            <span key={tag} style={{
              fontSize: "10px", fontWeight: 500, letterSpacing: "0.04em",
              color: "var(--muted-foreground)", background: "var(--secondary)",
              border: "1px solid var(--border)",
              padding: "2px 6px", borderRadius: "4px", fontFamily: "var(--font-sans)",
            }}>
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span style={{ fontSize: "10px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
              +{tags.length - 2}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
    </button>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const { data: sessions, isLoading } = trpc.sessions.list.useQuery(
    { search: search || undefined },
    { enabled: isAuthenticated }
  );
  const { data: billing } = trpc.billing.getStatus.useQuery(undefined, { enabled: isAuthenticated });
  const createCheckout = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => { if (url) window.open(url, "_blank"); },
    onError: () => toast.error("Could not open checkout. Please try again."),
  });

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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading || !isAuthenticated) {
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

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-6">
          <p style={{ fontSize: "12px", color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "var(--font-sans)", marginBottom: "4px" }}>
            {greeting}
          </p>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "26px", fontWeight: 600, color: "var(--foreground)", margin: 0, lineHeight: 1.2 }}>
            {firstName}
          </h1>
          <p style={{ fontSize: "13px", color: "var(--muted-foreground)", marginTop: "4px", fontFamily: "var(--font-sans)" }}>
            {filteredSessions?.length ?? 0} session{filteredSessions?.length !== 1 ? "s" : ""}{activeTag ? ` · ${activeTag}` : " captured"}
          </p>
        </div>

        {/* Free plan usage bar */}
        {billing?.plan === "free" && billing.sessionsThisMonth !== null && (
          <div style={{ marginBottom: "16px", padding: "12px 14px", background: "var(--secondary)", borderRadius: "10px", border: "1px solid var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)" }}>
                {billing.sessionsThisMonth} / 10 sessions this month
              </span>
              <button
                onClick={() => createCheckout.mutate({ planKey: "pro", origin: window.location.origin })}
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "var(--font-sans)" }}
              >
                <Zap size={11} /> Upgrade
              </button>
            </div>
            <div style={{ height: "4px", background: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.min(100, (billing.sessionsThisMonth / 10) * 100)}%`, background: billing.sessionsThisMonth >= 10 ? "var(--destructive)" : "var(--primary)", borderRadius: "2px", transition: "width 0.3s" }} />
            </div>
          </div>
        )}

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)", pointerEvents: "none" }} />
          <input
            type="text"
            placeholder="Search sessions..."
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

        {/* New Session CTA */}
        <button
          onClick={() => navigate("/new")}
          className="w-full mb-6 transition-all duration-200 active:scale-[0.98]"
          style={{
            background: "var(--primary)",
            border: "none", borderRadius: "12px", padding: "14px 20px",
            display: "flex", alignItems: "center", gap: "10px",
            cursor: "pointer",
          }}
        >
          <Plus size={20} style={{ color: "var(--primary-foreground)" }} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "15px", fontWeight: 600, color: "var(--primary-foreground)" }}>
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
            <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "var(--secondary)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              {activeTag ? <Tag size={28} style={{ color: "var(--muted-foreground)" }} /> : <Brain size={28} style={{ color: "var(--muted-foreground)" }} />}
            </div>
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "17px", fontWeight: 600, color: "var(--muted-foreground)", marginBottom: "8px" }}>
              {search ? "No sessions found" : activeTag ? `No ${activeTag} sessions` : "No sessions yet"}
            </p>
            <p style={{ fontSize: "13px", color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", maxWidth: "220px", lineHeight: 1.5 }}>
              {search ? "Try a different search term." : activeTag ? `No sessions tagged "${activeTag}" yet.` : "Capture your first meeting intelligence session."}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
