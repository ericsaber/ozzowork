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
import InterstitialScreen from "@/components/InterstitialScreen";

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

  const [step, setStep] = useState<1 | "interstitial" | 2>(1);
  const [contactId, setContactId] = useState(preselectedContactId || "");
  const [connectType, setConnectType] = useState("");
  const [note, setNote] = useState("");
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [contactCleared, setContactCleared] = useState(false);
  const [connectDate, setConnectDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ first_name: "", last_name: "", company: "", phone: "", email: "" });
  const [skippedInteraction, setSkippedInteraction] = useState(false);

  // Draft state (FAB / Log button flows only — not completion flow)
  const [draftId, setDraftId] = useState<string | null>(null);
  const [linkedRecordId, setLinkedRecordId] = useState<string | null>(null);
  const [interstitialPath, setInterstitialPath] = useState<"link" | "clear" | "keep" | null>(null);
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
      setLinkedRecordId(null);
      setInterstitialPath(null);
      setExistingFollowup(null);
      setSavedTaskRecordId(null);
      setSkippedInteraction(false);
      setContactCleared(false);
      setConnectDate(format(new Date(), "yyyy-MM-dd"));
      setShowQuickAdd(false);
      setQuickForm({ first_name: "", last_name: "", company: "", phone: "", email: "" });
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
        console.log("[interstitial] active follow-up found:", {
          taskRecordId: activeFollowup.id,
          type: activeFollowup.planned_follow_up_type,
          date: activeFollowup.planned_follow_up_date,
          hasPriorInteraction: !!(activeFollowup.connect_type || activeFollowup.note),
        });
        setStep("interstitial");
      } else {
        setStep(2);
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Follow-up mutation: promotes draft or updates linked record ──
  const followupMutation = useMutation({
    mutationFn: async ({ type, date }: { type: string; date: string }) => {
      const recordId = interstitialPath === "link" ? linkedRecordId : draftId;
      if (!recordId) throw new Error("No record to update");

      const updatePayload: any = {
        planned_follow_up_type: type || null,
        planned_follow_up_date: date,
      };

      // For non-link paths, promote draft to active
      if (interstitialPath !== "link") {
        updatePayload.status = "active";
      }

      const { error } = await supabase.from("task_records" as any).update(updatePayload).eq("id", recordId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success(interstitialPath === "link" ? "Follow-up updated" : "Follow-up set");
      clearAndClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Skip follow-up: promote draft to completed (heads-only) ──
  const handleSkip = async () => {
    if (draftId) {
      await supabase.from("task_records" as any).update({ status: "completed" }).eq("id", draftId);
    }
    invalidateAll();
    toast.success("Interaction logged");
    clearAndClose();
  };

  // ── Keep-separate save: promote draft to completed (heads-only) ──
  const handleSaveHeadsOnly = async () => {
    if (draftId) {
      await supabase.from("task_records" as any).update({ status: "completed" }).eq("id", draftId);
      console.log("[interstitial] keep separate — saved heads-only:", draftId);
    }
    invalidateAll();
    toast.success("Interaction saved");
    clearAndClose();
  };

  // ── Interstitial handlers ──
  const handleLinkAndUpdate = async () => {
    if (!draftId || !existingFollowup) return;

    const computedConnectDate =
      connectDate === format(new Date(), "yyyy-MM-dd")
        ? new Date().toISOString()
        : new Date(connectDate + "T12:00:00").toISOString();

    // Update existing record with draft's interaction data
    await supabase.from("task_records" as any).update({
      connect_type: connectType || null,
      note: note || null,
      connect_date: computedConnectDate,
    }).eq("id", existingFollowup.id);

    // Delete draft (absorbed into existing record)
    await supabase.from("task_records" as any).delete().eq("id", draftId);

    console.log("[interstitial] link and update — updating:", existingFollowup.id, "deleting draft:", draftId);

    setLinkedRecordId(existingFollowup.id);
    setDraftId(null);
    setInterstitialPath("link");
    invalidateAll();
    setStep(2);
  };

  const handleClearAndSetNew = async () => {
    if (!existingFollowup) return;

    // Clear existing record — permanent, not reverted
    await supabase.from("task_records" as any).update({ status: "cleared" }).eq("id", existingFollowup.id);

    console.log("[interstitial] clear and set new — cleared:", existingFollowup.id, "draft continues:", draftId);

    setInterstitialPath("clear");
    invalidateAll();
    setStep(2);
  };

  const handleKeepSeparate = () => {
    console.log("[interstitial] keep separate — draft will be heads-only:", draftId);
    setInterstitialPath("keep");
    setStep(2);
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
    const recordId = interstitialPath === "link" ? linkedRecordId : draftId;
    if (recordId) {
      await supabase.from("task_records" as any).update({
        connect_type: newConnectType || null,
        note: newNote || null,
      }).eq("id", recordId);
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
    setInterstitialPath(null);
    setLinkedRecordId(null);
    setExistingFollowup(null);
  };

  // "Want to add one?" — go back to step 1 with contact preserved
  const handleAddInteraction = () => {
    setStep(1);
    setSkippedInteraction(false);
    setInterstitialPath(null);
    setExistingFollowup(null);
  };

  const handleStepBack = () => {
    if (step === "interstitial") {
      setStep(1);
    } else {
      setStep(1);
      setInterstitialPath(null);
    }
  };

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpen} snapPoints={isContactPrefilled ? undefined : [0.95]}>
        <DrawerContent maxHeightRatio={isContactPrefilled ? 0.9 : 0.95} onContextMenu={(e) => e?.preventDefault?.()}>
          <div className="overflow-y-auto px-5 pb-6">
            {!skipFollowupStep && step !== "interstitial" && (
              <StepIndicator currentStep={step === 2 ? 2 : 1} />
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
            ) : step === "interstitial" ? (
              <InterstitialScreen
                existingFollowup={existingFollowup}
                contactName={contactName}
                onLinkAndUpdate={handleLinkAndUpdate}
                onClearAndSetNew={handleClearAndSetNew}
                onKeepSeparate={handleKeepSeparate}
                onBack={() => setStep(1)}
              />
            ) : (
              <LogStep2
                connectType={connectType}
                contactName={contactName}
                note={note}
                logDate={format(new Date(), "MMM d, yyyy")}
                onBack={interstitialPath ? undefined : handleStepBack}
                onSaveWithFollowup={(type, date) => followupMutation.mutate({ type, date })}
                onSkip={handleSkip}
                isSaving={followupMutation.isPending}
                onUpdateLog={handleUpdateLog}
                skippedInteraction={skippedInteraction}
                onAddInteraction={handleAddInteraction}
                isKeepSeparatePath={interstitialPath === "keep"}
                isLinkPath={interstitialPath === "link"}
                isClearPath={interstitialPath === "clear"}
                existingFollowupDate={existingFollowup?.planned_follow_up_date}
                existingFollowupType={existingFollowup?.planned_follow_up_type}
                onSaveHeadsOnly={handleSaveHeadsOnly}
              />
            )}
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
    </>
  );
};

export default LogInteractionSheet;
