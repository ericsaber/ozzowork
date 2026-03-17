import { useState } from "react";
import { Check, Phone, Mail, MessageSquare, Users, Video, CalendarIcon } from "lucide-react";
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
  const [followUpType, setFollowUpType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editConnectType, setEditConnectType] = useState(connectType);
  const [editNote, setEditNote] = useState(note);

  const handlePillClick = (value: string) => {
    setFollowUpType(followUpType === value ? "" : value);
  };

  const handleChipClick = (chipDate: string) => {
    setSelectedDate(selectedDate === chipDate ? "" : chipDate);
    setShowDatePicker(false);
  };

  const handleDoneEditing = () => {
    setIsEditing(false);
    onUpdateLog?.(editConnectType, editNote);
  };

  const bothSelected = followUpType && selectedDate;
  const typeLabel = connectType ? connectType.charAt(0).toUpperCase() + connectType.slice(1) : "";

  return (
    <div className="space-y-5">
      {/* Bug 7: Skipped interaction nudge */}
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

      {/* Green confirmation card — always shown */}
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
          /* Inline edit mode */
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

      {/* Follow-up type chips */}
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>
          How will you follow up?
        </p>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((t) => {
            const selected = followUpType === t.value;
            return (
              <button
                key={t.value}
                onClick={() => handlePillClick(t.value)}
                className={`inline-flex items-center gap-1.5 py-[8px] px-[15px] text-[13px] font-medium transition-colors ${
                  selected ? "text-primary-foreground" : "text-muted-foreground"
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

      {/* Date chips */}
      <div>
        <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>
          When?
        </p>
        <div className="flex flex-wrap gap-2">
          {dateChips.map((chip) => {
            const chipDate = chip.date();
            const selected = selectedDate === chipDate;
            return (
              <button
                key={chip.label}
                onClick={() => handleChipClick(chipDate)}
                className={`py-[8px] px-[15px] text-[13px] font-medium transition-colors ${
                  selected ? "text-primary-foreground" : "text-muted-foreground"
                }`}
                style={{
                  borderRadius: "100px",
                  fontFamily: "var(--font-body)",
                  ...(selected
                    ? { background: "hsl(var(--primary))" }
                    : { background: "hsl(var(--card))", border: "0.5px solid hsl(var(--border))" }),
                }}
              >
                {chip.label}
              </button>
            );
          })}
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <button
                className={`inline-flex items-center gap-1 py-[8px] px-[15px] text-[13px] font-medium transition-colors ${
                  showDatePicker ? "text-primary-foreground" : "text-muted-foreground"
                }`}
                style={{
                  borderRadius: "100px",
                  fontFamily: "var(--font-body)",
                  ...(showDatePicker
                    ? { background: "hsl(var(--primary))" }
                    : { background: "hsl(var(--card))", border: "0.5px solid hsl(var(--border))" }),
                }}
              >
                <CalendarIcon size={14} />
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
              <div
                className="inline-flex items-center gap-2 py-[8px] px-[15px] text-[15px] font-medium text-foreground"
                style={{ borderRadius: "100px", border: "0.5px solid hsl(var(--border))", fontFamily: "var(--font-body)" }}
              >
                <CalendarIcon size={16} className="text-muted-foreground shrink-0" />
                {label}
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedDate(""); }}
                  className="ml-auto text-muted-foreground hover:text-foreground transition-colors text-[16px] leading-none"
                  aria-label="Clear date"
                >
                  ×
                </button>
              </div>
            );
          })()}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onSaveWithFollowup(followUpType, selectedDate)}
        disabled={!bothSelected || isSaving}
        className="w-full py-[16.5px] text-[16.5px] font-semibold text-primary-foreground shadow-md transition-opacity disabled:opacity-[0.38]"
        style={{ borderRadius: "100px", background: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
      >
        {isSaving ? "Saving..." : "Save →"}
      </button>

      {/* Skip — Bug 9: hide if user already skipped interaction */}
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
