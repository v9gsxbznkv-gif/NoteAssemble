import { useEffect } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";

interface Feature {
  icon: string;
  title: string;
  body: string;
}

interface SeoPageProps {
  title: string;
  metaDescription: string;
  headline: string;
  subheadline: string;
  heroCtaText?: string;
  features: Feature[];
  quote?: { text: string; author: string; role: string };
  howItWorks: string[];
  closingHeadline: string;
  closingBody: string;
}

export default function SeoPageLayout({
  title,
  metaDescription,
  headline,
  subheadline,
  heroCtaText = "Start Free",
  features,
  quote,
  howItWorks,
  closingHeadline,
  closingBody,
}: SeoPageProps) {
  const [, navigate] = useLocation();

  useEffect(() => {
    document.title = title;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = metaDescription;
  }, [title, metaDescription]);

  const loginUrl = getLoginUrl();

  return (
    <div style={{ fontFamily: "var(--font-sans)", background: "var(--background)", color: "var(--foreground)", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 960, margin: "0 auto" }}>
        <a href="/" style={{ fontWeight: 700, fontSize: 18, color: "var(--foreground)", textDecoration: "none", letterSpacing: "-0.5px" }}>
          NoteAssemble
        </a>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <a href="/pricing" style={{ fontSize: 14, color: "var(--muted-foreground)", textDecoration: "none" }}>Pricing</a>
          <a
            href={loginUrl}
            style={{ fontSize: 14, background: "#b45309", color: "#fff", padding: "7px 18px", borderRadius: 8, textDecoration: "none", fontWeight: 600 }}
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "72px 24px 48px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 46px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1px", marginBottom: 20 }}>
          {headline}
        </h1>
        <p style={{ fontSize: 18, color: "var(--muted-foreground)", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 36px" }}>
          {subheadline}
        </p>
        <a
          href={loginUrl}
          style={{ display: "inline-block", background: "#b45309", color: "#fff", padding: "14px 36px", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: "0 4px 20px rgba(180,83,9,0.35)" }}
        >
          {heroCtaText}
        </a>
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 12 }}>Free to start. Takes 30 seconds.</p>
      </section>

      {/* Features */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {features.map((f, i) => (
            <div key={i} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "28px 24px", background: "var(--card)" }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: "var(--muted-foreground)", lineHeight: 1.6 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quote */}
      {quote && (
        <section style={{ background: "var(--card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "48px 24px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: 20, fontStyle: "italic", lineHeight: 1.6, marginBottom: 16 }}>"{quote.text}"</p>
            <p style={{ fontSize: 14, color: "var(--muted-foreground)", fontWeight: 600 }}>{quote.author} · {quote.role}</p>
          </div>
        </section>
      )}

      {/* How it works */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 40, letterSpacing: "-0.5px" }}>How it works</h2>
        <ol style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          {howItWorks.map((step, i) => (
            <li key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <span style={{ background: "#b45309", color: "#fff", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {i + 1}
              </span>
              <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0, paddingTop: 4 }}>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Closing CTA */}
      <section style={{ background: "var(--card)", borderTop: "1px solid var(--border)", padding: "64px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16, letterSpacing: "-0.5px" }}>{closingHeadline}</h2>
        <p style={{ fontSize: 16, color: "var(--muted-foreground)", maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.7 }}>{closingBody}</p>
        <a
          href={loginUrl}
          style={{ display: "inline-block", background: "#b45309", color: "#fff", padding: "14px 36px", borderRadius: 10, fontWeight: 700, fontSize: 16, textDecoration: "none" }}
        >
          Start Free
        </a>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>
          © {new Date().getFullYear()} NoteAssemble ·{" "}
          <a href="/" style={{ color: "var(--muted-foreground)" }}>Home</a> ·{" "}
          <a href="/pricing" style={{ color: "var(--muted-foreground)" }}>Pricing</a>
        </p>
      </footer>
    </div>
  );
}
