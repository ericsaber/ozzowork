import { Phone, Mail, Voicemail, MessageSquare } from "lucide-react";
import { format, parseISO } from "date-fns";

interface InteractionItemProps {
  date: string;
  type: string;
  note: string | null;
}

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone size={16} />,
  email: <Mail size={16} />,
  voicemail: <Voicemail size={16} />,
  note: <MessageSquare size={16} />,
};

const typeLabels: Record<string, string> = {
  call: "Call",
  email: "Email",
  voicemail: "Voicemail",
  note: "Note",
};

const InteractionItem = ({ date, type, note }: InteractionItemProps) => {
  return (
    <div className="flex gap-3 py-3 animate-fade-in">
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
      </div>
    </div>
  );
};

export default InteractionItem;
