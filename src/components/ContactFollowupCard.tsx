import { useState } from "react";
import { Phone, Mail, MessageSquare, Users, Video, Calendar, Clock, Check, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
  meet: "Meet",
  video: "Video",
};

const pastVerb: Record<string, string> = {
  call: "Called",
  email: "Emailed",
  text: "Texted",
  meet: "Met",
  video: "Video called",
};

interface ContactFollowupCardProps {
  interaction: {
    id: string;
    date: string;
    planned_follow_up_type: string;
    connect_type: string | null;
    note: string | null;
    follow_up_date: string | null;
  };
  variant: "upcoming" | "overdue";
  onLogIt: () => void;
  onReschedule?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}

const ContactFollowupCard = ({
  interaction,
  variant,
  onLogIt,
  onReschedule,
  onEdit,
  onDelete,
  menuOpen,
  onMenuOpenChange,
}: ContactFollowupCardProps) => {
  const followUpDate = interaction.follow_up_date ? parseISO(interaction.follow_up_date) : new Date();
  const plannedType = interaction.planned_follow_up_type;
  const TypeIcon = typeIcons[plannedType] || MessageSquare;

  const isUpcoming = variant === "upcoming";

  // Date display
  let dateText = "";
  if (isUpcoming) {
    if (isToday(followUpDate)) dateText = "Today";
    else if (isTomorrow(followUpDate)) dateText = "Tomorrow";
    else dateText = format(followUpDate, "EEEE, MMM d");
  } else {
    const daysAgo = differenceInDays(new Date(), followUpDate);
    dateText = `Due ${format(followUpDate, "MMM d")}`;
    const ageText = ` · ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`;
    dateText += ageText;
  }

  // Colors
  const iconBg = isUpcoming ? "bg-[hsl(120,30%,95%)]" : "bg-[hsl(8,80%,96%)]";
  const iconColor = isUpcoming ? "text-[hsl(120,35%,40%)]" : "text-[hsl(12,70%,52%)]";
  const btnBg = isUpcoming ? "bg-[hsl(120,30%,95%)]" : "bg-[hsl(8,80%,96%)]";
  const btnBorder = isUpcoming ? "border-[hsl(120,30%,82%)]" : "border-[hsl(8,60%,85%)]";
  const btnText = isUpcoming ? "text-[hsl(120,35%,36%)]" : "text-[hsl(12,70%,52%)]";

  return (
    <div
      className="relative rounded-[14px] bg-card p-[12px_14px]"
      style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}
    >
      {/* Dots menu */}
      <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
        <DropdownMenuTrigger asChild>
          <button className="absolute top-3 right-3 p-1 text-[#aaa] hover:text-[#666] transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil size={14} className="mr-2" /> Edit follow-up
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
            <Trash2 size={14} className="mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Eyebrow */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center ${iconBg}`}>
          {isUpcoming ? (
            <Calendar size={12} className={iconColor} />
          ) : (
            <Clock size={12} className={iconColor} />
          )}
        </div>
        <span className="text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--font-body)" }}>
          {dateText}
        </span>
      </div>

      {/* Type pill */}
      <div className="mb-3">
        <span
          className="inline-flex items-center gap-1 rounded-[20px] px-[9px] py-[3px] text-[10px] font-medium"
          style={{ background: "#e8e4de", color: "#666", fontFamily: "var(--font-body)" }}
        >
          <TypeIcon size={10} />
          {typeLabels[plannedType] || plannedType} planned
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-border mb-3" />

      {/* Last connect */}
      <div className="mb-3">
        <p
          className="text-[9px] font-medium uppercase tracking-[0.08em] mb-1"
          style={{ color: "#bbb", fontFamily: "var(--font-body)" }}
        >
          Last connect
        </p>
        {interaction.connect_type && (
          (() => {
            const ConnectIcon = typeIcons[interaction.connect_type] || MessageSquare;
            const verb = pastVerb[interaction.connect_type] || interaction.connect_type;
            return (
              <span
                className="inline-flex items-center gap-1 mb-1"
                style={{
                  background: '#e8e4de',
                  color: '#666',
                  borderRadius: '20px',
                  padding: '3px 9px',
                  fontSize: '10px',
                  fontWeight: 500,
                  fontFamily: 'var(--font-body)',
                }}
              >
                <ConnectIcon size={10} />
                {verb} · {format(parseISO(interaction.date), "MMM d")}
              </span>
            );
          })()
        )}
        {interaction.note ? (
          <p className="text-[11px] line-clamp-2" style={{ color: "#777", fontFamily: "var(--font-body)" }}>
            {interaction.note}
          </p>
        ) : (
          <p className="text-[11px] italic" style={{ color: "#bbb", fontFamily: "var(--font-body)" }}>
            No note
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onLogIt}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-border px-3 py-[9px] text-[12px] font-medium text-muted-foreground transition-colors"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <Pencil size={14} />
          Log it
        </button>
        {!isUpcoming && onReschedule && (
          <button
            onClick={onReschedule}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-[10px] border px-3 py-[9px] text-[12px] font-medium transition-colors ${btnBg} ${btnBorder} ${btnText}`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            <Calendar size={14} />
            Reschedule
          </button>
        )}
      </div>
    </div>
  );
};

export default ContactFollowupCard;
