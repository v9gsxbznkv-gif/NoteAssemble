import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import NewSession from "./pages/NewSession";
import History from "./pages/History";
import SessionDetail from "./pages/SessionDetail";
import Actions from "./pages/Actions";
import SharedSession from "./pages/SharedSession";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import FloatingRecordingBar from "./components/FloatingRecordingBar";
import ForPastors from "./pages/seo/ForPastors";
import ForChurchStaff from "./pages/seo/ForChurchStaff";
import ForConsultants from "./pages/seo/ForConsultants";
import ForExecutivePastors from "./pages/seo/ForExecutivePastors";
import FirefliesAlternative from "./pages/seo/FirefliesAlternative";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/login" component={Login} />
      <Route path="/new" component={NewSession} />
      <Route path="/history" component={History} />
      <Route path="/session/:id" component={SessionDetail} />
      <Route path="/actions" component={Actions} />
      <Route path="/share/:token" component={SharedSession} />
      <Route path="/settings" component={Settings} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/for/pastors" component={ForPastors} />
      <Route path="/for/church-staff" component={ForChurchStaff} />
      <Route path="/for/consultants" component={ForConsultants} />
      <Route path="/for/executive-pastors" component={ForExecutivePastors} />
      <Route path="/compare/fireflies-alternative" component={FirefliesAlternative} />
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
          <Toaster theme="system" />
          <FloatingRecordingBar />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
