import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { addDays, addWeeks, format, parseISO, isToday as isDateToday, isPast, startOfDay, getYear } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  call: "Call planned", email: "Email planned", text: "Text planned",
  meet: "Meeting planned", video: "Video planned",
};

const dateChips = [
  { label: "Tomorrow", date: () => format(addDays(new Date(), 1), "yyyy-MM-dd") },
  { label: "3 days",   date: () => format(addDays(new Date(), 3), "yyyy-MM-dd") },
  { label: "1 week",   date: () => format(addWeeks(new Date(), 1), "yyyy-MM-dd") },
  { label: "2 weeks",  date: () => format(addWeeks(new Date(), 2), "yyyy-MM-dd") },
];

interface OutstandingFollowupStepProps {
  existingFollowup: {
    id: string;
    planned_follow_up_type: string | null;
    planned_follow_up_date: string;
    connect_type: string | null;
    note: string | null;
  };
  contactName: string;
  onComplete: () => void;
  onUpdate: (newDate: string) => void;
  onCancel: () => void;
  onBack: () => void;
}

type Choice = "complete" | "update" | "cancel" | null;

const OutstandingFollowupStep = ({
  existingFollowup, contactName, onComplete, onUpdate, onCancel, onBack,
}: OutstandingFollowupStepProps) => {
  const fuDate = startOfDay(parseISO(existingFollowup.planned_follow_up_date));
  const isToday = isDateToday(fuDate);
  const isOverdue = !isToday && isPast(fuDate);
  const status: "today" | "overdue" | "future" = isToday ? "today" : isOverdue ? "overdue" : "future";

  console.log("[OutstandingFollowupStep] rendering:", {
    id: existingFollowup.id,
    plannedDate: existingFollowup.planned_follow_up_date,
    status,
    type: existingFollowup.planned_follow_up_type,
    isTailsOnly: !existingFollowup.connect_type && !existingFollowup.note,
  });

  const [choice, setChoice] = useState<Choice>(null);
  const [rescheduleDate, setRescheduleDate] = useState(status === "future" ? existingFollowup.planned_follow_up_date : "");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const badgeConfig = {
    today: { text: "Due today", color: "#d97a1a" },
    overdue: { text: "Overdue", color: "#b03828" },
    future: { text: "Upcoming", color: "#2a7048" },
  }[status];

  const cardStyle = {
    today: { background: "#fff4e6", border: "1px solid rgba(200,98,42,0.15)" },
    overdue: { background: "#fceae8", border: "1px solid rgba(176,56,40,0.15)" },
    future: { background: "#eaf4ed", border: "1px solid rgba(42,112,72,0.15)" },
  }[status];

  const dueDateStr = isToday
    ? "Due today"
    : isOverdue
    ? `Was due ${format(fuDate, "MMM d")}`
    : `Due ${format(fuDate, "MMM d, yyyy")}`;

  const typeLabel = existingFollowup.planned_follow_up_type
    ? typeLabels[existingFollowup.planned_follow_up_type] || existingFollowup.planned_follow_up_type
    : null;

  const options: { id: Choice; color: string; label: string; sub: string }[] =
    status === "future"
      ? [
          { id: "complete", color: "#2a7048", label: "Mark as complete early", sub: "Mark this follow-up as complete ahead of schedule" },
          { id: "update", color: "#c8622a", label: "Keep as is or reschedule", sub: "Confirm the date or pick a new one" },
          { id: "cancel", color: "#b03828", label: "Cancel it", sub: "Remove this follow-up entirely" },
        ]
      : [
          { id: "complete", color: "#2a7048", label: "Complete it", sub: status === "today" ? "Mark today's follow-up as complete" : "Mark this overdue follow-up as complete" },
          { id: "update", color: "#c8622a", label: "Update it", sub: "Reschedule to a new date" },
          { id: "cancel", color: "#b03828", label: "Cancel it", sub: "Remove this follow-up entirely" },
        ];

  const getCTAText = () => {
    if (!choice) return "Save log";
    if (choice === "complete") {
      if (status === "today") return "Save log and complete today's follow-up";
      if (status === "overdue") return "Save log and complete overdue follow-up";
      return "Save log and mark follow-up complete";
    }
    if (choice === "update") {
      if (!rescheduleDate) return "Save log";
      if (rescheduleDate === existingFollowup.planned_follow_up_date) return "Save log and keep follow-up";
      return "Save log and reschedule follow-up";
    }
    return "Save log and cancel follow-up";
  };

  const isDisabled = !choice || (choice === "update" && !rescheduleDate);

  const handleSave = () => {
    console.log("[OutstandingFollowupStep] choice made:", { choice, rescheduleDate, status });
    if (choice === "complete") onComplete();
    else if (choice === "update") onUpdate(rescheduleDate);
    else if (choice === "cancel") onCancel();
  };

  const handleChipClick = (chipDate: string) => {
    setRescheduleDate(rescheduleDate === chipDate ? "" : chipDate);
    setShowDatePicker(false);
  };

  return (
    <div className="space-y-4">
      <h2
        className="text-center pt-2"
        style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: 700, color: "hsl(var(--foreground))" }}
      >
        Outstanding follow-up
      </h2>

      <p className="text-center" style={{ fontSize: "14px", color: "#7a746c", fontFamily: "var(--font-body)", lineHeight: 1.5 }}>
        You already have an active follow-up. What would you like to do with it?
      </p>

      <div className="rounded-[14px]" style={{ ...cardStyle, padding: "12px 14px" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ color: badgeConfig.color, background: `${badgeConfig.color}15`, fontFamily: "var(--font-body)" }}
          >
            {badgeConfig.text}
          </span>
          {typeLabel && (
            <span style={{ fontSize: "13px", color: "#1c1812", fontFamily: "var(--font-body)" }}>{typeLabel}</span>
          )}
        </div>
        <div style={{ fontSize: "13px", color: "#7a746c", fontFamily: "var(--font-body)", marginTop: 4 }}>
          {dueDateStr}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {options.map((opt) => {
          const selected = choice === opt.id;
          return (
            <div key={opt.id}>
              <button
                onClick={() => setChoice(selected ? null : opt.id)}
                className="w-full text-left transition-all active:scale-[0.98]"
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: selected ? `1.5px solid ${opt.color}` : "1.5px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              >
                <div
                  className="font-bold"
                  style={{ fontSize: "14px", fontFamily: "var(--font-body)", color: selected ? opt.color : "#1c1812" }}
                >
                  {opt.label}
                </div>
                <div style={{ fontSize: "12px", fontFamily: "var(--font-body)", color: "#7a746c", marginTop: 2, lineHeight: 1.4 }}>
                  {opt.sub}
                </div>
              </button>

              {opt.id === "update" && selected && (
                <div className="mt-2 px-1">
                  <p
                    className="uppercase tracking-[0.1em] mb-2"
                    style={{ fontSize: "11px", color: "#7a746c", fontFamily: "var(--font-body)" }}
                  >
                    {status === "future"
                      ? `Currently ${format(fuDate, "MMM d, yyyy")} — keep or pick a new date`
                      : "Reschedule to"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {status === "future" && (
                      <button
                        onClick={() => setRescheduleDate(existingFollowup.planned_follow_up_date)}
                        className="transition-colors"
                        style={{
                          borderRadius: "100px", padding: "8px 13px", fontSize: "12px",
                          fontFamily: "var(--font-body)", fontWeight: 500,
                          ...(rescheduleDate === existingFollowup.planned_follow_up_date
                            ? { background: "#c8622a", color: "#fff", border: "0.5px solid transparent" }
                            : { background: "#f0ede8", color: "#1c1812", border: "0.5px solid rgba(28,24,18,0.11)" }),
                        }}
                      >
                        {format(fuDate, "MMM d")} (keep)
                      </button>
                    )}
                    {dateChips.map((chip) => {
                      const chipDate = chip.date();
                      const sel = rescheduleDate === chipDate;
                      return (
                        <button
                          key={chip.label}
                          onClick={() => handleChipClick(chipDate)}
                          className="transition-colors"
                          style={{
                            borderRadius: "100px", padding: "8px 13px", fontSize: "12px",
                            fontFamily: "var(--font-body)", fontWeight: 500,
                            ...(sel
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
                            borderRadius: "100px", padding: "8px 13px", fontSize: "12px",
                            fontFamily: "var(--font-body)", fontWeight: 500,
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
                          selected={rescheduleDate ? new Date(rescheduleDate + "T00:00:00") : undefined}
                          onSelect={(date) => {
                            if (date) {
                              setRescheduleDate(format(date, "yyyy-MM-dd"));
                              setShowDatePicker(false);
                            }
                          }}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    {rescheduleDate &&
                      rescheduleDate !== existingFollowup.planned_follow_up_date &&
                      !dateChips.some((c) => c.date() === rescheduleDate) && (() => {
                        const parsed = parseISO(rescheduleDate);
                        const label = getYear(parsed) === getYear(new Date()) ? format(parsed, "EEE, MMM d") : format(parsed, "EEE, MMM d, yyyy");
                        return (
                          <button
                            onClick={() => setRescheduleDate("")}
                            className="inline-flex items-center gap-1.5 transition-colors"
                            style={{
                              borderRadius: "100px", padding: "8px 13px", fontSize: "12px",
                              fontFamily: "var(--font-body)", fontWeight: 500,
                              background: "#c8622a", color: "#fff", border: "0.5px solid transparent",
                            }}
                          >
                            <CalendarIcon size={13} />
                            {label}
                            <span className="ml-1 text-[14px] leading-none opacity-70">×</span>
                          </button>
                        );
                      })()}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={isDisabled}
        className="w-full py-[16.5px] text-[16.5px] font-semibold text-primary-foreground shadow-md transition-opacity disabled:opacity-[0.38]"
        style={{ borderRadius: "100px", background: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
      >
        {getCTAText()}
      </button>

      <button
        onClick={onBack}
        className="w-full text-center text-[13px] text-muted-foreground underline py-1"
        style={{ fontFamily: "var(--font-body)" }}
      >
        ← Back
      </button>
    </div>
  );
};

export default OutstandingFollowupStep;
