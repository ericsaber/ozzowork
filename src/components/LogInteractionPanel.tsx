import { useEffect, useRef, useState } from "react";
import { useLogInteraction } from "@/hooks/useLogInteraction";
import LogInteractionContent from "@/components/LogInteractionContent";

interface LogInteractionPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedContactId?: string | null;
}

const LogInteractionPanel = ({ open, onOpenChange, preselectedContactId }: LogInteractionPanelProps) => {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const closingRef = useRef(false);

  const state = useLogInteraction({
    open,
    onOpenChange,
    preselectedContactId,
    skipFollowupStep: false,
  });

  // Mount → animate in
  useEffect(() => {
    if (open) {
      closingRef.current = false;
      setMounted(true);
      // Double rAF to ensure DOM is painted before animation starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    } else if (mounted && !closingRef.current) {
      // Animate out
      closingRef.current = true;
      setVisible(false);
      const timer = setTimeout(() => {
        setMounted(false);
        closingRef.current = false;
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleOverlayClick = () => {
    state.handleRequestClose();
  };

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50" style={{ pointerEvents: "auto" }}>
      {/* Overlay */}
      <div
        onClick={handleOverlayClick}
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          opacity: visible ? 1 : 0,
          transition: "opacity 300ms ease-out",
        }}
      />

      {/* Sheet */}
      <div
        className="absolute inset-x-0 bottom-0 flex flex-col rounded-t-[10px] border bg-background"
        style={{
          maxHeight: "min(90vh, 90lvh)",
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 300ms ease-out",
          overflowY: "auto",
          overscrollBehavior: "none",
        }}
      >
        {/* Drag handle (decorative) */}
        <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted shrink-0" />

        <LogInteractionContent
          state={state}
          onKeepEditing={() => {
            // Panel stays mounted — nothing extra needed
          }}
        />
      </div>
    </div>
  );
};

export default LogInteractionPanel;
