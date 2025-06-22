
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Index from "./pages/Index";
import BusinessList from "./pages/BusinessList";
import BusinessDetail from "./pages/BusinessDetail";
import Report from "./pages/Report";
import UserSettings from "./pages/UserSettings";
import DataSources from "./pages/DataSources";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Make queryClient available globally for cache clearing
(window as any).queryClient = queryClient;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <AuthGuard>
                <Index />
              </AuthGuard>
            } />
            <Route path="/businesses" element={
              <AuthGuard>
                <BusinessList />
              </AuthGuard>
            } />
            <Route path="/business/:id" element={
              <AuthGuard>
                <BusinessDetail />
              </AuthGuard>
            } />
            <Route path="/report" element={
              <AuthGuard>
                <Report />
              </AuthGuard>
            } />
            <Route path="/settings" element={
              <AuthGuard>
                <UserSettings />
              </AuthGuard>
            } />
            <Route path="/data-sources" element={
              <AuthGuard>
                <DataSources />
              </AuthGuard>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
