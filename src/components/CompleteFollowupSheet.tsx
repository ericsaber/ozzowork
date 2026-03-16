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
  showToast?: boolean; // true for Today check / contact record checkmark
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
  const didMarkComplete = useRef(false);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["task-records"] });
    queryClient.invalidateQueries({ queryKey: ["task-record"] });
    queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
    queryClient.invalidateQueries({ queryKey: ["task-records-upcoming"] });
  };

  const logMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const { error } = await supabase.from("task_records" as any)
        .update({
          status: "completed",
          completed_at: now,
          connect_type: connectType || null,
          connect_date: now,
          note: note || null,
          planned_follow_up_type: connectType || null,
          planned_follow_up_date: now,
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

  const followupMutation = useMutation({
    mutationFn: async ({ type, date }: { type: string; date: string }) => {
      const { error } = await supabase.from("task_records" as any)
        .insert({
          contact_id: contactId,
          user_id: userId,
          connect_type: connectType || null,
          connect_date: new Date().toISOString(),
          note: note || null,
          planned_follow_up_type: type,
          planned_follow_up_date: date,
          status: "active",
        });
      if (error) throw error;
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
      didMarkComplete.current = false;
    }, 300);
  };

  const handleSkip = async () => {
    const { error } = await supabase.from("task_records" as any)
      .insert({
        contact_id: contactId,
        user_id: userId,
        connect_type: connectType || null,
        connect_date: new Date().toISOString(),
        note: note || null,
        status: "active",
      });
    if (error) { toast.error(error.message); return; }
    invalidateAll();
    toast.success("Interaction logged");
    handleClose();
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DrawerContent className="max-h-[90vh]">
        {showToast && (
          <CelebrationHeader contactId={contactId} contactName={contactName} open={open} />
        )}
        <StepIndicator currentStep={step} />
        <div className="px-5 pb-6 overflow-y-auto">
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
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default CompleteFollowupSheet;
