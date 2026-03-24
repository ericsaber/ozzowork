import { Phone, Mail, MessageSquare, Users, Video, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";

interface InteractionItemProps {
  date: string;
  type: string;
  note: string | null;
  followUpDate?: string | null;
  followUpType?: string | null;
  status?: string;
  completedAt?: string | null;
  plannedFollowUpDate?: string | null;
  rescheduledFrom?: string | null;
  onClick?: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone size={16} />,
  email: <Mail size={16} />,
  text: <MessageSquare size={16} />,
  meet: <Users size={16} />,
  video: <Video size={16} />,
};

const typeLabels: Record<string, string> = {
  call: "Call",
  email: "Email",
  text: "Text",
  meet: "Meeting",
  video: "Video",
};

const InteractionItem = ({ date, type, note, followUpDate, followUpType, status, completedAt, plannedFollowUpDate, rescheduledFrom, onClick }: InteractionItemProps) => {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      onClick={onClick}
      className={`flex gap-3 py-3 animate-fade-in w-full text-left ${onClick ? "hover:bg-secondary/50 rounded-lg px-2 -mx-2 cursor-pointer active:scale-[0.98] transition-all" : ""}`}
    >
      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 text-muted-foreground">
        {typeIcons[type] || <MessageSquare size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {typeLabels[type] || type}
          </span>
          <span className="text-xs text-muted-foreground">
            {format(parseISO(date), "MMM d, yyyy")}
          </span>
        </div>
        {note && <p className="text-sm text-muted-foreground mt-0.5">{note}</p>}

        {/* Completed ghost row */}
        {status === "completed" && completedAt && plannedFollowUpDate && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Follow-up completed · {format(parseISO(completedAt), "MMM d")} · Was due {format(parseISO(plannedFollowUpDate), "MMM d")}
            {followUpType ? ` · ${typeLabels[followUpType] || followUpType} planned` : ""}
          </p>
        )}

        {/* Cancelled ghost row */}
        {status === "cancelled" && completedAt && plannedFollowUpDate && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Follow-up cancelled · {format(parseISO(completedAt), "MMM d")} · Was due {format(parseISO(plannedFollowUpDate), "MMM d")}
            {followUpType ? ` · ${typeLabels[followUpType] || followUpType} planned` : ""}
          </p>
        )}

        {/* Rescheduled annotation */}
        {rescheduledFrom && followUpDate && (
          <p className="text-xs text-muted-foreground mt-0.5">
            → Rescheduled from {format(parseISO(rescheduledFrom), "MMM d")} to {format(parseISO(followUpDate), "MMM d")}
          </p>
        )}

        {/* Normal active follow-up thread line */}
        {followUpDate && !rescheduledFrom && status !== "completed" && status !== "cancelled" && (
          <p className="text-xs text-primary mt-0.5">
            → {format(parseISO(followUpDate), "MMM d, yyyy")}
          </p>
        )}
      </div>
      {onClick && (
        <ChevronRight size={16} className="text-muted-foreground shrink-0 self-center" />
      )}
    </Wrapper>
  );
};

export default InteractionItem;
