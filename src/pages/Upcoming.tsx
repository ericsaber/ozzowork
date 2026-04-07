import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, addDays } from "date-fns";
import { ArrowLeft } from "lucide-react";
import FollowupCard from "@/components/FollowupCard";
import CompleteFollowupSheet from "@/components/CompleteFollowupSheet";
import EditFollowupSheet from "@/components/EditFollowupSheet";
import LogInteractionSheet from "@/components/LogInteractionSheet";
import LastInteractionSheet from "@/components/LastInteractionSheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Upcoming = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const [completeTarget, setCompleteTarget] = useState<{
    followUpId: string;
    contactId: string;
    contactName: string;
    plannedType: string | null;
  } | null>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [cancelTarget, setCancelTarget] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [cancelLogContactId, setCancelLogContactId] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ contactId: string; contactName: string } | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["follow-ups-upcoming"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*, contacts(*)")
        .eq("status", "active")
        .gt("planned_date", today)
        .order("planned_date", { ascending: true });
      if (error) throw error;
      console.log("[Upcoming] follow_ups fetched:", data?.length);
      const seen = new Set<string>();
      return (data || []).filter((item: any) => {
        if (seen.has(item.contact_id)) return false;
        seen.add(item.contact_id);
        return true;
      });
    },
  });

  const contactIds = (items || []).map((f: any) => f.contact_id);

  const { data: contactsWithInteractions } = useQuery({
    queryKey: ["contacts-with-interactions-upcoming", contactIds],
    queryFn: async () => {
      if (contactIds.length === 0) return [];
      const { data, error } = await supabase
        .from("interactions")
        .select("contact_id")
        .in("contact_id", contactIds)
        .eq("status", "published")
        .limit(1000);
      if (error) throw error;
      console.log("[Upcoming] contacts-with-interactions fetched:", data?.length);
      return [...new Set(data.map((r: any) => r.contact_id))];
    },
    enabled: contactIds.length > 0,
  });
  const hasInteractionsSet = new Set(contactsWithInteractions || []);

  const cancelFollowUpMutation = useMutation({
    mutationFn: async (followUpId: string) => {
      const { error } = await supabase
        .from("follow_ups")
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", followUpId);
      if (error) throw error;
      console.log("[Upcoming] follow_up cancelled:", followUpId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups-upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["follow-ups-today"] });
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      setShowCancelDialog(false);
      setCancelTarget(null);
    },
    onError: (e: any) => console.error("[Upcoming] cancel error:", e),
  });

  return (
    <div className="min-h-screen pb-24 px-8 pt-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
        <ArrowLeft size={18} /><span className="text-sm">Back</span>
      </button>
      <h1 className="text-2xl font-heading text-foreground mb-6">Upcoming</h1>
      {isLoading ? (
        <div className="space-y-6">{[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-lg bg-secondary animate-pulse" />)}</div>
      ) : items && items.length > 0 ? (
        <div className="space-y-6">
          {items.map((item: any) => {
            const name = item.contacts ? `${item.contacts.first_name} ${item.contacts.last_name}`.trim() : "Unknown";
            return (
              <FollowupCard
                key={item.id}
                taskRecordId={item.id}
                contactId={item.contact_id}
                name={name}
                company={item.contacts?.company || null}
                dueDate={item.planned_date}
                plannedType={item.planned_type || null}
                reminderNote={item.reminder_note || null}
                variant="upcoming"
                contactPhone={item.contacts?.phone ?? null}
                contactEmail={item.contacts?.email ?? null}
                menuOpen={openMenuId === item.id}
                onMenuOpenChange={(o) => setOpenMenuId(o ? item.id : null)}
                hasInteractions={hasInteractionsSet.has(item.contact_id)}
                onHistoryTap={() => setHistoryTarget({ contactId: item.contact_id, contactName: name })}
                onComplete={() => setCompleteTarget({
                  followUpId: item.id,
                  contactId: item.contact_id,
                  contactName: name,
                  plannedType: item.planned_type || null,
                })}
                onEdit={() => { setOpenMenuId(null); setEditTarget(item); }}
                onCancel={() => { setOpenMenuId(null); setCancelTarget(item); setShowCancelDialog(true); }}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-12">No upcoming follow-ups.</p>
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
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                if (cancelTarget) {
                  setCancelLogContactId(cancelTarget.contact_id);
                  cancelFollowUpMutation.mutate(cancelTarget.id);
                }
              }}
              className="w-full"
              style={{ fontFamily: "var(--font-body)" }}
            >
              Cancel and log what happened
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => { if (cancelTarget) cancelFollowUpMutation.mutate(cancelTarget.id); }}
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

export default Upcoming;
