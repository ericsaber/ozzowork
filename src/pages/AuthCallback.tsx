import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Try getSession first — Supabase may have already processed the hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/", { replace: true });
        return;
      }

      // Otherwise wait for auth state change
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();
          navigate("/", { replace: true });
        }
      });

      // Fallback timeout after 5 seconds
      const timer = setTimeout(() => {
        subscription.unsubscribe();
        navigate("/auth", { replace: true });
      }, 5000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timer);
      };
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground font-heading text-xl italic">ozzo</div>
    </div>
  );
};

export default AuthCallback;
