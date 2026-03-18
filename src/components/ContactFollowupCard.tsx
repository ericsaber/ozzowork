import { useState } from "react";
import { Phone, Mail, MessageSquare, Users, Video, Check, MoreHorizontal, Pencil, Clock } from "lucide-react";
import { format, parseISO, differenceInDays, isToday, isTomorrow } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const typeIcons: Record<string, typeof Phone> = {
  call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video,
};
const typeLabels: Record<string, string> = {
  call: "Call", email: "Email", text: "Text", meet: "Meeting", video: "Video",
};

interface ContactFollowupCardProps {
  taskRecord: {
    id: string;
    planned_follow_up_type: string;
    planned_follow_up_date: string;
    contact_id: string;
  };
  variant: "upcoming" | "overdue";
  onTap?: () => void;
  onComplete?: () => void;
  onEdit?: () => void;
  onReschedule?: () => void;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
}

const ContactFollowupCard = ({
  taskRecord,
  variant,
  onTap,
  onComplete,
  onEdit,
  onReschedule,
  menuOpen,
  onMenuOpenChange,
}: ContactFollowupCardProps) => {
  const [checkHovered, setCheckHovered] = useState(false);
  const followUpDate = parseISO(taskRecord.planned_follow_up_date);
  const plannedType = taskRecord.planned_follow_up_type;
  const TypeIcon = plannedType ? (typeIcons[plannedType] || null) : null;

  // Date label
  let dateLabel = "";
  if (isToday(followUpDate)) dateLabel = "Today";
  else if (isTomorrow(followUpDate)) dateLabel = variant === "upcoming" ? "Tomorrow" : `Due ${format(followUpDate, "MMM d")}`;
  else dateLabel = `Due ${format(followUpDate, "MMM d")}`;

  // Relative time subtitle
  let relativeTime = "";
  if (variant === "upcoming") {
    if (isToday(followUpDate)) relativeTime = "Due today";
    else {
      const daysAhead = differenceInDays(followUpDate, new Date());
      if (daysAhead === 1) relativeTime = "Tomorrow";
      else if (daysAhead > 0) relativeTime = `In ${daysAhead} day${daysAhead !== 1 ? "s" : ""}`;
    }
  } else {
    const daysAgo = differenceInDays(new Date(), followUpDate);
    relativeTime = `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;
  }

  const pillBg = variant === "upcoming" ? "#e9f2eb" : "#fce8e8";
  const pillColor = variant === "upcoming" ? "#3d7a4a" : "#a32d2d";

  return (
    <div
      className="rounded-[12px] bg-card overflow-hidden cursor-pointer"
      style={{ border: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 4px rgba(0,0,0,.05)" }}
      onClick={onTap}
    >
      <div className="flex items-center gap-3" style={{ padding: "14px 12px" }}>
        {/* Checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onComplete?.(); }}
          onMouseEnter={() => setCheckHovered(true)}
          onMouseLeave={() => setCheckHovered(false)}
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
          style={{
            border: `1.5px solid ${checkHovered ? "#4a9e4a" : "#e8e6e3"}`,
            background: checkHovered ? "#eef7ee" : "transparent",
          }}
        >
          <Check size={14} strokeWidth={2.5} className="transition-colors" style={{ color: checkHovered ? "#4a9e4a" : "#c5c3be" }} />
        </button>

        {/* Content block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-foreground"
              style={{ fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 500, lineHeight: "20px" }}
            >
              {dateLabel}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-[9px] py-[2px] shrink-0"
              style={{ background: pillBg, color: pillColor, fontSize: "11px", fontWeight: 500, fontFamily: "var(--font-body)" }}
            >
              <TypeIcon size={11} />
              {typeLabels[plannedType] || plannedType} planned
            </span>
          </div>
          {relativeTime && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", lineHeight: "16px", color: "#9e9e99", marginTop: "2px" }}>
              {relativeTime}
            </p>
          )}
        </div>

        {/* Three-dot menu */}
        {onMenuOpenChange && (
          <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-full transition-colors shrink-0"
                style={{ color: "#b0ada8" }}
              >
                <MoreHorizontal size={18} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                  <Pencil size={14} className="mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {onReschedule && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onReschedule(); }}>
                  <Clock size={14} className="mr-2" /> Reschedule
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default ContactFollowupCard;
