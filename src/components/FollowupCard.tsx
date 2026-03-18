import { useNavigate } from "react-router-dom";
import { Check, Phone, Mail, MessageSquare, Users, Video } from "lucide-react";
import { format, parseISO } from "date-fns";

interface FollowupCardProps {
  taskRecordId: string;
  contactId: string;
  name: string;
  company: string | null;
  dueDate: string;
  plannedType: string;
  connectType: string | null;
  connectDate: string | null;
  note: string | null;
  variant: "overdue" | "today";
  isCompleting?: boolean;
  onComplete: () => void;
}

const typeIcon: Record<string, React.ElementType> = {
  call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video,
};
const pastVerb: Record<string, string> = {
  call: "Called", email: "Emailed", text: "Texted", meet: "Met", video: "Video called",
};

const FollowupCard = ({
  taskRecordId, contactId, name, company, dueDate, variant,
  plannedType, connectType, connectDate, note, isCompleting, onComplete,
}: FollowupCardProps) => {
  const navigate = useNavigate();
  const TypeIcon = plannedType ? (typeIcon[plannedType?.toLowerCase()] || null) : null;
  const plannedLabel = plannedType ? (pastVerb[plannedType?.toLowerCase()] ? typeIcon[plannedType?.toLowerCase()] ? undefined : "Planned" : "Planned") : "Planned";
  const ConnectIcon = connectType ? (typeIcon[connectType.toLowerCase()] || null) : null;
  const connectVerb = connectType ? (pastVerb[connectType.toLowerCase()] || connectType) : null;

  const badgeLabel = variant === "today" ? "Today" : `Due ${format(parseISO(dueDate), "MMM d")}`;

  const handleCheck = (e: React.MouseEvent) => { e.stopPropagation(); onComplete(); };

  return (
    <button
      onClick={() => navigate(`/interaction/${taskRecordId}`)}
      data-completing={isCompleting || undefined}
      className="w-full text-left bg-card rounded-lg border border-border p-4 flex items-start gap-3 active:scale-[0.98] transition-all duration-500 animate-fade-in data-[completing]:opacity-40 data-[completing]:line-through"
    >
      <button
        onClick={handleCheck}
        className="w-[26px] h-[26px] rounded-full border-[1.5px] border-[hsl(var(--border))] flex items-center justify-center shrink-0 transition-colors hover:border-[hsl(142,60%,40%)] hover:bg-[hsl(142,60%,40%)]/10 group mt-0.5"
        title="Mark complete"
      >
        <Check size={12} strokeWidth={2.5} className={`transition-colors ${isCompleting ? "text-[hsl(142,60%,40%)]" : "text-[#ccc] group-hover:text-[hsl(142,60%,40%)]"}`} />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            onClick={(e) => { e.stopPropagation(); navigate(`/contact/${contactId}`); }}
            className="font-medium text-foreground truncate hover:underline cursor-pointer"
            style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '20px' }}
          >
            {name}
          </span>
          {variant === "overdue" ? (
            <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full shrink-0" style={{ fontSize: '14px', lineHeight: '20px', background: '#fce8e8', color: '#a32d2d' }}>
              {TypeIcon && <TypeIcon size={16} />}{TypeIcon ? badgeLabel : `Planned · ${badgeLabel.replace("Due ", "")}`}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-full shrink-0" style={{ fontSize: '14px', lineHeight: '20px', background: '#e9f2eb', color: '#3d7a4a' }}>
              {TypeIcon && <TypeIcon size={16} />}{TypeIcon ? badgeLabel : `Planned · ${badgeLabel.replace("Due ", "")}`}
            </span>
          )}
        </div>

        {company && (
          <p className="font-normal text-[#999]" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: '16px' }}>
            {company}
          </p>
        )}

        {connectType && (
          <div className="mt-2">
            <div className="border-t border-border mb-1.5" />
            <p className="font-medium uppercase text-[#bbb] mb-1" style={{ fontFamily: 'var(--font-body)', fontSize: '9px', lineHeight: '16px', letterSpacing: '0.1em' }}>
              Last connect
            </p>
            {ConnectIcon && (
              <span className="inline-flex items-center gap-1 mb-1" style={{ background: '#e8e4de', color: '#666', borderRadius: '20px', padding: '3px 9px', fontSize: '10px', fontWeight: 500 }}>
                <ConnectIcon size={10} />
                {connectVerb} · {connectDate ? format(parseISO(connectDate), "MMM d") : ""}
              </span>
            )}
            {note && (
              <p className="text-[#777] line-clamp-2" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', lineHeight: '16px' }}>
                {note}
              </p>
            )}
          </div>
        )}
      </div>
    </button>
  );
};

export default FollowupCard;
