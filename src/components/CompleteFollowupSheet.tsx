import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowRight, Check } from "lucide-react";
import FullscreenTakeover from "@/components/FullscreenTakeover";
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
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("Logged.");

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
      setCelebrationText(pendingDate ? "Logged & set." : "Logged.");
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        handleClose();
        navigate(`/contact/${contactId}`);
      }, 1800);
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
      setCelebrationText("Logged.");
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        handleClose();
        navigate(`/contact/${contactId}`);
      }, 1800);
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
      setShowCelebration(false);
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
        <div className="px-5 pb-6" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
          {step === 1 ? (
            <div style={{ paddingTop: 20, paddingBottom: 24, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <LogStep1
                connectType={connectType}
                setConnectType={setConnectType}
                note={note}
                setNote={setNote}
                contactId={contactId}
                contactName={contactName}
                isContactPrefilled={true}
                onNext={() => logMutation.mutate()}
                isSubmitting={logMutation.isPending}
              />
            </div>
          ) : (
            <div style={{ paddingTop: 20, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <LogStep2
                connectType={connectType}
                contactName={contactName}
                note={note}
                onSaveWithFollowup={(type, date) => followupMutation.mutate({ type, date, reminderNote: pendingReminder })}
                onSkip={handleSkip}
                isSaving={followupMutation.isPending}
                onUpdateLog={handleUpdateLog}
                onFollowupStateChange={(date, type, reminder) => {
                  setPendingDate(date);
                  setPendingType(type);
                  setPendingReminder(reminder);
                }}
              />
            </div>
          )}
        </div>

        {step === 1 && (
          <div
            style={{
              flexShrink: 0,
              padding: "8px 20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <button
              onClick={() => logMutation.mutate()}
              disabled={logMutation.isPending || !step1CanSubmit}
              style={{
                width: "100%",
                background: step1CanSubmit ? "#c8622a" : "#ddd8d1",
                color: step1CanSubmit ? "white" : "#b0ada8",
                border: "none",
                borderRadius: 100,
                padding: 15,
                fontSize: 16,
                fontWeight: 500,
                fontFamily: "Outfit, sans-serif",
                cursor: step1CanSubmit && !logMutation.isPending ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              {logMutation.isPending ? "Saving…" : (
                <>
                  Next
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        )}

        {step === 2 && (
          <div
            style={{
              flexShrink: 0,
              padding: "8px 20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div
              style={{
                maxHeight: pendingDate ? 60 : 0,
                opacity: pendingDate ? 1 : 0,
                overflow: "hidden",
                transition: "max-height 0.3s ease, opacity 0.25s ease",
              }}
            >
              <button
                onClick={() => {
                  console.log("[completion] save step2:", { pendingType, pendingDate, pendingReminder });
                  followupMutation.mutate({ type: pendingType, date: pendingDate, reminderNote: pendingReminder });
                }}
                disabled={followupMutation.isPending}
                style={{
                  width: "100%",
                  background: "#c8622a",
                  color: "white",
                  border: "none",
                  borderRadius: 100,
                  padding: 15,
                  fontSize: 16,
                  fontWeight: 500,
                  fontFamily: "Outfit, sans-serif",
                  cursor: followupMutation.isPending ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {followupMutation.isPending ? "Saving…" : (
                  <>
                    Save
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleSkip}
              disabled={followupMutation.isPending}
              style={{
                fontSize: 13,
                color: "#888480",
                fontFamily: "Outfit, sans-serif",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
                textAlign: "center",
                padding: 4,
              }}
            >
              Skip follow-up
            </button>
          </div>
        )}
      </FullscreenTakeover>

      {showCelebration && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            background: "#f0f7f4",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            animation: "celebFadeIn 0.25s ease",
          }}
        >
          <style>{`
            @keyframes celebFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes celebCheck {
              0% { transform: scale(0.5); opacity: 0; }
              60% { transform: scale(1.15); opacity: 1; }
              100% { transform: scale(1); opacity: 1; }
            }
          `}</style>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#fff",
              border: "1.5px solid #b7d9cc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "celebCheck 0.5s ease forwards",
            }}
          >
            <Check size={32} color="#2d6a4f" strokeWidth={2.5} />
          </div>
          <div
            style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: 32,
              color: "#2d6a4f",
              lineHeight: 1.2,
            }}
          >
            {celebrationText}
          </div>
          <div
            style={{
              fontFamily: "Outfit, sans-serif",
              fontSize: 16,
              color: "#888480",
            }}
          >
            {contactName}
          </div>
        </div>
      )}

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
