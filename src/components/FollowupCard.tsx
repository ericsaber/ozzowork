import { useNavigate } from "react-router-dom";
import { Phone, Mail, MessageSquare, Users, Video, Calendar as CalendarIcon, CornerDownRight, MoreVertical, Pencil, X, History } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FollowupCardProps {
  taskRecordId: string;
  contactId: string;
  name: string;
  company: string | null;
  dueDate: string;
  plannedType: string | null;
  reminderNote: string | null;
  variant: "overdue" | "today" | "upcoming";
  onComplete: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  contactPhone?: string | null;
  contactEmail?: string | null;
  hasInteractions?: boolean;
  onHistoryTap?: () => void;
}

const typeVerb: Record<string, string> = {
  call: "Call", email: "Email", text: "Text", meet: "Meeting", video: "Video call",
};
const typeIcon: Record<string, React.ElementType> = {
  call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video,
};

const FollowupCard = ({
  taskRecordId, contactId, name, company, dueDate, variant,
  plannedType, reminderNote, onComplete,
  onEdit, onCancel, menuOpen, onMenuOpenChange,
  contactPhone, contactEmail, hasInteractions, onHistoryTap,
}: FollowupCardProps) => {
  const navigate = useNavigate();

  const isActionable = plannedType === "call" || plannedType === "text" || plannedType === "email";

  const handleActionTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (plannedType === "call" || plannedType === "text") {
      if (contactPhone) {
        window.location.href = plannedType === "call"
          ? `tel:${contactPhone}`
          : `sms:${contactPhone}`;
      } else {
        navigate(`/contact/${contactId}`);
      }
    } else if (plannedType === "email") {
      if (contactEmail) {
        window.location.href = `mailto:${contactEmail}`;
      } else {
        navigate(`/contact/${contactId}`);
      }
    }
  };

  const isOverdue = variant === "overdue";
  const isToday = variant === "today";

  const tokens = isOverdue
    ? {
        subframeBg: "rgba(255,240,239,0.5)",
        color: "#c0392b",
        doneBorder: "1px solid rgba(192,57,43,0.35)",
        reminderBg: "rgba(255,240,239,0.6)",
        reminderBorderColor: "rgba(192,57,43,0.35)",
      }
    : isToday
    ? {
        subframeBg: "rgba(231,242,235,0.5)",
        color: "#2e7a4d",
        doneBorder: "1px solid rgba(46,122,77,0.35)",
        reminderBg: "rgba(231,242,235,0.5)",
        reminderBorderColor: "rgba(46,122,77,0.35)",
      }
    : {
        subframeBg: "rgba(253,240,232,0.5)",
        color: "#b05524",
        doneBorder: "1px solid rgba(200,98,42,0.35)",
        reminderBg: "rgba(253,240,232,0.5)",
        reminderBorderColor: "rgba(176,85,36,0.35)",
      };

  const ActionIcon = plannedType ? (typeIcon[plannedType] || CalendarIcon) : CalendarIcon;

  const actionLabel = (() => {
    const typeStr = plannedType ? typeVerb[plannedType] || plannedType : "Follow-up";
    if (isToday) return `${typeStr} Today`;
    if (isOverdue) return `${typeStr} · Due ${format(parseISO(dueDate), "M/d")}`;
    return `${typeStr} · ${format(parseISO(dueDate), "MMM d")}`;
  })();

  return (
    <div
      onClick={() => navigate(`/contact/${contactId}`)}
      style={{
        background: "white",
        boxShadow: "0 1px 5px rgba(0,0,0,.08)",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        width: "100%",
      }}
    >
      {/* Top row */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        padding: "16px 20px 10px",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            onClick={(e) => { e.stopPropagation(); navigate(`/contact/${contactId}`); }}
            style={{
              fontWeight: 600,
              fontSize: "16px",
              color: "#383838",
              lineHeight: "normal",
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              margin: 0,
              cursor: "pointer",
            }}
          >
            {name}
          </p>
          {company && (
            <p
              onClick={(e) => { e.stopPropagation(); navigate(`/contact/${contactId}`); }}
              style={{
                fontWeight: 400,
                fontSize: "14px",
                color: "#777",
                lineHeight: "normal",
                fontFamily: "var(--font-body)",
                margin: 0,
                cursor: "pointer",
              }}
            >
              {company}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginTop: "2px" }}>
          {hasInteractions && (
            <History
              size={15}
              style={{ color: "#777", cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); onHistoryTap?.(); }}
            />
          )}
          <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "flex-start",
                }}
              >
                <MoreVertical size={16} style={{ color: "#777" }} />
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

      {/* Action subframe + reminder */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingBottom: "16px",
      }}>
        <div style={{
          width: "calc(100% - 24px)",
          borderRadius: "5px",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          {/* Main action row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 8px",
            background: tokens.subframeBg,
          }}>
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
                lineHeight: "normal",
                fontFamily: "var(--font-body)",
              }}>
                {actionLabel}
              </span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(); }}
              style={{
                background: "white",
                border: tokens.doneBorder,
                borderRadius: "20px",
                padding: "6px 14px",
                fontWeight: 500,
                fontSize: "14px",
                color: tokens.color,
                whiteSpace: "nowrap",
                lineHeight: "normal",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              Log it
            </button>
          </div>

          {/* Reminder row */}
          {reminderNote && (
            <div style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 18px",
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
                lineHeight: "normal",
                fontFamily: "var(--font-body)",
                flex: 1,
              }}>
                {reminderNote}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowupCard;
