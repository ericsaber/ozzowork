import { Phone, Mail, MessageSquare, Users, Video, Pencil, Clock, Calendar as CalendarIcon, CornerDownRight, X } from "lucide-react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const typeVerb: Record<string, string> = {
  call: "Call", email: "Email", text: "Text", meet: "Meeting", video: "Video call",
};
const typeIconMap: Record<string, React.ElementType> = {
  call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video,
};

interface ContactFollowupCardProps {
  taskRecord: {
    id: string;
    planned_type: string | null;
    planned_date: string;
    reminder_note: string | null;
    contact_id: string;
  };
  variant: "upcoming" | "overdue";
  onComplete?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  rescheduleCount?: number;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

const ContactFollowupCard = ({
  taskRecord,
  variant,
  onComplete,
  onEdit,
  onCancel,
  menuOpen,
  onMenuOpenChange,
  rescheduleCount,
  contactPhone,
  contactEmail,
}: ContactFollowupCardProps) => {
  const isOverdue = variant === "overdue";

  const tokens = isOverdue
    ? {
        subframeBg: "rgba(255,240,239,0.5)",
        color: "#c0392b",
        doneBorder: "1px solid rgba(192,57,43,0.35)",
        reminderBg: "#fff0ef",
        reminderBorderColor: "rgba(192,57,43,0.35)",
      }
    : {
        subframeBg: "rgba(253,240,232,0.5)",
        color: "#b05524",
        doneBorder: "1px solid rgba(200,98,42,0.35)",
        reminderBg: "rgba(253,240,232,0.5)",
        reminderBorderColor: "rgba(176,85,36,0.35)",
      };

  const isActionable = taskRecord.planned_type === "call" || taskRecord.planned_type === "text" || taskRecord.planned_type === "email";

  const handleActionTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (taskRecord.planned_type === "call" || taskRecord.planned_type === "text") {
      if (contactPhone) {
        window.location.href = taskRecord.planned_type === "call" ? `tel:${contactPhone}` : `sms:${contactPhone}`;
      }
    } else if (taskRecord.planned_type === "email") {
      if (contactEmail) {
        window.location.href = `mailto:${contactEmail}`;
      }
    }
  };

  const ActionIcon = taskRecord.planned_type
    ? (typeIconMap[taskRecord.planned_type] || CalendarIcon)
    : CalendarIcon;

  const typeStr = taskRecord.planned_type
    ? typeVerb[taskRecord.planned_type] || taskRecord.planned_type
    : "Follow-up";

  const followUpDate = parseISO(taskRecord.planned_date);
  const datePart = (() => {
    if (isToday(followUpDate)) return "Today";
    if (isTomorrow(followUpDate)) return "Tomorrow";
    if (isOverdue) return `Due ${format(followUpDate, "MMM d")}`;
    return format(followUpDate, "MMM d");
  })();
  const actionLabel = `${typeStr} · ${datePart}`;

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e8e4de",
        borderRadius: "16px",
        overflow: "hidden",
        width: "100%",
        maxWidth: "390px",
        margin: "0 auto",
        padding: "16px 0",
      }}
    >
      {/* Action subframe */}
      <div style={{
        width: "calc(100% - 24px)",
        margin: "0 auto",
        borderRadius: "5px",
        overflow: "hidden",
      }}>
        {/* Main action row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 8px",
          background: tokens.subframeBg,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{ display: "flex", alignItems: "center", gap: "6px", cursor: isActionable ? "pointer" : "default" }}
              onClick={isActionable ? handleActionTap : undefined}
            >
              <div style={{
                width: "26px",
                height: "26px",
                borderRadius: "6px",
                background: `${tokens.color}26`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <ActionIcon size={16} strokeWidth={2} style={{ color: tokens.color }} />
              </div>
              <span style={{
                fontWeight: 600,
                fontSize: "16px",
                color: tokens.color,
                whiteSpace: "nowrap",
                fontFamily: "var(--font-body)",
              }}>
                {actionLabel}
              </span>
            </div>
          </div>

          {/* Right: Done button + vertical dots */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={(e) => { e.stopPropagation(); onComplete?.(); }}
              style={{
                background: "white",
                border: tokens.doneBorder,
                borderRadius: "20px",
                padding: "8px 16px",
                fontWeight: 500,
                fontSize: "14px",
                color: tokens.color,
                whiteSpace: "nowrap",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              Log it
            </button>

            {/* Vertical dots menu */}
            <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px 8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                    alignItems: "center",
                    flexShrink: 0,
                  }}
                >
                  {[0,1,2].map((i) => (
                    <div key={i} style={{
                      width: "3px",
                      height: "3px",
                      borderRadius: "50%",
                      background: "#bbb",
                    }} />
                  ))}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Pencil size={14} className="mr-2" /> Edit follow-up
                  </DropdownMenuItem>
                )}
                {onCancel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => { e.stopPropagation(); onCancel(); }}
                      className="text-destructive focus:text-destructive"
                    >
                      <X size={14} className="mr-2" /> Cancel follow-up
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Reminder row */}
        {taskRecord.reminder_note && (
          <div style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 17px",
            gap: "7px",
            borderTop: `1px dashed ${tokens.reminderBorderColor}`,
            background: tokens.reminderBg,
          }}>
            <CornerDownRight size={16} style={{ color: tokens.color, flexShrink: 0 }} />
            <span style={{
              fontWeight: 400,
              fontSize: "12px",
              color: tokens.color,
              whiteSpace: "nowrap",
              fontFamily: "var(--font-body)",
              flex: 1,
            }}>
              {taskRecord.reminder_note}
            </span>
          </div>
        )}
      </div>

      {/* Reschedule nudge */}
      {rescheduleCount !== undefined && rescheduleCount >= 3 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 12px 0",
          marginTop: "8px",
        }}>
          <Clock size={11} style={{ color: "#999" }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
            Rescheduled {rescheduleCount} times
          </span>
        </div>
      )}
    </div>
  );
};

export default ContactFollowupCard;
