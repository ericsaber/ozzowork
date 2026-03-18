import { useState } from "react";
import { Phone, Mail, MessageSquare, Users, Video, CalendarIcon, Check } from "lucide-react";
import { addDays, addWeeks, format, parseISO, getYear } from "date-fns";
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

const dateChips = [
  { label: "Tomorrow", date: () => format(addDays(new Date(), 1), "yyyy-MM-dd") },
  { label: "3 days", date: () => format(addDays(new Date(), 3), "yyyy-MM-dd") },
  { label: "1 week", date: () => format(addWeeks(new Date(), 1), "yyyy-MM-dd") },
  { label: "2 weeks", date: () => format(addWeeks(new Date(), 2), "yyyy-MM-dd") },
];

interface LogStep2Props {
  connectType: string;
  contactName: string;
  note: string;
  logDate: string;
  onBack?: () => void;
  onSaveWithFollowup: (type: string, date: string) => void;
  onSkip: () => void;
  isSaving: boolean;
  onUpdateLog?: (connectType: string, note: string) => void;
  skippedInteraction?: boolean;
}

const LogStep2 = ({
  connectType,
  contactName,
  note,
  logDate,
  onBack,
  onSaveWithFollowup,
  onSkip,
  isSaving,
  onUpdateLog,
  skippedInteraction = false,
}: LogStep2Props) => {
  const [followUpType, setFollowUpType] = useState(connectType || "");
  const [selectedDate, setSelectedDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editConnectType, setEditConnectType] = useState(connectType);
  const [editNote, setEditNote] = useState(note);
  const [viaActivated, setViaActivated] = useState(false);

  const handlePillClick = (value: string) => {
    if (!viaActivated) setViaActivated(true);
    setFollowUpType(followUpType === value ? "" : value);
  };

  const handleChipClick = (chipDate: string) => {
    const newDate = selectedDate === chipDate ? "" : chipDate;
    setSelectedDate(newDate);
    if (newDate && !viaActivated) setViaActivated(true);
    setShowDatePicker(false);
  };

  const handleDoneEditing = () => {
    setIsEditing(false);
    onUpdateLog?.(editConnectType, editNote);
  };

  const typeLabel = connectType ? connectType.charAt(0).toUpperCase() + connectType.slice(1) : "";

  return (
    <div className="space-y-5">
      {/* Skipped interaction nudge */}
      {skippedInteraction && !isEditing && (
        <div
          className="rounded-[14px] overflow-hidden"
          style={{
            background: "#fdf5f0",
            border: "0.5px solid rgba(200,98,42,0.2)",
            padding: "14px 16.5px",
          }}
        >
          <p className="text-[14px]" style={{ color: "#7a746c", fontFamily: "var(--font-body)" }}>
            No interaction logged.{" "}
            {onBack && (
              <button
                onClick={onBack}
                className="underline font-medium"
                style={{ color: "#c8622a", fontFamily: "var(--font-body)" }}
              >
                Want to add one?
              </button>
            )}
          </p>
        </div>
      )}

      {/* Green confirmation card */}
      <div
        className="rounded-[14px] overflow-hidden"
        style={{
          background: isEditing ? "hsl(var(--card))" : "#eaf4ed",
          border: isEditing ? "0.5px solid hsl(var(--border))" : "0.5px solid rgba(42,112,72,0.2)",
          padding: "14px 16.5px",
        }}
      >
        {!isEditing ? (
          <>
            {connectType && (
              <div className="flex items-center gap-2">
                <div
                  className="rounded-full flex items-center justify-center shrink-0"
                  style={{ width: 21, height: 21, background: "hsl(var(--success))" }}
                >
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-[14px] font-medium" style={{ color: "#2a7048", fontFamily: "var(--font-body)" }}>
                  {typeLabel} · {contactName}
                </span>
                <span className="ml-auto text-[13px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                  {logDate}
                </span>
              </div>
            )}
            {!connectType && (
              <div className="flex items-center gap-2">
                <div
                  className="rounded-full flex items-center justify-center shrink-0"
                  style={{ width: 21, height: 21, background: "hsl(var(--success))" }}
                >
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-[14px] font-medium" style={{ color: "#2a7048", fontFamily: "var(--font-body)" }}>
                  {contactName}
                </span>
                <span className="ml-auto text-[13px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                  {logDate}
                </span>
              </div>
            )}
            {note && (
              <p
                className="italic mt-1.5"
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "14px",
                  color: "#2a5c3a",
                  paddingLeft: "29px",
                }}
              >
                {note}
              </p>
            )}
            {onUpdateLog && (
              <button
                onClick={() => {
                  setEditConnectType(connectType);
                  setEditNote(note);
                  setIsEditing(true);
                }}
                className="text-[13px] underline mt-1.5"
                style={{ color: "rgba(42,112,72,0.65)", fontFamily: "var(--font-body)", paddingLeft: "29px" }}
              >
                Tap to edit
              </button>
            )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((t) => {
                const selected = editConnectType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setEditConnectType(selected ? "" : t.value)}
                    className={`inline-flex items-center gap-1.5 py-[7px] px-[14px] text-[13px] font-medium transition-colors ${
                      selected ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                    style={{
                      borderRadius: "100px",
                      fontFamily: "var(--font-body)",
                      ...(selected
                        ? { background: "hsl(var(--primary))" }
                        : { background: "hsl(var(--secondary))", border: "0.5px solid hsl(var(--border))" }),
                    }}
                  >
                    <t.icon size={14} />
                    {t.label}
                  </button>
                );
              })}
            </div>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Add a note…"
              className="w-full bg-secondary rounded-[10px] border-none outline-none resize-none px-3 py-2 text-[14px] italic text-foreground min-h-[48px] placeholder:text-muted-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            />
            <button
              onClick={handleDoneEditing}
              className="text-[13px] underline"
              style={{ color: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
            >
              Done editing
            </button>
          </div>
        )}
      </div>

      {/* Unified follow-up card */}
      <div
        className="rounded-[14px]"
        style={{
          background: "#fff",
          border: "0.5px solid rgba(28,24,18,0.11)",
          padding: "13px 14px",
        }}
      >
        {/* Date section */}
        <p
          className="font-semibold uppercase tracking-[0.1em] mb-[10px]"
          style={{ fontSize: "11px", color: "#1c1812", fontFamily: "var(--font-body)" }}
        >
          Next connect
        </p>
        <div className="flex flex-wrap gap-2">
          {dateChips.map((chip) => {
            const chipDate = chip.date();
            const selected = selectedDate === chipDate;
            return (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chipDate)}
                className="transition-colors"
                style={{
                  borderRadius: "100px",
                  padding: "8px 13px",
                  fontSize: "12px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  ...(selected
                    ? { background: "#c8622a", color: "#fff", border: "0.5px solid transparent" }
                    : { background: "#f0ede8", color: "#1c1812", border: "0.5px solid rgba(28,24,18,0.11)" }),
                }}
              >
                {chip.label}
              </button>
            );
          })}
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
                  ...(showDatePicker
                    ? { background: "#c8622a", color: "#fff", border: "0.5px solid transparent" }
                    : { background: "#f0ede8", color: "#1c1812", border: "0.5px solid rgba(28,24,18,0.11)" }),
                }}
              >
                <CalendarIcon size={13} />
                Pick date
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(format(date, "yyyy-MM-dd"));
                    setShowDatePicker(false);
                  }
                }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {selectedDate && !dateChips.some((chip) => chip.date() === selectedDate) && (() => {
            const parsed = parseISO(selectedDate);
            const label = getYear(parsed) === getYear(new Date()) ? format(parsed, "EEE, MMM d") : format(parsed, "EEE, MMM d, yyyy");
            return (
              <button
                onClick={() => setSelectedDate("")}
                className="inline-flex items-center gap-1.5 transition-colors"
                style={{
                  borderRadius: "100px",
                  padding: "8px 13px",
                  fontSize: "12px",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  background: "#c8622a",
                  color: "#fff",
                  border: "0.5px solid transparent",
                }}
              >
                <CalendarIcon size={13} />
                {label}
                <span className="ml-1 text-[14px] leading-none opacity-70">×</span>
              </button>
            );
          })()}
        </div>

        {/* Divider */}
        <div style={{ height: "0.5px", background: "rgba(28,24,18,0.11)", margin: "11px 0" }} />

        {/* Via row */}
        <div
          className="flex items-center gap-2.5"
          style={{
            opacity: viaActivated ? 1 : 0.38,
            transition: "opacity 0.2s ease",
          }}
        >
          <span
            className="shrink-0"
            style={{ fontSize: "11px", color: "#b0a89e", fontFamily: "var(--font-body)" }}
          >
            via
          </span>
          <div className="flex items-center gap-2">
            {typeOptions.map((t) => {
              const selected = followUpType === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => handlePillClick(t.value)}
                  className="flex items-center justify-center transition-colors"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    ...(selected
                      ? { background: "#c8622a", borderColor: "transparent", border: "0.5px solid transparent" }
                      : { background: "#f0ede8", border: "0.5px solid rgba(28,24,18,0.11)" }),
                  }}
                  title={t.label}
                >
                  <t.icon size={14} style={{ color: selected ? "#fff" : "#1c1812" }} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onSaveWithFollowup(followUpType || connectType, selectedDate)}
        disabled={!selectedDate || isSaving}
        className="w-full py-[16.5px] text-[16.5px] font-semibold text-primary-foreground shadow-md transition-opacity disabled:opacity-[0.38]"
        style={{ borderRadius: "100px", background: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
      >
        {isSaving ? "Saving..." : "Save →"}
      </button>

      {/* Skip */}
      {!skippedInteraction && (
        <button
          onClick={onSkip}
          disabled={isSaving}
          className="w-full text-center text-[13px] text-muted-foreground underline py-1"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Skip follow-up
        </button>
      )}
    </div>
  );
};

export default LogStep2;
