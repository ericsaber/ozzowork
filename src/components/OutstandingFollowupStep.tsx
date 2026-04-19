import { useState, useEffect } from "react";
import {
  CalendarIcon,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Video,
  CornerDownRight,
  type LucideIcon,
} from "lucide-react";
import {
  addDays,
  addWeeks,
  format,
  isToday as isDateToday,
  isPast,
  startOfDay,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = {
  call: "Call",
  email: "Email",
  text: "Text",
  meet: "Meeting",
  video: "Video",
};

const typeIcons: Record<string, LucideIcon> = {
  call: Phone,
  email: Mail,
  text: MessageSquare,
  meet: Users,
  video: Video,
};

const parseDate = (dateStr: string) => {
  if (!dateStr) return new Date();
  return new Date(dateStr.slice(0, 10) + "T00:00:00");
};

const dateChips = [
  { label: "Tomorrow", date: () => format(addDays(new Date(), 1), "yyyy-MM-dd") },
  { label: "3 days", date: () => format(addDays(new Date(), 3), "yyyy-MM-dd") },
  { label: "1 week", date: () => format(addWeeks(new Date(), 1), "yyyy-MM-dd") },
  { label: "2 weeks", date: () => format(addWeeks(new Date(), 2), "yyyy-MM-dd") },
];

type Choice = "keep" | "reschedule" | "cancel" | null;

interface OutstandingFollowupStepProps {
  existingFollowup: {
    id: string;
    planned_type: string | null;
    planned_date: string;
    status: string;
    reminder_note?: string | null;
  };
  contactName: string;
  onUpdate: (newDate: string) => void;
  onCancel: () => void;
  onChoiceChange?: (choice: Choice, rescheduleDate: string) => void;
}

const OutstandingFollowupStep = ({
  existingFollowup,
  contactName,
  onChoiceChange,
}: OutstandingFollowupStepProps) => {
  const fuDate = startOfDay(parseDate(existingFollowup.planned_date));
  const isToday = isDateToday(fuDate);
  const isOverdue = !isToday && isPast(fuDate);
  const status: "today" | "overdue" | "future" = isToday
    ? "today"
    : isOverdue
    ? "overdue"
    : "future";

  console.log("[OutstandingFollowupStep] rendering:", {
    id: existingFollowup.id,
    plannedDate: existingFollowup.planned_date,
    status,
    type: existingFollowup.planned_type,
    followupStatus: existingFollowup.status,
    reminderNote: existingFollowup.reminder_note,
  });

  const [choice, setChoice] = useState<Choice>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    onChoiceChange?.(choice, rescheduleDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, rescheduleDate]);

  const statusColor =
    status === "overdue" ? "#c0392b" : status === "today" ? "#2d6a4f" : "#c8622a";
  const reminderBorderColor =
    status === "overdue" ? "#f0c8c8" : status === "today" ? "#b7d9cc" : "#e8c4b0";

  const TypeIcon = existingFollowup.planned_type
    ? typeIcons[existingFollowup.planned_type] || CalendarIcon
    : CalendarIcon;
  const typeLabel = existingFollowup.planned_type
    ? typeLabels[existingFollowup.planned_type] || "Follow-up"
    : "Follow-up";

  const dueDateStr = isToday
    ? "Today"
    : isOverdue
    ? `Was due ${format(fuDate, "MMM d")}`
    : format(fuDate, "MMM d");

  const options: { id: Exclude<Choice, null>; title: string; sub: string; danger?: boolean }[] = [
    { id: "keep", title: "Keep as-is", sub: "Leave it active, nothing changes" },
    { id: "reschedule", title: "Reschedule", sub: "Move it to a new date" },
    { id: "cancel", title: "Cancel it", sub: "Remove this follow-up entirely", danger: true },
  ];

  const handleChipClick = (chipDate: string) => {
    setRescheduleDate(rescheduleDate === chipDate ? "" : chipDate);
    setShowCalendar(false);
  };

  return (
    <div style={{ paddingTop: 20, display: "flex", flexDirection: "column" }}>
      <h2
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontSize: 26,
          fontWeight: 500,
          color: "#1c1a17",
          lineHeight: 1.2,
          letterSpacing: "-0.01em",
          marginBottom: 16,
          margin: 0,
          paddingRight: 44,
        }}
      >
        {contactName} has an active follow-up. What would you like to do with it?
      </h2>

      {/* Trimmed card */}
      <div
        style={{
          background: "white",
          border: "1px solid #e8e4de",
          borderRadius: 16,
          padding: "12px 14px",
          marginTop: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 0",
          }}
        >
          <TypeIcon size={15} color={statusColor} />
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "Outfit, sans-serif",
              color: statusColor,
            }}
          >
            {typeLabel} · {dueDateStr}
          </div>
        </div>

        {existingFollowup.reminder_note && (
          <div
            style={{
              borderTop: `1px dashed ${reminderBorderColor}`,
              paddingTop: 8,
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
            }}
          >
            <CornerDownRight size={13} color="#888480" style={{ marginTop: 2, flexShrink: 0 }} />
            <div
              style={{
                fontSize: 12,
                fontStyle: "italic",
                color: "#6b6860",
                fontFamily: "Outfit, sans-serif",
                lineHeight: 1.4,
              }}
            >
              {existingFollowup.reminder_note}
            </div>
          </div>
        )}
      </div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
        {options.map((opt) => {
          const selected = choice === opt.id;
          const danger = opt.danger;

          let bg = "#faf8f5";
          let border = "1.5px solid #e8e4de";
          let titleColor = "#1c1a17";

          if (danger && !selected) {
            border = "1.5px solid #f5c4c4";
            titleColor = "#b03030";
          } else if (danger && selected) {
            bg = "#fdecea";
            border = "1.5px solid #f5b8b4";
            titleColor = "#b03030";
          } else if (selected) {
            bg = "#fdf4f0";
            border = "1.5px solid #c8622a";
            titleColor = "#c8622a";
          }

          return (
            <div key={opt.id}>
              <button
                onClick={() => setChoice(selected ? null : opt.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: bg,
                  border,
                  borderRadius: 16,
                  padding: "13px 14px",
                  cursor: "pointer",
                  transition: "background 0.15s ease, border-color 0.15s ease",
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "Outfit, sans-serif",
                    color: titleColor,
                  }}
                >
                  {opt.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#888480",
                    fontFamily: "Outfit, sans-serif",
                    marginTop: 2,
                  }}
                >
                  {opt.sub}
                </div>
              </button>

              {opt.id === "reschedule" && selected && (
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {dateChips.map((chip) => {
                      const chipDate = chip.date();
                      const sel = rescheduleDate === chipDate;
                      return (
                        <button
                          key={chip.label}
                          onClick={() => handleChipClick(chipDate)}
                          style={{
                            background: sel ? "#fdf4f0" : "#faf8f5",
                            border: sel ? "1.5px solid #c8622a" : "1px solid #e8e4de",
                            borderRadius: 12,
                            padding: "13px 8px",
                            fontSize: 14,
                            fontFamily: "Outfit, sans-serif",
                            color: sel ? "#c8622a" : "#1c1a17",
                            fontWeight: 500,
                            cursor: "pointer",
                            transition: "background 0.15s ease, border-color 0.15s ease",
                          }}
                        >
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setShowCalendar((s) => !s)}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      background: showCalendar ? "#fdf4f0" : "#faf8f5",
                      border: showCalendar ? "1.5px solid #c8622a" : "1px solid #e8e4de",
                      borderRadius: 12,
                      padding: "13px 8px",
                      fontSize: 14,
                      fontFamily: "Outfit, sans-serif",
                      color: showCalendar ? "#c8622a" : "#1c1a17",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                  >
                    <CalendarIcon size={14} />
                    {rescheduleDate &&
                    !dateChips.some((c) => c.date() === rescheduleDate)
                      ? format(parseDate(rescheduleDate), "EEE, MMM d")
                      : "Pick date"}
                  </button>

                  {showCalendar && (
                    <div
                      style={{
                        background: "#faf8f5",
                        border: "1px solid #e8e4de",
                        borderRadius: 12,
                        overflow: "hidden",
                        marginTop: 8,
                      }}
                    >
                      <Calendar
                        mode="single"
                        selected={
                          rescheduleDate ? parseDate(rescheduleDate) : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            setRescheduleDate(format(date, "yyyy-MM-dd"));
                            setShowCalendar(false);
                          }
                        }}
                        disabled={(date) =>
                          date < new Date(new Date().setHours(0, 0, 0, 0))
                        }
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OutstandingFollowupStep;
