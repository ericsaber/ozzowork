import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

// Module-level draft persistence
let savedDraft: { contactId: string; connectType: string; note: string } | null = null;

export function getSavedDraft() { return savedDraft; }
export function setSavedDraft(d: typeof savedDraft) { savedDraft = d; }

interface UseLogInteractionOptions {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedContactId?: string | null;
  skipFollowupStep?: boolean;
  existingTaskRecordId?: string;
}

export function useLogInteraction({
  open,
  onOpenChange,
  preselectedContactId,
  skipFollowupStep = false,
  existingTaskRecordId,
}: UseLogInteractionOptions) {
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [contactId, setContactId] = useState(preselectedContactId || "");
  const [connectType, setConnectType] = useState("");
  const [note, setNote] = useState("");
  const [savedTaskRecordId, setSavedTaskRecordId] = useState<string | null>(null);
  const [skippedInteraction, setSkippedInteraction] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [contactCleared, setContactCleared] = useState(false);
  const [connectDate, setConnectDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ first_name: "", last_name: "", company: "", phone: "", email: "" });

  // Sync contactId when preselectedContactId changes
  useEffect(() => {
    if (!open) {
      if (!savedDraft) {
        setContactId(preselectedContactId || "");
        setContactCleared(false);
      }
    }
  }, [preselectedContactId, open]);

  // Restore draft on open
  useEffect(() => {
    if (open && savedDraft && !preselectedContactId) {
      setContactId(savedDraft.contactId);
      setConnectType(savedDraft.connectType);
      setNote(savedDraft.note);
      savedDraft = null;
    } else if (open && !savedDraft && !contactCleared) {
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

  const handleRequestClose = () => {
    if (isDirty && step === 1) {
      savedDraft = { contactId, connectType, note };
      setShowDiscardDialog(true);
      return false; // signal: don't close yet
    }
    clearAndClose();
    return true;
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

      if (skipFollowupStep && existingTaskRecordId) {
        const updatePayload = {
          connect_type: connectType || null,
          note: note || null,
          connect_date: connectDate === format(new Date(), 'yyyy-MM-dd')
            ? new Date().toISOString()
            : new Date(connectDate + 'T12:00:00').toISOString(),
        };
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
        connect_type: connectType || null, connect_date: connectDate === format(new Date(), 'yyyy-MM-dd') ? new Date().toISOString() : new Date(connectDate + 'T12:00:00').toISOString(),
        note: note || null, status: "active",
      }).select("id").single();
      if (error) throw error;
      return { id: (data as any).id, skipMode: false };
    },
    onSuccess: async (data: any) => {
      if (data.skipMode) {
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

  const handleChangeContact = () => {
    setContactCleared(true);
    setContactId("");
  };

  const handleAddInteraction = () => {
    setStep(1);
    setSkippedInteraction(false);
    setSavedTaskRecordId(null);
  };

  const handleDiscardKeep = () => {
    setShowDiscardDialog(false);
  };

  const handleDiscardConfirm = () => {
    setShowDiscardDialog(false);
    savedDraft = null;
    clearAndClose();
  };

  return {
    step, contactId, setContactId, connectType, setConnectType,
    note, setNote, contactName, isContactPrefilled, contacts,
    showQuickAdd, quickForm, setQuickForm, quickAddContact,
    logMutation, followupMutation,
    handleSkip, handleAddNewContact, handleUpdateLog, handleChangeContact, handleAddInteraction,
    showDiscardDialog, handleDiscardKeep, handleDiscardConfirm,
    handleRequestClose, clearAndClose,
    isDirty, skippedInteraction, savedTaskRecordId,
    skipFollowupStep, connectDate, setConnectDate,
    showQuickAddState: [showQuickAdd, setShowQuickAdd] as [boolean, (v: boolean) => void],
  };
}
