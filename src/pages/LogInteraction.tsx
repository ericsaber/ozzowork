import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, X } from "lucide-react";
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
  const [savedInteractionId, setSavedInteractionId] = useState<string | null>(null);

  // Quick-add contact state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: "", company: "", phone: "", email: "" });

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
      const parts = quickForm.name.split(" ");
      const { data, error } = await supabase.from("contacts").insert({
        first_name: parts[0] || quickForm.name,
        last_name: parts.slice(1).join(" ") || "",
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
      setQuickForm({ name: "", company: "", phone: "", email: "" });
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
          {/* Contact picker */}
          <div>
            <div className="flex gap-2">
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="flex-1 h-11 rounded-[12px] border border-border bg-secondary px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <option value="">Select a contact…</option>
                {contacts?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {`${c.first_name} ${c.last_name}`.trim()} {c.company ? `— ${c.company}` : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowQuickAdd(!showQuickAdd)}
                className="w-11 h-11 rounded-[12px] border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Add new contact"
              >
                {showQuickAdd ? <X size={16} /> : <Plus size={16} />}
              </button>
            </div>

            {/* Quick-add form */}
            {showQuickAdd && (
              <div className="mt-3 p-3 rounded-[12px] border border-border bg-card animate-fade-in">
                <p className="text-[10px] font-medium text-muted-foreground mb-2 uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)" }}>
                  Quick-add contact
                </p>
                <div className="space-y-2">
                  <Input placeholder="Name *" value={quickForm.name} onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })} className="h-9 text-sm bg-background" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Company" value={quickForm.company} onChange={(e) => setQuickForm({ ...quickForm, company: e.target.value })} className="h-9 text-sm bg-background" />
                    <Input placeholder="Phone" value={quickForm.phone} onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })} className="h-9 text-sm bg-background" />
                  </div>
                  <Input placeholder="Email" type="email" value={quickForm.email} onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })} className="h-9 text-sm bg-background" />
                  <Button size="sm" onClick={() => quickAddContact.mutate()} disabled={!quickForm.name || quickAddContact.isPending} className="w-full">
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
