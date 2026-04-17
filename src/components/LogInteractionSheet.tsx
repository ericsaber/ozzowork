import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import FullscreenTakeover from "@/components/FullscreenTakeover";
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
import StepIndicator from "@/components/StepIndicator";
import LogStep1 from "@/components/LogStep1";
import LogStep2 from "@/components/LogStep2";
import OutstandingFollowupStep from "@/components/OutstandingFollowupStep";

interface LogInteractionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedContactId?: string | null;
  startStep?: 1 | 2;
  logOnly?: boolean;
}

const LogInteractionSheet = ({
  open, onOpenChange, preselectedContactId, startStep = 1, logOnly = false,
}: LogInteractionSheetProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | "outstanding" | 2 | 3>(startStep);

  useEffect(() => {
    if (open) {
      setStep(startStep);
    }
  }, [open, startStep]);
  const [contactId, setContactId] = useState(preselectedContactId || "");
  const [connectType, setConnectType] = useState("");
  const [note, setNote] = useState("");
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showCancelConfirmDialog, setShowCancelConfirmDialog] = useState(false);
  const [contactCleared, setContactCleared] = useState(false);
  const [connectDate, setConnectDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const getConnectDateISO = () =>
    connectDate === format(new Date(), "yyyy-MM-dd")
      ? new Date().toISOString()
      : new Date(connectDate + "T12:00:00").toISOString();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ first_name: "", last_name: "", company: "", phone: "", email: "" });
  const [skippedInteraction, setSkippedInteraction] = useState(false);

  // Draft state (FAB / Log button flows only — not completion flow)
  const [draftId, setDraftId] = useState<string | null>(null);
  const [existingFollowup, setExistingFollowup] = useState<any | null>(null);

  // isDirty tied to draft existence OR any unsaved Step 1 input
  const isDirty = !!draftId || note.trim().length > 0 || connectType !== "";

  // Sync contactId when preselectedContactId changes
  useEffect(() => {
    if (!open && !draftId) {
      setContactId(preselectedContactId || "");
      setContactCleared(false);
    }
  }, [preselectedContactId, open]);

  useEffect(() => {
    if (open && !draftId && !contactCleared) {
      setContactId(preselectedContactId || "");
    }
  }, [open, preselectedContactId]);

  // Reactive query: check if selected contact has an active follow-up
  const { data: activeFollowup } = useQuery({
    queryKey: ["active-followup", contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data } = await supabase
        .from("follow_ups")
        .select("id, planned_type, planned_date, status")
        .eq("contact_id", contactId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      console.log("[activeFollowup] query result:", data);
      return data;
    },
    enabled: open && !!contactId,
  });

  const clearAndClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(startStep);
      setContactId(preselectedContactId || "");
      setConnectType("");
      setNote("");
      setDraftId(null);
      setExistingFollowup(null);
      setSkippedInteraction(false);
      setContactCleared(false);
      setConnectDate(format(new Date(), "yyyy-MM-dd"));
      setShowQuickAdd(false);
      setQuickForm({ first_name: "", last_name: "", company: "", phone: "", email: "" });
      setShowCancelConfirmDialog(false);
    }, 300);
  };

  // Dismiss interceptor: show discard dialog when draft exists
  const handleOpen = (o: boolean) => {
    if (!o) {
      if (isDirty) {
        setShowDiscardDialog(true);
        return;
      }
      clearAndClose();
    } else {
      onOpenChange(true);
    }
  };

  const { data: contacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").order("first_name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const selectedContact = contacts?.find((c) => c.id === contactId);
  const contactName = selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}`.trim() : "";
  const isContactPrefilled = !!preselectedContactId && !contactCleared;

  const quickAddContact = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("contacts").insert({
        first_name: quickForm.first_name, last_name: quickForm.last_name,
        company: quickForm.company || null, phone: quickForm.phone || null,
        email: quickForm.email || null, user_id: user.id,
      }).select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setContactId(data.id);
      setShowQuickAdd(false);
      setQuickForm({ first_name: "", last_name: "", company: "", phone: "", email: "" });
      toast.success("Contact created & selected");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["interactions"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    queryClient.invalidateQueries({ queryKey: ["active-followup"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups-active"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups-history"] });
  };

  // ── Main log mutation: creates or updates draft ──
  const logMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!contactId) throw new Error("Select a contact");



      // Update existing draft
      if (draftId) {
        const { error } = await supabase
          .from("interactions")
          .update({
            connect_type: connectType || null,
            note: note || null,
            connect_date: getConnectDateISO(),
          })
          .eq("id", draftId);
        if (error) throw error;
        console.log("[draft] interactions updated:", { draftId, connect_type: connectType, note, connect_date: getConnectDateISO() });
        return { id: draftId };
      }

      
      // Create new draft
      
      const { data, error } = await supabase
        .from("interactions")
        .insert({
          contact_id: contactId,
          user_id: user.id,
          connect_type: connectType || null,
          connect_date: getConnectDateISO(),
          note: note || null,
          status: "draft",
        })
        .select("id")
        .single();
      if (error) throw error;
      console.log("[draft] interactions created:", { draftId: data.id, connect_type: connectType, note });
      return { id: data.id };
    },
    onSuccess: (result) => {
      setDraftId(result.id);
      setSkippedInteraction(!connectType && !note);

      // logOnly mode — publish draft immediately and close, no Step 2
      if (logOnly) {
        supabase
          .from("interactions")
          .update({ status: "published" })
          .eq("id", result.id)
          .then(() => {
            console.log("[LogInteractionSheet] logOnly — draft published:", result.id);
            invalidateAll();
            toast.success("Log saved.");
            clearAndClose();
            navigate(`/contact/${contactId}`);
          });
        return;
      }

      if (activeFollowup) {
        setExistingFollowup(activeFollowup);
        console.log("[outstanding] active follow-up found:", {
          followUpId: activeFollowup.id,
          type: activeFollowup.planned_type,
          date: activeFollowup.planned_date,
        });
        setStep("outstanding");
      } else {
        setStep(2);
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Follow-up mutation: step 2 normal + step 3 complete path ──
  const followupMutation = useMutation({
    mutationFn: async ({ type, date }: { type: string; date: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!draftId && !existingFollowup) {
        console.log("[followupMutation] no draft, no existing follow-up — follow-up only path");
      }

      const computedConnectDate = new Date().toISOString();

      // Complete path — outstanding follow-up exists
      if (existingFollowup) {
        console.log("[followupMutation] complete path:", {
          existingFollowUpId: existingFollowup.id,
          draftId,
          newType: type,
          newDate: date,
        });

        // 1. Mark existing follow-up as completed, write interaction details onto it
        const { error: completeError } = await supabase
          .from("follow_ups")
          .update({
            status: "completed",
            completed_at: computedConnectDate,
          })
          .eq("id", existingFollowup.id);
        if (completeError) throw completeError;
        console.log("[followupMutation] follow_up marked completed:", existingFollowup.id);

        // 2. Publish the interaction draft
        const { error: publishError } = await supabase
          .from("interactions")
          .update({ status: "published" })
          .eq("id", draftId);
        if (publishError) throw publishError;
        console.log("[followupMutation] interaction draft published:", draftId);

        // 3. If a new follow-up date was set, insert a new follow_ups row
        if (date) {
          const { error: insertError } = await supabase
            .from("follow_ups")
            .insert({
              contact_id: contactId,
              user_id: user.id,
              planned_type: type || null,
              planned_date: date,
              status: "active",
            });
          if (insertError) throw insertError;
          console.log("[followupMutation] new follow_up inserted:", { type, date });
        }

        return { completePath: true, hasFollowup: !!date };
      }

      // Normal step 2 path — no outstanding follow-up
      // 1. Publish interaction draft if one exists (null when Step 1 was skipped)
      if (draftId) {
        const { error: publishError } = await supabase
          .from("interactions")
          .update({ status: "published" })
          .eq("id", draftId);
        if (publishError) throw publishError;
        console.log("[followupMutation] interaction draft published:", draftId);
      } else {
        console.log("[followupMutation] no interaction draft — follow-up only");
      }

      // 2. Insert new follow_up
      const { error: insertError } = await supabase
        .from("follow_ups")
        .insert({
          contact_id: contactId,
          user_id: user.id,
          planned_type: type || null,
          planned_date: date,
          status: "active",
        });
      if (insertError) throw insertError;
      console.log("[followupMutation] follow_up inserted:", { type, date });

      return { completePath: false, hasFollowup: true };
    },
    onSuccess: (result: any) => {
      invalidateAll();
      if (result?.completePath) {
        toast.success(result.hasFollowup ? "Nice work. Follow-up marked complete." : "Nice work. Log saved.");
      } else {
        toast.success("Done. Log saved.");
      }
      clearAndClose();
      navigate(`/contact/${contactId}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Skip follow-up: handle both normal and complete path ──
  const handleSkip = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Complete path skip — mark existing follow-up complete, publish draft, no new follow-up
    if (existingFollowup) {
      const computedConnectDate = new Date().toISOString();

      console.log("[handleSkip] complete path skip:", {
        existingFollowUpId: existingFollowup.id,
        draftId,
      });

      await supabase
        .from("follow_ups")
        .update({
          status: "completed",
          completed_at: computedConnectDate,
        })
        .eq("id", existingFollowup.id);

      if (draftId) {
        await supabase
          .from("interactions")
          .update({ status: "published" })
          .eq("id", draftId);
        console.log("[handleSkip] interaction draft published:", draftId);
      }

      invalidateAll();
      toast.success("Nice work. Log saved.");
      clearAndClose();
      navigate(`/contact/${contactId}`);
      return;
    }

    // Normal skip — publish interaction draft if exists, no follow-up created
    if (draftId) {
      await supabase
        .from("interactions")
        .update({ status: "published" })
        .eq("id", draftId);
      console.log("[handleSkip] draft published, no follow-up:", draftId);
    } else {
      console.log("[handleSkip] no draft and no follow-up — nothing to save");
    }
    invalidateAll();
    toast.success("Log saved.");
    clearAndClose();
    navigate(`/contact/${contactId}`);
  };

  // ── Outstanding follow-up: Complete chosen → go to step 3 ──
  const handleOutstandingComplete = () => {
    console.log("[outstanding] complete chosen — proceeding to step 3:", {
      existingFollowupId: existingFollowup?.id,
      plannedDate: existingFollowup?.planned_date,
    });
    setStep(3);
  };

  // ── Outstanding follow-up: Update/keep chosen → save immediately ──
  const handleOutstandingUpdate = async (newDate: string) => {
    if (!existingFollowup || !draftId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const previousDate = existingFollowup.planned_date;
    const isKeep = newDate === previousDate;

    console.log("[handleOutstandingUpdate] update chosen:", {
      existingFollowUpId: existingFollowup.id,
      previousDate,
      newDate,
      isKeep,
    });

    // 1. If rescheduling, insert follow_up_edits audit row
    if (!isKeep) {
      const { error: editError } = await supabase
        .from("follow_up_edits")
        .insert({
          follow_up_id: existingFollowup.id,
          user_id: user.id,
          previous_type: existingFollowup.planned_type || null,
          previous_due_date: previousDate,
        });
      console.log("[handleOutstandingUpdate] follow_up_edits inserted:", {
        follow_up_id: existingFollowup.id,
        previous_due_date: previousDate,
        error: editError?.message || null,
      });
    }

    // 2. If rescheduling, update planned_date on follow_up
    if (!isKeep) {
      await supabase
        .from("follow_ups")
        .update({ planned_date: newDate })
        .eq("id", existingFollowup.id);
      console.log("[handleOutstandingUpdate] follow_up rescheduled to:", newDate);
    }

    // 3. Publish interaction draft
    await supabase
      .from("interactions")
      .update({ status: "published" })
      .eq("id", draftId);
    console.log("[handleOutstandingUpdate] interaction draft published:", draftId);

    invalidateAll();
    toast.success(isKeep ? "Log saved." : "Log saved. Follow-up rescheduled.");
    clearAndClose();
    navigate(`/contact/${contactId}`);
  };

  // ── Outstanding follow-up: Cancel chosen → show confirm dialog ──
  const handleOutstandingCancel = () => {
    console.log("[outstanding] cancel chosen:", { existingFollowupId: existingFollowup?.id });
    setShowCancelConfirmDialog(true);
  };

  // ── Outstanding follow-up: Cancel confirmed ──
  const handleOutstandingCancelConfirm = async () => {
    if (!existingFollowup || !draftId) return;

    console.log("[handleOutstandingCancelConfirm] cancel confirmed:", {
      existingFollowUpId: existingFollowup.id,
      draftId,
    });

    // 1. Mark follow-up as cancelled
    await supabase
      .from("follow_ups")
      .update({
        status: "cancelled",
        completed_at: new Date().toISOString(),
      })
      .eq("id", existingFollowup.id);

    // 2. Publish interaction draft
    await supabase
      .from("interactions")
      .update({ status: "published" })
      .eq("id", draftId);
    console.log("[handleOutstandingCancelConfirm] interaction draft published:", draftId);

    setShowCancelConfirmDialog(false);
    invalidateAll();
    toast.success("Log saved. Follow-up cancelled.");
    clearAndClose();
    navigate(`/contact/${contactId}`);
  };

  // ── Contact & UI helpers ──
  const handleAddNewContact = (name: string) => {
    const parts = name.trim().split(" ");
    setQuickForm({ ...quickForm, first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "" });
    setShowQuickAdd(true);
  };

  const handleUpdateLog = async (newConnectType: string, newNote: string) => {
    setConnectType(newConnectType);
    setNote(newNote);
    if (draftId) {
      await supabase.from("interactions").update({
        connect_type: newConnectType || null,
        note: newNote || null,
      }).eq("id", draftId);
    }
  };

  const handleChangeContact = async () => {
    if (draftId) {
      await supabase.from("interactions").delete().eq("id", draftId);
      console.log("[draft] contact changed — deleted interaction draft:", draftId);
      setDraftId(null);
    }
    setContactCleared(true);
    setContactId("");
    setExistingFollowup(null);
  };

  // "Want to add one?" — go back to step 1 with contact preserved
  const handleAddInteraction = () => {
    setStep(1);
    setSkippedInteraction(false);
    setExistingFollowup(null);
  };

  const handleStepBack = () => {
    if (step === "outstanding") {
      setStep(1);
    } else if (step === 3) {
      setStep("outstanding");
    } else {
      setStep(1);
    }
  };

  return (
    <>
      <FullscreenTakeover open={open} onOpenChange={handleOpen}>
        <div
          className="px-5 pb-6"
          style={{ flex: 1, overflowY: "auto" }}
          onContextMenu={(e) => e?.preventDefault?.()}
        >
            {step !== "outstanding" && startStep !== 2 && !logOnly && (
              <StepIndicator currentStep={step === 2 || step === 3 ? 2 : 1} />
            )}

            {step === 1 ? (
              <div className="space-y-5">
                {showQuickAdd && (
                  <div className="p-3 rounded-[12px] border border-border bg-card animate-fade-in">
                    <p className="text-[12px] font-medium text-muted-foreground mb-2 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)" }}>Quick-add contact</p>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="First Name *" value={quickForm.first_name} onChange={(e) => setQuickForm({ ...quickForm, first_name: e.target.value })} className="h-9 text-sm bg-background" />
                        <Input placeholder="Last Name" value={quickForm.last_name} onChange={(e) => setQuickForm({ ...quickForm, last_name: e.target.value })} className="h-9 text-sm bg-background" />
                      </div>
                      <Input placeholder="Company" value={quickForm.company} onChange={(e) => setQuickForm({ ...quickForm, company: e.target.value })} className="h-9 text-sm bg-background" />
                      <Input placeholder="Phone" value={quickForm.phone} onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })} className="h-9 text-sm bg-background" />
                      <Input placeholder="Email" type="email" value={quickForm.email} onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })} className="h-9 text-sm bg-background" />
                      <Button size="sm" onClick={() => quickAddContact.mutate()} disabled={!quickForm.first_name || quickAddContact.isPending} className="w-full">
                        {quickAddContact.isPending ? "Creating..." : "Create & Select"}
                      </Button>
                    </div>
                  </div>
                )}
                <LogStep1
                  connectType={connectType}
                  setConnectType={setConnectType}
                  note={note}
                  setNote={setNote}
                  onSubmit={() => logMutation.mutate()}
                  isSubmitting={logMutation.isPending}
                  disabled={!contactId}
                  submitLabel={logOnly ? "Save →" : undefined}
                  contactId={contactId}
                  contactName={contactName}
                  isContactPrefilled={isContactPrefilled}
                  contacts={contacts}
                  onContactSelect={setContactId}
                  onAddNewContact={handleAddNewContact}
                  onSkipToFollowup={activeFollowup ? undefined : async () => {
                    if (!contactId) {
                      toast.error("Select a contact first.");
                      return;
                    }
                    console.log("[skip] Step 1 skipped — routing to Step 2 with no draft");
                    // If user previously hit Next → (creating a draft) then came back and hit skip,
                    // delete the draft so no empty interaction record is left behind
                    if (draftId) {
                      await supabase.from("interactions").delete().eq("id", draftId);
                      console.log("[skip] deleted existing draft on skip:", draftId);
                      setDraftId(null);
                    }
                    setConnectType("");
                    setNote("");
                    setSkippedInteraction(true);
                    setStep(2);
                  }}
                  onChangeContact={handleChangeContact}
                  connectDate={connectDate}
                  setConnectDate={setConnectDate}
                />
              </div>
            ) : step === "outstanding" ? (
              <OutstandingFollowupStep
                existingFollowup={existingFollowup}
                contactName={contactName}
                onComplete={handleOutstandingComplete}
                onUpdate={handleOutstandingUpdate}
                onCancel={handleOutstandingCancel}
                onBack={() => setStep(1)}
              />
            ) : step === 2 ? (
              <LogStep2
                connectType={connectType}
                contactName={contactName}
                note={note}
                logDate={format(new Date(), "MMM d, yyyy")}
                onBack={handleStepBack}
                onSaveWithFollowup={(type, date) => followupMutation.mutate({ type, date })}
                onSkip={startStep === 2 ? undefined : handleSkip}
                isSaving={followupMutation.isPending}
                onUpdateLog={handleUpdateLog}
                skippedInteraction={skippedInteraction || startStep === 2}
                onAddInteraction={handleAddInteraction}
              />
            ) : step === 3 ? (
              <LogStep2
                connectType={connectType}
                contactName={contactName}
                note={note}
                logDate={format(new Date(), "MMM d, yyyy")}
                onBack={handleStepBack}
                onSaveWithFollowup={(type, date) => followupMutation.mutate({ type, date })}
                onSkip={handleSkip}
                isSaving={followupMutation.isPending}
                onUpdateLog={handleUpdateLog}
                skippedInteraction={false}
              />
            ) : null}
        </div>
      </FullscreenTakeover>

      {/* Discard dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard this log?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes that will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDiscardDialog(false);
              requestAnimationFrame(() => onOpenChange(true));
            }}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setShowDiscardDialog(false);
              if (draftId) {
                await supabase.from("interactions").delete().eq("id", draftId);
                console.log("[draft] discarded interaction:", draftId);
              }
              clearAndClose();
            }}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel follow-up confirmation */}
      <AlertDialog open={showCancelConfirmDialog} onOpenChange={setShowCancelConfirmDialog}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this follow-up?</AlertDialogTitle>
            <AlertDialogDescription>
              It'll be recorded as cancelled in {contactName}'s history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowCancelConfirmDialog(false)}
              style={{ fontFamily: "var(--font-body)" }}
            >
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleOutstandingCancelConfirm}>
              Cancel follow-up
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LogInteractionSheet;
