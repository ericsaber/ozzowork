import { useNavigate } from "react-router-dom";
import { Check, Phone, Mail, MessageSquare, Users, Video } from "lucide-react";
import { format, parseISO } from "date-fns";

interface FollowupCardProps {
  followUpId: string;
  contactId: string;
  name: string;
  company: string | null;
  lastNote: string | null;
  dueDate: string;
  followUpType: string;
  connectType: string | null;
  interactionDate: string;
  variant: "overdue" | "today";
  isCompleting?: boolean;
  onComplete: () => void;
}

const typeIcon: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  text: MessageSquare,
  meet: Users,
  video: Video,
};

const pastVerb: Record<string, string> = {
  call: "Called",
  email: "Emailed",
  text: "Texted",
  meet: "Met",
  video: "Video called",
};

const FollowupCard = ({
  followUpId,
  name,
  company,
  lastNote,
  dueDate,
  variant,
  followUpType,
  connectType,
  interactionDate,
  isCompleting,
  onComplete,
}: FollowupCardProps) => {
  const navigate = useNavigate();

  const TypeIcon = typeIcon[followUpType?.toLowerCase()] || MessageSquare;
  const ConnectIcon = connectType ? (typeIcon[connectType.toLowerCase()] || null) : null;
  const connectVerb = connectType ? (pastVerb[connectType.toLowerCase()] || connectType) : null;

  const badgeLabel =
    variant === "today"
      ? "Today"
      : `Due ${format(parseISO(dueDate), "MMM d")}`;

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComplete();
  };

  return (
    <button
      onClick={() => navigate(`/followup/${followUpId}`)}
      data-completing={isCompleting || undefined}
      className="w-full text-left bg-card rounded-lg border border-border p-4 flex items-start gap-3 active:scale-[0.98] transition-all duration-500 animate-fade-in data-[completing]:opacity-40 data-[completing]:line-through"
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

        {/* Last connect section */}
        {(connectType || lastNote) && (
          <div className="mt-2">
            <div className="border-t border-border mb-1.5" />
            <p className="font-medium uppercase text-[#bbb] mb-1" style={{ fontFamily: 'var(--font-body)', fontSize: '9px', lineHeight: '16px', letterSpacing: '0.1em' }}>
              Last connect
            </p>
            {connectType && ConnectIcon && (
              <span
                className="inline-flex items-center gap-1 mb-1"
                style={{
                  background: '#e8e4de',
                  color: '#666',
                  borderRadius: '20px',
                  padding: '3px 9px',
                  fontSize: '10px',
                  fontWeight: 500,
                }}
              >
                <ConnectIcon size={10} />
                {connectVerb} · {format(parseISO(interactionDate), "MMM d")}
              </span>
            )}
            {lastNote && (
              <p className="text-[#777] line-clamp-2" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', lineHeight: '16px' }}>
                {lastNote}
              </p>
            )}
          </div>
        )}
      </div>
    </button>
  );
};

export default FollowupCard;
