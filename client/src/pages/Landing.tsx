import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";

const LOGO_LIGHT = "https://d2xsxph8kpxj0f.cloudfront.net/310519663419960068/VAGE5Jp3b45KbifC3JSBbp/noteassemble_n_pen_v2-ZeZuxKzcbqzkjBZnUtJHrN.webp";
const LOGO_DARK = "/manus-storage/noteassemble_n_pen_dark_v3_66c1b3e6.png";

// ─── Feature cards ─────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: "🎙️",
    title: "Paste or transcribe any meeting",
    body: "Drop in a transcript, paste notes, or connect Fireflies. NoteAssemble works with whatever you already use.",
  },
  {
    icon: "⚡",
    title: "AI extracts what matters",
    body: "Decisions, action items, owners, and deadlines — pulled automatically. No more re-reading notes to find what was agreed.",
  },
  {
    icon: "✅",
    title: "Action items that don't disappear",
    body: "Every action item lives in one place, tagged by context — Church, Real Estate, Personal — so nothing falls through the cracks.",
  },
  {
    icon: "🔗",
    title: "Share a clean read-only link",
    body: "Send anyone a shareable summary of the session. No login required on their end.",
  },
  {
    icon: "📱",
    title: "Works from your home screen",
    body: "Install it like an app. Open it between meetings. It's fast, mobile-first, and built for leaders on the move.",
  },
  {
    icon: "🔒",
    title: "Your notes stay yours",
    body: "Sessions are private by default. You control what gets shared and what stays internal.",
  },
];

// ─── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "I run 15+ meetings a week across three organizations. NoteAssemble is the first tool that actually keeps up.",
    name: "Chad Veach",
    title: "Executive Pastor & Church Consultant",
  },
  {
    quote: "The action item view alone is worth it. I used to lose follow-ups in my notes app. Not anymore.",
    name: "Real Estate Investor",
    title: "Multi-portfolio operator",
  },
  {
    quote: "I shared a session summary with my board in 30 seconds. They thought I had a dedicated EA.",
    name: "Nonprofit Director",
    title: "Operations leader",
  },
];

