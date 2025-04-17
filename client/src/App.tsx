import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import MainLayout from "@/components/layout/MainLayout";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useState, useEffect } from "react";

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
import LandingPage from "@/pages/landing-page";
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
  const [showLanding, setShowLanding] = useState(true);
  
  // Check if the user has already seen the landing page
  useEffect(() => {
    // For testing purposes, always remove the flag (can be changed to persist once tested)
    localStorage.removeItem('hasSeenLanding');
    const hasSeenLanding = localStorage.getItem('hasSeenLanding');
    
    // Skip landing page if the URL has parameters or the landing has been seen in this session
    if (window.location.search || window.location.hash || hasSeenLanding) {
      setShowLanding(false);
    } else {
      // Set the flag for future visits
      localStorage.setItem('hasSeenLanding', 'true');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {showLanding ? <LandingPage /> : null}
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
