import { useState } from "react";
import { Check, Phone, Mail, MessageSquare, Users, Video, CalendarIcon } from "lucide-react";
import { addDays, addWeeks, format } from "date-fns";
import { Input } from "@/components/ui/input";
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
  onBack: () => void;
  onSaveWithFollowup: (type: string, date: string) => void;
  onSkip: () => void;
  isSaving: boolean;
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
}: LogStep2Props) => {
  const [followUpType, setFollowUpType] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePillClick = (value: string) => {
    setFollowUpType(followUpType === value ? "" : value);
  };

  const handleChipClick = (chipDate: string) => {
    setSelectedDate(selectedDate === chipDate ? "" : chipDate);
    setShowDatePicker(false);
  };

  const bothSelected = followUpType && selectedDate;

  const truncatedNote = note ? (note.length > 60 ? note.slice(0, 60) + "…" : note) : "";

  const typeLabel =
    connectType.charAt(0).toUpperCase() + connectType.slice(1);

  // Helper hints
  const showTypeHint = selectedDate && !followUpType;
  const showDateHint = followUpType && !selectedDate;

  return (
    <div className="space-y-5">
      {/* Back link */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-muted-foreground text-[13px]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        ← Edit log
      </button>

      {/* Title */}
      <h2
        className="text-[24px] text-foreground"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        What's next?
      </h2>

      {/* Confirmation strip */}
      <div className="flex items-start gap-2.5 rounded-[12px] border border-[#c2dfc2] bg-[#eef7ee] px-[14px] py-[10px]">
        <div className="w-5 h-5 rounded-full bg-[hsl(142,60%,40%)] flex items-center justify-center shrink-0 mt-0.5">
          <Check size={12} className="text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[hsl(142,40%,35%)]" style={{ fontFamily: "var(--font-body)" }}>
            {typeLabel} logged with {contactName}
          </p>
          <p className="text-[10px] text-[hsl(142,30%,50%)]" style={{ fontFamily: "var(--font-body)" }}>
            {logDate}{truncatedNote ? ` · ${truncatedNote}` : ""}
          </p>
        </div>
      </div>

      {/* Follow-up type */}
      <div>
        <p
          className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
          How will you follow up?
        </p>
        <div className="flex flex-wrap gap-2">
          {typeOptions.map((t) => {
            const selected = followUpType === t.value;
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
      </div>

      {/* When */}
      <div>
        <p
          className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2"
          style={{ fontFamily: "var(--font-body)" }}
        >
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
                className={`rounded-[20px] px-[13px] py-[7px] text-[11px] font-medium transition-colors ${
                  selected
                    ? "bg-[#fdf0e8] border-[1.5px] border-[#f0c4a8] text-[#c8622a]"
                    : "bg-white border-[1.5px] border-border text-muted-foreground"
                }`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                {chip.label}
              </button>
            );
          })}
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <button
                className={`rounded-[20px] px-[13px] py-[7px] text-[11px] font-medium transition-colors inline-flex items-center gap-1 ${
                  showDatePicker
                    ? "bg-[#fdf0e8] border-[1.5px] border-[#f0c4a8] text-[#c8622a]"
                    : "bg-white border-[1.5px] border-border text-muted-foreground"
                }`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                <CalendarIcon size={12} />
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
        </div>

        {/* Helper hints */}
        {showDateHint && (
          <p className="text-[11px] italic text-muted-foreground mt-2" style={{ fontFamily: "var(--font-body)" }}>
            Select when to set the reminder.
          </p>
        )}
        {showTypeHint && (
          <p className="text-[11px] italic text-muted-foreground mt-2" style={{ fontFamily: "var(--font-body)" }}>
            Select how you'll follow up to set the reminder.
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={() => onSaveWithFollowup(followUpType, selectedDate)}
        disabled={!bothSelected || isSaving}
        className="w-full rounded-[13px] bg-primary text-primary-foreground py-[14px] text-[14px] font-semibold shadow-md transition-opacity disabled:opacity-[0.38]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {isSaving ? "Saving..." : "Save & set reminder"}
      </button>

      {/* Skip link */}
      <button
        onClick={onSkip}
        disabled={isSaving}
        className="w-full text-center text-[13px] text-muted-foreground underline py-1"
        style={{ fontFamily: "var(--font-body)" }}
      >
        Save log and skip follow-up
      </button>
    </div>
  );
};

export default LogStep2;
