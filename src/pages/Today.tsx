import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FollowupCard from "@/components/FollowupCard";
import CompleteFollowupSheet from "@/components/CompleteFollowupSheet";
import { format, endOfWeek, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";

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

      // Dedupe by contact_id per bucket
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
    // After animation delay, open sheet
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
      <p className="text-sm text-muted-foreground mb-6">
        {format(new Date(), "EEEE, MMMM d")}
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
        <div className="space-y-6">
          {overdue.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-destructive mb-3">
                Overdue
              </h2>
              <div className="space-y-3">
                {overdue.map((item: any) => renderCard(item, "overdue"))}
              </div>
            </section>
          )}

          {dueToday.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-success mb-3">
                Due Today
              </h2>
              <div className="space-y-3">
                {dueToday.map((item: any) => renderCard(item, "today"))}
              </div>
            </section>
          )}

          {comingUp.length > 0 && (
            <button
              onClick={() => navigate("/upcoming")}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground hover:bg-secondary transition-colors"
            >
              <span>{comingUp.length} more this week</span>
              <ChevronRight size={16} />
            </button>
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
