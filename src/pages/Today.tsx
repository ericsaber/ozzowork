import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FollowupCard from "@/components/FollowupCard";
import CompleteFollowupSheet from "@/components/CompleteFollowupSheet";
import { useCompleteTask } from "@/hooks/useCompleteTask";
import { format, addDays, parseISO } from "date-fns";
import { Calendar, Eye } from "lucide-react";

const Today = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const windowEnd = format(addDays(new Date(), 14), "yyyy-MM-dd");

  const { target, sheetOpen, startComplete, handleSheetClose } = useCompleteTask({
    onCompleted: () => {
      queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["task-records"] });
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["task-records-today"],
    queryFn: async () => {
      const { data, error } = await supabase.from("task_records" as any)
        .select("*, contacts(*)")
        .eq("status", "active")
        .not("planned_follow_up_date", "is", null)
        .is('related_task_record_id', null)
        .lte("planned_follow_up_date", windowEnd)
        .order("planned_follow_up_date", { ascending: true });
      if (error) throw error;
      const records = data as any[];

      const overdue: any[] = [];
      const dueToday: any[] = [];
      const comingUp: any[] = [];
      const seenComing = new Set<string>();

      for (const item of records || []) {
        const d = item.planned_follow_up_date;
        if (d < today) overdue.push(item);
        else if (d === today) dueToday.push(item);
        else if (!seenComing.has(item.contact_id)) {
          seenComing.add(item.contact_id);
          comingUp.push(item);
        }
      }
      overdue.sort((a: any, b: any) => a.planned_follow_up_date.localeCompare(b.planned_follow_up_date));
      dueToday.sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      return { overdue, dueToday, comingUp };
    },
  });

  const { overdue = [], dueToday = [], comingUp = [] } = data || {};
  const isEmpty = overdue.length === 0 && dueToday.length === 0;
  const attentionCount = overdue.length + dueToday.length;

  const handleComplete = (item: any) => {
    const contactName = item.contacts ? `${item.contacts.first_name} ${item.contacts.last_name}`.trim() : "Unknown";
    startComplete({
      taskRecordId: item.id,
      contactId: item.contact_id,
      contactName,
      followUpType: item.planned_follow_up_type || "",
      userId: item.user_id,
      hasInteraction: !!(item.connect_type || item.note),
    });
  };

  const renderCard = (item: any, variant: "overdue" | "today") => (
    <FollowupCard
      key={item.id}
      taskRecordId={item.id}
      contactId={item.contact_id}
      name={item.contacts ? `${item.contacts.first_name} ${item.contacts.last_name}`.trim() : "Unknown"}
      company={item.contacts?.company}
      dueDate={item.planned_follow_up_date}
      plannedType={item.planned_follow_up_type || ""}
      connectType={item.connect_type}
      connectDate={item.connect_date}
      note={item.note}
      variant={variant}
      onComplete={() => handleComplete(item)}
    />
  );

  const renderComingUp = () => {
    if (comingUp.length === 0) {
      return (
        <div className="w-full bg-card rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="w-[26px] h-[26px] flex items-center justify-center shrink-0"><Calendar size={16} className="text-muted-foreground" /></div>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: '20px' }}>No follow-ups in the next 2 weeks</p>
            <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: '16px' }}>You're all caught up</p>
          </div>
        </div>
      );
    }

    const sorted = [...comingUp].sort((a, b) => a.planned_follow_up_date.localeCompare(b.planned_follow_up_date));
    const next = sorted[0];
    const nextName = next.contacts ? `${next.contacts.first_name} ${next.contacts.last_name}`.trim() : "Unknown";
    const nextDate = parseISO(next.planned_follow_up_date);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = format(nextDate, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd");
    const dayLabel = isTomorrow ? "tomorrow" : format(nextDate, "EEEE");

    return (
      <button onClick={() => navigate("/upcoming")} className="w-full bg-card rounded-lg border border-border p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
        <div className="w-[26px] h-[26px] flex items-center justify-center shrink-0"><Calendar size={16} className="text-muted-foreground" /></div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium text-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: '20px' }}>{comingUp.length} follow-up{comingUp.length !== 1 ? "s" : ""}</p>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: '16px' }}>Next: {nextName} {isTomorrow ? "tomorrow" : `on ${dayLabel}`}</p>
        </div>
        <span className="inline-flex items-center gap-1 bg-[#f5ede7] text-primary font-medium rounded-[20px] px-2.5 py-1 shrink-0" style={{ fontSize: '14px', lineHeight: '20px' }}><Eye size={16} />See all</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-heading text-foreground mb-1">Today</h1>
      <p className="text-muted-foreground mb-6" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: '20px' }}>
        {format(new Date(), "EEEE, MMMM d")}
        {!isLoading && attentionCount > 0 && <span> · {attentionCount} need attention</span>}
      </p>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-secondary animate-pulse" />)}</div>
      ) : (
        <div>
          {isEmpty ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg font-heading italic">All clear for today</p>
              <p className="text-sm text-muted-foreground mt-1">No follow-ups due. Nice work.</p>
            </div>
          ) : (
            <>
              {dueToday.length > 0 && (
                <section>
                  <h2 className="font-medium uppercase tracking-[0.1em] mt-2 mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', lineHeight: '16px', color: '#999' }}>Due Today</h2>
                  <div className="space-y-3">{dueToday.map((item: any) => renderCard(item, "today"))}</div>
                </section>
              )}

              {overdue.length > 0 && (
                <section>
                  <h2 className="font-medium uppercase tracking-[0.1em] mt-10 mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', lineHeight: '16px', color: '#999' }}>Overdue</h2>
                  <div className="space-y-3">{overdue.map((item: any) => renderCard(item, "overdue"))}</div>
                </section>
              )}
            </>
          )}

          <section>
            <h2 className="font-medium uppercase tracking-[0.1em] mt-10 mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', lineHeight: '16px', color: '#999' }}>Coming Up</h2>
            {renderComingUp()}
          </section>
        </div>
      )}

      {target && (
        <CompleteFollowupSheet open={sheetOpen} onOpenChange={handleSheetClose} taskRecordId={target.taskRecordId} contactId={target.contactId} contactName={target.contactName} followUpType={target.followUpType} userId={target.userId} hasInteraction={target.hasInteraction} />
      )}
    </div>
  );
};

export default Today;