import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CelebrationHeaderProps {
  contactId: string;
  contactName: string;
  open: boolean;
}

const ordinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

const CelebrationHeader = ({ contactId, contactName, open }: CelebrationHeaderProps) => {
  const [interactionCount, setInteractionCount] = useState<number | null>(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (!open) {
      setInteractionCount(null);
      return;
    }
    setAnimKey((k) => k + 1);
    (async () => {
      const { count } = await supabase
        .from("task_records" as any)
        .select("id", { count: "exact", head: true })
        .eq("contact_id", contactId)
        .not("connect_type", "is", null);
      setInteractionCount(count ?? 0);
    })();
  }, [open, contactId]);

  if (interactionCount === null) return null;

  // +1 because the current interaction being logged isn't in the DB yet
  const displayCount = (interactionCount ?? 0) + 1;
  const isFirst = displayCount <= 1;

  return (
    <>
      <style>{`
        @keyframes ch-spring-in {
          0% { transform: scale(0); opacity: 0; }
          55% { transform: scale(1.18); opacity: 1; }
          75% { transform: scale(0.94); }
          100% { transform: scale(1); }
        }
        @keyframes ch-ripple {
          0% { width: 36px; height: 36px; opacity: 0.7; }
          100% { width: 80px; height: 80px; opacity: 0; }
        }
        @keyframes ch-check-draw {
          0% { stroke-dashoffset: 30; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes ch-fade-up {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes ch-scale-pop {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div
        key={animKey}
        className="flex items-center gap-3 border-b border-border"
        style={{ padding: "18px 20px 16px" }}
      >
        <div className="relative flex items-center justify-center" style={{ width: 36, height: 36 }}>
          {isFirst && (
            <div
              className="absolute rounded-full border-2"
              style={{
                borderColor: "hsl(var(--accent))",
                animation: "ch-ripple 600ms ease-out 100ms forwards",
                width: 36, height: 36,
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
            />
          )}
          <div
            className="flex items-center justify-center rounded-full"
            style={
              isFirst
                ? {
                    width: 36, height: 36,
                    background: "linear-gradient(135deg, #e8794a, #c8622a)",
                    boxShadow: "0 3px 12px rgba(200,98,42,.40)",
                    animation: "ch-spring-in 420ms cubic-bezier(0.34,1.56,0.64,1) forwards",
                  }
                : {
                    width: 36, height: 36,
                    background: "#f0ede8",
                    border: "1.5px solid hsl(var(--border))",
                    animation: "ch-scale-pop 250ms ease-out forwards",
                  }
            }
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              style={isFirst ? { strokeDasharray: 30, strokeDashoffset: 30, animation: "ch-check-draw 300ms ease-out 280ms forwards" } : {}}>
              <path d="M5 13l4 4L19 7" stroke={isFirst ? "white" : "#bbb"} strokeWidth={isFirst ? 3 : 2.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div style={isFirst ? { animation: "ch-fade-up 300ms ease-out 150ms both" } : { animation: "ch-fade-up 300ms ease-out both" }}>
          {isFirst ? (
            <h2 className="text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: 21, lineHeight: "26px" }}>
              Nice work<span style={{ color: "#c8622a" }}>.</span>
            </h2>
          ) : (
            <h2 className="text-foreground font-medium" style={{ fontFamily: "var(--font-body)", fontSize: 18, lineHeight: "24px" }}>
              Done.
            </h2>
          )}
          <p className="text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: 11, lineHeight: "16px" }}>
            {isFirst ? (
              <>Logging with <span className="text-foreground font-medium">{contactName}</span></>
            ) : (
              <>
                <span className="text-foreground font-medium">{contactName}</span>
                {" · "}{ordinal(interactionCount)} interaction
              </>
            )}
          </p>
        </div>
      </div>
    </>
  );
};

export default CelebrationHeader;
