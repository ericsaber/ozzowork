import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FollowupCard from "@/components/FollowupCard";
import CompleteFollowupSheet from "@/components/CompleteFollowupSheet";
import EditFollowupSheet from "@/components/EditFollowupSheet";
import { format, addDays, parseISO } from "date-fns";
import { Calendar, Eye, UserRound } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Today = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const windowEnd = format(addDays(new Date(), 14), "yyyy-MM-dd");
  const [completeTarget, setCompleteTarget] = useState<{
    followUpId: string;
    contactId: string;
    contactName: string;
    plannedType: string | null;
  } | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: followUpsData, isLoading: followUpsLoading } = useQuery({
    queryKey: ["follow-ups-today"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*, contacts(*)")
        .eq("status", "active")
        .lte("planned_date", windowEnd)
        .order("planned_date", { ascending: true });
      if (error) throw error;
      console.log("[Today] follow_ups fetched:", data?.length);
      return data as any[];
    },
  });

  const contactIds = (followUpsData || []).map((f: any) => f.contact_id);

  const { data: interactionsData } = useQuery({
    queryKey: ["interactions-today", contactIds],
    queryFn: async () => {
      if (contactIds.length === 0) return [];
      const { data, error } = await supabase
        .from("interactions")
        .select("*")
        .in("contact_id", contactIds)
        .eq("status", "published")
        .order("connect_date", { ascending: false });
      if (error) throw error;
      console.log("[Today] interactions fetched:", data?.length);
      return data as any[];
    },
    enabled: contactIds.length > 0,
  });

  const lastInteractionByContact = (interactionsData || []).reduce(
    (acc: Record<string, any>, interaction: any) => {
      if (!acc[interaction.contact_id]) {
        acc[interaction.contact_id] = interaction;
      }
      return acc;
    },
    {}
  );

  const records = followUpsData || [];
  
  const overdue: any[] = [];
  const dueToday: any[] = [];
  const comingUp: any[] = [];
  const seenComing = new Set<string>();

  for (const item of records) {
    const d = item.planned_date;
    if (d < today) overdue.push(item);
    else if (d === today) dueToday.push(item);
    else if (!seenComing.has(item.contact_id)) {
      seenComing.add(item.contact_id);
      comingUp.push(item);
    }
  }

  overdue.sort((a: any, b: any) => a.planned_date.localeCompare(b.planned_date));
  dueToday.sort((a: any, b: any) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

  const cancelFollowUpMutation = useMutation({
    mutationFn: async () => {
      if (!cancelTarget) throw new Error("No target");
      const { error } = await supabase
        .from("follow_ups")
        .update({
          status: "cancelled",
          completed_at: new Date().toISOString(),
        })
        .eq("id", cancelTarget.id);
      if (error) throw error;
      console.log("[Today] follow_up cancelled:", cancelTarget.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups-today"] });
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["follow-ups-active"] });
      setCancelTarget(null);
      setShowCancelDialog(false);
    },
    onError: (e: any) => console.error("[Today] cancel error:", e),
  });

  const isLoading = followUpsLoading;
  const isEmpty = overdue.length === 0 && dueToday.length === 0;
  const attentionCount = overdue.length + dueToday.length;

  const renderCard = (item: any, variant: "overdue" | "today" | "upcoming") => (
    <FollowupCard
      key={item.id}
      taskRecordId={item.id}
      contactId={item.contact_id}
      name={item.contacts ? `${item.contacts.first_name} ${item.contacts.last_name}`.trim() : "Unknown"}
      company={item.contacts?.company ?? null}
      dueDate={item.planned_date}
      plannedType={item.planned_type || null}
      reminderNote={item.reminder_note || null}
      lastInteraction={lastInteractionByContact[item.contact_id] || null}
      variant={variant}
      contactPhone={item.contacts?.phone ?? null}
      contactEmail={item.contacts?.email ?? null}
      menuOpen={openMenuId === item.id}
      onMenuOpenChange={(o) => setOpenMenuId(o ? item.id : null)}
      onEdit={() => { setOpenMenuId(null); setEditTarget(item); }}
      onCancel={() => { setOpenMenuId(null); setCancelTarget(item); setShowCancelDialog(true); }}
      onComplete={() => {
        setCompleteTarget({
          followUpId: item.id,
          contactId: item.contact_id,
          contactName: item.contacts ? `${item.contacts.first_name} ${item.contacts.last_name}`.trim() : "Unknown",
          plannedType: item.planned_type || null,
        });
      }}
    />
  );

  const renderComingUp = () => {
    if (comingUp.length === 0) {
      return (
        <div className="w-full bg-card rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: '20px' }}>No follow-ups in the next 2 weeks</p>
            <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: '16px' }}>You're all caught up</p>
          </div>
        </div>
      );
    }

    const sorted = [...comingUp].sort((a, b) => a.planned_date.localeCompare(b.planned_date));
    const next = sorted[0];
    const nextName = next.contacts ? `${next.contacts.first_name} ${next.contacts.last_name}`.trim() : "Unknown";
    const nextDate = parseISO(next.planned_date);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = format(nextDate, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd");
    const dayLabel = isTomorrow ? "tomorrow" : format(nextDate, "EEEE");

    return (
      <button onClick={() => navigate("/upcoming")} className="w-full bg-card rounded-lg border border-border p-4 flex items-center gap-3 hover:bg-secondary/50 transition-colors">
        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium text-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '15px', lineHeight: '20px' }}>{comingUp.length} follow-up{comingUp.length !== 1 ? "s" : ""}</p>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: '16px' }}>Next: {nextName} {isTomorrow ? "tomorrow" : `on ${dayLabel}`}</p>
        </div>
        <span className="inline-flex items-center gap-1 bg-[#f5ede7] text-primary font-medium rounded-[20px] px-2.5 py-1 shrink-0" style={{ fontSize: '14px', lineHeight: '20px' }}><Eye size={16} />See all</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen pb-24 px-8 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "30px", fontWeight: 500, color: "#383838", lineHeight: "normal" }}>
          ozzo
        </span>
        <UserRound size={32} style={{ color: "#999" }} />
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#71717a", marginBottom: "20px" }}>
        {format(new Date(), "EEEE, MMMM d")}
        {!isLoading && attentionCount > 0 && <span> · {attentionCount} need attention</span>}
      </p>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-secondary animate-pulse" />)}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {isEmpty ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg font-heading italic">All clear for today</p>
              <p className="text-sm text-muted-foreground mt-1">No follow-ups due. Nice work.</p>
            </div>
          ) : (
            <>
              {overdue.length > 0 && (
                <section>
                  <h2 className="font-medium uppercase tracking-[0.1em] mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', lineHeight: '16px', color: '#999' }}>Overdue</h2>
                  <div className="space-y-5 w-full">{overdue.map((item: any) => renderCard(item, "overdue"))}</div>
                </section>
              )}

              {dueToday.length > 0 && (
                <section>
                  <h2 className="font-medium uppercase tracking-[0.1em] mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', lineHeight: '16px', color: '#999' }}>Due Today</h2>
                  <div className="space-y-5 w-full">{dueToday.map((item: any) => renderCard(item, "today"))}</div>
                </section>
              )}
            </>
          )}

          <section>
            <h2 className="font-medium uppercase tracking-[0.1em] mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: '11px', lineHeight: '16px', color: '#999' }}>Coming Up</h2>
            {renderComingUp()}
          </section>
        </div>
      )}
      {completeTarget && (
        <CompleteFollowupSheet
          open={!!completeTarget}
          onOpenChange={(o) => { if (!o) setCompleteTarget(null); }}
          followUpId={completeTarget.followUpId}
          contactId={completeTarget.contactId}
          contactName={completeTarget.contactName}
          plannedType={completeTarget.plannedType}
          userId=""
        />
      )}
      {editTarget && (
        <EditFollowupSheet
          open={!!editTarget}
          onOpenChange={(o) => { if (!o) setEditTarget(null); }}
          followUp={{
            id: editTarget.id,
            planned_type: editTarget.planned_type || null,
            planned_date: editTarget.planned_date,
            reminder_note: editTarget.reminder_note || null,
            created_at: editTarget.created_at,
            contact_id: editTarget.contact_id,
          }}
        />
      )}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this follow-up?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be recorded as cancelled in their history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
            <AlertDialogAction
              onClick={() => {
                // TODO: route to log flow then cancel on save
                cancelFollowUpMutation.mutate();
              }}
              className="w-full"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Cancel and log what happened
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => cancelFollowUpMutation.mutate()}
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Yes, cancel
            </AlertDialogAction>
            <AlertDialogCancel
              onClick={() => { setShowCancelDialog(false); setCancelTarget(null); }}
              className="w-full"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Don't cancel
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Today;
