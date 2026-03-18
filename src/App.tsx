import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import Today from "./pages/Today";
import Contacts from "./pages/Contacts";
import ContactHistory from "./pages/ContactHistory";
import LogInteraction from "./pages/LogInteraction";
import FollowupTask from "./pages/FollowupTask";
import InteractionDetail from "./pages/InteractionDetail";
import EditTaskRecord from "./pages/EditTaskRecord";
import Upcoming from "./pages/Upcoming";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import BottomNav from "./components/BottomNav";
import PasswordGate from "./components/PasswordGate";
import { ScrollToTop } from "./components/ScrollToTop";

const queryClient = new QueryClient();

const AppContent = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => { setSession(session); setLoading(false); }
    );
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground font-heading text-xl italic">ozzo</div>
      </div>
    );
  }

  if (!session) return <Auth />;

  return (
    <>
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/contact/:id" element={<ContactHistory />} />
        <Route path="/log" element={<LogInteraction />} />
        <Route path="/followup/:id" element={<FollowupTask />} />
        <Route path="/interaction/:id" element={<InteractionDetail />} />
        <Route path="/edit-task/:id" element={<EditTaskRecord />} />
        <Route path="/upcoming" element={<Upcoming />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PasswordGate>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </PasswordGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
