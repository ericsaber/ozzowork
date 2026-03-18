import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Phone, Mail, MessageSquare, Users, Video,
  MoreHorizontal, Pencil, Clock, ArrowRight, RotateCcw, Calendar as CalendarIcon,
} from "lucide-react";
import { format, parseISO, formatDistanceToNow, isPast, isToday as isDateToday } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RescheduleSheet from "@/components/RescheduleSheet";
import ScheduleFollowupSheet from "@/components/ScheduleFollowupSheet";
import CompleteFollowupSheet from "@/components/CompleteFollowupSheet";
import LogInteractionSheet from "@/components/LogInteractionSheet";
import { useCompleteTask } from "@/hooks/useCompleteTask";

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
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [logSheetOpen, setLogSheetOpen] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ["task-record", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("task_records" as any)
        .select("*, contacts(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  const undoCompleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("task_records" as any)
        .update({ status: "active", completed_at: null })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-record", id] });
      queryClient.invalidateQueries({ queryKey: ["task-records"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-upcoming"] });
    },
  });

  const { target, sheetOpen, startComplete, handleSheetClose } = useCompleteTask({
    onCompleted: () => {
      queryClient.invalidateQueries({ queryKey: ["task-record", id] });
      queryClient.invalidateQueries({ queryKey: ["task-records"] });
    },
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
  const hasInteraction = !!task.connect_type;
  const isCompleted = task.status === "completed";
  const hasFollowUp = !!task.planned_follow_up_type || !!task.planned_follow_up_date;
  
  const showBottomBar = hasFollowUp && !isCompleted;

  const dueDate = task.planned_follow_up_date ? parseISO(task.planned_follow_up_date) : null;
  const overdue = dueDate && !isCompleted ? isPast(dueDate) && !isDateToday(dueDate) : false;
  const dueDateIsToday = dueDate ? isDateToday(dueDate) : false;

  const ConnectIcon = task.connect_type ? typeIcons[task.connect_type] : null;
  const FollowUpIcon = task.planned_follow_up_type ? typeIcons[task.planned_follow_up_type] : null;

  const handleLogFollowUp = () => {
    if (task && contact) {
      startComplete({
        taskRecordId: task.id,
        contactId: task.contact_id,
        contactName,
        followUpType: task.planned_follow_up_type || "",
        userId: task.user_id,
        hasInteraction,
      });
    }
  };

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
            {hasFollowUp && !isCompleted && (
              <DropdownMenuItem onClick={() => setRescheduleOpen(true)}>
                <Clock size={14} className="mr-2" /> Reschedule
              </DropdownMenuItem>
            )}
            {isCompleted && (
              <DropdownMenuItem onClick={() => undoCompleteMutation.mutate()}>
                <RotateCcw size={14} className="mr-2" /> Undo complete
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
        {/* WHAT HAPPENED */}
        <div className="px-4 py-3">
          <p className="font-medium uppercase mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "10px", letterSpacing: "0.08em", color: "#9e9e99" }}>
            What happened
          </p>
          {hasInteraction ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: "#f0ede8" }}>
                {ConnectIcon && <ConnectIcon size={14} className="text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: "20px" }}>
                  {typeLabels[task.connect_type] || task.connect_type}
                </p>
                <p className="text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "12px", lineHeight: "16px" }}>
                  {task.connect_date ? `${format(parseISO(task.connect_date), "MMM d")} · ${formatDistanceToNow(parseISO(task.connect_date), { addSuffix: false })} ago` : ""}
                </p>
                {task.note && (
                  <p className="mt-1 italic" style={{ fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: "18px", color: "#6b6b67" }}>
                    {task.note}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "#7a746c" }}>
              No interaction logged.{" "}
              <button onClick={() => setLogSheetOpen(true)} className="underline font-medium" style={{ color: "#c8622a" }}>
                Want to add one?
              </button>
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="relative px-4">
          <div className="border-t border-border" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2">
            <ArrowRight size={12} style={{ color: "#9e9e99" }} />
          </div>
        </div>

        {/* WHAT'S NEXT */}
        <div className="px-4 py-3">
          <p className="font-medium uppercase mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "10px", letterSpacing: "0.08em", color: "#9e9e99" }}>
            What's next
          </p>
          {hasFollowUp ? (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0" style={{ background: isCompleted ? "#e9f2eb" : overdue ? "#fce8e8" : "#f5ede7" }}>
                {FollowUpIcon ? <FollowUpIcon size={14} style={{ color: isCompleted ? "#3d7a4a" : overdue ? "#a32d2d" : "#c8622a" }} /> : (
                  <span style={{ fontSize: "10px", fontWeight: 600, color: isCompleted ? "#3d7a4a" : overdue ? "#a32d2d" : "#c8622a", fontFamily: "var(--font-body)" }}>📋</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium" style={{ fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: "20px", color: isCompleted ? "#3d7a4a" : overdue ? "#a32d2d" : "#c8622a" }}>
                  {task.planned_follow_up_type ? (typeLabels[task.planned_follow_up_type] || task.planned_follow_up_type) : "Planned"}
                </p>
                <p className="text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "12px", lineHeight: "16px" }}>
                  {isCompleted ? `Completed ${task.completed_at ? format(parseISO(task.completed_at), "MMM d") : ""}` : dueDate ? (overdue ? `Was due ${format(dueDate, "MMM d")}` : `Due ${format(dueDate, "MMM d")}`) : "No date set"}
                </p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 mt-1" style={{
                  fontSize: "10px", fontWeight: 500, fontFamily: "var(--font-body)",
                  background: isCompleted ? "#e9f2eb" : overdue ? "#fce8e8" : "#e9f2eb",
                  color: isCompleted ? "#3d7a4a" : overdue ? "#a32d2d" : "#3d7a4a",
                }}>
                  {isCompleted ? "Done" : getDaysLabel()}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-[10px] py-[10px] px-[14px]" style={{ background: "#fdf5f0", border: "0.5px solid rgba(200,98,42,0.2)" }}>
              <p className="text-[13px]" style={{ color: "#7a746c", fontFamily: "var(--font-body)" }}>
                No follow-up scheduled.{" "}
                <button onClick={() => setScheduleOpen(true)} className="underline font-medium" style={{ color: "#c8622a" }}>
                  Add one?
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      {showBottomBar && (
        <div className="flex gap-3 mt-4">
          <button onClick={handleLogFollowUp} className="flex-1 rounded-[12px] py-[13px] text-[14px] font-semibold text-white shadow-md" style={{ background: overdue ? "#a32d2d" : "#c8622a", fontFamily: "var(--font-body)" }}>
            Complete follow-up
          </button>
          <button onClick={() => setRescheduleOpen(true)} className="rounded-[12px] border border-border px-5 py-[13px] text-[14px] font-medium text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
            Reschedule
          </button>
        </div>
      )}

      {task && hasFollowUp && (
        <RescheduleSheet open={rescheduleOpen} onOpenChange={setRescheduleOpen} taskRecordId={task.id} contactName={contactName} currentType={task.planned_follow_up_type} dueDate={task.planned_follow_up_date} contactId={task.contact_id} />
      )}
      {task && (
        <ScheduleFollowupSheet open={scheduleOpen} onOpenChange={setScheduleOpen} contactId={task.contact_id} contactName={contactName} taskRecordId={task.id} />
      )}
      {target && (
        <CompleteFollowupSheet open={sheetOpen} onOpenChange={handleSheetClose} taskRecordId={target.taskRecordId} contactId={target.contactId} contactName={target.contactName} followUpType={target.followUpType} userId={target.userId} hasInteraction={target.hasInteraction} />
      )}
      <LogInteractionSheet
        open={logSheetOpen}
        onOpenChange={(o) => {
          setLogSheetOpen(o);
          if (!o) queryClient.invalidateQueries({ queryKey: ["task-record", id] });
        }}
        preselectedContactId={task.contact_id}
        skipFollowupStep={true}
        existingTaskRecordId={task.id}
      />
    </div>
  );
};

export default InteractionDetail;
