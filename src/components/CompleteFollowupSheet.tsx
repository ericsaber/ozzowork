import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import CelebrationHeader from "@/components/CelebrationHeader";
import FullscreenTakeover from "@/components/FullscreenTakeover";
import StepIndicator from "@/components/StepIndicator";
import LogStep1 from "@/components/LogStep1";
import LogStep2 from "@/components/LogStep2";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CompleteFollowupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followUpId: string;
  contactId: string;
  contactName: string;
  plannedType: string | null;
  userId: string;
  showToast?: boolean;
}

const CompleteFollowupSheet = ({
  open,
  onOpenChange,
  followUpId,
  contactId,
  contactName,
  plannedType,
  userId,
  showToast = true,
}: CompleteFollowupSheetProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [connectType, setConnectType] = useState(plannedType || "");
  const [note, setNote] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingDate, setPendingDate] = useState("");
  const [pendingType, setPendingType] = useState("");
  const [pendingReminder, setPendingReminder] = useState("");

  const isDirty = !!draftId || note.trim().length > 0 || connectType !== (plannedType || "");

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["interactions"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups-active"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups-today"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups-upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups-history"] });
    queryClient.invalidateQueries({ queryKey: ["active-followup"] });
  };

  const logMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const connectDate = new Date().toISOString();

      const { data, error } = await supabase
        .from("interactions")
        .insert({
          contact_id: contactId,
          user_id: user.id,
          connect_type: connectType || null,
          connect_date: connectDate,
          note: note || null,
          status: "draft",
        })
        .select("id")
        .single();
      if (error) throw error;
      console.log("[completion] interaction draft created:", data.id);
      return { id: data.id };
    },
    onSuccess: (result) => {
      setDraftId(result.id);
      setStep(2);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const followupMutation = useMutation({
    mutationFn: async ({ type, date, reminderNote }: { type: string; date: string; reminderNote: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!draftId) throw new Error("No interaction draft");

      const connectDate = new Date().toISOString();

      console.log("[completion] followupMutation:", { followUpId, draftId, type, date });

      // 1. Mark follow-up as completed, write interaction details onto it
      const { error: completeError } = await supabase
        .from("follow_ups")
        .update({
          status: "completed",
          completed_at: connectDate,
        })
        .eq("id", followUpId);
      if (completeError) throw completeError;
      console.log("[completion] follow_up marked completed:", followUpId);

      // 2. Publish the interaction draft
      const { error: publishError } = await supabase
        .from("interactions")
        .update({ status: "published" })
        .eq("id", draftId);
      if (publishError) throw publishError;
      console.log("[completion] interaction draft published:", draftId);

      // 3. Insert new follow-up if date set
      if (date) {
        console.log("[completion] insert reminder_note:", reminderNote);
        const { error: insertError } = await supabase
          .from("follow_ups")
          .insert({
            contact_id: contactId,
            user_id: user.id,
            planned_type: type || null,
            planned_date: date,
            status: "active",
            reminder_note: reminderNote.trim() || null,
          });
        if (insertError) throw insertError;
        console.log("[completion] new follow_up inserted:", { type, date, reminder_note: reminderNote.trim() || null });
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast.success(note || connectType ? "Nice work. Follow-up marked complete." : "Done. Follow-up marked complete.");
      handleClose();
      navigate(`/contact/${contactId}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const connectDate = new Date().toISOString();

      console.log("[completion] handleSkip:", { followUpId, draftId });

      // Mark follow-up as completed with whatever was logged
    const { error: completeError } = await supabase
      .from("follow_ups")
      .update({
        status: "completed",
        completed_at: connectDate,
      })
      .eq("id", followUpId);
    if (completeError) throw completeError;
    console.log("[completion] follow_up marked completed on skip:", followUpId);

      // Publish interaction draft if exists
      if (draftId) {
        const { error: publishError } = await supabase
          .from("interactions")
          .update({ status: "published" })
          .eq("id", draftId);
        if (publishError) throw publishError;
        console.log("[completion] interaction draft published on skip:", draftId);
      }

      invalidateAll();
      toast.success("Follow-up marked complete.");
      handleClose();
      navigate(`/contact/${contactId}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setConnectType(plannedType || "");
      setNote("");
      setDraftId(null);
      setPendingDate("");
      setPendingType("");
      setPendingReminder("");
    }, 300);
  };

  const handleUpdateLog = async (newConnectType: string, newNote: string) => {
    setConnectType(newConnectType);
    setNote(newNote);
    // Update draft if it exists
    if (draftId) {
      await supabase.from("interactions").update({
        connect_type: newConnectType || null,
        note: newNote || null,
      }).eq("id", draftId);
      console.log("[completion] draft updated via handleUpdateLog:", draftId);
    }
  };

  const handleOpen = (o: boolean) => {
    if (!o) {
      if (isDirty) {
        setShowDiscardDialog(true);
        return;
      }
      handleClose();
    }
  };

  return (
    <>
      <FullscreenTakeover open={open} onOpenChange={handleOpen}>
        {showToast && (
          <CelebrationHeader contactId={contactId} contactName={contactName} open={open} />
        )}
        <div className="px-5 pb-6" style={{ flex: 1, overflowY: "auto" }}>
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
              onSaveWithFollowup={(type, date) => followupMutation.mutate({ type, date })}
              onSkip={handleSkip}
              isSaving={followupMutation.isPending}
              onUpdateLog={handleUpdateLog}
            />
          )}
        </div>
      </FullscreenTakeover>
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this log?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDiscardDialog(false)}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setShowDiscardDialog(false);
              if (draftId) {
                await supabase.from("interactions").delete().eq("id", draftId);
                console.log("[completion] discarded interaction draft:", draftId);
              }
              handleClose();
            }}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CompleteFollowupSheet;
