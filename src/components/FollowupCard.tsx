import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, MessageSquare, Users, Video, Calendar as CalendarIcon, ChevronDown, CornerDownRight, MoreVertical, Pencil, X } from "lucide-react";
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
  lastInteraction?: {
    connect_type: string | null;
    connect_date: string | null;
    note: string | null;
  } | null;
  variant: "overdue" | "today" | "upcoming";
  onComplete: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
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
  onEdit, onCancel, menuOpen, onMenuOpenChange,
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
        maxWidth: "390px",
        margin: "0 auto",
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
              fontSize: "14px",
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
          <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px 0 0 8px",
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
              <div style={{
                width: "22px",
                height: "22px",
                borderRadius: "5px",
                background: `${tokens.color}26`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <ActionIcon size={14} style={{ color: tokens.color }} />
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
                fontSize: "16px",
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
              <svg width="13" height="11" viewBox="0 0 11 9" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path d="M5.49989 1.49984C5.49985 1.30208 5.44118 1.10877 5.33129 0.944352C5.2214 0.779933 5.06524 0.651787 4.88253 0.576113C4.69983 0.500439 4.49879 0.480635 4.30484 0.519205C4.11088 0.557774 3.93271 0.652986 3.79286 0.792803L0.792793 3.79296C0.605318 3.9805 0.5 4.23482 0.5 4.5C0.5 4.76518 0.605318 5.0195 0.792793 5.20704L3.79286 8.2072C3.93271 8.34701 4.11088 8.44223 4.30484 8.4808C4.49879 8.51937 4.69983 8.49956 4.88253 8.42389C5.06524 8.34821 5.2214 8.22007 5.33129 8.05565C5.44118 7.89123 5.49985 7.69792 5.49989 7.50016V1.49984Z" fill="#D9D9D9"/>
                <path d="M10.5 1.49984C10.5 1.30208 10.4413 1.10877 10.3314 0.944352C10.2215 0.779933 10.0653 0.651787 9.88264 0.576113C9.69994 0.500439 9.4989 0.480635 9.30494 0.519205C9.11099 0.557774 8.93282 0.652986 8.79296 0.792803L5.7929 3.79296C5.60542 3.9805 5.50011 4.23482 5.50011 4.5C5.50011 4.76518 5.60542 5.0195 5.7929 5.20704L8.79296 8.2072C8.93282 8.34701 9.11099 8.44223 9.30494 8.4808C9.4989 8.51937 9.69994 8.49956 9.88264 8.42389C10.0653 8.34821 10.2215 8.22007 10.3314 8.05565C10.4413 7.89123 10.5 7.69792 10.5 7.50016V1.49984Z" fill="#D9D9D9"/>
                <path d="M5.49989 1.49984C5.49985 1.30208 5.44118 1.10877 5.33129 0.944352C5.2214 0.779933 5.06524 0.651787 4.88253 0.576113C4.69983 0.500439 4.49879 0.480635 4.30484 0.519205C4.11088 0.557774 3.93271 0.652986 3.79286 0.792803L0.792793 3.79296C0.605318 3.9805 0.5 4.23482 0.5 4.5C0.5 4.76518 0.605318 5.0195 0.792793 5.20704L3.79286 8.2072C3.93271 8.34701 4.11088 8.44223 4.30484 8.4808C4.49879 8.51937 4.69983 8.49956 4.88253 8.42389C5.06524 8.34821 5.2214 8.22007 5.33129 8.05565C5.44118 7.89123 5.49985 7.69792 5.49989 7.50016V1.49984Z" stroke="#717171" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10.5 1.49984C10.5 1.30208 10.4413 1.10877 10.3314 0.944352C10.2215 0.779933 10.0653 0.651787 9.88264 0.576113C9.69994 0.500439 9.4989 0.480635 9.30494 0.519205C9.11099 0.557774 8.93282 0.652986 8.79296 0.792803L5.7929 3.79296C5.60542 3.9805 5.50011 4.23482 5.50011 4.5C5.50011 4.76518 5.60542 5.0195 5.7929 5.20704L8.79296 8.2072C8.93282 8.34701 9.11099 8.44223 9.30494 8.4808C9.4989 8.51937 9.69994 8.49956 9.88264 8.42389C10.0653 8.34821 10.2215 8.22007 10.3314 8.05565C10.4413 7.89123 10.5 7.69792 10.5 7.50016V1.49984Z" stroke="#717171" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{
                fontWeight: 400,
                fontSize: "14px",
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
                fontSize: "14px",
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
