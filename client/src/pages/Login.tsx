import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { Brain, Zap, Share2, FileText, CheckSquare, Lock } from "lucide-react";

const FEATURES = [
  {
    icon: <Brain size={18} />,
    title: "AI-Powered Analysis",
    desc: "Paste a transcript or type notes — get a structured executive summary, key decisions, and action items in seconds.",
  },
  {
    icon: <CheckSquare size={18} />,
    title: "Action Item Tracking",
    desc: "Every action item is extracted, prioritized, and tracked across all your meetings in one place.",
  },
  {
    icon: <FileText size={18} />,
    title: "Import from Anywhere",
    desc: "Snap a photo of handwritten notes, paste from Notion or Apple Notes, or pull directly from Fireflies.",
  },
  {
    icon: <Share2 size={18} />,
    title: "Read-Only Sharing",
    desc: "Generate a secure share link for any session — stakeholders see the summary without needing an account.",
  },
  {
    icon: <Zap size={18} />,
    title: "Weekly Digest",
    desc: "Every Monday morning, get an automated digest of open action items and session highlights from the past week.",
  },
  {
    icon: <Lock size={18} />,
    title: "Private by Default",
    desc: "Your sessions, notes, and analysis are scoped to your account only. No one else can see your data.",
  },
];

export default function Login() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogin = () => {
    window.location.href = getLoginUrl();
  };

  return (
    <div style={{ background: "#0e0e0e", minHeight: "100vh", fontFamily: "var(--font-sans)" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid oklch(16% 0 0)", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "oklch(68% 0.12 75)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--font-serif)", fontSize: "16px", fontWeight: 700, color: "#0e0e0e", lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px", fontWeight: 600, color: "oklch(92% 0 0)" }}>NoteAssemble</span>
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: "8px 20px", borderRadius: "8px",
            background: "oklch(68% 0.12 75)", color: "#0e0e0e",
            border: "none", cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600, fontSize: "13px", opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Loading..." : "Sign In"}
        </button>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "72px 24px 56px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 14px", borderRadius: "20px", background: "oklch(68% 0.12 75 / 0.12)", border: "1px solid oklch(68% 0.12 75 / 0.3)", marginBottom: "28px" }}>
          <Brain size={13} style={{ color: "oklch(68% 0.12 75)" }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "oklch(68% 0.12 75)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Meeting Intelligence</span>
        </div>

        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 700, color: "oklch(94% 0 0)", lineHeight: 1.15, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
          Turn every meeting into<br />
          <span style={{ color: "oklch(68% 0.12 75)" }}>actionable intelligence</span>
        </h1>

        <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: "oklch(58% 0 0)", lineHeight: 1.65, maxWidth: "520px", margin: "0 auto 40px" }}>
          NoteAssemble captures your meeting transcripts and notes, extracts decisions and action items with AI, and keeps everything organized — so nothing falls through the cracks.
        </p>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: "14px 36px", borderRadius: "12px",
            background: "oklch(68% 0.12 75)", color: "#0e0e0e",
            border: "none", cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700, fontSize: "16px",
            boxShadow: "0 6px 28px oklch(68% 0.12 75 / 0.3)",
            opacity: loading ? 0.7 : 1,
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 10px 36px oklch(68% 0.12 75 / 0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 28px oklch(68% 0.12 75 / 0.3)"; }}
        >
          {loading ? "Loading..." : "Get Started Free"}
        </button>

        <p style={{ fontSize: "12px", color: "oklch(38% 0 0)", marginTop: "14px" }}>
          Free to use · No credit card required
        </p>
      </div>

      {/* Feature grid */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "16px",
        }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: "oklch(11% 0 0)",
                border: "1px solid oklch(18% 0 0)",
                borderRadius: "14px",
                padding: "22px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "oklch(68% 0.12 75 / 0.12)", border: "1px solid oklch(68% 0.12 75 / 0.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "oklch(68% 0.12 75)", flexShrink: 0 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "15px", fontWeight: 600, color: "oklch(88% 0 0)", margin: 0 }}>{f.title}</h3>
              </div>
              <p style={{ fontSize: "13px", color: "oklch(50% 0 0)", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid oklch(14% 0 0)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "oklch(32% 0 0)", letterSpacing: "0.05em" }}>
          NoteAssemble &copy; {new Date().getFullYear()} &nbsp;·&nbsp; Your data is private and encrypted
        </p>
      </div>
    </div>
  );
}
