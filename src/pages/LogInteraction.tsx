import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import StepIndicator from "@/components/StepIndicator";
import LogStep1 from "@/components/LogStep1";
import LogStep2 from "@/components/LogStep2";
import ContactCombobox from "@/components/ContactCombobox";

const LogInteraction = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedContact = searchParams.get("contact");

  const [step, setStep] = useState<1 | 2>(1);
  const [contactId, setContactId] = useState(preselectedContact || "");
  const [connectType, setConnectType] = useState("");
  const [note, setNote] = useState("");
  const [savedInteractionId, setSavedInteractionId] = useState<string | null>(null);

  // Quick-add contact state
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
  const contactName = selectedContact
    ? `${selectedContact.first_name} ${selectedContact.last_name}`.trim()
    : "";

  const quickAddContact = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase.from("contacts").insert({
        first_name: quickForm.first_name,
        last_name: quickForm.last_name,
        company: quickForm.company || null,
        phone: quickForm.phone || null,
        email: quickForm.email || null,
        user_id: user.id,
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
    onError: (e) => toast.error(e.message),
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["followups-today"] });
    queryClient.invalidateQueries({ queryKey: ["followups-upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["interactions"] });
  };

  // Step 1: Save interaction
  const logMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!contactId) throw new Error("Select a contact");

      const { data, error } = await supabase.from("interactions").insert({
        contact_id: contactId,
        user_id: user.id,
        connect_type: connectType || null,
        note: note || null,
        planned_follow_up_type: "call", // default, updated in step 2
      }).select("id").single();
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
        .update({ planned_follow_up_type: type, follow_up_date: date })
        .eq("id", savedInteractionId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Follow-up set");
      navigate(-1);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSkip = () => {
    invalidateAll();
    toast.success("Interaction logged");
    navigate(-1);
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-[13px] max-w-lg mx-auto">
      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-muted-foreground mb-4 text-[13px]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      {/* Title */}
      <h1
        className="text-[24px] text-foreground mb-2"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Log interaction
      </h1>

      <StepIndicator currentStep={step} />

      {step === 1 ? (
        <div className="space-y-5">
          {/* Contact picker with + button */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <ContactCombobox
                  contacts={contacts}
                  contactId={contactId}
                  onSelect={setContactId}
                  onAddNew={() => setShowQuickAdd(true)}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAdd((v) => !v)}
                className="flex-shrink-0 w-[42px] h-[42px] rounded-[12px] border-[1.5px] border-[#e0dbd3] bg-[#f0ede8] flex items-center justify-center text-[#c8622a] hover:bg-[#fdf0e8] transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Quick-add form */}
            {showQuickAdd && (
              <div className="mt-3 p-3 rounded-[12px] border border-border bg-card animate-fade-in">
                <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)" }}>
                  Quick-add contact
                </p>
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

          <LogStep1
            connectType={connectType}
            setConnectType={setConnectType}
            note={note}
            setNote={setNote}
            onSubmit={() => logMutation.mutate()}
            isSubmitting={logMutation.isPending}
            disabled={!contactId}
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
        />
      )}
    </div>
  );
};

export default LogInteraction;
