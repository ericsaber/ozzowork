import { useNavigate } from "react-router-dom";
import { format, isToday, isPast, parseISO } from "date-fns";

interface FollowupCardProps {
  contactId: string;
  name: string;
  company: string | null;
  lastNote: string | null;
  followUpDate: string;
}

const FollowupCard = ({ contactId, name, company, lastNote, followUpDate }: FollowupCardProps) => {
  const navigate = useNavigate();
  const date = parseISO(followUpDate);
  const overdue = isPast(date) && !isToday(date);
  const today = isToday(date);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <button
      onClick={() => navigate(`/contact/${contactId}`)}
      className="w-full text-left bg-card rounded-lg border border-border p-4 flex items-start gap-3 active:scale-[0.98] transition-transform animate-fade-in"
    >
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
        <span className="text-sm font-semibold text-secondary-foreground">{initials}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          {overdue && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-destructive/10 text-destructive shrink-0">
              Overdue
            </span>
          )}
          {today && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success shrink-0">
              Today
            </span>
          )}
        </div>
        {company && <p className="text-sm text-muted-foreground">{company}</p>}
        {lastNote && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{lastNote}</p>
        )}
      </div>
    </button>
  );
};

export default FollowupCard;
