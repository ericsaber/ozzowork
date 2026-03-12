import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import CelebrationHeader from "@/components/CelebrationHeader";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import StepIndicator from "@/components/StepIndicator";
import LogStep1 from "@/components/LogStep1";
import LogStep2 from "@/components/LogStep2";

interface CompleteFollowupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followUpId: string;
  contactId: string;
  contactName: string;
  followUpType: string;
  userId: string;
}

const CompleteFollowupSheet = ({
  open,
  onOpenChange,
  followUpId,
  contactId,
  contactName,
  followUpType,
  userId,
}: CompleteFollowupSheetProps) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [connectType, setConnectType] = useState(followUpType || "");
  const [note, setNote] = useState("");
  const [savedInteractionId, setSavedInteractionId] = useState<string | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["followups-today"] });
    queryClient.invalidateQueries({ queryKey: ["followups-upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["interactions"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
  };

  // Step 1: Mark follow-up complete and log new interaction
  const logMutation = useMutation({
    mutationFn: async () => {
      // Mark the follow-up as completed
      const { error: completeErr } = await supabase
        .from("follow_ups")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", followUpId);
      if (completeErr) throw completeErr;

      // Insert new logged interaction
      const { data, error } = await supabase
        .from("interactions")
        .insert({
          contact_id: contactId,
          user_id: userId,
          connect_type: connectType || null,
          note: note || null,
          planned_follow_up_type: "call", // default, will be updated in step 2
        })
        .select("id")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setSavedInteractionId(data.id);
      invalidateAll();
      setStep(2);
    },
    onError: (e) => toast.error(e.message),
  });

  // Step 2: Create a new follow-up linked to the new interaction
  const followupMutation = useMutation({
    mutationFn: async ({ type, date }: { type: string; date: string }) => {
      if (!savedInteractionId) throw new Error("No interaction to link");
      const { error } = await supabase
        .from("follow_ups")
        .insert({
          contact_id: contactId,
          interaction_id: savedInteractionId,
          follow_up_type: type,
          due_date: date,
          user_id: userId,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Follow-up set");
      handleClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setConnectType(followUpType || "");
      setNote("");
      setSavedInteractionId(null);
    }, 300);
  };

  const handleSkip = () => {
    invalidateAll();
    toast.success("Interaction logged");
    handleClose();
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DrawerContent className="max-h-[90vh]">
        <CelebrationHeader contactId={contactId} contactName={contactName} open={open} />

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
            />
          ) : (
            <LogStep2
              connectType={connectType}
              contactName={contactName}
              note={note}
              logDate={format(new Date(), "MMM d, yyyy")}
              onBack={() => setStep(1)}
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
