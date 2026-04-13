import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PasswordGateProps {
  children: React.ReactNode;
}

const PasswordGate = ({ children }: PasswordGateProps) => {
  const [unlocked, setUnlocked] = useState(() => {
    return localStorage.getItem("site_unlocked") === "true";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-site-password', {
        body: { password },
      });

      if (fnError || !data?.valid) {
        setError(true);
      } else {
        localStorage.setItem("site_unlocked", "true");
        setUnlocked(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4 text-center">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        <p className="text-muted-foreground text-sm">This site is currently under development. Enter the access code to continue.</p>
        <Input
          type="password"
          placeholder="Access code"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          className={error ? "border-destructive" : ""}
          autoFocus
        />
        {error && <p className="text-destructive text-xs">Incorrect code. Try again.</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter"}
        </Button>
      </form>
    </div>
  );
};

export default PasswordGate;
