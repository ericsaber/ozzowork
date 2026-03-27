import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Phone, Mail, MessageSquare, Users, Video,
  MoreHorizontal, Pencil, Clock, ArrowRight, RotateCcw, Calendar as CalendarIcon, ClipboardList, X,
} from "lucide-react";
import { format, parseISO, formatDistanceToNow, isPast, isToday as isDateToday } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RescheduleSheet from "@/components/RescheduleSheet";
import CompleteFollowupSheet from "@/components/CompleteFollowupSheet";
import { useCompleteTask } from "@/hooks/useCompleteTask";
import { toast } from "sonner";

const typeIcons: Record<string, typeof Phone> = {
  call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video,
};
const typeLabels: Record<string, string> = {
  call: "Call", email: "Email", text: "Text", meet: "Meeting", video: "Video",
};

const InteractionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  console.log('[InteractionDetail] query key:', ['task-record', id]);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task-record", id],
    queryFn: async () => {
      console.log('[InteractionDetail] FETCHING task-record:', id);
      const { data, error } = await supabase.from("task_records" as any)
        .select("*, contacts(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      console.log('[InteractionDetail] fetched data:', { connect_type: (data as any).connect_type, note: (data as any).note, status: (data as any).status });
      console.log('[InteractionDetail] connect_date raw:', (data as any).connect_date);
      return data as any;
    },
    enabled: !!id,
  });

  const undoCompleteMutation = useMutation({
    mutationFn: async () => {
      console.log('[InteractionDetail] undo complete triggered:', { taskRecordId: id });
      try {
        const { error } = await supabase.from("task_records" as any)
          .update({ status: "active", completed_at: null })
          .eq("id", id!);
        if (error) throw error;
      } catch (error) {
        console.log('[InteractionDetail] undo complete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-record", id] });
      queryClient.invalidateQueries({ queryKey: ["task-records"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-upcoming"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Active followup check — for undo gating
  const { data: activeFollowup } = useQuery({
    queryKey: ["active-followup-check", task?.contact_id, task?.completed_at],
    queryFn: async () => {
      if (!task?.contact_id) return null;
      let query = supabase
        .from("task_records" as any)
        .select("id")
        .eq("contact_id", task.contact_id)
        .eq("status", "active")
        .not("planned_follow_up_date", "is", null)
        .is('related_task_record_id', null)
        .neq("id", id!)
        .limit(1);

      // Updated undo gating: if completed, only find followups created after completion
      if (task.status === 'completed' && task.completed_at) {
        query = query.gt('created_at', task.completed_at);
      }

      const { data } = await query.maybeSingle();
      console.log("[InteractionDetail] active followup check:", {
        contactId: task.contact_id,
        hasActiveFollowup: !!data,
        activeFollowupId: (data as any)?.id,
      });
      console.log('[InteractionDetail] activeFollowup after fix:', { activeFollowupId: (data as any)?.id, related_task_record_id: (data as any)?.related_task_record_id });
      return data as any;
    },
    enabled: !!task?.contact_id,
  });

  const hasOtherActiveFollowup = !!activeFollowup;

  const undoCancelMutation = useMutation({
    mutationFn: async () => {
      console.log("[InteractionDetail] undo cancel:", id);
      const { error } = await supabase
        .from("task_records" as any)
        .update({ status: "active", completed_at: null })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-record", id] });
      queryClient.invalidateQueries({ queryKey: ["task-records"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["active-followup-check"] });
      toast.success("Follow-up reactivated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Cancel mutation for active coins
  const cancelMutation = useMutation({
    mutationFn: async () => {
      console.log("[InteractionDetail] cancel follow-up:", id);
      const { error } = await supabase
        .from("task_records" as any)
        .update({ status: "cancelled", completed_at: new Date().toISOString() })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-record", id] });
      queryClient.invalidateQueries({ queryKey: ["task-records"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-upcoming"] });
      toast.success("Follow-up cancelled");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { target, sheetOpen, startComplete, handleSheetClose } = useCompleteTask({
    onCompleted: () => {
      queryClient.invalidateQueries({ queryKey: ["task-record", id] });
      queryClient.invalidateQueries({ queryKey: ["task-records"] });
      queryClient.invalidateQueries({ queryKey: ["latest-interaction", task?.contact_id] });
      navigate(`/contact/${task?.contact_id}`);
    },
  });

  // State determination
  const isActive = task ? task.status === 'active' && task.planned_follow_up_date && !task.related_task_record_id : false;
  const isHistorical = task ? !isActive : false;

  // Latest interaction query (contact-level) — only for active non-tails coins
  const { data: latestInteraction } = useQuery({
    queryKey: ["latest-interaction", task?.contact_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_records" as any)
        .select("*")
        .eq("contact_id", task!.contact_id)
      .not("connect_type", "is", null)
      .order("connect_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      console.log('[InteractionDetail] latestInteraction:', data);
      return data as any;
    },
    enabled: !!task?.contact_id && !!isActive,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
        <div className="h-8 w-20 bg-secondary animate-pulse rounded mb-6" />
        <div className="space-y-4"><div className="h-24 bg-secondary animate-pulse rounded-lg" /></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft size={18} /><span className="text-sm" style={{ fontFamily: "var(--font-body)" }}>Back</span>
        </button>
        <p className="text-muted-foreground text-center py-16">Record not found</p>
      </div>
    );
  }

  const contact = task.contacts;
  const contactName = contact ? `${contact.first_name} ${contact.last_name}`.trim() : "Unknown";
  const initials = contactName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  console.log('[InteractionDetail] task data:', { connect_type: task.connect_type, note: task.note, hasInteraction: !!(task.connect_type || task.note) });

  const dueDate = task.planned_follow_up_date ? parseISO(task.planned_follow_up_date) : null;
  const overdue = dueDate ? isPast(dueDate) && !isDateToday(dueDate) : false;
  const FollowUpIcon = task.planned_follow_up_type ? typeIcons[task.planned_follow_up_type] : null;

  const getDaysLabel = () => {
    if (!dueDate) return "";
    const todayMidnight = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const diffMs = todayMidnight.getTime() - dueMidnight.getTime();
    const diffDays = Math.round(diffMs / 86400000);
    if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? "s" : ""} overdue`;
    if (diffDays === 0) return "Due today";
    const ahead = Math.abs(diffDays);
    return `In ${ahead} day${ahead !== 1 ? "s" : ""}`;
  };

  const handleLogFollowUp = () => {
    if (task && contact) {
      startComplete({
        taskRecordId: task.id,
        contactId: task.contact_id,
        contactName,
        followUpType: task.planned_follow_up_type || "",
        userId: task.user_id,
        hasInteraction: !!(task.connect_type || task.note),
      });
    }
  };

  // For WHAT HAPPENED on active coins, use latestInteraction; for historical, use task itself
  const interactionData = isActive ? latestInteraction : task;
  const hasInteractionData = interactionData && (interactionData.connect_type || interactionData.note);
  const ConnectIcon = interactionData?.connect_type ? typeIcons[interactionData.connect_type] : null;

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
      {/* Nav bar */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground">
          <ArrowLeft size={18} />
          <span className="text-sm" style={{ fontFamily: "var(--font-body)" }}>Back</span>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-9 h-9 rounded-full flex items-center justify-center border-[1.5px] border-border" style={{ background: "#f0ede8" }}>
              <MoreHorizontal size={16} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuItem onClick={() => navigate(`/edit-task/${id}`)}>
              <Pencil size={14} className="mr-2" /> Edit
            </DropdownMenuItem>
            {isActive && (
              <DropdownMenuItem onClick={() => setRescheduleOpen(true)}>
                <Clock size={14} className="mr-2" /> Reschedule
              </DropdownMenuItem>
            )}
            {task.status === 'completed' && !hasOtherActiveFollowup && (
              <DropdownMenuItem onClick={() => undoCompleteMutation.mutate()}>
                <RotateCcw size={14} className="mr-2" /> Undo complete
              </DropdownMenuItem>
            )}
            {task.status === "cancelled" && !hasOtherActiveFollowup && (
              <DropdownMenuItem onClick={() => undoCancelMutation.mutate()}>
                <RotateCcw size={14} className="mr-2" /> Undo cancel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Contact header */}
      <button onClick={() => contact && navigate(`/contact/${contact.id}`)} className="flex items-center gap-3 mb-5 hover:opacity-80 transition-opacity">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <span className="text-sm font-semibold text-secondary-foreground">{initials}</span>
        </div>
        <div className="text-left">
          <p className="font-medium text-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "16px" }}>{contactName}</p>
          {contact?.company && (
            <p className="text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "12px" }}>{contact.company}</p>
          )}
        </div>
      </button>

      {/* Task record card */}
      <div className="rounded-[12px] bg-card border border-border overflow-hidden" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}>

        {/* WHAT HAPPENED — shown for active (non-tails) and historical */}
        {((isActive && latestInteraction) || isHistorical) && (
          <div className="px-4 py-3">
            <p className="font-medium uppercase mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "0.08em", color: "#999" }}>
              What happened
            </p>
            {hasInteractionData ? (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "#f0ede8" }}>
                  {ConnectIcon ? <ConnectIcon size={14} className="text-muted-foreground" /> : <ClipboardList size={14} className="text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "15px", lineHeight: "20px" }}>
                    {interactionData.connect_type ? (typeLabels[interactionData.connect_type] || interactionData.connect_type) : "Interacted"}
                  </p>
                  {interactionData.connect_date && (
                    <p className="text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: "16px" }}>
                      {format(parseISO(interactionData.connect_date), "MMM d")} · {formatDistanceToNow(parseISO(interactionData.connect_date), { addSuffix: false })} ago
                    </p>
                  )}
                  {interactionData.note && (
                    <p className="mt-1 italic" style={{ fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: "18px", color: "#6b6b67" }}>
                      {interactionData.note}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}>
                No interaction logged.
              </p>
            )}
          </div>
        )}

        {/* Divider — only for active non-tails coins */}
        {isActive && latestInteraction && (
          <div className="relative px-4">
            <div className="border-t border-border" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2">
              <ArrowRight size={12} style={{ color: "#9e9e99" }} />
            </div>
          </div>
        )}

        {/* WHAT'S NEXT — only for active coins (including tails-only) */}
        {isActive && (
          <div className="px-4 py-3">
            <p className="font-medium uppercase mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "11px", letterSpacing: "0.08em", color: "#999" }}>
              What's next
            </p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: overdue ? "#fce8e8" : "#f5ede7" }}>
                {FollowUpIcon ? <FollowUpIcon size={14} style={{ color: overdue ? "#a32d2d" : "#c8622a" }} /> : (
                  <CalendarIcon size={14} style={{ color: overdue ? "#a32d2d" : "#c8622a" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium" style={{ fontFamily: "var(--font-body)", fontSize: "15px", lineHeight: "20px", color: overdue ? "#a32d2d" : "#c8622a" }}>
                  {task.planned_follow_up_type ? (typeLabels[task.planned_follow_up_type] || task.planned_follow_up_type) : "Follow-up"}
                </p>
                <p className="text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: "16px" }}>
                  {dueDate ? (overdue ? `Was due ${format(dueDate, "MMM d")}` : `Due ${format(dueDate, "MMM d")}`) : "No date set"}
                </p>
                {dueDate && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 mt-1" style={{
                    fontSize: "12px", fontWeight: 500, fontFamily: "var(--font-body)",
                    background: overdue ? "#fce8e8" : "#e9f2eb",
                    color: overdue ? "#a32d2d" : "#3d7a4a",
                  }}>
                    {getDaysLabel()}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CTAs — only for active coins */}
      {isActive && (
        <div className="mt-4 space-y-3">
          <button onClick={handleLogFollowUp} className="w-full rounded-[12px] py-[13px] text-[14px] font-semibold text-white shadow-md" style={{ background: overdue ? "#a32d2d" : "#c8622a", fontFamily: "var(--font-body)" }}>
            Complete follow-up
          </button>
          <div className="flex gap-3">
            <button onClick={() => setRescheduleOpen(true)} className="flex-1 rounded-[12px] border border-border py-[13px] text-[14px] font-medium text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
              Reschedule
            </button>
            <button onClick={() => cancelMutation.mutate()} className="flex-1 rounded-[12px] border border-border py-[13px] text-[14px] font-medium text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {task && isActive && (
        <RescheduleSheet open={rescheduleOpen} onOpenChange={setRescheduleOpen} taskRecordId={task.id} contactName={contactName} currentType={task.planned_follow_up_type} dueDate={task.planned_follow_up_date} contactId={task.contact_id} />
      )}
      {target && (
        <CompleteFollowupSheet open={sheetOpen} onOpenChange={handleSheetClose} taskRecordId={target.taskRecordId} contactId={target.contactId} contactName={target.contactName} followUpType={target.followUpType} userId={target.userId} hasInteraction={target.hasInteraction} />
      )}
    </div>
  );
};

export default InteractionDetail;
