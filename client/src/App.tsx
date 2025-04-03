import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import MainLayout from "@/components/layout/MainLayout";
import FamilyTreePage from "@/pages/family-tree";
import EventsPage from "@/pages/events";
import DocumentsPage from "@/pages/documents";
import HelpNeededPage from "@/pages/help-needed";
import MessagesPage from "@/pages/messages";
import NotFound from "@/pages/not-found";
import "./styles.css";

function Router() {
  return (
    <Switch>
      <Route path="/" component={FamilyTreePage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/documents" component={DocumentsPage} />
      <Route path="/help-needed" component={HelpNeededPage} />
      <Route path="/messages" component={MessagesPage} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Router />
      </MainLayout>
    </QueryClientProvider>
  );
}

export default App;
