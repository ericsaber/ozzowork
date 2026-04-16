import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  useEffect(() => {
    // Handle magic link / email verification via query params
    const searchParams = new URLSearchParams(window.location.search);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (token_hash && type) {
      console.log('[AuthCallback] verifyOtp attempt, type:', type);
      supabase.auth.verifyOtp({ token_hash, type: type as any }).then(({ error }) => {
        if (error) {
          console.error('[AuthCallback] verifyOtp error:', error);
          window.location.replace('/auth?error=link_expired');
        } else {
          console.log('[AuthCallback] verifyOtp success');
          window.location.replace('/');
        }
      });
      return;
    }

    const hash = window.location.hash;
    const params = new URLSearchParams(hash.replace('#', ''));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        if (error) {
          console.error('[AuthCallback] setSession error:', error);
        window.location.replace('/');
        } else {
          console.log('[AuthCallback] session set successfully');
          window.location.replace('/');
        }
      });
    } else {
      console.log('[AuthCallback] no tokens in URL, redirecting to auth');
      window.location.replace('/');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-muted-foreground font-heading text-xl italic">ozzo</div>
    </div>
  );
};

export default AuthCallback;
