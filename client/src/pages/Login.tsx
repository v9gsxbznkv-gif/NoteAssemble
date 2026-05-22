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
    <div style={{ background: "var(--background)", minHeight: "100vh", fontFamily: "var(--font-sans)", color: "var(--foreground)" }}>
      {/* Nav */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border)", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <picture>
              <source
                srcSet="/manus-storage/noteassemble_n_pen_dark_v3_66c1b3e6.png"
                media="(prefers-color-scheme: dark)"
              />
              <img
                src="https://d2xsxph8kpxj0f.cloudfront.net/310519663419960068/VAGE5Jp3b45KbifC3JSBbp/noteassemble_n_pen_v2-ZeZuxKzcbqzkjBZnUtJHrN.webp"
                alt="NoteAssemble"
                style={{ width: "36px", height: "36px", flexShrink: 0 }}
              />
            </picture>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "17px", fontWeight: 600, color: "var(--foreground)" }}>NoteAssemble</span>
        </div>
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: "8px 20px", borderRadius: "8px",
            background: "var(--primary)", color: "var(--primary-foreground)",
            border: "none", cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 600, fontSize: "13px", opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Loading..." : "Sign In"}
        </button>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "72px 24px 56px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 14px", borderRadius: "20px", background: "color-mix(in oklch, var(--primary) 12%, transparent)", border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)", marginBottom: "28px" }}>
          <Brain size={13} style={{ color: "var(--primary)" }} />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--primary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Meeting Intelligence</span>
        </div>

        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.15, letterSpacing: "-0.03em", margin: "0 0 20px" }}>
          Turn every meeting into<br />
          <span style={{ color: "var(--primary)" }}>actionable intelligence</span>
        </h1>

        <p style={{ fontSize: "clamp(14px, 2vw, 17px)", color: "var(--muted-foreground)", lineHeight: 1.65, maxWidth: "520px", margin: "0 auto 40px" }}>
          NoteAssemble captures your meeting transcripts and notes, extracts decisions and action items with AI, and keeps everything organized — so nothing falls through the cracks.
        </p>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            padding: "14px 36px", borderRadius: "12px",
            background: "var(--primary)", color: "var(--primary-foreground)",
            border: "none", cursor: loading ? "not-allowed" : "pointer",
            fontWeight: 700, fontSize: "16px",
            opacity: loading ? 0.7 : 1,
            transition: "transform 0.15s, opacity 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {loading ? "Loading..." : "Get Started Free"}
        </button>

        <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "14px" }}>
          Free to use · No credit card required
        </p>
      </div>

      {/* Feature grid */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "22px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "8px", background: "color-mix(in oklch, var(--primary) 12%, transparent)", border: "1px solid color-mix(in oklch, var(--primary) 25%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)", flexShrink: 0 }}>
                  {f.icon}
                </div>
                <h3 style={{ fontFamily: "var(--font-serif)", fontSize: "15px", fontWeight: 600, color: "var(--foreground)", margin: 0 }}>{f.title}</h3>
              </div>
              <p style={{ fontSize: "13px", color: "var(--muted-foreground)", lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: "12px", color: "var(--muted-foreground)", letterSpacing: "0.05em" }}>
          NoteAssemble &copy; {new Date().getFullYear()} &nbsp;·&nbsp; Your data is private and encrypted
        </p>
      </div>
    </div>
  );
}
