import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Phone, Mail, Voicemail, MessageSquare, CheckCircle2, User, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO, isToday, isPast } from "date-fns";
import { toast } from "sonner";

const typeIcons: Record<string, React.ReactNode> = {
  call: <Phone size={18} />,
  email: <Mail size={18} />,
  voicemail: <Voicemail size={18} />,
  text: <MessageSquare size={18} />,
};

const typeLabels: Record<string, string> = {
  call: "Call",
  email: "Email",
  voicemail: "Voicemail",
  text: "Text",
};

const FollowupTask = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: interaction, isLoading } = useQuery({
    queryKey: ["interaction", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select("*, contacts(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const completeTask = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("interactions")
        .update({ follow_up_date: null })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups-today"] });
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      queryClient.invalidateQueries({ queryKey: ["interaction", id] });
      toast.success("Follow-up completed");
      navigate("/");
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
        <div className="h-8 w-20 bg-secondary animate-pulse rounded mb-6" />
        <div className="space-y-4">
          <div className="h-24 bg-secondary animate-pulse rounded-lg" />
          <div className="h-40 bg-secondary animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!interaction) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft size={18} /><span className="text-sm">Back</span>
        </button>
        <p className="text-muted-foreground text-center py-16">Task not found</p>
      </div>
    );
  }

  const contact = interaction.contacts;
  const contactName = contact ? `${contact.first_name} ${contact.last_name}`.trim() : "Unknown";
  const initials = contactName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const followDate = interaction.follow_up_date ? parseISO(interaction.follow_up_date) : null;
  const overdue = followDate && isPast(followDate) && !isToday(followDate);
  const isDueToday = followDate && isToday(followDate);

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-muted-foreground mb-4"
      >
        <ArrowLeft size={18} />
        <span className="text-sm">Back</span>
      </button>

      {/* Task header badge */}
      <div className="flex items-center gap-2 mb-5">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          overdue
            ? "bg-destructive/10 text-destructive"
            : isDueToday
            ? "bg-success/10 text-success"
            : "bg-primary/10 text-primary"
        }`}>
          {overdue ? "Overdue" : isDueToday ? "Due Today" : "Upcoming"}
        </div>
        <span className="text-xs text-muted-foreground">
          Follow-up Task
        </span>
      </div>

      {/* Contact card — prominent & clickable */}
      <Link
        to={`/contact/${interaction.contact_id}`}
        className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card mb-5 active:scale-[0.98] transition-transform group"
      >
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <span className="text-base font-semibold text-secondary-foreground">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-xl text-foreground group-hover:text-primary transition-colors truncate">
            {contactName}
          </p>
          {contact?.company && (
            <p className="text-sm text-muted-foreground">{contact.company}</p>
          )}
        </div>
        <User size={18} className="text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
      </Link>

      {/* Task details */}
      <div className="bg-card rounded-xl border border-border divide-y divide-border mb-6">
        {/* Due date */}
        <div className="flex items-center gap-3 p-4">
          <Calendar size={18} className="text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Due Date</p>
            <p className={`text-sm font-medium ${
              overdue ? "text-destructive" : isDueToday ? "text-success" : "text-foreground"
            }`}>
              {followDate ? format(followDate, "EEEE, MMMM d, yyyy") : "No date set"}
            </p>
          </div>
        </div>

        {/* Interaction type */}
        <div className="flex items-center gap-3 p-4">
          <div className="text-muted-foreground shrink-0">
            {typeIcons[interaction.planned_follow_up_type] || <MessageSquare size={18} />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Planned Follow-up</p>
            <p className="text-sm font-medium text-foreground">
              {typeLabels[interaction.planned_follow_up_type] || interaction.planned_follow_up_type}
            </p>
          </div>
        </div>

        {/* Logged date */}
        <div className="flex items-center gap-3 p-4">
          <FileText size={18} className="text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Logged On</p>
            <p className="text-sm text-foreground">
              {format(parseISO(interaction.date), "MMM d, yyyy")}
            </p>
          </div>
        </div>

        {/* Note */}
        {interaction.note && (
          <div className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1.5">Note</p>
            <p className="text-sm text-foreground leading-relaxed">{interaction.note}</p>
          </div>
        )}
      </div>

      {/* Complete button */}
      {interaction.follow_up_date && (
        <Button
          onClick={() => completeTask.mutate()}
          disabled={completeTask.isPending}
          className="w-full h-12 font-medium gap-2"
        >
          <CheckCircle2 size={18} />
          {completeTask.isPending ? "Completing..." : "Mark as Complete"}
        </Button>
      )}
    </div>
  );
};

export default FollowupTask;
