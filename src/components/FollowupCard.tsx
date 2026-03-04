import { useNavigate } from "react-router-dom";
import { format, isToday, isPast, parseISO } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FollowupCardProps {
  interactionId: string;
  contactId: string;
  name: string;
  company: string | null;
  lastNote: string | null;
  followUpDate: string;
}

const FollowupCard = ({ interactionId, contactId, name, company, lastNote, followUpDate }: FollowupCardProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const date = parseISO(followUpDate);
  const overdue = isPast(date) && !isToday(date);
  const today = isToday(date);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const completeTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("interactions")
        .update({ follow_up_date: null })
        .eq("id", interactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups-today"] });
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      toast.success("Follow-up completed");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeTask.mutate();
  };

  return (
    <button
      onClick={() => navigate(`/followup/${interactionId}`)}
      className="w-full text-left bg-card rounded-lg border border-border p-4 flex items-start gap-3 active:scale-[0.98] transition-transform animate-fade-in"
    >
      {/* Complete checkbox */}
      <button
        onClick={handleComplete}
        disabled={completeTask.isPending}
        className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center shrink-0 hover:border-primary hover:text-primary transition-colors group"
        title="Mark complete"
      >
        <CheckCircle2 size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
      </button>

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
