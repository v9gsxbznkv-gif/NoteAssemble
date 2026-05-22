import { useRecording } from "@/contexts/RecordingContext";
import { useLocation } from "wouter";

function formatTime(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

export default function FloatingRecordingBar() {
  const { state, elapsed } = useRecording();
  const [, navigate] = useLocation();

  if (state === "idle") return null;

  const isTranscribing = state === "transcribing";
  const isPaused = state === "paused";

  return (
    <div
      onClick={() => navigate("/new")}
      style={{
        position: "fixed",
        bottom: "calc(64px + env(safe-area-inset-bottom, 0px) + 8px)",
        left: "12px",
        right: "12px",
        zIndex: 9999,
        background: isTranscribing
          ? "var(--primary)"
          : isPaused
          ? "oklch(55% 0.12 75)"
          : "oklch(48% 0.18 25)",
        borderRadius: "14px",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        userSelect: "none",
        transition: "background 0.2s",
      }}
    >
      {/* Pulse dot */}
      {!isTranscribing && (
        <span
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            background: isPaused ? "#fbbf24" : "#ff4444",
            flexShrink: 0,
            animation: isPaused ? "none" : "recPulse 1.2s ease-in-out infinite",
          }}
        />
      )}

      {/* Label */}
      <span
        style={{
          flex: 1,
          fontSize: "14px",
          fontWeight: 600,
          color: "#fff",
          letterSpacing: "0.01em",
        }}
      >
        {isTranscribing
          ? "Transcribing…"
          : isPaused
          ? `Recording paused · ${formatTime(elapsed)}`
          : `Recording · ${formatTime(elapsed)}`}
      </span>

      {/* Tap hint */}
      <span
        style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.75)",
          fontWeight: 500,
          flexShrink: 0,
        }}
      >
        Tap to return →
      </span>

      <style>{`
        @keyframes recPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>
    </div>
  );
}
