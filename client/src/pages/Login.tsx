import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";
import { useLocation } from "wouter";

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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#0e0e0e" }}
    >
      {/* Logo mark */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "oklch(68% 0.12 75)",
            boxShadow: "0 0 32px oklch(68% 0.12 75 / 0.3)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "28px",
              fontWeight: 700,
              color: "#0e0e0e",
              lineHeight: 1,
            }}
          >
            N
          </span>
        </div>
        <div className="text-center">
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "28px",
              fontWeight: 600,
              color: "oklch(92% 0 0)",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            NoteAssemble
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: "oklch(50% 0 0)",
              marginTop: "6px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: "var(--font-sans)",
            }}
          >
            Executive Intelligence
          </p>
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: "oklch(11% 0 0)",
          border: "1px solid oklch(20% 0 0)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "20px",
            fontWeight: 600,
            color: "oklch(92% 0 0)",
            marginBottom: "8px",
          }}
        >
          Welcome back
        </h2>
        <p
          style={{
            fontSize: "14px",
            color: "oklch(55% 0 0)",
            marginBottom: "28px",
            lineHeight: 1.5,
          }}
        >
          Sign in to access your meeting intelligence sessions.
        </p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95"
          style={{
            background: "oklch(68% 0.12 75)",
            color: "#0e0e0e",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: "15px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            boxShadow: "0 4px 16px oklch(68% 0.12 75 / 0.25)",
          }}
        >
          {loading ? "Loading..." : "Sign In with Manus"}
        </button>

        <p
          style={{
            fontSize: "12px",
            color: "oklch(40% 0 0)",
            textAlign: "center",
            marginTop: "20px",
            lineHeight: 1.5,
          }}
        >
          Your sessions and notes are private and encrypted.
        </p>
      </div>

      {/* Footer */}
      <p
        style={{
          fontSize: "11px",
          color: "oklch(35% 0 0)",
          marginTop: "32px",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        NoteAssemble &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}
