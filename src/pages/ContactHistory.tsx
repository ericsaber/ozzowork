import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Phone, Mail, MessageSquare, Users, Video,
  Plus, Pencil, Trash2, X, MoreHorizontal, ArrowRight, ChevronRight, Clock,
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
import { format, parseISO, startOfToday, isPast, isToday } from "date-fns";

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
        .select("*").eq("contact_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!id,
  });

  // Categorize
  const activeFollowups = (taskRecords || []).filter((r: any) => r.planned_follow_up_date && r.status === "active");
  const upcomingFollowups = activeFollowups.filter((r: any) => r.planned_follow_up_date >= todayStr);
  const overdueFollowups = activeFollowups.filter((r: any) => r.planned_follow_up_date < todayStr);
  const hasActiveFollowups = activeFollowups.length > 0;

  // History: records with connect_type
  const historyRecords = (taskRecords || [])
    .filter((r: any) => r.connect_type)
    .sort((a: any, b: any) => new Date(b.connect_date || b.created_at).getTime() - new Date(a.connect_date || a.created_at).getTime());

  const interactionCount = historyRecords.length;
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
      hasInteraction: !!item.connect_type,
    });
  };

  const getThreadLine = (record: any) => {
    if (!record.planned_follow_up_type) return { text: "→ No follow-up", color: "#9e9e99" };
    const typeLbl = typeLabels[record.planned_follow_up_type] || record.planned_follow_up_type;
    const dateStr = record.planned_follow_up_date ? format(parseISO(record.planned_follow_up_date), "MMM d") : "";
    if (record.status === "completed") return { text: `→ ${typeLbl} ${dateStr} · Done`, color: "#3d7a4a" };
    if (record.planned_follow_up_date && record.planned_follow_up_date < todayStr) return { text: `→ ${typeLbl} ${dateStr} · Overdue`, color: "#a32d2d" };
    return { text: `→ ${typeLbl} ${dateStr}`, color: "#c8622a" };
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
            <button onClick={() => navigate(`/log?contact=${id}`)} className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-[9px] text-[12px] font-medium text-primary-foreground shadow-sm" style={{ background: "#c8622a", border: "1px solid #c8622a", fontFamily: "var(--font-body)" }}>
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
              const type = record.connect_type;
              const TypeIcon = typeIcons[type] || MessageSquare;
              const verb = typeVerbs[type] || type;
              const thread = getThreadLine(record);

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
