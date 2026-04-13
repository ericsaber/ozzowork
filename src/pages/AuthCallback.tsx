import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  useEffect(() => {
    // Try getSession first — Supabase may have already processed the hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.replace("/");
        return;
      }

      // Otherwise wait for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          window.location.replace("/");
        }
      });

      // Fallback timeout after 5 seconds
      const timer = setTimeout(() => {
        subscription.unsubscribe();
        window.location.replace("/auth");
      }, 5000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timer);
      };
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground font-heading text-xl italic">ozzo</div>
    </div>
  );
};

export default AuthCallback;
