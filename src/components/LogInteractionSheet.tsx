import { useRef } from "react";
import { useLogInteraction } from "@/hooks/useLogInteraction";
import LogInteractionContent from "@/components/LogInteractionContent";

interface LogInteractionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedContactId?: string | null;
  skipFollowupStep?: boolean;
  existingTaskRecordId?: string;
}

const LogInteractionSheet = ({ open, onOpenChange, preselectedContactId, skipFollowupStep = false, existingTaskRecordId }: LogInteractionSheetProps) => {
  const mountHeightRef = useRef(window.innerHeight);

  const state = useLogInteraction({
    open,
    onOpenChange,
    preselectedContactId,
    skipFollowupStep,
    existingTaskRecordId,
  });

  const handleOpen = (o: boolean) => {
    if (!o) {
      state.handleRequestClose();
      return;
    }
    onOpenChange(true);
  };

  if (!open) return null;

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 flex flex-col justify-end"
      style={{ height: mountHeightRef.current }}
    >
      {/* Overlay */}
      <div
        className="absolute left-0 right-0 top-0 z-0 bg-black/40 animate-fade-in"
        style={{ height: mountHeightRef.current }}
        onClick={() => handleOpen(false)}
      />
      {/* Sheet panel */}
      <div
        className="relative rounded-t-[10px] bg-background animate-slide-up"
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
        />
      </div>
    </div>
  );
};

export default LogInteractionSheet;
