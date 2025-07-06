import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import MobileNav from "@/components/layout/mobile-nav";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import CreateMatch from "@/pages/create-match";
import BetHistory from "@/pages/bet-history";
import { Switch, Route } from "wouter";
import { useState } from "react";

function Router() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 overflow-auto">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="container py-6">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/create" component={CreateMatch} />
            <Route path="/history" component={BetHistory} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <MobileNav />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}