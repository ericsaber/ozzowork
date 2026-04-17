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
  const [visible, setVisible] = useState(false);

  // Mount on open, then trigger transition on next frame so initial closed state paints first
  useEffect(() => {
    if (open) {
      setMounted(true);
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => setVisible(true));
        // store inner id on outer for cleanup
        (r1 as unknown as { inner?: number }).inner = r2;
      });
      return () => {
        cancelAnimationFrame(r1);
        const inner = (r1 as unknown as { inner?: number }).inner;
        if (inner !== undefined) cancelAnimationFrame(inner);
      };
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 560);
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
        onPointerDown={(e) => {
          e.stopPropagation();
          onOpenChange(false);
        }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 49,
          opacity: visible ? 1 : 0,
          transition: "opacity 200ms ease",
          pointerEvents: visible ? "auto" : "none",
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
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: visible
            ? "opacity 300ms ease, transform 420ms cubic-bezier(0.32, 0.72, 0, 1)"
            : "opacity 250ms ease, transform 550ms cubic-bezier(0.4, 0, 0.2, 1)",
          visibility: mounted ? "visible" : "hidden",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenChange(false);
          }}
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
            opacity: visible ? 1 : 0,
            transition: "opacity 200ms ease",
            transitionDelay: visible ? "250ms" : "0ms",
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
