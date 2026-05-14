import { ReactNode } from "react";
import BottomNav from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
  /** Hide bottom nav on certain pages (e.g. session detail) */
  hideNav?: boolean;
}

export default function AppShell({ children, hideNav = false }: AppShellProps) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--background)", paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <main className="flex-1 overflow-y-auto">
        {children}
        {/* Spacer so content isn't hidden behind bottom nav */}
        {!hideNav && <div style={{ height: "calc(4.5rem + env(safe-area-inset-bottom, 0px))" }} />}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
