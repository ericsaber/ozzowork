import { useState, useEffect, useRef } from "react";
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

interface LogInteractionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedContactId?: string | null;
  skipFollowupStep?: boolean;
  existingTaskRecordId?: string;
}

// Bug 10: Module-level draft persistence
let savedDraft: { contactId: string; connectType: string; note: string } | null = null;

const LogInteractionSheet = ({ open, onOpenChange, preselectedContactId, skipFollowupStep = false, existingTaskRecordId }: LogInteractionSheetProps) => {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [contactId, setContactId] = useState(preselectedContactId || "");
  const [connectType, setConnectType] = useState("");
  const [note, setNote] = useState("");
  const [savedTaskRecordId, setSavedTaskRecordId] = useState<string | null>(null);
  const [skippedInteraction, setSkippedInteraction] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  // Bug 3: Track if prefilled contact was cleared by user
  const [contactCleared, setContactCleared] = useState(false);

  // Fix 1: connect date for skipFollowupStep mode (defaults to today)
  const [connectDate, setConnectDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ first_name: "", last_name: "", company: "", phone: "", email: "" });

  // Bug 2: Sync contactId when preselectedContactId changes (route navigation)
  useEffect(() => {
    if (!open) {
      // When sheet is closed, always sync to current route context
      if (!savedDraft) {
        setContactId(preselectedContactId || "");
        setContactCleared(false);
      }
    }
  }, [preselectedContactId, open]);

  // Bug 10: Restore draft on open
  useEffect(() => {
    if (open && savedDraft && !preselectedContactId) {
      setContactId(savedDraft.contactId);
      setConnectType(savedDraft.connectType);
      setNote(savedDraft.note);
      savedDraft = null;
    } else if (open && !savedDraft && !contactCleared) {
      // Fresh open — sync to preselected
      setContactId(preselectedContactId || "");
    }
  }, [open, preselectedContactId]);

  const isDirty = !!note || !!connectType || (!!contactId && contactId !== (preselectedContactId || ""));

  const clearAndClose = () => {
    savedDraft = null;
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setContactId(preselectedContactId || "");
      setConnectType("");
      setNote("");
      setSavedTaskRecordId(null);
      setSkippedInteraction(false);
      setContactCleared(false);
      setConnectDate(format(new Date(), "yyyy-MM-dd"));
      setShowQuickAdd(false);
      setQuickForm({ first_name: "", last_name: "", company: "", phone: "", email: "" });
    }, 300);
  };

  // Bug 7: Intercept dismiss — do NOT close the drawer while showing dialog
  const handleOpen = (o: boolean) => {
    if (!o) {
      if (isDirty && step === 1) {
        savedDraft = { contactId, connectType, note };
        setShowDiscardDialog(true);
        // Do NOT call onOpenChange(false) — keep drawer open
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
  // Bug 3: isContactPrefilled is false if user cleared it
  const isContactPrefilled = !!preselectedContactId && !contactCleared;

  const quickAddContact = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("contacts").insert({
        first_name: quickForm.first_name, last_name: quickForm.last_name,
        company: quickForm.company || null, phone: quickForm.phone || null, email: quickForm.email || null, user_id: user.id,
      }).select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setContactId(data.id); setShowQuickAdd(false);
      setQuickForm({ first_name: "", last_name: "", company: "", phone: "", email: "" });
      toast.success("Contact created & selected");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["task-records"] });
    queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
    queryClient.invalidateQueries({ queryKey: ["task-records-upcoming"] });
  };

  const logMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!contactId) throw new Error("Select a contact");

      // skipFollowupStep mode: ONLY update existing task record — no insert
      if (skipFollowupStep && existingTaskRecordId) {
        const updatePayload = {
          connect_type: connectType || null,
          note: note || null,
          connect_date: new Date().toISOString(),
        };
        console.log("[LogInteractionSheet] skipFollowupStep update payload:", updatePayload, "taskRecordId:", existingTaskRecordId);
        const { error } = await supabase.from("task_records" as any).update(updatePayload).eq("id", existingTaskRecordId);
        if (error) throw error;
        return { id: existingTaskRecordId, skipMode: true };
      }

      if (savedTaskRecordId) {
        const { error } = await supabase.from("task_records" as any).update({
          connect_type: connectType || null, note: note || null,
        }).eq("id", savedTaskRecordId);
        if (error) throw error;
        return { id: savedTaskRecordId, skipMode: false };
      }

      const { data, error } = await supabase.from("task_records" as any).insert({
        contact_id: contactId, user_id: user.id,
        connect_type: connectType || null, connect_date: new Date().toISOString(),
        note: note || null, status: "active",
      }).select("id").single();
      if (error) throw error;
      return { id: (data as any).id, skipMode: false };
    },
    onSuccess: async (data: any) => {
      if (data.skipMode) {
        console.log('[LogInteractionSheet] invalidating:', existingTaskRecordId, 'type:', typeof existingTaskRecordId);
        invalidateAll();
        await queryClient.invalidateQueries({ queryKey: ["task-record", existingTaskRecordId] });
        await queryClient.invalidateQueries({ queryKey: ["contact-task-records", contactId] });
        toast.success("Interaction logged");
        savedDraft = null;
        clearAndClose();
        return;
      }
      setSavedTaskRecordId(data.id);
      invalidateAll();
      setSkippedInteraction(!connectType && !note);
      setStep(2);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const followupMutation = useMutation({
    mutationFn: async ({ type, date }: { type: string; date: string }) => {
      if (!savedTaskRecordId) throw new Error("No task record to update");
      const { error } = await supabase.from("task_records" as any).update({
        planned_follow_up_type: type || null, planned_follow_up_date: date,
      }).eq("id", savedTaskRecordId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Follow-up set");
      savedDraft = null;
      clearAndClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSkip = () => {
    invalidateAll();
    toast.success("Interaction logged");
    savedDraft = null;
    clearAndClose();
  };

  const handleAddNewContact = (name: string) => {
    const parts = name.trim().split(" ");
    setQuickForm({ ...quickForm, first_name: parts[0] || "", last_name: parts.slice(1).join(" ") || "" });
    setShowQuickAdd(true);
  };

  const handleUpdateLog = async (newConnectType: string, newNote: string) => {
    setConnectType(newConnectType);
    setNote(newNote);
    if (savedTaskRecordId) {
      await supabase.from("task_records" as any).update({
        connect_type: newConnectType || null, note: newNote || null,
      }).eq("id", savedTaskRecordId);
    }
  };

  // Bug 3: Handle "Change" from prefilled contact
  const handleChangeContact = () => {
    setContactCleared(true);
    setContactId("");
  };

  // Fix 1: "Want to add one?" — reset to step 1 with contact preserved
  const handleAddInteraction = () => {
    setStep(1);
    setSkippedInteraction(false);
    setSavedTaskRecordId(null);
    // contactId remains set — contact stays pre-filled
  };

  return (
    <>
      <Drawer open={open} onOpenChange={handleOpen}>
        <DrawerContent className="max-h-[90vh]" onContextMenu={(e) => e?.preventDefault?.()}>
          <div className="overflow-y-auto px-5 pb-6">
            {!skipFollowupStep && <StepIndicator currentStep={step} />}

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
                  onSkipToFollowup={skipFollowupStep ? undefined : () => logMutation.mutate()}
                  onChangeContact={handleChangeContact}
                  submitLabel={skipFollowupStep ? "Save →" : undefined}
                  showDateRow={skipFollowupStep}
                  connectDate={connectDate}
                  setConnectDate={setConnectDate}
                />
              </div>
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
                onUpdateLog={handleUpdateLog}
                skippedInteraction={skippedInteraction}
                onAddInteraction={handleAddInteraction}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Bug 10: Discard confirmation dialog */}
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
              // Bug 7: Ensure drawer stays open + force layout reset after keyboard
              requestAnimationFrame(() => {
                onOpenChange(true);
              });
            }}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowDiscardDialog(false);
              savedDraft = null;
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
