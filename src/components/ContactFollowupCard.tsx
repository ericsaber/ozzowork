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
  const TypeIcon = typeIcons[plannedType] || MessageSquare;

  let datePrimary = "";
  let dateSecondary = "";
  if (variant === "upcoming") {
    if (isToday(followUpDate)) datePrimary = "Today";
    else if (isTomorrow(followUpDate)) datePrimary = "Tomorrow";
    else datePrimary = format(followUpDate, "EEE, MMM d");
    if (isToday(followUpDate)) dateSecondary = "Due today";
  } else {
    datePrimary = `Due ${format(followUpDate, "MMM d")}`;
    const daysAgo = differenceInDays(new Date(), followUpDate);
    dateSecondary = `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;
  }

  const pillBg = variant === "upcoming" ? "#e9f2eb" : "#fce8e8";
  const pillColor = variant === "upcoming" ? "#3d7a4a" : "#a32d2d";

  return (
    <div className="rounded-[12px] bg-card overflow-hidden" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}>
      <div className="flex items-start gap-3" style={{ padding: "11px 12px" }}>
        {/* Checkbox */}
        <button
          onClick={onComplete}
          onMouseEnter={() => setCheckHovered(true)}
          onMouseLeave={() => setCheckHovered(false)}
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 transition-colors mt-0.5"
          style={{
            border: `1.5px solid ${checkHovered ? "#4a9e4a" : "#e8e4de"}`,
            background: checkHovered ? "#eef7ee" : "transparent",
          }}
        >
          <Check size={12} strokeWidth={2.5} className="transition-colors" style={{ color: checkHovered ? "#4a9e4a" : "#e8e4de" }} />
        </button>

        <div className="flex-1 min-w-0 pt-0.5 cursor-pointer" onClick={onTap}>
          <p className="text-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, lineHeight: "20px" }}>
            {datePrimary}
          </p>
          {dateSecondary && (
            <p className="text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "10px", lineHeight: "14px" }}>
              {dateSecondary}
            </p>
          )}
        </div>

        {onMenuOpenChange && (
          <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <button className="p-1 text-[#aaa] hover:text-[#666] transition-colors shrink-0">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {onEdit && (
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil size={14} className="mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {onReschedule && (
                <DropdownMenuItem onClick={onReschedule}>
                  <Clock size={14} className="mr-2" /> Reschedule
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,0,0.08)", padding: "8px 12px" }}>
        <span
          className="inline-flex items-center gap-1 rounded-[20px] px-[9px] py-[3px]"
          style={{ background: pillBg, color: pillColor, fontSize: "10px", fontWeight: 500, fontFamily: "var(--font-body)" }}
        >
          <TypeIcon size={10} />
          {typeLabels[plannedType] || plannedType} planned
        </span>
      </div>
    </div>
  );
};

export default ContactFollowupCard;
