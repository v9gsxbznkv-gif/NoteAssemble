import React, { createContext, useContext, useEffect, useState } from "react";

type ThemePreference = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: ResolvedTheme;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemePreference;
  switchable?: boolean;
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === "system") return getSystemTheme();
  return pref;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  switchable = false,
}: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme-preference") as ThemePreference | null;
      return stored ?? defaultTheme;
    }
    return defaultTheme;
  });

  const [theme, setTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(
      switchable
        ? ((localStorage.getItem("theme-preference") as ThemePreference | null) ?? defaultTheme)
        : defaultTheme
    )
  );

  // Apply .dark class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Listen for OS-level changes when preference is "system"
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  // Re-resolve whenever preference changes
  useEffect(() => {
    setTheme(resolveTheme(preference));
  }, [preference]);

  const setPreference = (p: ThemePreference) => {
    setPreferenceState(p);
    if (switchable) localStorage.setItem("theme-preference", p);
  };

  const toggleTheme = switchable
    ? () => setPreference(theme === "light" ? "dark" : "light")
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, preference, setPreference, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
