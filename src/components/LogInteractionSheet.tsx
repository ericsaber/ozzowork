import { useLogInteraction } from "@/hooks/useLogInteraction";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import LogInteractionContent from "@/components/LogInteractionContent";

interface LogInteractionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedContactId?: string | null;
  skipFollowupStep?: boolean;
  existingTaskRecordId?: string;
}

const LogInteractionSheet = ({ open, onOpenChange, preselectedContactId, skipFollowupStep = false, existingTaskRecordId }: LogInteractionSheetProps) => {
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

  const handleDrawerFocusCapture = () => {
    const drawer = document.querySelector<HTMLElement>("[vaul-drawer]");
    if (!drawer) return;
    drawer.style.transition = "none";
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        drawer.style.transition = "";
      });
    });
  };

  return (
    <Drawer open={open} onOpenChange={handleOpen} handleOnly={true}>
      <DrawerContent onContextMenu={(e) => e?.preventDefault?.()} onFocusCapture={handleDrawerFocusCapture}>
        <LogInteractionContent
          state={state}
          onKeepEditing={() => {
            requestAnimationFrame(() => {
              onOpenChange(true);
            });
          }}
        />
      </DrawerContent>
    </Drawer>
  );
};

export default LogInteractionSheet;
