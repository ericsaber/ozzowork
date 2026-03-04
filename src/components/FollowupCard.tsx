import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

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

const FollowupCard = ({
  interactionId,
  name,
  company,
  lastNote,
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
      <button
        onClick={handleCheck}
        className="w-9 h-9 rounded-full border-2 border-border flex items-center justify-center shrink-0 hover:border-primary hover:text-primary transition-colors group"
        title="Mark complete"
      >
        <CheckCircle2
          size={17}
          className={`transition-colors ${
            isCompleting
              ? "text-primary"
              : "text-muted-foreground group-hover:text-primary"
          }`}
        />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          {variant === "overdue" && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive shrink-0">
              Overdue
            </span>
          )}
          {variant === "today" && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success shrink-0">
              Today
            </span>
          )}
        </div>
        {company && <p className="text-sm text-muted-foreground">{company}</p>}
        {lastNote && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{lastNote}</p>
        )}
      </div>
    </button>
  );
};

export default FollowupCard;
