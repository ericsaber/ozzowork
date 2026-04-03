import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, MessageSquare, Users, Video, Calendar as CalendarIcon, ChevronDown, CornerDownRight, Rewind } from "lucide-react";
import { format, parseISO } from "date-fns";

interface FollowupCardProps {
  taskRecordId: string;
  contactId: string;
  name: string;
  company: string | null;
  dueDate: string;
  plannedType: string | null;
  reminderNote: string | null;
  lastInteraction?: {
    connect_type: string | null;
    connect_date: string | null;
    note: string | null;
  } | null;
  variant: "overdue" | "today" | "upcoming";
  onComplete: () => void;
}

const typeVerb: Record<string, string> = {
  call: "Call", email: "Email", text: "Text", meet: "Meeting", video: "Video call",
};
const typeIcon: Record<string, React.ElementType> = {
  call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video,
};
const connectVerbs: Record<string, string> = {
  call: "Called", email: "Emailed", text: "Texted", meet: "Met", video: "Video called",
};

const FollowupCard = ({
  taskRecordId, contactId, name, company, dueDate, variant,
  plannedType, reminderNote, lastInteraction, onComplete,
}: FollowupCardProps) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const isUpcoming = variant === "upcoming";
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
    return `${typeStr} · Planned ${format(parseISO(dueDate), "M/d")}`;
  })();

  const hasLastInteraction = !!lastInteraction?.connect_type || !!lastInteraction?.note;
  const lastVerb = lastInteraction?.connect_type
    ? `Last ${connectVerbs[lastInteraction.connect_type] || lastInteraction.connect_type}`
    : "Last connected";
  const lastDate = lastInteraction?.connect_date
    ? format(parseISO(lastInteraction.connect_date), "M/d")
    : "";

  const showPreviously = hasLastInteraction && (!isUpcoming || expanded);

  return (
    <div
      onClick={() => isUpcoming ? setExpanded((e) => !e) : navigate(`/contact/${contactId}`)}
      style={{
        background: "white",
        border: "1px solid #e8e4de",
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
          <p style={{
            fontWeight: 600,
            fontSize: "16px",
            color: "#383838",
            lineHeight: "normal",
            fontFamily: "var(--font-body)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            margin: 0,
          }}>
            {name}
          </p>
          {company && (
            <p style={{
              fontWeight: 400,
              fontSize: "12px",
              color: "#777",
              lineHeight: "normal",
              fontFamily: "var(--font-body)",
              margin: 0,
            }}>
              {company}
            </p>
          )}
        </div>

        {isUpcoming ? (
          <ChevronDown
            size={14}
            style={{
              color: "#ccc",
              flexShrink: 0,
              marginTop: "3px",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          />
        ) : (
          <div
            onClick={(e) => { e.stopPropagation(); navigate(`/contact/${contactId}`); }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "2.5px",
              paddingLeft: "8px",
              paddingTop: "3px",
              flexShrink: 0,
              cursor: "pointer",
            }}
          >
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ width: "2.5px", height: "2.5px", borderRadius: "50%", background: "#bbb" }} />
            ))}
          </div>
        )}
      </div>

      {/* Fold — action subframe + reminder */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: showPreviously ? "16px" : "0",
        paddingBottom: showPreviously ? "0" : "16px",
      }}>
        {/* Action subframe */}
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
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ActionIcon size={16} style={{ color: tokens.color, flexShrink: 0 }} />
              <span style={{
                fontWeight: 600,
                fontSize: "14px",
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
                fontSize: "12px",
                color: tokens.color,
                whiteSpace: "nowrap",
                lineHeight: "normal",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              Done
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
              <CornerDownRight size={10} style={{ color: tokens.color, flexShrink: 0 }} />
              <span style={{
                fontWeight: 500,
                fontSize: "10px",
                color: tokens.color,
                whiteSpace: "nowrap",
                lineHeight: "normal",
                fontFamily: "var(--font-body)",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {reminderNote}
              </span>
            </div>
          )}
        </div>

        {/* Previously section */}
        {showPreviously && (
          <div style={{
            background: "#f7f5f2",
            borderTop: "1px solid #ede9e3",
            width: "100%",
            padding: lastInteraction?.note ? "10px 20px 16px" : "10px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Rewind size={10} style={{ color: "#717171", fill: "#D9D9D9", flexShrink: 0 }} />
              <span style={{
                fontWeight: 400,
                fontSize: "13px",
                color: "#717171",
                whiteSpace: "nowrap",
                lineHeight: "normal",
                fontFamily: "var(--font-body)",
              }}>
                {lastVerb}{lastDate ? ` · ${lastDate}` : ""}
              </span>
            </div>
            {lastInteraction?.note && (
              <p style={{
                fontWeight: 400,
                fontSize: "11px",
                color: "#717171",
                lineHeight: "normal",
                fontFamily: "var(--font-body)",
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {lastInteraction.note}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowupCard;
