import { useState } from "react";
import { Phone, Mail, MessageSquare, Users, Video, Calendar, Check, MoreHorizontal, Pencil, Trash2, Clock } from "lucide-react";
import { format, parseISO, differenceInDays, isToday, isTomorrow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const typeIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  text: MessageSquare,
  meet: Users,
  video: Video,
};

const typeLabels: Record<string, string> = {
  call: "Call",
  email: "Email",
  text: "Text",
  meet: "Meeting",
  video: "Video",
};

interface ContactFollowupCardProps {
  followUp: {
    id: string;
    follow_up_type: string;
    due_date: string;
    created_at: string;
    contact_id: string;
    completed?: boolean;
    completed_at?: string | null;
  };
  variant: "upcoming" | "overdue" | "completed";
  onTap?: () => void;
  onComplete?: () => void;
  onReschedule?: () => void;
  onEditFollowup?: () => void;
  onRemoveFollowup?: () => void;
  onLogIt?: () => void;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
}

const ContactFollowupCard = ({
  followUp,
  variant,
  onTap,
  onComplete,
  onReschedule,
  onEditFollowup,
  onRemoveFollowup,
  onLogIt,
  menuOpen,
  onMenuOpenChange,
}: ContactFollowupCardProps) => {
  const [checkHovered, setCheckHovered] = useState(false);
  const followUpDate = parseISO(followUp.due_date);
  const plannedType = followUp.follow_up_type;
  const TypeIcon = typeIcons[plannedType] || MessageSquare;
  const isCompleted = variant === "completed" || followUp.completed;

  // Date display
  let datePrimary = "";
  let dateSecondary = "";
  if (isCompleted) {
    datePrimary = `${typeLabels[plannedType] || plannedType} · ${format(followUpDate, "MMM d")}`;
    dateSecondary = followUp.completed_at
      ? `Completed ${format(parseISO(followUp.completed_at), "MMM d")}`
      : "Completed";
  } else if (variant === "upcoming") {
    if (isToday(followUpDate)) datePrimary = "Today";
    else if (isTomorrow(followUpDate)) datePrimary = "Tomorrow";
    else datePrimary = format(followUpDate, "EEE, MMM d");
  } else {
    datePrimary = `Due ${format(followUpDate, "MMM d")}`;
    const daysAgo = differenceInDays(new Date(), followUpDate);
    dateSecondary = `${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;
  }

  // Pill colors
  const pillBg = isCompleted ? "#eef7ee" : variant === "upcoming" ? "#eef7ee" : "#fdf2f0";
  const pillColor = isCompleted ? "#3a7e3a" : variant === "upcoming" ? "#3a7e3a" : "#b83e22";

  if (isCompleted) {
    return (
      <div
        className="rounded-[14px] bg-card overflow-hidden opacity-70"
        style={{ boxShadow: "0 1px 5px rgba(0,0,0,.04)" }}
      >
        <div className="flex items-start gap-3" style={{ padding: "11px 12px" }}>
          {/* Filled green check */}
          <div className="w-[26px] h-[26px] rounded-full bg-[hsl(142,60%,40%)] flex items-center justify-center shrink-0 mt-0.5">
            <Check size={12} strokeWidth={2.5} className="text-white" />
          </div>

          <div className="flex-1 min-w-0 pt-0.5 cursor-pointer" onClick={onTap}>
            <p
              className="text-foreground line-through"
              style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, lineHeight: "20px" }}
            >
              {datePrimary}
            </p>
            <p
              className="text-[hsl(142,60%,40%)]"
              style={{ fontFamily: "var(--font-body)", fontSize: "10px", lineHeight: "14px" }}
            >
              {dateSecondary}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[14px] bg-card overflow-hidden"
      style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}
    >
      {/* Top zone */}
      <div className="flex items-start gap-3" style={{ padding: "11px 12px" }}>
        {/* Checkmark circle */}
        <button
          onClick={onComplete || onLogIt}
          onMouseEnter={() => setCheckHovered(true)}
          onMouseLeave={() => setCheckHovered(false)}
          className="w-[26px] h-[26px] rounded-full flex items-center justify-center shrink-0 transition-colors mt-0.5"
          style={{
            border: `1.5px solid ${checkHovered ? "#4a9e4a" : "#e8e4de"}`,
            background: checkHovered ? "#eef7ee" : "transparent",
          }}
        >
          <Check
            size={12}
            strokeWidth={2.5}
            className="transition-colors"
            style={{ color: checkHovered ? "#4a9e4a" : "#e8e4de" }}
          />
        </button>

        {/* Date text - tappable to navigate */}
        <div className="flex-1 min-w-0 pt-0.5 cursor-pointer" onClick={onTap}>
          <p
            className="text-foreground"
            style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, lineHeight: "20px" }}
          >
            {datePrimary}
          </p>
          {dateSecondary && (
            <p
              className="text-muted-foreground"
              style={{ fontFamily: "var(--font-body)", fontSize: "10px", lineHeight: "14px" }}
            >
              {dateSecondary}
            </p>
          )}
        </div>

        {/* Dots menu */}
        {onMenuOpenChange && (
          <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <button className="p-1 text-[#aaa] hover:text-[#666] transition-colors shrink-0">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {onEditFollowup && (
                <DropdownMenuItem onClick={onEditFollowup}>
                  <Pencil size={14} className="mr-2" /> Edit follow-up
                </DropdownMenuItem>
              )}
              {variant === "overdue" && onReschedule && (
                <DropdownMenuItem onClick={onReschedule}>
                  <Clock size={14} className="mr-2" /> Reschedule
                </DropdownMenuItem>
              )}
              {onRemoveFollowup && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onRemoveFollowup} className="text-destructive focus:text-destructive">
                    <Trash2 size={14} className="mr-2" /> Remove follow-up
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Bottom strip */}
      <div
        className="flex items-center justify-between"
        style={{ borderTop: "1px solid hsl(var(--border))", padding: "8px 12px" }}
      >
        {/* Type pill */}
        <span
          className="inline-flex items-center gap-1 rounded-[20px] px-[9px] py-[3px]"
          style={{
            background: pillBg,
            color: pillColor,
            fontSize: "10px",
            fontWeight: 500,
            fontFamily: "var(--font-body)",
          }}
        >
          <TypeIcon size={10} />
          {typeLabels[plannedType] || plannedType} planned
        </span>

        {/* Reschedule button for overdue */}
        {variant === "overdue" && onReschedule && (
          <button
            onClick={onReschedule}
            className="inline-flex items-center gap-1 transition-colors"
            style={{
              color: "#d94f2e",
              fontSize: "11px",
              fontWeight: 500,
              fontFamily: "var(--font-body)",
              background: "none",
              border: "none",
              padding: 0,
            }}
          >
            <Calendar size={12} />
            Reschedule
          </button>
        )}
      </div>
    </div>
  );
};

export default ContactFollowupCard;
