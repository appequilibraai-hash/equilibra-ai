import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import PublicLayout from "./components/PublicLayout";
import ProfileLayout from "./components/ProfileLayout";
import AnalyzeMeal from "./pages/AnalyzeMeal";
import About from "./pages/About";
import Onboarding from "./pages/Onboarding";
import ProfileProgress from "./pages/ProfileProgress";
import ProfileRecommendations from "./pages/ProfileRecommendations";
import ProfileSettings from "./pages/ProfileSettings";
import MealDetail from "./pages/MealDetail";
import { Login } from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";

// Public routes with header navigation
function PublicRoutes() {
  return (
    <PublicLayout>
      <Switch>
        <Route path="/" component={AnalyzeMeal} />
        <Route path="/analyze" component={AnalyzeMeal} />
        <Route path="/about" component={About} />
        <Route path="/onboarding" component={Onboarding} />
        <Route path="/login" component={Login} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route component={NotFound} />
      </Switch>
    </PublicLayout>
  );
}

// Profile routes (logged in area) with tabs
function ProfileRoutes() {
  return (
    <ProfileLayout>
      <Switch>
        <Route path="/profile" component={ProfileProgress} />
        <Route path="/profile/progress" component={ProfileProgress} />
        <Route path="/profile/recommendations" component={ProfileRecommendations} />
        <Route path="/profile/settings" component={ProfileSettings} />
        <Route path="/profile/meal/:id" component={MealDetail} />
        <Route component={NotFound} />
      </Switch>
    </ProfileLayout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={PublicRoutes} />
      <Route path="/analyze" component={PublicRoutes} />
      <Route path="/about" component={PublicRoutes} />
      <Route path="/onboarding" component={PublicRoutes} />
      <Route path="/login" component={PublicRoutes} />
      <Route path="/forgot-password" component={PublicRoutes} />
      <Route path="/reset-password" component={PublicRoutes} />
      
      {/* Profile routes (logged in) */}
      <Route path="/profile" component={ProfileRoutes} />
      <Route path="/profile/:rest*" component={ProfileRoutes} />
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
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
