import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FollowupCard from "@/components/FollowupCard";
import CompleteFollowupSheet from "@/components/CompleteFollowupSheet";
import { format, endOfWeek, parseISO } from "date-fns";
import { Calendar, Eye } from "lucide-react";

interface CompletingItem {
  id: string;
  contactId: string;
  contactName: string;
  interactionType: string;
  userId: string;
}

const Today = () => {
  const navigate = useNavigate();
  const today = format(new Date(), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data, isLoading } = useQuery({
    queryKey: ["followups-today"],
    queryFn: async () => {
      const { data: interactions, error } = await supabase
        .from("interactions")
        .select("*, contacts(*)")
        .not("follow_up_date", "is", null)
        .lte("follow_up_date", weekEnd)
        .order("follow_up_date", { ascending: true });

      if (error) throw error;

      const overdue: any[] = [];
      const dueToday: any[] = [];
      const comingUp: any[] = [];
      const seen = { overdue: new Set<string>(), today: new Set<string>(), coming: new Set<string>() };

      for (const item of interactions || []) {
        const d = item.follow_up_date!;
        if (d < today) {
          if (!seen.overdue.has(item.contact_id)) {
            seen.overdue.add(item.contact_id);
            overdue.push(item);
          }
        } else if (d === today) {
          if (!seen.today.has(item.contact_id)) {
            seen.today.add(item.contact_id);
            dueToday.push(item);
          }
        } else {
          if (!seen.coming.has(item.contact_id)) {
            seen.coming.add(item.contact_id);
            comingUp.push(item);
          }
        }
      }

      return { overdue, dueToday, comingUp };
    },
  });

  const [completingId, setCompletingId] = useState<string | null>(null);
  const [sheetItem, setSheetItem] = useState<CompletingItem | null>(null);

  const handleComplete = (item: any) => {
    setCompletingId(item.id);
    setTimeout(() => {
      setSheetItem({
        id: item.id,
        contactId: item.contact_id,
        contactName: item.contacts
          ? `${item.contacts.first_name} ${item.contacts.last_name}`.trim()
          : "Unknown",
        interactionType: item.type,
        userId: item.user_id,
      });
    }, 600);
  };

  const handleSheetClose = (open: boolean) => {
    if (!open) {
      setSheetItem(null);
      setCompletingId(null);
    }
  };

  const { overdue = [], dueToday = [], comingUp = [] } = data || {};
  const isEmpty = overdue.length === 0 && dueToday.length === 0 && comingUp.length === 0;
  const attentionCount = overdue.length + dueToday.length;

  const renderCard = (item: any, variant: "overdue" | "today") => (
    <FollowupCard
      key={item.id}
      interactionId={item.id}
      contactId={item.contact_id}
      name={item.contacts ? `${item.contacts.first_name} ${item.contacts.last_name}`.trim() : "Unknown"}
      company={item.contacts?.company}
      lastNote={item.note}
      followUpDate={item.follow_up_date}
      interactionType={item.type}
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
            const sorted = [...comingUp].sort((a, b) => a.follow_up_date!.localeCompare(b.follow_up_date!));
            const next = sorted[0];
            const nextName = next.contacts ? `${next.contacts.first_name} ${next.contacts.last_name}`.trim() : "Unknown";
            const nextDate = parseISO(next.follow_up_date!);
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

      {sheetItem && (
        <CompleteFollowupSheet
          open={!!sheetItem}
          onOpenChange={handleSheetClose}
          interactionId={sheetItem.id}
          contactId={sheetItem.contactId}
          contactName={sheetItem.contactName}
          interactionType={sheetItem.interactionType}
          userId={sheetItem.userId}
        />
      )}
    </div>
  );
};

export default Today;
