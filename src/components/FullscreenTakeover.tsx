import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface FullscreenTakeoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const FullscreenTakeover = ({ open, onOpenChange, children }: FullscreenTakeoverProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);

  // Mount on open, delay unmount until close transition finishes
  useEffect(() => {
    if (open) {
      setMounted(true);
    } else {
      const t = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(t);
    }
  }, [open]);

  // visualViewport resize listener — soft keyboard shrinks the sheet
  useEffect(() => {
    const handleResize = () => {
      if (open && containerRef.current) {
        const height = window.visualViewport?.height ?? window.innerHeight;
        containerRef.current.style.height = `${height}px`;
      }
    };
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, [open]);

  if (!mounted && !open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => onOpenChange(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 49,
          opacity: open ? 1 : 0,
          transition: "opacity 200ms ease",
          pointerEvents: open ? "auto" : "none",
        }}
      />
      {/* Sheet */}
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          inset: 0,
          height: "100dvh",
          background: "#f0ede8",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition:
            "opacity 300ms ease, transform 380ms cubic-bezier(0.32, 0.72, 0, 1)",
          visibility: open ? "visible" : "hidden",
        }}
      >
        <button
          onClick={() => onOpenChange(false)}
          aria-label="Close"
          style={{
            position: "absolute",
            top: "calc(env(safe-area-inset-top) + 12px)",
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            zIndex: 1,
            opacity: open ? 1 : 0,
            transition: "opacity 200ms ease",
            transitionDelay: open ? "250ms" : "0ms",
          }}
        >
          <X size={24} color="#666" />
        </button>
        {children}
      </div>
    </>
  );
};

export default FullscreenTakeover;
