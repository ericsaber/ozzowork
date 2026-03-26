import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
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
  skipFollowupStep?: boolean;
  existingTaskRecordId?: string;
}

const LogInteractionSheet = ({
  open, onOpenChange, preselectedContactId, skipFollowupStep = false, existingTaskRecordId,
}: LogInteractionSheetProps) => {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | "outstanding" | 2 | 3>(1);
  const [contactId, setContactId] = useState(preselectedContactId || "");
  const [connectType, setConnectType] = useState("");
  const [note, setNote] = useState("");
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showCancelConfirmDialog, setShowCancelConfirmDialog] = useState(false);
  const [contactCleared, setContactCleared] = useState(false);
  const [connectDate, setConnectDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ first_name: "", last_name: "", company: "", phone: "", email: "" });
  const [skippedInteraction, setSkippedInteraction] = useState(false);

  // Draft state (FAB / Log button flows only — not completion flow)
  const [draftId, setDraftId] = useState<string | null>(null);
  const [existingFollowup, setExistingFollowup] = useState<any | null>(null);

  // skipFollowupStep mode keeps its own record reference (unchanged)
  const [savedTaskRecordId, setSavedTaskRecordId] = useState<string | null>(null);

  // isDirty tied to draft existence (spec: false before Next →, true after)
  const isDirty = !!draftId;

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
        .from("task_records" as any)
        .select("id, planned_follow_up_type, planned_follow_up_date, connect_type, note")
        .eq("contact_id", contactId)
        .eq("status", "active")
        .not("planned_follow_up_date", "is", null)
        .limit(1)
        .maybeSingle();
      return data as any;
    },
    enabled: open && !!contactId,
  });

  const clearAndClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setContactId(preselectedContactId || "");
      setConnectType("");
      setNote("");
      setDraftId(null);
      setExistingFollowup(null);
      setSavedTaskRecordId(null);
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
    queryClient.invalidateQueries({ queryKey: ["task-records"] });
    queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
    queryClient.invalidateQueries({ queryKey: ["task-records-upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["active-followup"] });
  };

  // ── Main log mutation: creates or updates draft ──
  const logMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!contactId) throw new Error("Select a contact");

      const computedConnectDate =
        connectDate === format(new Date(), "yyyy-MM-dd")
          ? new Date().toISOString()
          : new Date(connectDate + "T12:00:00").toISOString();

      // skipFollowupStep mode — unchanged behavior (no draft)
      if (skipFollowupStep && existingTaskRecordId) {
        const updatePayload = {
          connect_type: connectType || null,
          note: note || null,
          connect_date: computedConnectDate,
        };
        console.log("[LogInteractionSheet] skipFollowupStep update payload:", updatePayload, "taskRecordId:", existingTaskRecordId);
        const { error } = await supabase.from("task_records" as any).update(updatePayload).eq("id", existingTaskRecordId);
        if (error) throw error;
        return { id: existingTaskRecordId, skipMode: true };
      }

      // Update existing draft
      if (draftId) {
        const { error } = await supabase.from("task_records" as any).update({
          connect_type: connectType || null,
          note: note || null,
          connect_date: computedConnectDate,
        }).eq("id", draftId);
        if (error) throw error;
        console.log("[draft] updated:", { draftId, connect_type: connectType, note, connect_date: computedConnectDate });
        return { id: draftId, skipMode: false };
      }

      // Create new draft
      const { data, error } = await supabase.from("task_records" as any).insert({
        contact_id: contactId,
        user_id: user.id,
        connect_type: connectType || null,
        connect_date: computedConnectDate,
        note: note || null,
        status: "draft",
      }).select("id").single();
      if (error) throw error;
      console.log("[draft] created:", { draftId: (data as any).id, connect_type: connectType, note, connect_date: computedConnectDate });
      return { id: (data as any).id, skipMode: false };
    },
    onSuccess: (result: any) => {
      // skipFollowupStep mode — close immediately
      if (result.skipMode) {
        console.log("[LogInteractionSheet] invalidating:", existingTaskRecordId, "type:", typeof existingTaskRecordId);
        invalidateAll();
        queryClient.invalidateQueries({ queryKey: ["task-record", existingTaskRecordId] });
        queryClient.invalidateQueries({ queryKey: ["contact-task-records", contactId] });
        toast.success("Interaction logged");
        clearAndClose();
        return;
      }

      // Store draft ID
      setDraftId(result.id);
      setSkippedInteraction(!connectType && !note);

      // Check for active follow-up on the contact
      if (activeFollowup && !skipFollowupStep) {
        setExistingFollowup(activeFollowup);
        console.log("[outstanding] active follow-up found — routing to outstanding step:", {
          taskRecordId: activeFollowup.id,
          type: activeFollowup.planned_follow_up_type,
          date: activeFollowup.planned_follow_up_date,
          isTailsOnly: !activeFollowup.connect_type && !activeFollowup.note,
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

      // Step 3: complete path — outstanding follow-up needs resolving
      if (existingFollowup) {
        const isTailsOnly = !existingFollowup.connect_type && !existingFollowup.note;
        const computedConnectDate = new Date().toISOString();

        console.log("[followupMutation] complete path:", {
          isTailsOnly,
          existingFollowupId: existingFollowup.id,
          draftId,
          newFollowUpType: type,
          newFollowUpDate: date,
        });

        if (isTailsOnly) {
          // Fill in the head of the existing tails-only coin + mark complete
          const { error: updateError } = await supabase.from("task_records" as any).update({
            connect_type: connectType || null,
            connect_date: computedConnectDate,
            note: note || null,
            status: "completed",
            completed_at: computedConnectDate,
          }).eq("id", existingFollowup.id);
          console.log('[followupMutation] tails-only UPDATE result:', { error: updateError?.message || null });

          // Delete the draft (interaction absorbed into existing record)
          const { error: deleteError } = await supabase.from("task_records" as any).delete().eq("id", draftId!);
          console.log('[followupMutation] tails-only DELETE result:', { error: deleteError?.message || null });

          // If new follow-up set, create new tails-only coin
          if (date) {
            const { error: insertError } = await supabase.from("task_records" as any).insert({
              contact_id: contactId,
              user_id: user.id,
              planned_follow_up_type: type || null,
              planned_follow_up_date: date,
              status: "active",
            });
            console.log('[followupMutation] tails-only INSERT result:', { error: insertError?.message || null, date });
          }
        } else {
          // Full coin: mark existing record's tail complete
          await supabase.from("task_records" as any).update({
            status: "completed",
            completed_at: computedConnectDate,
          }).eq("id", existingFollowup.id);

          // Promote draft to active with new follow-up
          await supabase.from("task_records" as any).update({
            status: "active",
            planned_follow_up_type: type || null,
            planned_follow_up_date: date || null,
          }).eq("id", draftId!);
        }
        return { completePath: true, hasFollowup: !!date };
      }

      // Normal step 2 path (no outstanding follow-up)
      if (!draftId) throw new Error("No draft record");
      await supabase.from("task_records" as any).update({
        planned_follow_up_type: type || null,
        planned_follow_up_date: date,
        status: "active",
      }).eq("id", draftId);
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
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Skip follow-up: handle both normal and complete path ──
  const handleSkip = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Complete path skip — same as followupMutation but with no follow-up
    if (existingFollowup) {
      const isTailsOnly = !existingFollowup.connect_type && !existingFollowup.note;
      const computedConnectDate = new Date().toISOString();

      console.log("[handleSkip] complete path skip:", { isTailsOnly, existingFollowupId: existingFollowup.id, draftId });

      if (isTailsOnly) {
        await supabase.from("task_records" as any).update({
          connect_type: connectType || null,
          connect_date: computedConnectDate,
          note: note || null,
          status: "completed",
          completed_at: computedConnectDate,
          planned_follow_up_type: null,
          planned_follow_up_date: null,
        }).eq("id", existingFollowup.id);
        await supabase.from("task_records" as any).delete().eq("id", draftId!);
      } else {
        await supabase.from("task_records" as any).update({
          status: "completed",
          completed_at: computedConnectDate,
        }).eq("id", existingFollowup.id);
        await supabase.from("task_records" as any).update({
          status: "active",
          planned_follow_up_type: null,
          planned_follow_up_date: null,
        }).eq("id", draftId!);
      }
      invalidateAll();
      toast.success("Nice work. Log saved.");
      clearAndClose();
      return;
    }

    // Normal skip
    if (draftId) {
      await supabase.from("task_records" as any).update({ status: "active" }).eq("id", draftId);
      console.log("[draft] skipped follow-up, promoted to active:", draftId);
    }
    invalidateAll();
    toast.success("Log saved.");
    clearAndClose();
  };

  // ── Outstanding follow-up: Complete chosen → go to step 3 ──
  const handleOutstandingComplete = () => {
    console.log("[outstanding] complete chosen — proceeding to step 3:", {
      existingFollowupId: existingFollowup?.id,
      isTailsOnly: !existingFollowup?.connect_type && !existingFollowup?.note,
      plannedDate: existingFollowup?.planned_follow_up_date,
    });
    setStep(3);
  };

  // ── Outstanding follow-up: Update/keep chosen → save immediately ──
  const handleOutstandingUpdate = async (newDate: string) => {
    if (!existingFollowup || !draftId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const previousDate = existingFollowup.planned_follow_up_date;
    const isKeep = newDate === previousDate;

    console.log("[outstanding] update chosen:", {
      existingFollowupId: existingFollowup.id,
      previousDate,
      newDate,
      isKeep,
    });

    // 1. If rescheduling (not keeping), insert a follow_up_edits audit row
    if (!isKeep) {
      await supabase.from("follow_up_edits" as any).insert({
        task_record_id: existingFollowup.id,
        follow_up_id: null,
        previous_type: existingFollowup.planned_follow_up_type || '',
        previous_due_date: previousDate,
        changed_at: new Date().toISOString(),
        user_id: user.id,
      });

      console.log("[handleOutstandingUpdate] follow_up_edits inserted:", {
        task_record_id: existingFollowup.id,
        previous_type: existingFollowup.planned_follow_up_type || '',
        previous_due_date: previousDate,
      });
    }

    // 2. If rescheduling, update planned_follow_up_date on existing record
    if (!isKeep) {
      await supabase.from("task_records" as any)
        .update({ planned_follow_up_date: newDate })
        .eq("id", existingFollowup.id);
    }

    // 3. Promote draft to active (heads-only standalone log)
    // Set related_task_record_id to link this log to the rescheduled/kept record
    // If keep, store the kept date on the standalone log for history display
    await supabase.from("task_records" as any)
      .update({
        status: "active",
        related_task_record_id: existingFollowup.id,
        ...(isKeep ? { planned_follow_up_date: existingFollowup.planned_follow_up_date } : {}),
      })
      .eq("id", draftId);

    console.log("[handleOutstandingUpdate] standalone log linked to rescheduled record:", {
      draftId,
      relatedRecordId: existingFollowup.id,
      isKeep,
    });

    invalidateAll();
    toast.success(isKeep ? "Log saved." : "Log saved. Follow-up rescheduled.");
    clearAndClose();
  };

  // ── Outstanding follow-up: Cancel chosen → show confirm dialog ──
  const handleOutstandingCancel = () => {
    console.log("[outstanding] cancel chosen:", { existingFollowupId: existingFollowup?.id });
    setShowCancelConfirmDialog(true);
  };

  // ── Outstanding follow-up: Cancel confirmed ──
  const handleOutstandingCancelConfirm = async () => {
    if (!existingFollowup || !draftId) return;

    console.log("[outstanding] cancel confirmed:", {
      existingFollowupId: existingFollowup.id,
      plannedDatePreserved: existingFollowup.planned_follow_up_date,
      draftId,
    });

    // 1. Mark existing follow-up as cancelled — preserve planned_follow_up_date
    await supabase.from("task_records" as any)
      .update({
        status: "cancelled",
        completed_at: new Date().toISOString(),
      })
      .eq("id", existingFollowup.id);

    // 2. Promote draft to active (standalone log, no follow-up)
    await supabase.from("task_records" as any)
      .update({
        status: "active",
        related_task_record_id: existingFollowup.id,
      })
      .eq("id", draftId);

    console.log("[handleOutstandingCancelConfirm] standalone log linked to cancelled record:", {
      draftId,
      relatedRecordId: existingFollowup.id,
    });

    setShowCancelConfirmDialog(false);
    invalidateAll();
    toast.success("Log saved. Follow-up cancelled.");
    clearAndClose();
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
      await supabase.from("task_records" as any).update({
        connect_type: newConnectType || null,
        note: newNote || null,
      }).eq("id", draftId);
    }
  };

  const handleChangeContact = async () => {
    // Delete existing draft if any
    if (draftId) {
      await supabase.from("task_records" as any).delete().eq("id", draftId);
      console.log("[draft] contact changed — deleted draft:", draftId);
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
      <Drawer open={open} onOpenChange={handleOpen} snapPoints={isContactPrefilled ? undefined : [0.95]}>
        <DrawerContent maxHeightRatio={isContactPrefilled ? 0.9 : 0.95} onContextMenu={(e) => e?.preventDefault?.()}>
          <div className="overflow-y-auto px-5 pb-6">
            {!skipFollowupStep && step !== "outstanding" && (
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
                  contactId={contactId}
                  contactName={contactName}
                  isContactPrefilled={isContactPrefilled}
                  contacts={contacts}
                  onContactSelect={setContactId}
                  onAddNewContact={handleAddNewContact}
                  onSkipToFollowup={skipFollowupStep || activeFollowup ? undefined : () => logMutation.mutate()}
                  onChangeContact={handleChangeContact}
                  submitLabel={skipFollowupStep ? "Save →" : undefined}
                  showDateRow={skipFollowupStep}
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
                onSkip={handleSkip}
                isSaving={followupMutation.isPending}
                onUpdateLog={handleUpdateLog}
                skippedInteraction={skippedInteraction}
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
        </DrawerContent>
      </Drawer>

      {/* Discard dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
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
                await supabase.from("task_records" as any).delete().eq("id", draftId);
                console.log("[draft] discarded:", draftId);
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
        <AlertDialogContent>
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
