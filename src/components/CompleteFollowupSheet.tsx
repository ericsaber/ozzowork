import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import CelebrationHeader from "@/components/CelebrationHeader";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import StepIndicator from "@/components/StepIndicator";
import LogStep1 from "@/components/LogStep1";
import LogStep2 from "@/components/LogStep2";

interface CompleteFollowupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskRecordId: string;
  contactId: string;
  contactName: string;
  followUpType: string;
  userId: string;
  hasInteraction: boolean;
  showToast?: boolean;
}

const CompleteFollowupSheet = ({
  open,
  onOpenChange,
  taskRecordId,
  contactId,
  contactName,
  followUpType,
  userId,
  hasInteraction,
  showToast = true,
}: CompleteFollowupSheetProps) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [connectType, setConnectType] = useState(followUpType || "");
  const [note, setNote] = useState("");
  const connectDateRef = useRef<string | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["task-records"] });
    queryClient.invalidateQueries({ queryKey: ["task-record"] });
    queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
    queryClient.invalidateQueries({ queryKey: ["task-records-upcoming"] });
  };

  const logMutation = useMutation({
    mutationFn: async () => {
      const connectDate = new Date().toISOString();
      connectDateRef.current = connectDate;

      console.log("[completion] op1 UPDATE:", taskRecordId, { status: "completed" });

      const { error } = await supabase
        .from("task_records" as any)
        .update({
          status: "completed",
          completed_at: connectDate,
        })
        .eq("id", taskRecordId);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      setStep(2);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const insertCompletionRecord = async ({
    plannedFollowUpType,
    plannedFollowUpDate,
  }: {
    plannedFollowUpType: string | null;
    plannedFollowUpDate: string | null;
  }) => {
    const connectDate = connectDateRef.current ?? new Date().toISOString();

    console.log("[completion] op2 INSERT:", {
      connect_type: connectType || null,
      note: note || null,
      connect_date: connectDate,
      planned_follow_up_type: plannedFollowUpType,
      planned_follow_up_date: plannedFollowUpDate,
    });

    const { error } = await supabase.from("task_records" as any).insert({
      contact_id: contactId,
      user_id: userId,
      connect_type: connectType || null,
      note: note || null,
      connect_date: connectDate,
      planned_follow_up_type: plannedFollowUpType,
      planned_follow_up_date: plannedFollowUpDate,
      status: plannedFollowUpDate ? "active" : "completed",
    });

    if (error) throw error;
  };

  const followupMutation = useMutation({
    mutationFn: async ({ type, date }: { type: string; date: string }) => {
      console.log("[completion] followupMutation received:", { type, date });
      await insertCompletionRecord({
        plannedFollowUpType: type || null,
        plannedFollowUpDate: date || null,
      });
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Follow-up set");
      handleClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setConnectType(followUpType || "");
      setNote("");
      connectDateRef.current = null;
    }, 300);
  };

  const handleSkip = async () => {
    try {
      await insertCompletionRecord({
        plannedFollowUpType: null,
        plannedFollowUpDate: null,
      });

      invalidateAll();
      toast.success("Interaction logged");
      handleClose();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleUpdateLog = async (newConnectType: string, newNote: string) => {
    setConnectType(newConnectType);
    setNote(newNote);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DrawerContent className="max-h-[90vh]">
        {showToast && (
          <CelebrationHeader contactId={contactId} contactName={contactName} open={open} />
        )}
        <div className="overflow-y-auto px-5 pb-6">
          <StepIndicator currentStep={step} />
          {step === 1 ? (
            <LogStep1
              connectType={connectType}
              setConnectType={setConnectType}
              note={note}
              setNote={setNote}
              onSubmit={() => logMutation.mutate()}
              isSubmitting={logMutation.isPending}
              contactId={contactId}
              contactName={contactName}
              isContactPrefilled={true}
              onChangeContact={undefined}
            />
          ) : (
            <LogStep2
              connectType={connectType}
              contactName={contactName}
              note={note}
              logDate={format(new Date(), "MMM d, yyyy")}
              onBack={hasInteraction ? undefined : () => setStep(1)}
              onSaveWithFollowup={(type, date) => followupMutation.mutate({ type, date })}
              onSkip={handleSkip}
              isSaving={followupMutation.isPending}
              onUpdateLog={handleUpdateLog}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CompleteFollowupSheet;
