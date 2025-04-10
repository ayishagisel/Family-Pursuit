import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import FamilyTreePage from "@/pages/family-tree";
import EventsPage from "@/pages/events";
import DocumentsPage from "@/pages/documents";
import HelpNeededPage from "@/pages/help-needed";
import HousingIssuesPage from "@/pages/housing-issues";
import MessagesPage from "@/pages/messages";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import UnauthorizedPage from "@/pages/unauthorized";
import NotFound from "@/pages/not-found";
import "./styles.css";

function Router() {
  const [location] = useLocation();
  const isAuthPage = location === '/login' || location === '/register' || location === '/unauthorized';

  return (
    <>
      {isAuthPage ? (
        <Switch>
          <Route path="/login" component={LoginPage} />
          <Route path="/register" component={RegisterPage} />
          <Route path="/unauthorized" component={UnauthorizedPage} />
        </Switch>
      ) : (
        <MainLayout>
          <Switch>
            <Route path="/" component={() => <ProtectedRoute component={FamilyTreePage} />} />
            <Route path="/events" component={() => <ProtectedRoute component={EventsPage} />} />
            <Route path="/documents" component={() => <ProtectedRoute component={DocumentsPage} />} />
            <Route path="/help-needed" component={() => <ProtectedRoute component={HelpNeededPage} />} />
            <Route path="/housing-issues" component={() => <ProtectedRoute component={HousingIssuesPage} />} />
            <Route path="/messages" component={() => <ProtectedRoute component={MessagesPage} />} />
            {/* Auth routes */}
            <Route path="/login" component={LoginPage} />
            <Route path="/register" component={RegisterPage} />
            <Route path="/unauthorized" component={UnauthorizedPage} />
            {/* Fallback to 404 */}
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
      )}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
