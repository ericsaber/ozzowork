import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StepIndicator from "@/components/StepIndicator";
import LogStep1 from "@/components/LogStep1";
import LogStep2 from "@/components/LogStep2";

const LogInteraction = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedContact = searchParams.get("contact");

  const [step, setStep] = useState<1 | 2>(1);
  const [contactId, setContactId] = useState(preselectedContact || "");
  const [connectType, setConnectType] = useState("");
  const [note, setNote] = useState("");
  const [savedTaskRecordId, setSavedTaskRecordId] = useState<string | null>(null);

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ first_name: "", last_name: "", company: "", phone: "", email: "" });

  const { data: contacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").order("first_name");
      if (error) throw error;
      return data;
    },
  });

  const selectedContact = contacts?.find((c) => c.id === contactId);
  const contactName = selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}`.trim() : "";
  const isContactPrefilled = !!preselectedContact;

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

      if (savedTaskRecordId) {
        const { error } = await supabase.from("task_records" as any).update({
          connect_type: connectType || null, note: note || null,
        }).eq("id", savedTaskRecordId);
        if (error) throw error;
        return { id: savedTaskRecordId };
      }

      const { data, error } = await supabase.from("task_records" as any).insert({
        contact_id: contactId, user_id: user.id,
        connect_type: connectType || null, connect_date: new Date().toISOString(),
        note: note || null, status: "active",
      }).select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      setSavedTaskRecordId(data.id);
      invalidateAll();
      setStep(2);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const followupMutation = useMutation({
    mutationFn: async ({ type, date }: { type: string; date: string }) => {
      if (!savedTaskRecordId) throw new Error("No task record to update");
      const { error } = await supabase.from("task_records" as any).update({
        planned_follow_up_type: type, planned_follow_up_date: date,
      }).eq("id", savedTaskRecordId);
      if (error) throw error;
    },
    onSuccess: () => { invalidateAll(); toast.success("Follow-up set"); navigate(-1); },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSkip = () => { invalidateAll(); toast.success("Interaction logged"); navigate(-1); };

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

  return (
    <div className="min-h-screen pb-24 px-4 pt-[13px] max-w-lg mx-auto">
      <StepIndicator currentStep={step} />

      {step === 1 ? (
        <div className="space-y-5">
          {showQuickAdd && (
            <div className="p-3 rounded-[12px] border border-border bg-card animate-fade-in">
              <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)" }}>Quick-add contact</p>
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
            onSkipToFollowup={() => {
              // Skip logging, go directly to step 2
              logMutation.mutate();
            }}
          />
        </div>
      ) : (
        <LogStep2
          connectType={connectType}
          contactName={contactName}
          note={note}
          logDate={format(new Date(), "MMM d, yyyy")}
          onSaveWithFollowup={(type, date) => followupMutation.mutate({ type, date })}
          onSkip={handleSkip}
          isSaving={followupMutation.isPending}
          onUpdateLog={handleUpdateLog}
        />
      )}
    </div>
  );
};

export default LogInteraction;
