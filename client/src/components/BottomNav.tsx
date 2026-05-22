import { Home, PlusCircle, Clock, CheckSquare, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";

const tabs = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/new", label: "New", icon: PlusCircle },
  { path: "/actions", label: "Actions", icon: CheckSquare },
  { path: "/history", label: "History", icon: Clock },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "color-mix(in oklch, var(--background) 92%, transparent)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderTop: "1px solid var(--border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        {tabs.map(({ path, label, icon: Icon }) => {
          const isActive = path === "/dashboard" ? location === "/dashboard" || location === "/" : location.startsWith(path);
          return (
            <Link
              key={path}
              href={path}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200"
              style={{
                color: isActive ? "oklch(68% 0.12 75)" : "oklch(50% 0 0)",
                textDecoration: "none",
              }}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                style={{
                  filter: isActive ? "drop-shadow(0 0 6px oklch(68% 0.12 75 / 0.5))" : "none",
                  transition: "filter 0.2s",
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
