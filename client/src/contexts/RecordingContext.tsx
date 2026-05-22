import { createContext, useContext, useRef, useState, useCallback, useEffect, ReactNode } from "react";

export type RecordingState = "idle" | "recording" | "paused" | "transcribing";

interface RecordingContextValue {
  state: RecordingState;
  elapsed: number; // seconds
  audioChunks: BlobPart[];
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  streamRef: React.MutableRefObject<MediaStream | null>;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  audioCtxRef: React.MutableRefObject<AudioContext | null>;
  animFrameRef: React.MutableRefObject<number | null>;
  elapsedRef: React.MutableRefObject<number>;
  timerRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>;
  setState: (s: RecordingState) => void;
  setElapsed: (n: number) => void;
  setAudioChunks: React.Dispatch<React.SetStateAction<BlobPart[]>>;
  startTimer: () => void;
  stopTimer: () => void;
}

const RecordingContext = createContext<RecordingContextValue | null>(null);

export function RecordingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<RecordingState>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [audioChunks, setAudioChunks] = useState<BlobPart[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Keep elapsedRef in sync
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  return (
    <RecordingContext.Provider
      value={{
        state,
        elapsed,
        audioChunks,
        mediaRecorderRef,
        streamRef,
        analyserRef,
        audioCtxRef,
        animFrameRef,
        elapsedRef,
        timerRef,
        setState,
        setElapsed,
        setAudioChunks,
        startTimer,
        stopTimer,
      }}
    >
      {children}
    </RecordingContext.Provider>
  );
}

export function useRecording() {
  const ctx = useContext(RecordingContext);
  if (!ctx) throw new Error("useRecording must be used inside RecordingProvider");
  return ctx;
}
