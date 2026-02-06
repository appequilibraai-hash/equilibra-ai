import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import MealDetail from "./pages/MealDetail";
import History from "./pages/History";
import Progress from "./pages/Progress";
import Recommendations from "./pages/Recommendations";
import Settings from "./pages/Settings";

function DashboardRoutes() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/analyze" component={Analyze} />
        <Route path="/meal/:id" component={MealDetail} />
        <Route path="/history" component={History} />
        <Route path="/progress" component={Progress} />
        <Route path="/recommendations" component={Recommendations} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/404" component={NotFound} />
      {/* Dashboard routes with layout */}
      <Route path="/dashboard" component={DashboardRoutes} />
      <Route path="/analyze" component={DashboardRoutes} />
      <Route path="/meal/:id" component={DashboardRoutes} />
      <Route path="/history" component={DashboardRoutes} />
      <Route path="/progress" component={DashboardRoutes} />
      <Route path="/recommendations" component={DashboardRoutes} />
      <Route path="/settings" component={DashboardRoutes} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
