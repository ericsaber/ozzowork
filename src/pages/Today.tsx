import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import FollowupCard from "@/components/FollowupCard";
import CompleteFollowupSheet from "@/components/CompleteFollowupSheet";

import LogInteractionSheet from "@/components/LogInteractionSheet";
import LastInteractionSheet from "@/components/LastInteractionSheet";
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
  
  const [cancelTarget, setCancelTarget] = useState<any | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelLogContactId, setCancelLogContactId] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ contactId: string; contactName: string } | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const kb = window.innerHeight - vv.height;
      setKeyboardHeight(kb > 0 ? kb : 0);
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  const { data: contactsWithInteractions } = useQuery({
    queryKey: ["contacts-with-interactions", contactIds],
    queryFn: async () => {
      if (contactIds.length === 0) return [];
      const { data, error } = await supabase
        .from("interactions")
        .select("contact_id")
        .in("contact_id", contactIds)
        .eq("status", "published")
        .limit(1000);
      if (error) throw error;
      console.log("[Today] contacts-with-interactions fetched:", data?.length);
      return [...new Set(data.map((r: any) => r.contact_id))];
    },
    enabled: contactIds.length > 0,
  });
  const hasInteractionsSet = new Set(contactsWithInteractions || []);

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

  const renderCard = (item: any, variant: "overdue" | "today" | "upcoming") => {
    const contactName = item.contacts ? `${item.contacts.first_name} ${item.contacts.last_name}`.trim() : "Unknown";
    return (
      <FollowupCard
        scrollContainerRef={scrollContainerRef}
        key={item.id}
        taskRecordId={item.id}
        contactId={item.contact_id}
        name={contactName}
        company={item.contacts?.company ?? null}
        dueDate={item.planned_date}
        plannedType={item.planned_type || null}
        reminderNote={item.reminder_note || null}
        variant={variant}
        contactPhone={item.contacts?.phone ?? null}
        contactEmail={item.contacts?.email ?? null}
        menuOpen={openMenuId === item.id}
        onMenuOpenChange={(o) => setOpenMenuId(o ? item.id : null)}
        
        onCancel={() => { setOpenMenuId(null); setCancelTarget(item); setShowCancelDialog(true); }}
        hasInteractions={hasInteractionsSet.has(item.contact_id)}
        onHistoryTap={() => setHistoryTarget({ contactId: item.contact_id, contactName })}
        isEditingExternal={editingCardId === item.id}
        onEditStart={() => setEditingCardId(item.id)}
        onEditEnd={() => setEditingCardId(null)}
        onComplete={() => {
          setCompleteTarget({
            followUpId: item.id,
            contactId: item.contact_id,
            contactName,
            plannedType: item.planned_type || null,
          });
        }}
      />
    );
  };

  const renderComingUp = () => {
    if (comingUp.length === 0) {
      return (
        <div className="w-full bg-card rounded-lg p-4 flex items-center gap-3" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.08)" }}>
          <div className="flex-1 min-w-0 text-left">
            <p className="font-medium text-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', lineHeight: '20px' }}>No follow-ups in the next 2 weeks</p>
            <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '16px' }}>You're all caught up</p>
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
      <button onClick={() => navigate("/upcoming")} className="w-full bg-card rounded-lg p-4 flex items-center gap-3" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.08)" }}>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium text-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '16px', lineHeight: '20px' }}>{comingUp.length} follow-up{comingUp.length !== 1 ? "s" : ""}</p>
          <p className="text-muted-foreground" style={{ fontFamily: 'var(--font-body)', fontSize: '14px', lineHeight: '16px' }}>Next: {nextName} {isTomorrow ? "tomorrow" : `on ${dayLabel}`}</p>
        </div>
        <span className="inline-flex items-center gap-1 bg-[#f5ede7] text-primary font-medium rounded-[20px] px-2.5 py-1 shrink-0" style={{ fontSize: '14px', lineHeight: '20px' }}><Eye size={16} />See all</span>
      </button>
    );
  };

  return (
    <div ref={scrollContainerRef} className="min-h-screen pb-24 px-8 pt-6 max-w-lg mx-auto" style={{ paddingBottom: Math.max(96, keyboardHeight) }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontFamily: "var(--font-body)", fontSize: "30px", fontWeight: 500, color: "#383838", lineHeight: "normal" }}>
          ozzo
        </span>
        <UserRound size={24} style={{ color: "#999" }} />
      </div>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "#71717a", marginBottom: "20px" }}>
        {format(new Date(), "EEEE, MMMM d")}
        {!isLoading && attentionCount > 0 && <span> · {attentionCount} need attention</span>}
      </p>

      {isLoading ? (
        <div className="space-y-6">{[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-lg bg-secondary animate-pulse" />)}</div>
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
                  <h2 className="font-medium uppercase tracking-[0.1em] mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: '16px', color: '#999' }}>Overdue</h2>
                  <div className="space-y-6 w-full">{overdue.map((item: any) => renderCard(item, "overdue"))}</div>
                </section>
              )}

              {dueToday.length > 0 && (
                <section>
                  <h2 className="font-medium uppercase tracking-[0.1em] mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: '16px', color: '#999' }}>Due Today</h2>
                  <div className="space-y-6 w-full">{dueToday.map((item: any) => renderCard(item, "today"))}</div>
                </section>
              )}
            </>
          )}

          <section>
            <h2 className="font-medium uppercase tracking-[0.1em] mb-3" style={{ fontFamily: 'var(--font-body)', fontSize: '12px', lineHeight: '16px', color: '#999' }}>Coming Up</h2>
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
                if (cancelTarget) {
                  setCancelLogContactId(cancelTarget.contact_id);
                  cancelFollowUpMutation.mutate();
                }
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
      <LogInteractionSheet
        open={!!cancelLogContactId}
        onOpenChange={(o) => { if (!o) setCancelLogContactId(null); }}
        preselectedContactId={cancelLogContactId}
        startStep={1}
        logOnly={true}
      />
      {historyTarget && (
        <LastInteractionSheet
          open={!!historyTarget}
          onOpenChange={(o) => { if (!o) setHistoryTarget(null); }}
          contactId={historyTarget.contactId}
          contactName={historyTarget.contactName}
        />
      )}
    </div>
  );
};

export default Today;
