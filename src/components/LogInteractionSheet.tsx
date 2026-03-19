import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLogInteraction } from "@/hooks/useLogInteraction";
import LogInteractionContent from "@/components/LogInteractionContent";

interface LogInteractionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedContactId?: string | null;
  skipFollowupStep?: boolean;
  existingTaskRecordId?: string;
}

const LogInteractionSheet = ({
  open,
  onOpenChange,
  preselectedContactId,
  skipFollowupStep = false,
  existingTaskRecordId,
}: LogInteractionSheetProps) => {
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const addLog = (msg: string) => setDebugLog((prev) => [...prev.slice(-10), `${Date.now() % 100000}: ${msg}`]);
  addLog(`render open=${open}`);
  const mountHeightRef = useRef(window.innerHeight);
  const hasAnimated = useRef(false);

  const state = useLogInteraction({
    open,
    onOpenChange,
    preselectedContactId,
    skipFollowupStep,
    existingTaskRecordId,
  });

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        hasAnimated.current = true;
      });
    } else {
      hasAnimated.current = false;
    }
  }, [open]);

  useEffect(() => {
    // disabled for debugging
  }, [open]);

  const handleOpen = (o: boolean) => {
    addLog(`handleOpen o=${o}`);
    if (!o) {
      state.handleRequestClose();
      return;
    }
    onOpenChange(true);
  };

  addLog(`before open check open=${open}`);
  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: mountHeightRef.current,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "black",
          color: "lime",
          fontSize: 10,
          padding: 4,
          fontFamily: "monospace",
          maxHeight: 120,
          overflowY: "auto",
          pointerEvents: "none",
        }}
      >
        {debugLog.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
      {/* Overlay */}
      <div
        className="animate-fade-in"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: mountHeightRef.current,
          backgroundColor: "hsl(0 0% 0% / 0.4)",
        }}
        onClick={() => handleOpen(false)}
      />
      {/* Sheet panel */}
      <div
        className="relative rounded-t-[10px] bg-background"
        style={{
          maxHeight: `${mountHeightRef.current * 0.9}px`,
          overflowY: "auto",
        }}
      >
        {/* Drag handle — decorative only */}
        <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-muted-foreground/30" />

        {/* Existing content */}
        <LogInteractionContent
          state={state}
          onKeepEditing={() => {
            requestAnimationFrame(() => {
              onOpenChange(true);
            });
          }}
          addLog={addLog}
        />
      </div>
    </div>,
    document.body,
  );
};

export default LogInteractionSheet;
