import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FollowupCard from "@/components/FollowupCard";
import { format, endOfWeek, parseISO } from "date-fns";
import { Calendar, Eye } from "lucide-react";
import { toast } from "sonner";

const Today = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["followups-today"],
    queryFn: async () => {
      const { data: followUps, error } = await supabase
        .from("follow_ups")
        .select("*, contacts(*)")
        .eq("completed", false)
        .lte("due_date", weekEnd)
        .order("due_date", { ascending: true });

      if (error) throw error;

      const interactionIds = (followUps || [])
        .map((f: any) => f.interaction_id)
        .filter(Boolean);

      let interactionMap: Record<string, any> = {};
      if (interactionIds.length > 0) {
        const { data: interactions } = await supabase
          .from("interactions")
          .select("*")
          .in("id", interactionIds);
        if (interactions) {
          for (const i of interactions) {
            interactionMap[i.id] = i;
          }
        }
      }

      const overdue: any[] = [];
      const dueToday: any[] = [];
      const comingUp: any[] = [];
      const seenComing = new Set<string>();

      for (const item of followUps || []) {
        const enriched = {
          ...item,
          _interaction: item.interaction_id ? interactionMap[item.interaction_id] : null,
        };
        const d = item.due_date;
        if (d < today) {
          overdue.push(enriched);
        } else if (d === today) {
          dueToday.push(enriched);
        } else {
          if (!seenComing.has(item.contact_id)) {
            seenComing.add(item.contact_id);
            comingUp.push(enriched);
          }
        }
      }

      overdue.reverse();
      return { overdue, dueToday, comingUp };
    },
  });

  const [completingId, setCompletingId] = useState<string | null>(null);

  const completeMutation = useMutation({
    mutationFn: async (followUpId: string) => {
      const { error } = await supabase
        .from("follow_ups")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", followUpId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups-today"] });
      queryClient.invalidateQueries({ queryKey: ["followups-upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      toast.success("Follow-up completed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleComplete = (item: any) => {
    setCompletingId(item.id);
    completeMutation.mutate(item.id);
  };

  const { overdue = [], dueToday = [], comingUp = [] } = data || {};
  const isEmpty = overdue.length === 0 && dueToday.length === 0 && comingUp.length === 0;
  const attentionCount = overdue.length + dueToday.length;

  const renderCard = (item: any, variant: "overdue" | "today") => (
    <FollowupCard
      key={item.id}
      followUpId={item.id}
      contactId={item.contact_id}
      name={item.contacts ? `${item.contacts.first_name} ${item.contacts.last_name}`.trim() : "Unknown"}
      company={item.contacts?.company}
      lastNote={item._interaction?.note || null}
      dueDate={item.due_date}
      followUpType={item.follow_up_type}
      connectType={item._interaction?.connect_type || null}
      interactionDate={item._interaction?.date || item.created_at}
      variant={variant}
      isCompleting={completingId === item.id}
      onComplete={() => handleComplete(item)}
    />
  );

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-heading text-foreground mb-1">Today</h1>
      <p className="text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '20px' }}>
        {format(new Date(), "EEEE, MMMM d")}
        {!isLoading && attentionCount > 0 && (
          <span> · {attentionCount} need attention</span>
        )}
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg bg-secondary animate-pulse" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg font-heading italic">
            All clear for today
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            No follow-ups due. Nice work.
          </p>
        </div>
      ) : (
        <div>
          {/* Due Today */}
          {dueToday.length > 0 && (
            <section>
              <h2
                className="font-medium uppercase tracking-[0.1em] text-[#bbb] mt-2 mb-3"
                style={{ fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: '16px' }}
              >
                Due Today
              </h2>
              <div className="space-y-3">
                {dueToday.map((item: any) => renderCard(item, "today"))}
              </div>
            </section>
          )}

          {/* Coming Up strip */}
          {comingUp.length > 0 && (() => {
            const sorted = [...comingUp].sort((a, b) => a.due_date.localeCompare(b.due_date));
            const next = sorted[0];
            const nextName = next.contacts ? `${next.contacts.first_name} ${next.contacts.last_name}`.trim() : "Unknown";
            const nextDate = parseISO(next.due_date);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const isTomorrow = format(nextDate, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd");
            const dayLabel = isTomorrow ? "tomorrow" : format(nextDate, "EEEE");

            return (
              <>
                <h2
                  className="font-medium uppercase tracking-[0.1em] text-[#bbb] mt-10 mb-3"
                  style={{ fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: '16px' }}
                >
                  Coming Up
                </h2>
                <button
                  onClick={() => navigate("/upcoming")}
                  className="w-full bg-card rounded-lg border border-border p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-[26px] h-[26px] flex items-center justify-center shrink-0">
                    <Calendar size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '20px' }}>
                      {comingUp.length} follow-up{comingUp.length !== 1 ? "s" : ""} this week
                    </p>
                    <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: '16px' }}>
                      Next: {nextName} {isTomorrow ? "tomorrow" : `on ${dayLabel}`}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-[hsl(21,90%,96%)] text-primary font-medium rounded-[20px] px-2.5 py-1 shrink-0" style={{ fontSize: '14px', lineHeight: '20px' }}>
                    <Eye size={16} />
                    See all
                  </span>
                </button>
              </>
            );
          })()}

          {/* Overdue */}
          {overdue.length > 0 && (
            <section>
              <h2
                className="font-medium uppercase tracking-[0.1em] text-[#bbb] mt-10 mb-3"
                style={{ fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: '16px' }}
              >
                Overdue
              </h2>
              <div className="space-y-3">
                {overdue.map((item: any) => renderCard(item, "overdue"))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default Today;
