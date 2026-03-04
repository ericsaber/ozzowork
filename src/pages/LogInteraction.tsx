import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mic, Square, Phone, Mail, Voicemail, MessageSquare, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { addDays, addWeeks, format } from "date-fns";
import { Input } from "@/components/ui/input";

const typeOptions = [
  { value: "call", icon: Phone, label: "Call" },
  { value: "email", icon: Mail, label: "Email" },
  { value: "voicemail", icon: Voicemail, label: "VM" },
  { value: "note", icon: MessageSquare, label: "Note" },
];

const LogInteraction = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const preselectedContact = searchParams.get("contact");

  const [contactId, setContactId] = useState(preselectedContact || "");
  const [type, setType] = useState("call");
  const [note, setNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState<string | null>(null);
  const [customDate, setCustomDate] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Quick-add contact state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickForm, setQuickForm] = useState({ name: "", company: "", phone: "", email: "" });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { data: contacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").order("first_name");
      if (error) throw error;
      return data;
    },
  });

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

  const dateChips = [
    { label: "Tomorrow", date: format(addDays(new Date(), 1), "yyyy-MM-dd") },
    { label: "3 days", date: format(addDays(new Date(), 3), "yyyy-MM-dd") },
    { label: "1 week", date: format(addWeeks(new Date(), 1), "yyyy-MM-dd") },
    { label: "2 weeks", date: format(addWeeks(new Date(), 2), "yyyy-MM-dd") },
  ];

  const saveInteraction = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!contactId) throw new Error("Select a contact");
      const { error } = await supabase.from("interactions").insert({
        contact_id: contactId,
        user_id: user.id,
        type,
        note: note || null,
        follow_up_date: followUpDate || customDate || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups-today"] });
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      toast.success("Interaction saved");
      navigate(-1);
    },
    onError: (e) => toast.error(e.message),
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeAudio(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      toast.error("Microphone access denied. Please type your note instead.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "audio.webm");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) {
        throw new Error("Transcription failed");
      }

      const { summary } = await res.json();
      if (summary) {
        setNote(summary);
        toast.success("Recording transcribed");
      } else {
        toast.info("No speech detected. Type your note instead.");
      }
    } catch (e) {
      console.error("Transcription error:", e);
      toast.error("Transcription failed — type your note manually.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-muted-foreground mb-4"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </button>

      <h1 className="text-2xl font-heading text-foreground mb-6">Log Interaction</h1>

      {/* Contact selector */}
      <div className="mb-5">
        <label className="text-sm font-medium text-foreground mb-1.5 block">Contact</label>
        <div className="flex gap-2">
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="flex-1 h-11 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a contact...</option>
            {contacts?.map((c) => (
              <option key={c.id} value={c.id}>
                {`${c.first_name} ${c.last_name}`.trim()} {c.company ? `— ${c.company}` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="w-11 h-11 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Add new contact"
          >
            {showQuickAdd ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {/* Quick-add contact form */}
        {showQuickAdd && (
          <div className="mt-3 p-3 rounded-lg border border-border bg-card animate-fade-in">
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick-add contact</p>
            <div className="space-y-2">
              <Input
                placeholder="Name *"
                value={quickForm.name}
                onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                className="h-9 text-sm bg-background"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Company"
                  value={quickForm.company}
                  onChange={(e) => setQuickForm({ ...quickForm, company: e.target.value })}
                  className="h-9 text-sm bg-background"
                />
                <Input
                  placeholder="Phone"
                  value={quickForm.phone}
                  onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                  className="h-9 text-sm bg-background"
                />
              </div>
              <Input
                placeholder="Email"
                type="email"
                value={quickForm.email}
                onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })}
                className="h-9 text-sm bg-background"
              />
              <Button
                size="sm"
                onClick={() => quickAddContact.mutate()}
                disabled={!quickForm.name || quickAddContact.isPending}
                className="w-full"
              >
                {quickAddContact.isPending ? "Creating..." : "Create & Select"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Type selector */}
      <div className="mb-5">
        <label className="text-sm font-medium text-foreground mb-1.5 block">Type</label>
        <div className="flex gap-2">
          {typeOptions.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                type === t.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice recording zone */}
      <div className="mb-5">
        <label className="text-sm font-medium text-foreground mb-1.5 block">Note</label>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={handleRecord}
            disabled={isTranscribing}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isTranscribing
                ? "bg-muted text-muted-foreground"
                : isRecording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {isTranscribing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isRecording ? (
              <Square size={16} />
            ) : (
              <Mic size={18} />
            )}
          </button>
          <span className="text-xs text-muted-foreground">
            {isTranscribing
              ? "Transcribing..."
              : isRecording
              ? "Recording... tap to stop"
              : "Tap to record, or type below"}
          </span>
        </div>
        <Textarea
          placeholder="What happened? AI will summarize after recording..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="bg-card"
          disabled={isTranscribing}
        />
      </div>

      {/* Follow-up date */}
      <div className="mb-6">
        <label className="text-sm font-medium text-foreground mb-1.5 block">Follow up</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {dateChips.map((chip) => (
            <button
              key={chip.label}
              onClick={() => {
                setFollowUpDate(chip.date);
                setCustomDate("");
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                followUpDate === chip.date
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {chip.label}
            </button>
          ))}
          <button
            onClick={() => {
              setFollowUpDate(null);
            }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !followUpDate && customDate
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            Pick date
          </button>
        </div>
        {!followUpDate && (
          <Input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="bg-card"
          />
        )}
      </div>

      <Button
        onClick={() => saveInteraction.mutate()}
        disabled={!contactId || saveInteraction.isPending}
        className="w-full h-12 font-medium"
      >
        {saveInteraction.isPending ? "Saving..." : "Save & set reminder"}
      </Button>
    </div>
  );
};

export default LogInteraction;
