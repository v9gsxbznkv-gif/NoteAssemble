import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NewSession from "./pages/NewSession";
import History from "./pages/History";
import SessionDetail from "./pages/SessionDetail";
import Actions from "./pages/Actions";
import SharedSession from "./pages/SharedSession";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/new" component={NewSession} />
      <Route path="/history" component={History} />
      <Route path="/session/:id" component={SessionDetail} />
      <Route path="/actions" component={Actions} />
      <Route path="/share/:token" component={SharedSession} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="system" switchable={true}>
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(13% 0 0)",
                border: "1px solid oklch(22% 0 0)",
                color: "oklch(88% 0 0)",
                fontFamily: "var(--font-sans)",
              },
            }}
          />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
