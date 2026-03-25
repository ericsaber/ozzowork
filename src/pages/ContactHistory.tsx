import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Phone, Mail, MessageSquare, Users, Video, ClipboardList,
  Plus, Pencil, Trash2, X, MoreHorizontal, ArrowRight, ChevronRight, Clock, Calendar, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ContactFollowupCard from "@/components/ContactFollowupCard";
import RescheduleSheet from "@/components/RescheduleSheet";
import ScheduleFollowupSheet from "@/components/ScheduleFollowupSheet";
import CompleteFollowupSheet from "@/components/CompleteFollowupSheet";
import LogInteractionSheet from "@/components/LogInteractionSheet";
import { useCompleteTask } from "@/hooks/useCompleteTask";
import { toast } from "sonner";
import { format, parseISO, startOfToday, startOfDay, isPast, isToday } from "date-fns";

const typeVerbs: Record<string, string> = { call: "Called", email: "Emailed", text: "Texted", meet: "Met", video: "Video called" };
const typeIcons: Record<string, typeof Phone> = { call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video };
const typeLabels: Record<string, string> = { call: "Call", email: "Email", text: "Text", meet: "Meeting", video: "Video" };

const ContactHistory = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const todayStr = format(startOfToday(), "yyyy-MM-dd");

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", company: "", phone: "", email: "" });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  const [rescheduleTask, setRescheduleTask] = useState<any | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [logSheetOpen, setLogSheetOpen] = useState(false);

  const { target, sheetOpen, startComplete, handleSheetClose } = useCompleteTask({
    onCompleted: () => {
      queryClient.invalidateQueries({ queryKey: ["task-records", id] });
      queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
    },
  });

  const { data: contact } = useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: taskRecords, isLoading } = useQuery({
    queryKey: ["task-records", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("task_records" as any)
        .select("*").eq("contact_id", id!).not("status", "eq", "draft").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!id,
  });

  const { data: followUpEdits } = useQuery({
    queryKey: ["follow-up-edits", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_up_edits" as any)
        .select("task_record_id, previous_due_date, previous_type, changed_at")
        .in(
          "task_record_id",
          (taskRecords || []).map((r: any) => r.id)
        );
      if (error) throw error;
      console.log("[ContactHistory] follow_up_edits fetched:", data);
      return (data || []) as any[];
    },
    enabled: !!id && !!(taskRecords && taskRecords.length > 0),
  });

  const rescheduleMap = (followUpEdits || []).reduce((acc: any, edit: any) => {
    acc[edit.task_record_id] = edit;
    return acc;
  }, {});

  // Categorize
  const activeFollowups = (taskRecords || []).filter((r: any) => r.planned_follow_up_date && r.status === "active");
  const upcomingFollowups = activeFollowups.filter((r: any) => r.planned_follow_up_date >= todayStr);
  const overdueFollowups = activeFollowups.filter((r: any) => r.planned_follow_up_date < todayStr);
  const hasActiveFollowups = activeFollowups.length > 0;

  // History: records with connect_type OR note (Fix 3: include note-only records)
  const historyRecords = (taskRecords || [])
    .filter((r: any) =>
      r.connect_type ||
      r.note ||
      r.status === 'cleared' ||
      r.status === 'cancelled' ||
      (r.status === 'completed' && !r.connect_type && !r.note && r.planned_follow_up_date && !(taskRecords || []).some((other: any) => other.related_task_record_id === r.id))
    )
    .sort((a: any, b: any) => new Date(b.connect_date || b.created_at).getTime() - new Date(a.connect_date || a.created_at).getTime());

  const interactionCount = historyRecords.filter((r: any) => r.connect_type || r.note).length;
  const firstContactDate = historyRecords.length > 0
    ? format(parseISO(historyRecords[historyRecords.length - 1].connect_date || historyRecords[historyRecords.length - 1].created_at), "MMM d")
    : null;

  // Mutations
  const updateContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contacts").update({
        first_name: form.first_name, last_name: form.last_name,
        company: form.company || null, phone: form.phone || null, email: form.email || null,
      }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contact", id] }); queryClient.invalidateQueries({ queryKey: ["contacts"] }); setEditing(false); toast.success("Contact updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteContact = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("contacts").delete().eq("id", id!); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contacts"] }); toast.success("Contact deleted"); navigate("/contacts", { replace: true }); },
    onError: (e: any) => toast.error(e.message),
  });

  const startEditing = () => {
    if (contact) {
      setForm({ first_name: contact.first_name, last_name: contact.last_name, company: contact.company || "", phone: contact.phone || "", email: contact.email || "" });
      setEditing(true);
    }
  };

  const fullName = contact ? `${contact.first_name} ${contact.last_name}`.trim() : "";
  const initials = fullName ? fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  const handleComplete = (item: any) => {
    startComplete({
      taskRecordId: item.id,
      contactId: item.contact_id,
      contactName: fullName,
      followUpType: item.planned_follow_up_type || "",
      userId: item.user_id,
      hasInteraction: !!(item.connect_type || item.note),
    });
  };

  const getThreadLine = (record: any, rescheduleInfo?: any) => {
    const typeLbl = record.planned_follow_up_type
      ? (typeLabels[record.planned_follow_up_type] || record.planned_follow_up_type)
      : null;
    const plannedDateStr = record.planned_follow_up_date
      ? format(parseISO(record.planned_follow_up_date), "MMM d")
      : "";
    const completedDateStr = record.completed_at
      ? format(parseISO(record.completed_at), "MMM d")
      : "";

    if (record.related_task_record_id) {
      const relatedRecord = (taskRecords || []).find((r: any) => r.id === record.related_task_record_id);
      if (relatedRecord) {
        const plannedDateStr = relatedRecord.planned_follow_up_date
          ? format(parseISO(relatedRecord.planned_follow_up_date), "MMM d")
          : "";
        const completedDateStr2 = relatedRecord.completed_at
          ? format(parseISO(relatedRecord.completed_at), "MMM d")
          : "";
        const rescheduledDateStr = relatedRecord.planned_follow_up_date
          ? format(parseISO(relatedRecord.planned_follow_up_date), "MMM d")
          : "";

        console.log("[getThreadLine] related record found:", {
          relatedId: relatedRecord.id,
          relatedStatus: relatedRecord.status,
          plannedDate: relatedRecord.planned_follow_up_date,
          completedAt: relatedRecord.completed_at,
        });

        if (relatedRecord.status === "cancelled") {
          return {
            text: plannedDateStr
              ? `→ Follow-up cancelled · Was due ${plannedDateStr}`
              : "→ Follow-up cancelled",
            color: "#9e9e99",
          };
        }

        if (relatedRecord.status === "completed") {
          const wasEarly = relatedRecord.planned_follow_up_date && relatedRecord.completed_at
            ? startOfDay(parseISO(relatedRecord.planned_follow_up_date)) > startOfDay(parseISO(relatedRecord.completed_at))
            : false;
          const dueLbl = wasEarly ? "was planned for" : "was due";
          const sameDate = plannedDateStr && completedDateStr2 && plannedDateStr === completedDateStr2;
          const prefix = sameDate
            ? `Follow-up completed ${completedDateStr2}`
            : plannedDateStr ? `Follow-up ${dueLbl} ${plannedDateStr}` : 'Follow-up completed';
          const suffix = sameDate ? '' : (completedDateStr2 ? ` · Completed ${completedDateStr2}` : '');
          return {
            text: `→ ${prefix}${suffix}`,
            color: '#3d7a4a',
          };
        }

        // Rescheduled — related record is still active with a new date
        if (rescheduledDateStr) {
          return {
            text: `→ Follow-up rescheduled to ${rescheduledDateStr}`,
            color: "#c8622a",
          };
        }
      }
    }

    if (!record.planned_follow_up_type && !record.planned_follow_up_date) {
      return { text: "→ No follow-up", color: "#9e9e99" };
    }

    if (record.status === "completed") {
      const parts = [typeLbl || 'Follow-up planned', plannedDateStr ? `Was due ${plannedDateStr}` : null, "Done"]
        .filter(Boolean).join(" · ");
      return { text: `→ ${parts}`, color: "#3d7a4a" };
    }

    if (record.status === "cancelled") {
      const parts = [typeLbl || 'Follow-up planned', plannedDateStr ? `Was due ${plannedDateStr}` : null, "Cancelled"]
        .filter(Boolean).join(" · ");
      return { text: `→ ${parts}`, color: "#9e9e99" };
    }

    if (record.planned_follow_up_date && record.planned_follow_up_date < todayStr) {
      return { text: `→ ${[typeLbl || 'Follow-up planned', plannedDateStr].filter(Boolean).join(" ")} · Overdue`, color: "#a32d2d" };
    }

    console.log('[getThreadLine]', {
      id: record.id,
      status: record.status,
      planned_follow_up_date: record.planned_follow_up_date,
      completed_at: record.completed_at,
      related_task_record_id: record.related_task_record_id,
    });

    const activeLbl = typeLbl ? `${typeLbl} planned` : 'Follow-up planned';
    if (rescheduleInfo) {
      const previousDateStr = rescheduleInfo.previous_due_date
        ? format(parseISO(rescheduleInfo.previous_due_date), "MMM d")
        : "";
      const rescheduleText = previousDateStr
        ? `Follow-up planned for ${plannedDateStr} · Rescheduled from ${previousDateStr}`
        : `Follow-up planned for ${plannedDateStr}`;
      return { text: `→ ${rescheduleText}`, color: "#3d7a4a" };
    }
    return { text: `→ ${[activeLbl, plannedDateStr].filter(Boolean).join(' ')}`, color: '#3d7a4a' };
  };

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
        <ArrowLeft size={18} /><span className="text-sm" style={{ fontFamily: "var(--font-body)" }}>Back</span>
      </button>

      {contact && !editing && (
        <div className="mb-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <span className="text-lg font-semibold text-secondary-foreground">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl text-foreground" style={{ fontFamily: "var(--font-heading)" }}>{fullName}</h1>
              {contact.company && <p className="text-muted-foreground text-sm" style={{ fontFamily: "var(--font-body)" }}>{contact.company}</p>}
            </div>
            <DropdownMenu open={openMenuId === "contact-menu"} onOpenChange={(o) => setOpenMenuId(o ? "contact-menu" : null)}>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full flex items-center justify-center border-[1.5px] border-border transition-colors shrink-0" style={{ background: "#f0ede8" }}>
                  <MoreHorizontal size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[160px]">
                <DropdownMenuItem onClick={startEditing}><Pencil size={14} className="mr-2" /> Edit contact</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteContactOpen(true)} className="text-destructive focus:text-destructive"><Trash2 size={14} className="mr-2" /> Delete contact</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Action row — flush left */}
          <div className="flex items-center justify-start gap-2 mt-4">
            <button onClick={() => setLogSheetOpen(true)} className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-[9px] text-[12px] font-medium text-primary-foreground shadow-sm" style={{ background: "#c8622a", border: "1px solid #c8622a", fontFamily: "var(--font-body)" }}>
              <Plus size={14} /> Log
            </button>
            <button onClick={() => { if (contact.phone) window.location.href = `tel:${contact.phone}`; else toast("No phone number added.", { action: { label: "Add", onClick: startEditing } }); }} className="inline-flex items-center gap-1.5 rounded-[10px] border border-border px-4 py-[9px] text-[12px] font-medium text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
              <Phone size={14} /> Call
            </button>
            <button onClick={() => { if (contact.email) window.location.href = `mailto:${contact.email}`; else toast("No email added.", { action: { label: "Add", onClick: startEditing } }); }} className="inline-flex items-center gap-1.5 rounded-[10px] border border-border px-4 py-[9px] text-[12px] font-medium text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
              <Mail size={14} /> Email
            </button>
            <button onClick={() => { if (contact.phone) window.location.href = `sms:${contact.phone}`; else toast("No phone number added.", { action: { label: "Add", onClick: startEditing } }); }} className="inline-flex items-center gap-1.5 rounded-[10px] border border-border px-4 py-[9px] text-[12px] font-medium text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
              <MessageSquare size={14} /> Text
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {contact && editing && (
        <div className="bg-card rounded-lg border border-border p-4 text-left mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground">Edit Contact</h3>
            <button onClick={() => setEditing(false)} className="text-muted-foreground"><X size={18} /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="First Name *" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="bg-background" />
              <Input placeholder="Last Name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="bg-background" />
            </div>
            <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="bg-background" />
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-background" />
            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-background" />
            <Button onClick={() => updateContact.mutate()} disabled={!form.first_name || updateContact.isPending} className="w-full">
              {updateContact.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      {/* Schedule CTA when no active follow-ups */}
      {!hasActiveFollowups && contact && (
        <div className="mb-5">
          <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>Next follow-up</p>
          <button onClick={() => setScheduleOpen(true)} className="w-full rounded-[14px] border-[1.5px] border-dashed border-border bg-card px-4 py-4 text-center hover:border-primary/40 transition-colors" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.04)" }}>
            <p className="text-[13px] text-muted-foreground mb-1" style={{ fontFamily: "var(--font-body)" }}>No follow-up scheduled</p>
            <span className="text-[12px] text-primary font-medium" style={{ fontFamily: "var(--font-body)" }}>+ Schedule a follow-up</span>
          </button>
        </div>
      )}

      {/* Next follow-up */}
      {upcomingFollowups.length > 0 && (
        <div className="mb-5">
          <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>Next follow-up</p>
          <div className="space-y-3">
            {upcomingFollowups.map((r: any) => (
              <ContactFollowupCard
                key={r.id}
                taskRecord={r}
                variant="upcoming"
                onTap={() => navigate(`/interaction/${r.id}`)}
                onComplete={() => handleComplete(r)}
                onEdit={() => { setOpenMenuId(null); navigate(`/edit-task/${r.id}`); }}
                onReschedule={() => { setOpenMenuId(null); setRescheduleTask(r); }}
                menuOpen={openMenuId === `card-${r.id}`}
                onMenuOpenChange={(o) => setOpenMenuId(o ? `card-${r.id}` : null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Overdue */}
      {overdueFollowups.length > 0 && (
        <div className="mb-5">
          <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>Overdue</p>
          <div className="space-y-3">
            {overdueFollowups.map((r: any) => (
              <ContactFollowupCard
                key={r.id}
                taskRecord={r}
                variant="overdue"
                onTap={() => navigate(`/interaction/${r.id}`)}
                onComplete={() => handleComplete(r)}
                onEdit={() => { setOpenMenuId(null); navigate(`/edit-task/${r.id}`); }}
                onReschedule={() => { setOpenMenuId(null); setRescheduleTask(r); }}
                menuOpen={openMenuId === `card-${r.id}`}
                onMenuOpenChange={(o) => setOpenMenuId(o ? `card-${r.id}` : null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {!isLoading && historyRecords.length > 0 && (
        <div className="mb-5">
          <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2 pt-[10px]" style={{ fontFamily: "var(--font-body)" }}>History</p>
          <div className="space-y-0">
            {historyRecords.map((record: any) => {
              // Cleared record rendering
              if (record.status === 'cleared') {
                const typeLbl = record.planned_follow_up_type
                  ? (typeLabels[record.planned_follow_up_type] || record.planned_follow_up_type)
                  : "Planned";
                const dateStr = record.planned_follow_up_date
                  ? format(parseISO(record.planned_follow_up_date), "MMM d")
                  : "";
                return (
                  <div key={record.id} className="flex gap-3 py-3 px-2 -mx-2" style={{ opacity: 0.55 }}>
                    <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#f0ede8" }}>
                      <Calendar size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-medium text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        {typeLbl} follow-up{dateStr ? ` · ${dateStr}` : ""}
                      </span>
                      <div className="mt-1">
                        <span
                          className="inline-block text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "#f3f2f0", color: "#7a746c", fontFamily: "var(--font-body)" }}
                        >
                          Cleared
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Cancelled tails-only record rendering
              if (record.status === 'cancelled' && !record.connect_type && !record.note) {
                const typeLbl = record.planned_follow_up_type
                  ? (typeLabels[record.planned_follow_up_type] || record.planned_follow_up_type)
                  : "Planned";
                const plannedDateStr = record.planned_follow_up_date
                  ? format(parseISO(record.planned_follow_up_date), "MMM d")
                  : "";
                const cancelledDateStr = record.completed_at
                  ? format(parseISO(record.completed_at), "MMM d")
                  : "";

                return (
                  <div key={record.id} className="flex gap-3 py-3 px-2 -mx-2" style={{ opacity: 0.55 }}>
                    <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#f0ede8" }}>
                      <Calendar size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-medium text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        {typeLbl} follow-up{plannedDateStr ? ` · ${plannedDateStr}` : ""}
                      </span>
                      {cancelledDateStr && plannedDateStr && cancelledDateStr !== plannedDateStr && (
                        <p className="text-[10px] mt-0.5" style={{ color: "#b0a89e", fontFamily: "var(--font-body)" }}>
                          Cancelled {cancelledDateStr} · Was due {plannedDateStr}
                        </p>
                      )}
                      <div className="mt-1">
                        <span
                          className="inline-block text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "#f3f2f0", color: "#7a746c", fontFamily: "var(--font-body)" }}
                        >
                          Cancelled
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Completed tails-only record (follow-up completed with no prior interaction)
              if (record.status === 'completed' && !record.connect_type && !record.note && record.planned_follow_up_date) {
                const typeLbl = record.planned_follow_up_type
                  ? (typeLabels[record.planned_follow_up_type] || record.planned_follow_up_type)
                  : "Planned";
                const plannedDateStr = format(parseISO(record.planned_follow_up_date), "MMM d");
                const completedDateStr = record.completed_at
                  ? format(parseISO(record.completed_at), "MMM d")
                  : "";

                return (
                  <div key={record.id} className="flex gap-3 py-3 px-2 -mx-2" style={{ opacity: 0.6 }}>
                    <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#e9f2eb" }}>
                      <Check size={14} style={{ color: "#3d7a4a" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-medium" style={{ fontFamily: "var(--font-body)", color: "#1c1812" }}>
                        {typeLbl} follow-up · Was due {plannedDateStr}
                      </span>
                      {completedDateStr && completedDateStr !== plannedDateStr && (
                        <p className="text-[10px] mt-0.5" style={{ color: "#b0a89e", fontFamily: "var(--font-body)" }}>
                          Completed {completedDateStr}
                        </p>
                      )}
                      <div className="mt-1">
                        <span
                          className="inline-block text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "#e9f2eb", color: "#3d7a4a", fontFamily: "var(--font-body)" }}
                        >
                          Done
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              const type = record.connect_type;
              // Fix 3: fallback icon and verb when no connect type
              const TypeIcon = type ? (typeIcons[type] || ClipboardList) : ClipboardList;
              const verb = type ? (typeVerbs[type] || type) : "Interacted";
              const thread = getThreadLine(record, rescheduleMap[record.id]);

              return (
                <button key={record.id} onClick={() => navigate(`/interaction/${record.id}`)} className="flex gap-3 py-3 group w-full text-left hover:bg-secondary/50 rounded-lg px-2 -mx-2 active:scale-[0.98] transition-all cursor-pointer">
                  <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5" style={{ background: "#f0ede8" }}>
                    <TypeIcon size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-foreground" style={{ fontFamily: "var(--font-body)" }}>{verb}</span>
                      <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>{format(parseISO(record.connect_date || record.created_at), "MMM d")}</span>
                    </div>
                    {record.note && (
                      <p className="text-[11px] line-clamp-1 mt-0.5" style={{ color: "#777", fontFamily: "var(--font-body)" }}>{record.note}</p>
                    )}
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px]" style={{ fontFamily: "var(--font-body)", color: thread.color }}>{thread.text}</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-muted-foreground shrink-0 self-center" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isLoading && <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />)}</div>}

      {/* Footer */}
      {!isLoading && interactionCount > 0 && (
        <p className="text-center text-[11px] text-muted-foreground py-4" style={{ fontFamily: "var(--font-body)" }}>
          {interactionCount} interaction{interactionCount !== 1 ? "s" : ""}{firstContactDate ? ` · First contact ${firstContactDate}` : ""}
        </p>
      )}

      {/* Sheets */}
      {contact && <ScheduleFollowupSheet open={scheduleOpen} onOpenChange={setScheduleOpen} contactId={id!} contactName={fullName} />}

      {rescheduleTask && contact && (
        <RescheduleSheet open={!!rescheduleTask} onOpenChange={(o) => { if (!o) setRescheduleTask(null); }} taskRecordId={rescheduleTask.id} contactName={fullName} currentType={rescheduleTask.planned_follow_up_type} dueDate={rescheduleTask.planned_follow_up_date} contactId={id!} />
      )}

      {target && (
        <CompleteFollowupSheet open={sheetOpen} onOpenChange={handleSheetClose} taskRecordId={target.taskRecordId} contactId={target.contactId} contactName={target.contactName} followUpType={target.followUpType} userId={target.userId} hasInteraction={target.hasInteraction} />
      )}

      <LogInteractionSheet open={logSheetOpen} onOpenChange={setLogSheetOpen} preselectedContactId={id} />

      {/* Delete contact */}
      <AlertDialog open={deleteContactOpen} onOpenChange={setDeleteContactOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete contact?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {fullName} and cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteContact.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContactHistory;
