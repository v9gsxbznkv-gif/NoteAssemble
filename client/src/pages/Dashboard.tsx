import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Search, Plus, ChevronRight, Brain, Calendar } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/AppShell";

function SessionCard({
  session,
  onClick,
}: {
  session: { id: number; name: string; createdAt: Date; status: string; transcript: string | null };
  onClick: () => void;
}) {
  const isAnalyzed = session.status === "analyzed";
  const date = new Date(session.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: isAnalyzed ? "oklch(68% 0.12 75 / 0.15)" : "oklch(16% 0 0)",
          border: `1px solid ${isAnalyzed ? "oklch(68% 0.12 75 / 0.3)" : "oklch(22% 0 0)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Brain
          size={18}
          style={{ color: isAnalyzed ? "oklch(68% 0.12 75)" : "oklch(45% 0 0)" }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "15px",
            fontWeight: 600,
            color: "oklch(90% 0 0)",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {session.name}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
          <Calendar size={11} style={{ color: "oklch(45% 0 0)" }} />
          <span style={{ fontSize: "12px", color: "oklch(45% 0 0)", fontFamily: "var(--font-sans)" }}>
            {date}
          </span>
          {isAnalyzed && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "oklch(68% 0.12 75)",
                background: "oklch(68% 0.12 75 / 0.12)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontFamily: "var(--font-sans)",
              }}
            >
              Analyzed
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={16} style={{ color: "oklch(35% 0 0)", flexShrink: 0 }} />
    </button>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  const { data: sessions, isLoading } = trpc.sessions.list.useQuery(
    { search: search || undefined },
    { enabled: isAuthenticated }
  );

  if (authLoading) {
    return (
      <AppShell>
        <div className="container py-8">
          <div className="skeleton h-8 w-48 mb-6" />
          <div className="skeleton h-12 w-full mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 w-full mb-3" />
          ))}
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-6">
          <p
            style={{
              fontSize: "12px",
              color: "oklch(50% 0 0)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "var(--font-sans)",
              marginBottom: "4px",
            }}
          >
            {greeting}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "26px",
              fontWeight: 600,
              color: "oklch(92% 0 0)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {firstName}
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "oklch(50% 0 0)",
              marginTop: "4px",
              fontFamily: "var(--font-sans)",
            }}
          >
            {sessions?.length ?? 0} session{sessions?.length !== 1 ? "s" : ""} captured
          </p>
        </div>

        {/* Search */}
        <div
          style={{
            position: "relative",
            marginBottom: "20px",
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "oklch(45% 0 0)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            placeholder="Search sessions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "oklch(13% 0 0)",
              border: "1px solid oklch(22% 0 0)",
              borderRadius: "10px",
              padding: "12px 14px 12px 40px",
              fontSize: "14px",
              color: "oklch(88% 0 0)",
              fontFamily: "var(--font-sans)",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "oklch(68% 0.12 75 / 0.5)")}
            onBlur={(e) => (e.target.style.borderColor = "oklch(22% 0 0)")}
          />
        </div>

        {/* New Session CTA */}
        <button
          onClick={() => navigate("/new")}
          className="w-full mb-6 transition-all duration-200 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, oklch(68% 0.12 75) 0%, oklch(60% 0.1 75) 100%)",
            border: "none",
            borderRadius: "12px",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            boxShadow: "0 4px 20px oklch(68% 0.12 75 / 0.2)",
          }}
        >
          <Plus size={20} style={{ color: "#0e0e0e" }} />
          <span
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "15px",
              fontWeight: 600,
              color: "#0e0e0e",
            }}
          >
            New Session
          </span>
        </button>

        {/* Session list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-3 animate-fade-in-up">
            {sessions.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onClick={() => navigate(`/session/${s.id}`)}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up"
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "16px",
                background: "oklch(13% 0 0)",
                border: "1px solid oklch(20% 0 0)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}
            >
              <Brain size={28} style={{ color: "oklch(40% 0 0)" }} />
            </div>
            <p
              style={{
                fontFamily: "var(--font-serif)",
                fontSize: "17px",
                fontWeight: 600,
                color: "oklch(60% 0 0)",
                marginBottom: "8px",
              }}
            >
              {search ? "No sessions found" : "No sessions yet"}
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "oklch(40% 0 0)",
                fontFamily: "var(--font-sans)",
                maxWidth: "220px",
                lineHeight: 1.5,
              }}
            >
              {search
                ? "Try a different search term."
                : "Capture your first meeting intelligence session."}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
