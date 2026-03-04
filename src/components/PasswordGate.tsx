import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const SITE_PASSWORD = "ollo2026";

interface PasswordGateProps {
  children: React.ReactNode;
}

const PasswordGate = ({ children }: PasswordGateProps) => {
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem("site_unlocked") === "true";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      sessionStorage.setItem("site_unlocked", "true");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
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
        <Button type="submit" className="w-full">Enter</Button>
      </form>
    </div>
  );
};

export default PasswordGate;
