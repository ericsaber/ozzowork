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
  const didMarkComplete = useRef(false);
  const newRecordId = useRef<string | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["task-records"] });
    queryClient.invalidateQueries({ queryKey: ["task-record"] });
    queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
    queryClient.invalidateQueries({ queryKey: ["task-records-upcoming"] });
  };

  const logMutation = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();

      // 1) Mark the OLD record as completed — preserve its original data
      console.log('[completion] marking old record complete:', taskRecordId);
      const { error: updateErr } = await supabase.from("task_records" as any)
        .update({ status: "completed", completed_at: now })
        .eq("id", taskRecordId);
      if (updateErr) throw updateErr;

      // 2) Create a NEW record for today's interaction
      const newRecord = {
        contact_id: contactId,
        user_id: userId,
        connect_type: connectType || null,
        connect_date: now,
        note: note || null,
        status: "completed",
        completed_at: now,
      };
      console.log('[completion] creating new record:', { connect_type: newRecord.connect_type, note: newRecord.note, connect_date: newRecord.connect_date });
      const { data, error: insertErr } = await supabase.from("task_records" as any)
        .insert(newRecord)
        .select("id")
        .single();
      if (insertErr) throw insertErr;
      newRecordId.current = (data as any)?.id ?? null;
      console.log('[completion] new record id:', newRecordId.current);
    },
    onSuccess: () => {
      invalidateAll();
      setStep(2);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const followupMutation = useMutation({
    mutationFn: async ({ type, date }: { type: string; date: string }) => {
      // Create a tails-only active record for the next follow-up
      const followupRecord = {
        contact_id: contactId,
        user_id: userId,
        planned_follow_up_type: type || null,
        planned_follow_up_date: date,
        status: "active",
      };
      console.log('[completion] creating follow-up record:', followupRecord);
      const { error } = await supabase.from("task_records" as any)
        .insert(followupRecord);
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
      newRecordId.current = null;
    }, 300);
  };

  const handleSkip = async () => {
    // Interaction was already saved in logMutation — just close
    toast.success("Interaction logged");
    handleClose();
  };

  const handleUpdateLog = async (newConnectType: string, newNote: string) => {
    setConnectType(newConnectType);
    setNote(newNote);
    // Persist edits to the NEW interaction record (not the old follow-up)
    const targetId = newRecordId.current;
    if (!targetId) {
      console.error('[completion] no new record id to update');
      return;
    }
    console.log('[completion] updating new record:', targetId, { connect_type: newConnectType, note: newNote });
    const { error } = await supabase.from("task_records" as any).update({
      connect_type: newConnectType || null,
      note: newNote || null,
    }).eq("id", targetId);
    if (error) console.error('[completion] failed to update log:', error);
    else invalidateAll();
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
