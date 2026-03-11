import { useRef, useState } from "react";
import { Mic, Square, Loader2, Phone, Mail, MessageSquare, Users, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const typeOptions = [
  { value: "call", icon: Phone, label: "Call" },
  { value: "email", icon: Mail, label: "Email" },
  { value: "text", icon: MessageSquare, label: "Text" },
  { value: "meet", icon: Users, label: "Meet" },
  { value: "video", icon: Video, label: "Video" },
];

interface LogStep1Props {
  connectType: string;
  setConnectType: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
}

const LogStep1 = ({
  connectType,
  setConnectType,
  note,
  setNote,
  onSubmit,
  isSubmitting,
  disabled,
}: LogStep1Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

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
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Transcription failed");

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
    if (isRecording) stopRecording();
    else startRecording();
  };

  const handlePillClick = (value: string) => {
    setConnectType(connectType === value ? "" : value);
  };

  return (
    <div className="space-y-5">
      {/* Section label */}
      <p
        className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
        style={{ fontFamily: "var(--font-body)" }}
      >
        How did you connect?
      </p>

      {/* Type pills */}
      <div className="flex flex-wrap gap-2">
        {typeOptions.map((t) => {
          const selected = connectType === t.value;
          return (
            <button
              key={t.value}
              onClick={() => handlePillClick(t.value)}
              className={`inline-flex items-center gap-1.5 rounded-[20px] px-[13px] py-[7px] text-[11px] font-medium transition-colors ${
                selected
                  ? "bg-[#fdf0e8] border-[1.5px] border-[#f0c4a8] text-[#c8622a]"
                  : "bg-white border-[1.5px] border-border text-muted-foreground"
              }`}
              style={{ fontFamily: "var(--font-body)" }}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Note area card */}
      <div className="rounded-[14px] border-[1.5px] border-transparent bg-secondary focus-within:border-[#f0c4a8] transition-colors overflow-hidden">
        {/* Mic row */}
        <button
          onClick={handleRecord}
          disabled={isTranscribing}
          className="w-full flex items-center gap-2 px-3 py-2.5"
        >
          <span
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              isTranscribing
                ? "bg-muted text-muted-foreground"
                : isRecording
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "text-muted-foreground"
            }`}
          >
            {isTranscribing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isRecording ? (
              <Square size={14} />
            ) : (
              <Mic size={16} />
            )}
          </span>
          <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
            {isTranscribing
              ? "Transcribing..."
              : isRecording
              ? "Recording... tap to stop"
              : "Tap to record, or type below"}
          </span>
        </button>

        {/* Divider */}
        <div className="mx-3 border-t border-border" />

        {/* Textarea */}
        <textarea
          placeholder="What happened? AI will summarize after recording…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isTranscribing}
          className="w-full bg-transparent border-none outline-none resize-none px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground min-h-[56px]"
          style={{ fontFamily: "var(--font-body)" }}
        />
      </div>

      {/* CTA */}
      <button
        onClick={onSubmit}
        disabled={isSubmitting || disabled}
        className="w-full rounded-[13px] bg-primary text-primary-foreground py-[14px] text-[14px] font-semibold shadow-md disabled:opacity-50 transition-opacity"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {isSubmitting ? "Saving..." : "Log it →"}
      </button>
    </div>
  );
};

export default LogStep1;