export default function Landing() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  // Redirect authenticated users straight to the dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, loading, navigate]);

  // Don't block render while auth loads — show landing page immediately.
  // Authenticated users are redirected by the useEffect above once loading completes.

  return (
    <div style={{ fontFamily: "var(--font-sans)", background: "var(--background)", color: "var(--foreground)", overflowX: "hidden" }}>

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "color-mix(in oklch, var(--background) 85%, transparent)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "56px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <picture>
            <source srcSet={LOGO_DARK} media="(prefers-color-scheme: dark)" />
            <img src={LOGO_LIGHT} alt="NoteAssemble" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
          </picture>
          <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "17px", color: "var(--foreground)", letterSpacing: "-0.02em" }}>
            NoteAssemble
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <a href="/pricing" style={{ fontSize: "13px", color: "var(--muted-foreground)", textDecoration: "none", padding: "6px 10px" }}>
            Pricing
          </a>
          <a
            href={getLoginUrl()}
            style={{
              fontSize: "13px", fontWeight: 600,
              background: "var(--primary)", color: "var(--primary-foreground)",
              padding: "8px 18px", borderRadius: "8px", textDecoration: "none",
              transition: "opacity 0.15s",
            }}
          >
            Get Started Free
          </a>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px 60px", maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
        <div style={{
          display: "inline-block",
          background: "color-mix(in oklch, var(--primary) 12%, transparent)",
          border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
          color: "var(--primary)",
          borderRadius: "20px", padding: "4px 14px",
          fontSize: "12px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase",
          marginBottom: "24px",
        }}>
          AI Meeting Intelligence
        </div>

        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(36px, 8vw, 56px)",
          fontWeight: 700, lineHeight: 1.1,
          letterSpacing: "-0.03em",
          color: "var(--foreground)",
          margin: "0 0 20px",
        }}>
          Every meeting.<br />
          <span style={{ color: "var(--primary)" }}>Every decision.</span><br />
          Nothing lost.
        </h1>

        <p style={{
          fontSize: "17px", lineHeight: 1.65,
          color: "var(--muted-foreground)",
          margin: "0 0 36px",
          maxWidth: "520px", marginLeft: "auto", marginRight: "auto",
        }}>
          NoteAssemble turns your meeting transcripts and notes into structured summaries,
          decisions, and action items — automatically. Built for leaders who run too many
          meetings to let anything slip.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href={getLoginUrl()}
            style={{
              display: "inline-block",
              background: "var(--primary)", color: "var(--primary-foreground)",
              padding: "14px 32px", borderRadius: "10px",
              fontWeight: 700, fontSize: "15px", textDecoration: "none",
              boxShadow: "0 4px 20px color-mix(in oklch, var(--primary) 35%, transparent)",
              transition: "opacity 0.15s",
            }}
          >
            Start Free — No Credit Card
          </a>
          <a
            href="/pricing"
            style={{
              display: "inline-block",
              background: "var(--secondary)", color: "var(--foreground)",
              border: "1px solid var(--border)",
              padding: "14px 28px", borderRadius: "10px",
              fontWeight: 600, fontSize: "15px", textDecoration: "none",
            }}
          >
            See Pricing
          </a>
        </div>

        <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "16px" }}>
          Free plan includes 10 sessions/month. No credit card required.
        </p>
      </section>

      {/* ── App preview mockup ───────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 80px", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 8px 40px color-mix(in oklch, var(--foreground) 8%, transparent)",
        }}>
          {/* Fake browser chrome */}
          <div style={{ background: "var(--secondary)", borderBottom: "1px solid var(--border)", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "oklch(65% 0.18 25)" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "oklch(75% 0.18 80)" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "oklch(65% 0.18 145)" }} />
            <div style={{ flex: 1, background: "var(--input)", borderRadius: "6px", padding: "4px 12px", fontSize: "11px", color: "var(--muted-foreground)", marginLeft: "8px" }}>
              noteassemble.com
            </div>
          </div>
          {/* Mock content */}
          <div style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "color-mix(in oklch, var(--primary) 15%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🎙️</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)" }}>Leadership Team — May 22</div>
                <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>Analyzed · 3 decisions · 7 action items</div>
              </div>
              <div style={{ marginLeft: "auto", padding: "3px 10px", borderRadius: "20px", background: "oklch(65% 0.18 145 / 0.15)", border: "1px solid oklch(65% 0.18 145 / 0.4)", color: "oklch(55% 0.18 145)", fontSize: "11px", fontWeight: 700 }}>ANALYZED</div>
            </div>
            {/* Mock action items */}
            {[
              { task: "Finalize Q3 budget proposal", priority: "HIGH", owner: "Chad", tag: "Church", done: false },
              { task: "Send updated lease terms to attorney", priority: "HIGH", owner: "Chad", tag: "Real Estate", done: false },
              { task: "Schedule follow-up with Blueprint 1122 client", priority: "MED", owner: "Chad", tag: "Consulting", done: true },
            ].map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 12px", borderRadius: "8px",
                background: item.done ? "var(--secondary)" : "var(--background)",
                border: "1px solid var(--border)",
                marginBottom: "6px",
                opacity: item.done ? 0.6 : 1,
              }}>
                <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: `2px solid ${item.done ? "var(--primary)" : "var(--border)"}`, background: item.done ? "var(--primary)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.done && <span style={{ color: "var(--primary-foreground)", fontSize: "10px" }}>✓</span>}
                </div>
                <span style={{ flex: 1, fontSize: "13px", color: "var(--foreground)", textDecoration: item.done ? "line-through" : "none", fontWeight: 500 }}>{item.task}</span>
                <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", background: item.priority === "HIGH" ? "oklch(55% 0.18 25 / 0.12)" : "color-mix(in oklch, var(--primary) 12%, transparent)", color: item.priority === "HIGH" ? "oklch(55% 0.18 25)" : "var(--primary)", border: `1px solid ${item.priority === "HIGH" ? "oklch(55% 0.18 25 / 0.35)" : "color-mix(in oklch, var(--primary) 35%, transparent)"}` }}>{item.priority}</span>
                <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>{item.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "60px 24px", background: "var(--secondary)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 700, textAlign: "center", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Built for leaders who move fast
          </h2>
          <p style={{ textAlign: "center", color: "var(--muted-foreground)", fontSize: "15px", margin: "0 0 48px" }}>
            Pastors. Consultants. Investors. Anyone running more meetings than they have time to process.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {FEATURES.map((f) => (
              <div key={f.title} style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "12px", padding: "20px",
              }}>
                <div style={{ fontSize: "24px", marginBottom: "10px" }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: "14px", margin: "0 0 6px", color: "var(--foreground)" }}>{f.title}</h3>
                <p style={{ fontSize: "13px", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.6 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: "680px", margin: "0 auto" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 700, textAlign: "center", margin: "0 0 48px", letterSpacing: "-0.02em" }}>
          Three steps. Done.
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {[
            { step: "01", title: "Add your meeting", body: "Paste a transcript, type your notes, or connect Fireflies to pull recordings automatically." },
            { step: "02", title: "Let AI do the work", body: "NoteAssemble extracts decisions, action items, owners, and key context — structured and ready in seconds." },
            { step: "03", title: "Act on what matters", body: "Review your action items by category (Church, Real Estate, Personal), set due dates, and track completion." },
          ].map((s) => (
            <div key={s.step} style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
              <div style={{
                flexShrink: 0, width: "44px", height: "44px", borderRadius: "50%",
                background: "color-mix(in oklch, var(--primary) 12%, transparent)",
                border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: "13px", color: "var(--primary)", fontFamily: "var(--font-sans)",
              }}>
                {s.step}
              </div>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: "16px", margin: "0 0 4px", color: "var(--foreground)" }}>{s.title}</h3>
                <p style={{ fontSize: "14px", color: "var(--muted-foreground)", margin: 0, lineHeight: 1.65 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section style={{ padding: "60px 24px", background: "var(--secondary)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, textAlign: "center", margin: "0 0 40px", letterSpacing: "-0.02em" }}>
            What leaders are saying
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "12px", padding: "20px",
              }}>
                <p style={{ fontSize: "14px", color: "var(--foreground)", lineHeight: 1.65, margin: "0 0 16px", fontStyle: "italic" }}>
                  "{t.quote}"
                </p>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px", color: "var(--foreground)" }}>{t.name}</div>
                  <div style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>{t.title}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ──────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(26px, 5vw, 36px)", fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          Simple pricing
        </h2>
        <p style={{ fontSize: "15px", color: "var(--muted-foreground)", margin: "0 0 36px", lineHeight: 1.65 }}>
          Start free. Upgrade when you need more. No contracts, cancel anytime.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          {[
            { name: "Free", price: "$0", desc: "10 sessions/month. Core AI analysis. Action item tracking.", cta: "Start Free", href: getLoginUrl(), highlight: false },
            { name: "Pro", price: "$12/mo", desc: "Unlimited sessions. Priority AI. Advanced export. Full history.", cta: "Start Pro", href: getLoginUrl(), highlight: true },
          ].map((p) => (
            <div key={p.name} style={{
              background: p.highlight ? "color-mix(in oklch, var(--primary) 8%, var(--card))" : "var(--card)",
              border: `1px solid ${p.highlight ? "color-mix(in oklch, var(--primary) 40%, transparent)" : "var(--border)"}`,
              borderRadius: "12px", padding: "24px",
              position: "relative",
            }}>
              {p.highlight && (
                <div style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "10px", padding: "2px 12px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>{p.name}</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "28px", fontWeight: 700, color: p.highlight ? "var(--primary)" : "var(--foreground)", marginBottom: "8px" }}>{p.price}</div>
              <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: "0 0 16px", lineHeight: 1.6 }}>{p.desc}</p>
              <a href={p.href} style={{
                display: "block", textAlign: "center",
                background: p.highlight ? "var(--primary)" : "var(--secondary)",
                color: p.highlight ? "var(--primary-foreground)" : "var(--foreground)",
                border: `1px solid ${p.highlight ? "var(--primary)" : "var(--border)"}`,
                padding: "10px", borderRadius: "8px",
                fontWeight: 600, fontSize: "13px", textDecoration: "none",
              }}>
                {p.cta}
              </a>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "12px", color: "var(--muted-foreground)" }}>
          Have a referral code? Enter it at checkout for a free month of Pro.
        </p>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section style={{
        padding: "80px 24px",
        background: "color-mix(in oklch, var(--primary) 8%, var(--background))",
        borderTop: "1px solid color-mix(in oklch, var(--primary) 20%, transparent)",
        textAlign: "center",
      }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(28px, 6vw, 42px)", fontWeight: 700, margin: "0 0 16px", letterSpacing: "-0.03em" }}>
          Stop losing decisions<br />in your notes app.
        </h2>
        <p style={{ fontSize: "16px", color: "var(--muted-foreground)", margin: "0 0 32px", maxWidth: "440px", marginLeft: "auto", marginRight: "auto", lineHeight: 1.65 }}>
          Join leaders who've replaced scattered notes with a system that actually tracks what needs to happen next.
        </p>
        <a
          href={getLoginUrl()}
          style={{
            display: "inline-block",
            background: "var(--primary)", color: "var(--primary-foreground)",
            padding: "16px 40px", borderRadius: "10px",
            fontWeight: 700, fontSize: "16px", textDecoration: "none",
            boxShadow: "0 4px 24px color-mix(in oklch, var(--primary) 40%, transparent)",
          }}
        >
          Get Started Free
        </a>
        <p style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "14px" }}>
          Free forever. No credit card. Takes 30 seconds.
        </p>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid var(--border)",
        padding: "24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: "12px",
        maxWidth: "900px", margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <picture>
            <source srcSet={LOGO_DARK} media="(prefers-color-scheme: dark)" />
            <img src={LOGO_LIGHT} alt="NoteAssemble" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
          </picture>
          <span style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: "14px" }}>NoteAssemble</span>
        </div>
        <div style={{ display: "flex", gap: "20px", fontSize: "12px", color: "var(--muted-foreground)" }}>
          <a href="/pricing" style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>Pricing</a>
          <a href={getLoginUrl()} style={{ color: "var(--muted-foreground)", textDecoration: "none" }}>Sign In</a>
        </div>
        <p style={{ fontSize: "12px", color: "var(--muted-foreground)", margin: 0 }}>
          © {new Date().getFullYear()} NoteAssemble
        </p>
      </footer>
    </div>
  );
}
