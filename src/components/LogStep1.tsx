import { useRef, useState, useMemo, useEffect } from "react";
import { Mic, Square, Phone, Mail, MessageSquare, Users, Video, Search, CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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
  contactId?: string;
  contactName?: string;
  contactInitials?: string;
  isContactPrefilled?: boolean;
  contacts?: Contact[];
  onContactSelect?: (id: string) => void;
  onAddNewContact?: (name: string) => void;
  onSkipToFollowup?: () => void;
  onChangeContact?: () => void;
  submitLabel?: string;
  // Fix 1: date row for skipFollowupStep mode
  showDateRow?: boolean;
  connectDate?: string;
  setConnectDate?: (v: string) => void;
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
  onChangeContact,
  submitLabel,
  showDateRow,
  connectDate,
  setConnectDate,
}: LogStep1Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRawTranscript, setIsRawTranscript] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Fix 1: date picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const yesterdayStr = format(addDays(new Date(), -1), "yyyy-MM-dd");

  // Auto-grow textarea when note is set programmatically
  useEffect(() => {
    if (textareaRef.current && note) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [note]);

  // Auto-focus textarea when typing mode activates
  useEffect(() => {
    if (isTyping) {
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [isTyping]);

  // Contact search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Bug 9: Soft flag when recording completes without contact
  const [showContactFlag, setShowContactFlag] = useState(false);

  const contactSelected = !!contactId;

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    if (!searchQuery) return contacts.slice(0, 3);
    const q = searchQuery.toLowerCase();
    return contacts
      .filter((c) => {
        const name = `${c.first_name} ${c.last_name}`.toLowerCase();
        return name.includes(q) || (c.company || "").toLowerCase().includes(q);
      })
      .slice(0, 5);
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
    setShowContactFlag(false); // Bug 9: clear flag on contact select
  };

  const handleChangeContact = () => {
    if (onChangeContact) {
      onChangeContact();
    }
    setSearchOpen(true);
    setSearchQuery("");
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  // Recording logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Bug 5: Lower bitrate for faster upload
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
    // Bug 4: Show transcribing state immediately
    setIsRecording(false);
    setIsTranscribing(true);
  };

  const transcribeAudio = async (blob: Blob) => {
    // isTranscribing already set by stopRecording
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
        // Bug 9: Flag if no contact selected after transcription
        if (!contactId) {
          setShowContactFlag(true);
        }
        // Bug 11: No toast — populated note is confirmation enough
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

  const handleMainCTA = () => {
    if (isRecording) {
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
  // Fix 3: connect type optional — activate when connectType OR note exists
  const canSubmit = !disabled && contactSelected && (!!connectType || !!note) && !isSubmitting;

  // Bug 1: Only render avatar when data is ready
  const hasContactData = !!initials && !!contactName;

  return (
    <div className="space-y-5">
      {/* Unified Card */}
      <div
        className="rounded-[14px] bg-card overflow-hidden"
        style={{
          border: showContactFlag
            ? "1.5px solid rgba(200,98,42,0.4)"
            : "0.5px solid hsl(var(--border))",
        }}
      >
        {/* Contact header row */}
        <div
          className="flex items-center px-[14px] border-b border-border"
          style={{ minHeight: "54px", padding: "12px 14px" }}
        >
          {showContactSearch ? (
            /* Searchable contact */
            <div ref={searchWrapperRef} className="flex-1 relative">
              {contactSelected && !searchOpen && hasContactData ? (
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-full flex items-center justify-center text-primary-foreground shrink-0"
                      style={{ width: 30, height: 30, fontSize: 12, fontWeight: 600, background: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
                    >
                      {initials}
                    </div>
                    <span className="text-[15.5px] font-medium text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                      {contactName}
                    </span>
                  </div>
                  {/* Bug 3: Always show Change when contact is selected */}
                  <button
                    onClick={handleChangeContact}
                    className="text-[13px] underline"
                    style={{ color: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
                  >
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <div
                      className="rounded-full flex items-center justify-center shrink-0"
                      style={{ width: 30, height: 30, border: "1.5px dashed hsl(var(--border))" }}
                    >
                      <Search size={13} className="text-muted-foreground" />
                    </div>
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      placeholder="Who did you talk to?"
                      onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                      onFocus={() => setSearchOpen(true)}
                      className="flex-1 bg-transparent border-none outline-none text-[15.5px] text-foreground placeholder:text-muted-foreground"
                      style={{ fontFamily: "var(--font-body)" }}
                    />
                  </div>
                  {searchOpen && (
                    <div
                      className="absolute left-0 right-0 top-full mt-1 rounded-[10px] border border-border bg-card overflow-hidden"
                      style={{ boxShadow: "0 8px 24px rgba(0,0,0,.10)", zIndex: 50 }}
                    >
                      <div className="overflow-y-auto" style={{ maxHeight: `${filteredContacts.length * 44 + 4}px` }}>
                        {filteredContacts.length === 0 && (
                          <div className="px-3 py-2.5 text-[14px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
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
                                style={{ width: 26, height: 26, fontSize: 10.5, fontWeight: 600, background: "hsl(var(--primary))" }}
                              >
                                {cInitials}
                              </div>
                              <div>
                                <div className="text-[14px] text-foreground">{`${c.first_name} ${c.last_name}`.trim()}</div>
                                {c.company && <div className="text-[12px] text-muted-foreground">{c.company}</div>}
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
                          className="w-full text-left px-3 py-2.5 text-[14px] font-medium hover:bg-secondary transition-colors"
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
            hasContactData ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div
                    className="rounded-full flex items-center justify-center text-primary-foreground shrink-0"
                    style={{ width: 30, height: 30, fontSize: 12, fontWeight: 600, background: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
                  >
                    {initials}
                  </div>
                  <span className="text-[15.5px] font-medium text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                    {contactName}
                  </span>
                </div>
                {/* Bug 3: Change link on prefilled contacts too */}
                {onChangeContact && (
                  <button
                    onClick={handleChangeContact}
                    className="text-[13px] underline"
                    style={{ color: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
                  >
                    Change
                  </button>
                )}
              </div>
            ) : (
              /* Bug 1: Show placeholder while data loads */
              <div className="flex items-center gap-2">
                <div
                  className="rounded-full flex items-center justify-center shrink-0"
                  style={{ width: 30, height: 30, border: "1.5px dashed hsl(var(--border))" }}
                >
                  <Search size={13} className="text-muted-foreground" />
                </div>
                <span className="text-[15.5px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                  Loading…
                </span>
              </div>
            )
          )}
        </div>

        {/* Bug 9: Contact flag message — always in DOM, visibility toggled */}
        <div
          className="px-[14px] py-1.5 border-b border-border"
          style={{ visibility: showContactFlag ? "visible" : "hidden" }}
        >
          <span className="text-[13px]" style={{ color: "rgba(200,98,42,0.7)", fontFamily: "var(--font-body)" }}>
            Select a contact to continue
          </span>
        </div>

        {/* Note / mic area — Bug 10: stable min-height */}
        <div className="px-[14px] py-[12px]" style={{ minHeight: "180px" }}>
          {!isTyping && !note && !isRecording && !isTranscribing ? (
            /* Default: centered mic CTA */
            <div className="flex flex-col items-center py-4 gap-2">
              <button
                onClick={handleRecordingCTA}
                className="rounded-full flex items-center justify-center shrink-0 transition-colors"
                style={{
                  width: 48,
                  height: 48,
                  background: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <Mic size={20} className="text-muted-foreground" />
              </button>
              <span className="text-[13px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                Speak a few sentences
              </span>
              <span className="text-[12px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                AI will sum it up
              </span>
              <div className="w-12 border-t border-border my-1" />
              <button
                onClick={() => setIsTyping(true)}
                className="text-[14px] italic text-muted-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                or tap here to type…
              </button>
            </div>
          ) : isRecording ? (
            /* Bug 10: Recording mode — same layout, labels stay */
            <div className="flex flex-col items-center py-4 gap-2">
              <button
                onClick={stopRecording}
                className="rounded-full flex items-center justify-center shrink-0 transition-colors animate-pulse"
                style={{
                  width: 48,
                  height: 48,
                  background: "hsl(var(--destructive))",
                }}
              >
                <Square size={16} className="text-destructive-foreground" />
              </button>
              <span className="text-[13px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                Recording… tap to stop
              </span>
              <span className="text-[12px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                AI will sum it up
              </span>
              <div className="w-12 border-t border-border my-1" />
              <button
                onClick={() => setIsTyping(true)}
                className="text-[14px] italic text-muted-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                or tap here to type…
              </button>
            </div>
          ) : isTranscribing ? (
            /* Bug 10: Transcribing — pulsing placeholder in note position */
            <div className="flex flex-col items-center py-4 gap-2">
              <button
                disabled
                className="rounded-full flex items-center justify-center shrink-0"
                style={{
                  width: 48,
                  height: 48,
                  background: "hsl(var(--secondary))",
                  border: "1px solid hsl(var(--border))",
                }}
              >
                <Mic size={20} className="text-muted-foreground" />
              </button>
              <span
                className="text-[13px] italic animate-pulse"
                style={{ color: "hsl(var(--primary))", fontFamily: "var(--font-heading)" }}
              >
                Transcribing…
              </span>
              <span className="text-[12px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                AI will sum it up
              </span>
              <div className="w-12 border-t border-border my-1" />
              <span className="text-[14px] italic text-muted-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                or tap here to type…
              </span>
            </div>
          ) : (
            /* Typing / note populated */
            <div className="relative">
              <div className="flex items-start gap-2">
                <button onClick={handleRecordingCTA} className="mt-0.5 shrink-0">
                  <Mic size={18} className="text-muted-foreground" />
                </button>
                <div className="flex-1">
                  <span className="text-[12px] uppercase tracking-[0.08em] text-muted-foreground block mb-1" style={{ fontFamily: "var(--font-body)" }}>
                    {isRawTranscript ? "Transcript" : "Note"}
                  </span>
                  <textarea
                    ref={textareaRef}
                    placeholder="What happened?"
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value);
                      // Auto-grow
                      const el = e.target;
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                    }}
                    
                    className="w-full bg-transparent border-none outline-none resize-none text-[14px] text-foreground placeholder:text-muted-foreground italic overflow-hidden"
                    style={{ fontFamily: "var(--font-heading)", minHeight: "56px" }}
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
          className="text-[12px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2"
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
                className={`inline-flex items-center gap-1.5 py-[8px] px-[15px] text-[13px] font-medium transition-colors ${
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
                <t.icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fix 1: Date row for past interactions — only in skipFollowupStep mode */}
      {showDateRow && connectDate && setConnectDate && (
        <div
          style={{ opacity: contactSelected ? 1 : 0.4, pointerEvents: contactSelected ? "auto" : "none" }}
        >
          <p
            className="text-[12px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            When?
          </p>
          <div className="flex flex-wrap gap-2">
            {/* Today chip */}
            <button
              onClick={() => { setConnectDate(todayStr); setShowDatePicker(false); }}
              className="transition-colors"
              style={{
                borderRadius: "100px",
                padding: "8px 13px",
                fontSize: "12px",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                ...(connectDate === todayStr
                  ? { background: "#c8622a", color: "#fff", border: "0.5px solid transparent" }
                  : { background: "#f0ede8", color: "#1c1812", border: "0.5px solid rgba(28,24,18,0.11)" }),
              }}
            >
              Today
            </button>
            {/* Yesterday chip */}
            <button
              onClick={() => { setConnectDate(yesterdayStr); setShowDatePicker(false); }}
              className="transition-colors"
              style={{
                borderRadius: "100px",
                padding: "8px 13px",
                fontSize: "12px",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                ...(connectDate === yesterdayStr
                  ? { background: "#c8622a", color: "#fff", border: "0.5px solid transparent" }
                  : { background: "#f0ede8", color: "#1c1812", border: "0.5px solid rgba(28,24,18,0.11)" }),
              }}
            >
              Yesterday
            </button>
            {/* Pick date */}
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex items-center gap-1 transition-colors"
                  style={{
                    borderRadius: "100px",
                    padding: "8px 13px",
                    fontSize: "12px",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    ...(connectDate !== todayStr && connectDate !== yesterdayStr
                      ? { background: "#c8622a", color: "#fff", border: "0.5px solid transparent" }
                      : showDatePicker
                      ? { background: "#c8622a", color: "#fff", border: "0.5px solid transparent" }
                      : { background: "#f0ede8", color: "#1c1812", border: "0.5px solid rgba(28,24,18,0.11)" }),
                  }}
                >
                  <CalendarIcon size={13} />
                  {connectDate !== todayStr && connectDate !== yesterdayStr
                    ? format(new Date(connectDate + "T00:00:00"), "MMM d")
                    : "Pick date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={connectDate ? new Date(connectDate + "T00:00:00") : undefined}
                  onSelect={(d) => {
                    if (d) {
                      setConnectDate(format(d, "yyyy-MM-dd"));
                      setShowDatePicker(false);
                    }
                  }}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleMainCTA}
        disabled={isRecording ? false : (!canSubmit && !isTranscribing)}
        className="w-full py-[16.5px] text-[16.5px] font-semibold text-primary-foreground shadow-md transition-opacity disabled:opacity-[0.38]"
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
          : (submitLabel || "Next →")}
      </button>

      {/* Skip link */}
      {onSkipToFollowup && (
        <button
          onClick={onSkipToFollowup}
          className="w-full text-center text-[13px] text-muted-foreground underline py-1"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Set a follow-up without logging
        </button>
      )}
    </div>
  );
};

export default LogStep1;
