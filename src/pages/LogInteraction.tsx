import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mic, Square, Phone, Mail, Voicemail, MessageSquare, Loader2 } from "lucide-react";
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { data: contacts } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").order("name");
      if (error) throw error;
      return data;
    },
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

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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
        <select
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          className="w-full h-11 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select a contact...</option>
          {contacts?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.company ? `— ${c.company}` : ""}
            </option>
          ))}
        </select>
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
