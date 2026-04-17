import { useRef, useState, useEffect } from "react";
import { Mic, Square, Phone, Mail, MessageSquare, Users, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { preventScrollOnFocus } from "@/lib/preventScrollOnFocus";
import { toast } from "sonner";

const typeOptions = [
  { value: "call", icon: Phone, label: "Call" },
  { value: "email", icon: Mail, label: "Email" },
  { value: "text", icon: MessageSquare, label: "Text" },
  { value: "meet", icon: Users, label: "Meeting" },
  { value: "video", icon: Video, label: "Video" },
];

const getAvatarColors = (name: string) => {
  const palette = [
    { bg: "#fde8da", text: "#c8622a" },
    { bg: "#d4edda", text: "#2d6a4f" },
    { bg: "#dce8f5", text: "#2c5f8a" },
    { bg: "#e8ddf5", text: "#6b3fa0" },
    { bg: "#f5e8d0", text: "#8a5c2a" },
  ];
  const ch = (name?.[0] || "A").toUpperCase().charCodeAt(0);
  return palette[ch % 5];
};

interface LogStep1Props {
  connectType: string;
  setConnectType: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  contactId?: string;
  contactName?: string;
  isContactPrefilled?: boolean;
  // Optional — kept for backward compatibility with callers (CompleteFollowupSheet,
  // any leftover LogInteractionSheet pass-through). Not used in the new UI.
  onSubmit?: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  contactInitials?: string;
  contacts?: unknown;
  onContactSelect?: (id: string) => void;
  onAddNewContact?: (name: string) => void;
  onSkipToFollowup?: () => void;
  onChangeContact?: () => void;
  submitLabel?: string;
  showDateRow?: boolean;
  connectDate?: string;
  setConnectDate?: (v: string) => void;
}

const LogStep1 = ({
  connectType,
  setConnectType,
  note,
  setNote,
  contactId,
  contactName,
}: LogStep1Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isRawTranscript, setIsRawTranscript] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Auto-grow textarea when note is set programmatically (preserved)
  useEffect(() => {
    if (textareaRef.current && note) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [note]);

  // Recording logic — preserved verbatim
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options: MediaRecorderOptions = { mimeType: "audio/webm" };
      try { options.audioBitsPerSecond = 32000; } catch {}
      const mediaRecorder = new MediaRecorder(stream, options);
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
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsTranscribing(true);
  };

  const transcribeAudio = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "audio.webm");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe-audio`,
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body: formData }
      );
      if (!res.ok) {
        const errText = await res.text();
        console.error("[transcribeAudio] error response:", errText);
        throw new Error("Transcription failed");
      }
      const resData = await res.json();
      console.log('[Transcribe] Estimated duration:', resData.estimatedDuration, 's');
      console.log('[Transcribe] Raw Whisper:', resData.transcript);
      console.log('[Transcribe] Gemini skipped:', resData.isRawTranscript);
      console.log('[Transcribe] Final note:', resData.summary || resData.transcript);
      const { summary, isRawTranscript: rawFlag } = resData;
      if (summary) {
        setNote(summary);
        setIsRawTranscript(!!rawFlag);
      } else {
        toast.info("No speech detected.");
      }
    } catch (e) {
      console.error("Transcription error:", e);
      toast.error("Transcription failed — type your note manually.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleRecordingCTA = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handlePillClick = (value: string) => {
    setConnectType(connectType === value ? "" : value);
  };

  // Avatar initials for contact chip
  const initials = contactName
    ? contactName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "";

  // Type pills reveal gate
  const showTypeRow = note.trim().length > 0 || connectType !== "";

  // Used to silence unused-var warning on isRawTranscript while we don't render it explicitly
  void isRawTranscript;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16, paddingTop: 8 }}>
      {/* Section 1 — Contact chip */}
      {contactId && contactName && (
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#faf8f5",
              border: "1px solid #e8e4de",
              borderRadius: 100,
              padding: "6px 14px 6px 8px",
            }}
          >
            <span
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: getAvatarColors(contactName).bg,
                color: getAvatarColors(contactName).text,
                fontSize: 11,
                fontWeight: 600,
                fontFamily: "Outfit, sans-serif",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {initials}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#1c1a17",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              {contactName}
            </span>
          </span>
        </div>
      )}

      {/* Section 2 — Note + voice card */}
      <div
        style={{
          background: "#faf8f5",
          border: "1px solid #e8e4de",
          borderRadius: 16,
          padding: 14,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <textarea
          ref={textareaRef}
          value={note}
          placeholder="What did you talk about?"
          onChange={(e) => {
            setNote(e.target.value);
            const el = e.target;
            el.style.height = "auto";
            el.style.height = el.scrollHeight + "px";
          }}
          onFocus={preventScrollOnFocus}
          style={{
            width: "100%",
            flex: 1,
            minHeight: 80,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: "Outfit, sans-serif",
            fontSize: 16,
            color: "#1c1a17",
          }}
        />

        <div style={{ borderTop: "1px solid #e8e4de", marginTop: 12, paddingTop: 12, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          {isRecording ? (
            <button
              onClick={handleRecordingCTA}
              className="animate-pulse"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#fdecea",
                border: "1.5px solid #f5b8b4",
                borderRadius: 100,
                padding: "10px 18px",
                cursor: "pointer",
              }}
            >
              <Square size={16} fill="#c0392b" color="#c0392b" />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#c0392b",
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                Stop recording
              </span>
            </button>
          ) : isTranscribing ? (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#f5f3f0",
                border: "1.5px solid #e8e4de",
                borderRadius: 100,
                padding: "10px 18px",
              }}
            >
              <Mic size={18} color="#888480" />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  fontStyle: "italic",
                  color: "#888480",
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                Transcribing…
              </span>
            </div>
          ) : (
            <button
              onClick={handleRecordingCTA}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#fdf4f0",
                border: "1.5px solid #e8c4b0",
                borderRadius: 100,
                padding: "10px 18px",
                cursor: "pointer",
              }}
            >
              <Mic size={18} color="#c8622a" />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#c8622a",
                  fontFamily: "Outfit, sans-serif",
                }}
              >
                Log with Voice
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Section 3 — Type pills (progressive reveal) */}
      <div
        style={{
          maxHeight: showTypeRow ? 200 : 0,
          opacity: showTypeRow ? 1 : 0,
          overflow: "hidden",
          transition: "max-height 0.3s ease, opacity 0.2s ease",
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#888480",
            fontFamily: "Outfit, sans-serif",
            marginBottom: 8,
          }}
        >
          How'd you connect?
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {typeOptions.map((t) => {
            const selected = connectType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => handlePillClick(t.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 12px",
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "Outfit, sans-serif",
                  cursor: "pointer",
                  background: selected ? "#fdf4f0" : "#faf8f5",
                  border: selected ? "1px solid #c8622a" : "1px solid #e8e4de",
                  color: selected ? "#c8622a" : "#6b6860",
                }}
              >
                <t.icon size={13} color={selected ? "#c8622a" : "#6b6860"} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LogStep1;
