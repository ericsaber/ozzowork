import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Search, CalendarIcon, ArrowRight, Check } from "lucide-react";
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
import LogStep1 from "@/components/LogStep1";
import LogStep2 from "@/components/LogStep2";
import OutstandingFollowupStep from "@/components/OutstandingFollowupStep";

const getAvatarColors = (name: string) => {
  const palette = [
    { bg: "#fde8da", text: "#c8622a" },
    { bg: "#d4edda", text: "#2d6a4f" },
    { bg: "#dce8f5", text: "#2c5f8a" },
    { bg: "#e8ddf5", text: "#6b3fa0" },
    { bg: "#f5e8d0", text: "#8a5c2a" },
  ];
  const parts = (name || "").trim().split(" ");
  const a = (parts[0]?.[0] || "A").toUpperCase().charCodeAt(0);
  const b = (parts[1]?.[0] || parts[0]?.[1] || "A").toUpperCase().charCodeAt(0);
  return palette[(a + b) % 5];
};

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

  // Determine initial step based on whether contact is pre-filled
  const getInitialStep = (): "contact-picker" | 1 | "outstanding" | 2 => {
    if (preselectedContactId && startStep === 1) return 1;
    if (startStep === 2) return 2;
    if (!preselectedContactId) return "contact-picker";
    return startStep;
  };

  const [step, setStep] = useState<"contact-picker" | 1 | "outstanding" | 2>(getInitialStep());

  useEffect(() => {
    if (open) {
      setStep(getInitialStep());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, startStep, preselectedContactId]);

  // Contact picker search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [slideOut, setSlideOut] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
  const [pendingDate, setPendingDate] = useState("");
  const [pendingType, setPendingType] = useState("");
  const [pendingReminder, setPendingReminder] = useState("");
  const [outstandingChoice, setOutstandingChoice] = useState<"keep" | "reschedule" | "cancel" | null>(null);
  const [outstandingDate, setOutstandingDate] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationText, setCelebrationText] = useState("Logged.");
  const [showSkipDiscardDialog, setShowSkipDiscardDialog] = useState(false);
  const [logSkipped, setLogSkipped] = useState(false);
  

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
        .select("id, planned_type, planned_date, status, reminder_note")
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
      
      setContactCleared(false);
      setConnectDate(format(new Date(), "yyyy-MM-dd"));
      setShowQuickAdd(false);
      setQuickForm({ first_name: "", last_name: "", company: "", phone: "", email: "" });
      setShowCancelConfirmDialog(false);
      setPendingDate("");
      setPendingType("");
      setPendingReminder("");
      setOutstandingChoice(null);
      setOutstandingDate("");
      setShowCelebration(false);
      setShowSkipDiscardDialog(false);
      setLogSkipped(false);
      setSlideOut(false);
    }, 300);
  };

  const triggerCelebration = (text: string, contactIdForNav: string) => {
    setCelebrationText(text);
    setShowCelebration(true);
    setTimeout(() => {
      setShowCelebration(false);
      clearAndClose();
      navigate(`/contact/${contactIdForNav}`);
    }, 1800);
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

  const { data: recentContactIds } = useQuery({
    queryKey: ["recent-contact-ids"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("interactions")
        .select("contact_id, connect_date")
        .eq("user_id", user.id)
        .eq("status", "published")
        .order("connect_date", { ascending: false })
        .limit(20);
      if (error) {
        console.log("[recentContactIds] error:", error);
        return [];
      }
      const seen = new Set<string>();
      const ids: string[] = [];
      for (const row of data || []) {
        if (!seen.has(row.contact_id)) {
          seen.add(row.contact_id);
          ids.push(row.contact_id);
          if (ids.length === 3) break;
        }
      }
      console.log("[recentContactIds] top 3:", ids);
      return ids;
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
      

      // logOnly mode — publish draft immediately and close, no Step 2
      if (logOnly) {
        supabase
          .from("interactions")
          .update({ status: "published" })
          .eq("id", result.id)
          .then(() => {
            console.log("[LogInteractionSheet] logOnly — draft published:", result.id);
            invalidateAll();
            triggerCelebration("Logged.", contactId);
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
    mutationFn: async ({ type, date, reminderNote }: { type: string; date: string; reminderNote: string }) => {
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
          console.log("[followupMutation] complete-path insert reminder_note:", reminderNote);
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
          console.log("[followupMutation] new follow_up inserted:", { type, date, reminder_note: reminderNote.trim() || null });
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
      console.log("[followupMutation] normal-path insert reminder_note:", reminderNote);
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
      console.log("[followupMutation] follow_up inserted:", { type, date, reminder_note: reminderNote.trim() || null });

      return { completePath: false, hasFollowup: true, hadDraft: !!draftId };
    },
    onSuccess: (result: any) => {
      invalidateAll();
      let text: string;
      if (result?.completePath) {
        text = result.hasFollowup ? "Logged & set." : "Logged.";
      } else if (result?.hasFollowup) {
        text = result?.hadDraft ? "Logged & set." : "Follow-up set.";
      } else {
        text = "Logged.";
      }
      triggerCelebration(text, contactId);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // ── Skip follow-up: handle both normal and complete path ──
  const handleSkip = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Nothing to save and no outstanding follow-up — just close
    if (!draftId && !existingFollowup) {
      console.log("[handleSkip] no draft, no follow-up — closing");
      clearAndClose();
      return;
    }

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
      triggerCelebration("Logged.", contactId);
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
    triggerCelebration("Logged.", contactId);
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
    console.log("[handleOutstandingUpdate] success — isKeep:", isKeep);
    const text = !isKeep ? "Logged & set." : "Logged.";
    triggerCelebration(text, contactId);
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


  const handleStepBack = () => {
    if (step === "outstanding") {
      setStep(1);
    } else if (step === 2 && !preselectedContactId) {
      setStep(1);
    } else {
      setStep(1);
    }
  };

  // Filtered contacts for picker
  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (!searchQuery) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts
      .filter((c) => {
        const name = `${c.first_name} ${c.last_name}`.toLowerCase();
        return name.includes(q) || (c.company || "").toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [contacts, searchQuery]);

  const recentContacts = ((recentContactIds || [])
    .map((id) => contacts?.find((c) => c.id === id))
    .filter(Boolean) as NonNullable<typeof contacts>);

  const handleContactSelect = (id: string) => {
    setContactId(id);
    setSearchOpen(false);
    setSearchQuery("");
    setSlideOut(true);
    setTimeout(() => {
      setStep(1);
      setSlideOut(false);
    }, 220);
  };

  // Skip step 1 → go to follow-up step with no draft
  const handleSkipToFollowup = async () => {
    if (!contactId) {
      toast.error("Select a contact first.");
      return;
    }
    if (isDirty) {
      setShowSkipDiscardDialog(true);
      return;
    }
    console.log("[skip] Step 1 skipped — routing to Step 2 with no draft");
    if (draftId) {
      await supabase.from("interactions").delete().eq("id", draftId);
      console.log("[skip] deleted existing draft on skip:", draftId);
      setDraftId(null);
    }
    setConnectType("");
    setNote("");
    setLogSkipped(true);
    setStep(2);
  };

  // Active follow-up nudge — publish draft if any, then close (no navigation)
  const handleSaveLogOnly = async () => {
    if (!contactId) {
      clearAndClose();
      return;
    }

    if (draftId) {
      await supabase
        .from("interactions")
        .update({ status: "published" })
        .eq("id", draftId);
      console.log("[saveLogOnly] existing draft published:", draftId);
    } else if (note.trim() || connectType) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("interactions")
        .insert({
          contact_id: contactId,
          user_id: user.id,
          connect_type: connectType || null,
          connect_date: getConnectDateISO(),
          note: note.trim() || null,
          status: "published",
        })
        .select("id")
        .single();
      if (error) {
        console.log("[saveLogOnly] insert error:", error);
        return;
      }
      console.log("[saveLogOnly] new interaction created + published:", data.id);
    } else {
      console.log("[saveLogOnly] nothing to save, closing");
      clearAndClose();
      return;
    }

    invalidateAll();
    triggerCelebration("Logged.", contactId);
  };

  // canNext is now computed inside LogStep1

  // Avoid unused imports if only referenced in some branches
  void searchOpen;

  return (
    <>
      <style>{`@keyframes slideInFromRight {
  from { transform: translateX(100%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}`}</style>
      <FullscreenTakeover open={open} onOpenChange={handleOpen}>
        <div
          style={{ flex: 1, overflowY: "auto", padding: "0 20px", minHeight: 0, display: "flex", flexDirection: "column" }}
          onContextMenu={(e) => e?.preventDefault?.()}
        >
          {step === "contact-picker" && (() => {
            const sectionLabelStyle: React.CSSProperties = {
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#888480",
              fontFamily: "Outfit, sans-serif",
              marginBottom: 8,
            };
            const renderRow = (c: NonNullable<typeof contacts>[number]) => {
              const initials = `${c.first_name[0] || ""}${c.last_name[0] || ""}`.toUpperCase();
              const colors = getAvatarColors(`${c.first_name} ${c.last_name}`);
              return (
                <button
                  key={c.id}
                  onClick={() => handleContactSelect(c.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    background: "none",
                    border: "none",
                    borderRadius: 10,
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: colors.bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 13,
                      fontWeight: 600,
                      color: colors.text,
                      fontFamily: "Outfit, sans-serif",
                    }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#1c1a17",
                        fontFamily: "Outfit, sans-serif",
                      }}
                    >
                      {`${c.first_name} ${c.last_name}`.trim()}
                    </div>
                    {c.company && (
                      <div
                        style={{
                          fontSize: 13,
                          color: "#888480",
                          fontFamily: "Outfit, sans-serif",
                        }}
                      >
                        {c.company}
                      </div>
                    )}
                  </div>
                </button>
              );
            };
            return (
            <div
              style={{
                paddingTop: 20,
                transform: slideOut ? "translateX(-100%)" : "translateX(0)",
                opacity: slideOut ? 0 : 1,
                transition: "transform 220ms ease-out, opacity 220ms ease-out",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Crimson Pro', serif",
                  fontSize: 24,
                  fontWeight: 500,
                  color: "#1c1a17",
                  margin: 0,
                }}
              >
                Who did you talk to?
              </h2>

              {/* Search input */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#faf8f5",
                  border: "1.5px solid #c8622a",
                  borderRadius: 100,
                  padding: "12px 16px",
                  marginTop: 16,
                }}
              >
                <Search size={16} color="#888480" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 16,
                    color: "#1c1a17",
                    fontFamily: "Outfit, sans-serif",
                  }}
                />
              </div>

              {!searchQuery ? (
                <>
                  {recentContacts.length > 0 && (
                    <>
                      <div style={{ ...sectionLabelStyle, marginTop: 20 }}>RECENT</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                        {recentContacts.map(renderRow)}
                      </div>
                    </>
                  )}
                  <div style={{ ...sectionLabelStyle, marginTop: recentContacts.length > 0 ? 20 : 20 }}>ALL CONTACTS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {filteredContacts.map(renderRow)}
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 12 }}>
                  {filteredContacts.map(renderRow)}
                </div>
              )}

              {searchQuery && (
                <button
                  onClick={() => handleAddNewContact(searchQuery)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 4px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    width: "100%",
                    textAlign: "left",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "#c8622a",
                    fontFamily: "Outfit, sans-serif",
                    marginTop: 4,
                  }}
                >
                  + Add "{searchQuery}"
                </button>
              )}

              {showQuickAdd && (
                <div className="p-3 rounded-[12px] border border-border bg-card animate-fade-in mt-3">
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
            </div>
            );
          })()}

          {step === 1 && (
            <div
              key={`step1-${contactId}`}
              style={{
                paddingTop: 20,
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                animation: "slideInFromRight 280ms ease-out",
              }}
            >
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
                contactId={contactId}
                contactName={contactName}
                isContactPrefilled={isContactPrefilled}
                onNext={() => logMutation.mutate()}
                isSubmitting={logMutation.isPending}
                logOnly={logOnly}
                onSkipLog={!logOnly && !activeFollowup ? handleSkipToFollowup : undefined}
                activeFollowup={activeFollowup && contactId && !logOnly ? activeFollowup : null}
                onSaveLogOnly={activeFollowup && contactId && !logOnly ? handleSaveLogOnly : undefined}
              />
            </div>
          )}

          {step === "outstanding" && existingFollowup && (
            <OutstandingFollowupStep
              existingFollowup={existingFollowup}
              contactName={contactName}
              onUpdate={handleOutstandingUpdate}
              onCancel={handleOutstandingCancel}
              onChoiceChange={(c, d) => {
                setOutstandingChoice(c);
                setOutstandingDate(d);
              }}
            />
          )}

          {step === 2 && (
            <div style={{ paddingTop: 20, flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
              <LogStep2
                connectType={connectType}
                contactName={contactName}
                note={note}
                onSaveWithFollowup={(type, date) => followupMutation.mutate({ type, date, reminderNote: pendingReminder })}
                onSkip={startStep === 2 ? undefined : handleSkip}
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

        {/* Bottom action area — outstanding step */}
        {step === "outstanding" && (
          <div
            style={{
              flexShrink: 0,
              padding: "8px 20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {(() => {
              const valid =
                !!outstandingChoice &&
                !(outstandingChoice === "reschedule" && !outstandingDate);
              return (
                <button
                  onClick={() => {
                    console.log("[LogInteractionSheet] outstanding save:", {
                      outstandingChoice,
                      outstandingDate,
                    });
                    if (outstandingChoice === "keep")
                      handleOutstandingUpdate(existingFollowup!.planned_date);
                    else if (outstandingChoice === "reschedule")
                      handleOutstandingUpdate(outstandingDate);
                    else if (outstandingChoice === "cancel")
                      handleOutstandingCancel();
                  }}
                  disabled={!valid}
                  style={{
                    width: "100%",
                    background: valid ? "#c8622a" : "#ddd8d1",
                    color: valid ? "white" : "#b0ada8",
                    border: "none",
                    borderRadius: 100,
                    padding: 15,
                    fontSize: 16,
                    fontWeight: 500,
                    fontFamily: "Outfit, sans-serif",
                    cursor: valid ? "pointer" : "default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  Save
                  <ArrowRight size={18} />
                </button>
              );
            })()}
          </div>
        )}

        {/* Bottom action area — step 2 */}
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
                  console.log("[LogInteractionSheet] save step2:", { pendingType, pendingDate, pendingReminder });
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

            {startStep !== 2 && !logSkipped && (
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
            )}
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
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
            animation: "celebFadeIn 200ms ease",
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
              background: "white",
              border: "1.5px solid #b7d9cc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "celebCheck 480ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            <Check size={32} color="#2d6a4f" strokeWidth={2.5} />
          </div>
          <div
            style={{
              fontFamily: "'Crimson Pro', serif",
              fontSize: 32,
              fontWeight: 500,
              color: "#2d6a4f",
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

      {/* Skip-to-followup discard dialog */}
      <AlertDialog open={showSkipDiscardDialog} onOpenChange={setShowSkipDiscardDialog}>
        <AlertDialogContent className="z-[60]">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your note?</AlertDialogTitle>
            <AlertDialogDescription>
              Your note won't be saved if you skip logging.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowSkipDiscardDialog(false)}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setShowSkipDiscardDialog(false);
              if (draftId) {
                await supabase.from("interactions").delete().eq("id", draftId);
                console.log("[skip] discarded draft on skip-to-followup:", draftId);
                setDraftId(null);
              }
              setConnectType("");
              setNote("");
              setLogSkipped(true);
              setStep(2);
            }}>
              Discard and skip
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
