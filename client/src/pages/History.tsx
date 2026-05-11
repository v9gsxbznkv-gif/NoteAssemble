import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Search, Brain, Calendar, ChevronRight, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/AppShell";

export default function History() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [isAuthenticated, authLoading, navigate]);

  const { data: sessions, isLoading } = trpc.sessions.list.useQuery(
    { search: search || undefined },
    { enabled: isAuthenticated }
  );

  if (authLoading) return null;

  return (
    <AppShell>
      <div className="container py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} style={{ color: "oklch(68% 0.12 75)" }} />
            <p
              style={{
                fontSize: "11px",
                color: "oklch(50% 0 0)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: "var(--font-sans)",
              }}
            >
              Session History
            </p>
          </div>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "24px",
              fontWeight: 600,
              color: "oklch(92% 0 0)",
              margin: 0,
            }}
          >
            All Sessions
          </h1>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "20px" }}>
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
            placeholder="Search sessions, transcripts, notes..."
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

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-16 w-full" />
            ))}
          </div>
        ) : sessions && sessions.length > 0 ? (
          <div className="space-y-3 animate-fade-in-up">
            {sessions.map((s) => {
              const isAnalyzed = s.status === "analyzed";
              const date = new Date(s.createdAt).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <button
                  key={s.id}
                  onClick={() => navigate(`/session/${s.id}`)}
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
                    <Brain size={18} style={{ color: isAnalyzed ? "oklch(68% 0.12 75)" : "oklch(45% 0 0)" }} />
                  </div>
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
                      {s.name}
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
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in-up">
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
              {search ? "No results found" : "No sessions yet"}
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
              {search ? "Try different keywords." : "Create your first session to get started."}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
