import { useNavigate } from "react-router-dom";
import { Check, Phone, Mail, Voicemail, MessageSquare } from "lucide-react";
import { format, parseISO } from "date-fns";

interface FollowupCardProps {
  interactionId: string;
  contactId: string;
  name: string;
  company: string | null;
  lastNote: string | null;
  followUpDate: string;
  interactionType: string;
  variant: "overdue" | "today";
  isCompleting?: boolean;
  onComplete: () => void;
}

const typeIcon: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  voicemail: Voicemail,
  text: MessageSquare,
};

const FollowupCard = ({
  interactionId,
  name,
  company,
  lastNote,
  followUpDate,
  variant,
  interactionType,
  isCompleting,
  onComplete,
}: FollowupCardProps) => {
  const navigate = useNavigate();

  const borderClass =
    variant === "overdue"
      ? "border-l-[3px] border-l-[hsl(8,72%,51%)]"
      : "border-l-[3px] border-l-[hsl(142,60%,40%)]";

  const TypeIcon = typeIcon[interactionType?.toLowerCase()] || MessageSquare;

  const badgeLabel =
    variant === "today"
      ? "Today"
      : `Due ${format(parseISO(followUpDate), "MMM d")}`;

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete();
  };

  return (
    <button
      onClick={() => navigate(`/followup/${interactionId}`)}
      data-completing={isCompleting || undefined}
      className={`w-full text-left bg-card rounded-lg border border-border ${borderClass} p-4 flex items-start gap-3 active:scale-[0.98] transition-all duration-500 animate-fade-in data-[completing]:opacity-40 data-[completing]:line-through`}
    >
      {/* Check circle */}
      <button
        onClick={handleCheck}
        className="w-[26px] h-[26px] rounded-full border-[1.5px] border-[hsl(var(--border))] flex items-center justify-center shrink-0 transition-colors hover:border-primary hover:bg-primary/10 group mt-0.5"
        title="Mark complete"
      >
        <Check
          size={12}
          strokeWidth={2.5}
          className={`transition-colors ${
            isCompleting
              ? "text-primary"
              : "text-[#ccc] group-hover:text-primary"
          }`}
        />
      </button>

      <div className="flex-1 min-w-0">
        {/* Name + badge row */}
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-medium text-foreground truncate" style={{ fontFamily: 'var(--font-body)' }}>
            {name}
          </h3>
          {variant === "overdue" ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[hsl(8,85%,97%)] text-[hsl(8,72%,51%)] shrink-0">
              <TypeIcon size={12} />
              {badgeLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-[hsl(142,40%,95%)] text-[hsl(142,35%,46%)] shrink-0">
              <TypeIcon size={12} />
              {badgeLabel}
            </span>
          )}
        </div>

        {/* Company */}
        {company && (
          <p className="text-[11px] font-normal text-[#999]" style={{ fontFamily: 'var(--font-body)' }}>
            {company}
          </p>
        )}

        {/* Last interaction section */}
        {lastNote && (
          <div className="mt-2">
            <div className="border-t border-border mb-1.5" />
            <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#bbb] mb-0.5" style={{ fontFamily: 'var(--font-body)' }}>
              Last Interaction
            </p>
            <p className="text-[12px] text-[#777] line-clamp-2" style={{ fontFamily: 'var(--font-body)' }}>
              {lastNote}
            </p>
          </div>
        )}
      </div>
    </button>
  );
};

export default FollowupCard;
