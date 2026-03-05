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

  const borderClass = "";

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
        className="w-[26px] h-[26px] rounded-full border-[1.5px] border-[hsl(var(--border))] flex items-center justify-center shrink-0 transition-colors hover:border-[hsl(142,60%,40%)] hover:bg-[hsl(142,60%,40%)]/10 group mt-0.5"
        title="Mark complete"
      >
        <Check
          size={12}
          strokeWidth={2.5}
          className={`transition-colors ${
            isCompleting
              ? "text-[hsl(142,60%,40%)]"
              : "text-[#ccc] group-hover:text-[hsl(142,60%,40%)]"
          }`}
        />
      </button>

      <div className="flex-1 min-w-0">
        {/* Name + badge row */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-medium text-foreground truncate" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '20px' }}>
            {name}
          </h3>
          {variant === "overdue" ? (
            <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full bg-[hsl(8,85%,97%)] text-[hsl(8,72%,51%)] shrink-0" style={{ fontSize: '14px', lineHeight: '20px' }}>
              <TypeIcon size={16} />
              {badgeLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full bg-[hsl(142,40%,95%)] text-[hsl(142,35%,46%)] shrink-0" style={{ fontSize: '14px', lineHeight: '20px' }}>
              <TypeIcon size={16} />
              {badgeLabel}
            </span>
          )}
        </div>

        {/* Company */}
        {company && (
          <p className="font-normal text-[#999]" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: '16px' }}>
            {company}
          </p>
        )}

        {/* Last interaction section */}
        {lastNote && (
          <div className="mt-2">
            <div className="border-t border-border mb-1.5" />
            <p className="font-medium uppercase text-[#bbb] mb-0.5" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: '16px', letterSpacing: '0px' }}>
              Last Interaction
            </p>
            <p className="text-[#777] line-clamp-2" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '20px' }}>
              {lastNote}
            </p>
          </div>
        )}
      </div>
    </button>
  );
};

export default FollowupCard;
