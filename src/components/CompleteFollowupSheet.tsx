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
  interactionId: string;
  contactId: string;
  contactName: string;
  interactionType: string;
  userId: string;
}

const CompleteFollowupSheet = ({
  open,
  onOpenChange,
  interactionId,
  contactId,
  contactName,
  interactionType,
  userId,
}: CompleteFollowupSheetProps) => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [connectType, setConnectType] = useState(interactionType || "");
  const [note, setNote] = useState("");
  const [savedInteractionId, setSavedInteractionId] = useState<string | null>(null);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["followups-today"] });
    queryClient.invalidateQueries({ queryKey: ["followups-upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["interactions"] });
  };

  // Step 1: Log the interaction
  const logMutation = useMutation({
    mutationFn: async () => {
      // Clear follow_up_date on original interaction
      const { error: updateErr } = await supabase
        .from("interactions")
        .update({ follow_up_date: null })
        .eq("id", interactionId);
      if (updateErr) throw updateErr;

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

  // Step 2: Update with follow-up
  const followupMutation = useMutation({
    mutationFn: async ({ type, date }: { type: string; date: string }) => {
      if (!savedInteractionId) throw new Error("No interaction to update");
      const { error } = await supabase
        .from("interactions")
        .update({
          planned_follow_up_type: type,
          follow_up_date: date,
        })
        .eq("id", savedInteractionId);
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
    // Reset after animation
    setTimeout(() => {
      setStep(1);
      setConnectType(interactionType || "");
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
        {/* Drag handle is built into DrawerContent */}

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
