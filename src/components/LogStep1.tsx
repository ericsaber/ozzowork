import { useRef, useState, useMemo, useEffect } from "react";
import { Mic, Square, Loader2, Phone, Mail, MessageSquare, Users, Video, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const typeOptions = [
  { value: "call", icon: Phone, label: "Call" },
  { value: "email", icon: Mail, label: "Email" },
  { value: "text", icon: MessageSquare, label: "Text" },
  { value: "meet", icon: Users, label: "Meeting" },
  { value: "video", icon: Video, label: "Video" },
];

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
}

interface LogStep1Props {
  connectType: string;
  setConnectType: (v: string) => void;
  note: string;
  setNote: (v: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
  // Contact props
  contactId?: string;
  contactName?: string;
  contactInitials?: string;
  isContactPrefilled?: boolean;
  contacts?: Contact[];
  onContactSelect?: (id: string) => void;
  onAddNewContact?: (name: string) => void;
  // Skip link
  onSkipToFollowup?: () => void;
  // Recording callback — when recording finishes transcription, advance
  onRecordingComplete?: () => void;
}

const LogStep1 = ({
  connectType,
  setConnectType,
  note,
  setNote,
  onSubmit,
  isSubmitting,
  disabled,
  contactId,
  contactName,
  contactInitials,
  isContactPrefilled,
  contacts,
  onContactSelect,
  onAddNewContact,
  onSkipToFollowup,
  onRecordingComplete,
}: LogStep1Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Contact search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [hasSelectedOnce, setHasSelectedOnce] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const contactSelected = !!contactId;

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (!searchQuery) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter((c) => {
      const name = `${c.first_name} ${c.last_name}`.toLowerCase();
      return name.includes(q) || (c.company || "").toLowerCase().includes(q);
    });
  }, [contacts, searchQuery]);

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleContactSelect = (id: string) => {
    onContactSelect?.(id);
    setSearchOpen(false);
    setSearchQuery("");
    setHasSelectedOnce(true);
  };

  const handleChangeContact = () => {
    setSearchOpen(true);
    setSearchQuery("");
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  // Recording logic
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
      toast.error("Microphone access denied.");
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
        { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` }, body: formData }
      );
      if (!res.ok) throw new Error("Transcription failed");
      const { summary } = await res.json();
      if (summary) {
        setNote(summary);
        toast.success("Recording transcribed");
      } else {
        toast.info("No speech detected.");
      }
    } catch (e) {
      console.error("Transcription error:", e);
      toast.error("Transcription failed — type your note manually.");
    } finally {
      setIsTranscribing(false);
      // After transcription, auto-advance
      if (onRecordingComplete) {
        onRecordingComplete();
      }
    }
  };

  const handleRecordingCTA = () => {
    if (isRecording) {
      stopRecording();
      // transcription will happen via onstop, then onRecordingComplete fires
    } else {
      startRecording();
    }
  };

  const handleMainCTA = () => {
    if (isRecording) {
      // "Done recording →" — stop, transcribe, then advance
      stopRecording();
    } else {
      onSubmit();
    }
  };

  const handlePillClick = (value: string) => {
    setConnectType(connectType === value ? "" : value);
  };

  const initials = contactInitials || (contactName ? contactName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "");
  const showContactSearch = !isContactPrefilled && onContactSelect;
  const canSubmit = !disabled && contactSelected && !!connectType && !isSubmitting;

  return (
    <div className="space-y-5">
      {/* Unified Card */}
      <div
        className="rounded-[14px] bg-card overflow-hidden"
        style={{ border: "0.5px solid hsl(var(--border))" }}
      >
        {/* Contact header row */}
        <div
          className="flex items-center px-[12px] border-b border-border"
          style={{ minHeight: "46px", padding: "10px 12px" }}
        >
          {showContactSearch ? (
            /* Searchable contact */
            <div ref={searchWrapperRef} className="flex-1 relative">
              {contactSelected && !searchOpen ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-full flex items-center justify-center text-primary-foreground shrink-0"
                      style={{ width: 26, height: 26, fontSize: 10, fontWeight: 600, background: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
                    >
                      {initials}
                    </div>
                    <span className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                      {contactName}
                    </span>
                  </div>
                  {hasSelectedOnce && (
                    <button
                      onClick={handleChangeContact}
                      className="text-[11px] underline"
                      style={{ color: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
                    >
                      Change
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-full flex items-center justify-center shrink-0"
                      style={{ width: 26, height: 26, border: "1.5px dashed hsl(var(--border))" }}
                    >
                      <Search size={11} className="text-muted-foreground" />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      placeholder="Who did you talk to?"
                      onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                      onFocus={() => setSearchOpen(true)}
                      className="flex-1 bg-transparent border-none outline-none text-[13px] text-foreground placeholder:text-muted-foreground"
                      style={{ fontFamily: "var(--font-body)" }}
                    />
                  </div>
                  {searchOpen && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 rounded-[10px] border border-border bg-card overflow-hidden"
                      style={{ boxShadow: "0 8px 24px rgba(0,0,0,.10)", zIndex: 50 }}
                    >
                      <div className="max-h-[180px] overflow-y-auto">
                        {filteredContacts.length === 0 && (
                          <div className="px-3 py-2.5 text-[12px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                            No contacts found
                          </div>
                        )}
                        {filteredContacts.map((c) => {
                          const cInitials = `${c.first_name[0] || ""}${c.last_name[0] || ""}`.toUpperCase();
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleContactSelect(c.id)}
                              className="w-full text-left px-3 py-2.5 hover:bg-secondary transition-colors flex items-center gap-2"
                              style={{ fontFamily: "var(--font-body)" }}
                            >
                              <div
                                className="rounded-full flex items-center justify-center text-primary-foreground shrink-0"
                                style={{ width: 22, height: 22, fontSize: 9, fontWeight: 600, background: "hsl(var(--primary))" }}
                              >
                                {cInitials}
                              </div>
                              <div>
                                <div className="text-[12px] text-foreground">{`${c.first_name} ${c.last_name}`.trim()}</div>
                                {c.company && <div className="text-[10px] text-muted-foreground">{c.company}</div>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="border-t border-border">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            onAddNewContact?.(searchQuery);
                            setSearchOpen(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-[12px] font-medium hover:bg-secondary transition-colors"
                          style={{ color: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
                        >
                          + Add "{searchQuery || "new contact"}"
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Prefilled contact (not searchable) */
            <div className="flex items-center gap-2">
              <div
                className="rounded-full flex items-center justify-center text-primary-foreground shrink-0"
                style={{ width: 26, height: 26, fontSize: 10, fontWeight: 600, background: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
              >
                {initials}
              </div>
              <span className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                {contactName}
              </span>
            </div>
          )}
        </div>

        {/* Note / mic area */}
        <div className="px-[12px] py-[10px]">
          {!isTyping && !note && !isRecording && !isTranscribing ? (
            /* Default: centered mic CTA */
            <div className="flex flex-col items-center py-4 gap-2">
              <button
                onClick={handleRecordingCTA}
                className="rounded-full flex items-center justify-center shrink-0 transition-colors"
                style={{
                  width: 38,
                  height: 38,
                  background: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <Mic size={16} className="text-muted-foreground" />
              </button>
              <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                Speak a few sentences
              </span>
              <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                AI will sum it up
              </span>
              <div className="w-12 border-t border-border my-1" />
              <button
                onClick={() => setIsTyping(true)}
                className="text-[12px] italic text-muted-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                or tap here to type…
              </button>
            </div>
          ) : isRecording ? (
            /* Recording mode */
            <div className="flex items-center gap-2 py-3">
              <span className="w-6 h-6 rounded-full bg-destructive flex items-center justify-center animate-pulse">
                <Square size={10} className="text-destructive-foreground" />
              </span>
              <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                Recording… tap button below to stop
              </span>
            </div>
          ) : isTranscribing ? (
            <div className="flex items-center gap-2 py-3">
              <Loader2 size={16} className="text-muted-foreground animate-spin" />
              <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                Transcribing…
              </span>
            </div>
          ) : (
            /* Typing / note populated */
            <div className="relative">
              <div className="flex items-start gap-2">
                <button onClick={handleRecordingCTA} className="mt-0.5 shrink-0">
                  <Mic size={16} className="text-muted-foreground" />
                </button>
                <div className="flex-1">
                  <span className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground block mb-1" style={{ fontFamily: "var(--font-body)" }}>
                    Note
                  </span>
                  <textarea
                    autoFocus
                    placeholder="What happened?"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-transparent border-none outline-none resize-none text-[12px] text-foreground placeholder:text-muted-foreground min-h-[56px] italic"
                    style={{ fontFamily: "var(--font-heading)" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Connect type chips — BELOW card */}
      <div
        style={{ opacity: contactSelected ? 1 : 0.4, pointerEvents: contactSelected ? "auto" : "none" }}
      >
        <p
          className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          How'd you connect?
        </p>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((t) => {
            const selected = connectType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => handlePillClick(t.value)}
                className={`inline-flex items-center gap-1.5 py-[7px] px-[13px] text-[11px] font-medium transition-colors ${
                  selected
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
                }`}
                style={{
                  borderRadius: "100px",
                  fontFamily: "var(--font-body)",
                  ...(selected
                    ? { background: "hsl(var(--primary))" }
                    : { background: "hsl(var(--card))", border: "0.5px solid hsl(var(--border))" }),
                }}
              >
                <t.icon size={13} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={handleMainCTA}
        disabled={isRecording ? false : (!canSubmit && !isTranscribing)}
        className="w-full py-[14px] text-[14px] font-semibold text-primary-foreground shadow-md transition-opacity disabled:opacity-[0.38]"
        style={{
          borderRadius: "100px",
          background: "hsl(var(--primary))",
          fontFamily: "var(--font-body)",
        }}
      >
        {isRecording
          ? "Done recording →"
          : isSubmitting
          ? "Saving..."
          : "Next →"}
      </button>

      {/* Skip link */}
      {onSkipToFollowup && (
        <button
          onClick={onSkipToFollowup}
          className="w-full text-center text-[11px] text-muted-foreground underline py-1"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Set a follow-up without logging
        </button>
      )}
    </div>
  );
};

export default LogStep1;
