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

  const displayCount = (interactionCount ?? 0) + 1;
  const isFirst = displayCount <= 1;

  return (
    <>
      <style>{`
        @keyframes toast-bar-grow {
          0% { height: 0; }
          100% { height: 100%; }
        }
        @keyframes toast-fade-up {
          0% { opacity: 0; transform: translateY(5px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes toast-check-pop {
          0% { opacity: 0; transform: scale(0.3); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div
        key={animKey}
        className="relative overflow-hidden mx-5 mb-[18px]"
        style={{
          background: "#fdf5f0",
          borderRadius: "6px",
          padding: "7px 12px 8px 14px",
        }}
      >
        {/* Left accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "3px",
            background: "#c8622a",
            borderRadius: "3px 0 0 3px",
            ...(isFirst
              ? { height: "0%", animation: "toast-bar-grow 280ms ease-out forwards" }
              : { height: "100%" }),
          }}
        />

        {isFirst ? (
          /* Variant A: Nice work */
          <div style={{ paddingLeft: "10px" }}>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "20px",
                lineHeight: "26px",
                color: "#c8622a",
                animation: "toast-fade-up 220ms ease-out 280ms both",
              }}
            >
              Nice work.
            </h2>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                lineHeight: "16px",
                color: "#7a746c",
                animation: "toast-fade-up 220ms ease-out 400ms both",
              }}
            >
              <span className="text-foreground font-medium">{contactName}</span>
              {" · First interaction"}
            </p>
          </div>
        ) : (
          /* Variant B: Done */
          <div style={{ paddingLeft: "10px" }}>
            <div className="flex items-baseline" style={{ gap: "8px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "20px",
                  fontWeight: 500,
                  lineHeight: "24px",
                  color: "#c8622a",
                }}
              >
                Done.
              </h2>
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "17px",
                  color: "#c8622a",
                  animation: "toast-check-pop 220ms cubic-bezier(.34,1.56,.64,1) 100ms both",
                  display: "inline-block",
                }}
              >
                ✓
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "11px",
                lineHeight: "16px",
                color: "#7a746c",
              }}
            >
              <span className="text-foreground font-medium">{contactName}</span>
              {" · "}{ordinal(displayCount)} interaction
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default CelebrationHeader;
