import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, MessageSquare, Users, Video, CalendarIcon } from "lucide-react";
import { format, parseISO, addDays, addWeeks } from "date-fns";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const typeOptions = [
  { value: "call", icon: Phone, label: "Call" },
  { value: "email", icon: Mail, label: "Email" },
  { value: "text", icon: MessageSquare, label: "Text" },
  { value: "meet", icon: Users, label: "Meeting" },
  { value: "video", icon: Video, label: "Video" },
];
const dateChips = [
  { label: "Tomorrow", date: () => format(addDays(new Date(), 1), "yyyy-MM-dd") },
  { label: "3 days", date: () => format(addDays(new Date(), 3), "yyyy-MM-dd") },
  { label: "1 week", date: () => format(addWeeks(new Date(), 1), "yyyy-MM-dd") },
  { label: "2 weeks", date: () => format(addWeeks(new Date(), 2), "yyyy-MM-dd") },
];

const EditTaskRecord = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [interactionOn, setInteractionOn] = useState(false);
  const [connectType, setConnectType] = useState("");
  const [connectDate, setConnectDate] = useState("");
  const [note, setNote] = useState("");
  const [followUpOn, setFollowUpOn] = useState(false);
  const [followUpType, setFollowUpType] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConnectDatePicker, setShowConnectDatePicker] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const initialized = useRef(false);
  const bothOff = !interactionOn && !followUpOn;

  const { data: task, isLoading } = useQuery({
    queryKey: ["task-record", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("task_records" as any)
        .select("*, contacts(*)").eq("id", id!).single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (task && !initialized.current) {
      initialized.current = true;
      setInteractionOn(!!task.connect_type);
      setConnectType(task.connect_type || "");
      setConnectDate(task.connect_date ? format(parseISO(task.connect_date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
      setNote(task.note || "");
      setFollowUpOn(!!task.planned_follow_up_type);
      setFollowUpType(task.planned_follow_up_type || "");
      setFollowUpDate(task.planned_follow_up_date || "");
    }
  }, [task]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const update: any = {};
      if (interactionOn) {
        update.connect_type = connectType || null;
        update.connect_date = connectDate ? new Date(connectDate + "T12:00:00").toISOString() : null;
        update.note = note || null;
      } else {
        update.connect_type = null; update.connect_date = null; update.note = null;
      }
      if (followUpOn) {
        if (task && (followUpType !== task.planned_follow_up_type || followUpDate !== task.planned_follow_up_date) && task.planned_follow_up_type) {
          await supabase.from("follow_up_edits" as any).insert({
            follow_up_id: null, task_record_id: id,
            previous_type: task.planned_follow_up_type, previous_due_date: task.planned_follow_up_date, user_id: user.id,
          });
        }
        update.planned_follow_up_type = followUpType || null;
        update.planned_follow_up_date = followUpDate || null;
      } else {
        update.planned_follow_up_type = null; update.planned_follow_up_date = null;
      }
      const { error } = await supabase.from("task_records" as any).update(update).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-record", id] });
      queryClient.invalidateQueries({ queryKey: ["task-records"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
      toast.success("Changes saved");
      navigate(-1);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("task_records" as any).delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-records"] });
      toast.success("Record deleted"); navigate(-1);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading || !task) {
    return <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto"><div className="h-8 w-20 bg-secondary animate-pulse rounded mb-6" /></div>;
  }

  const contact = task.contacts;
  const contactName = contact ? `${contact.first_name} ${contact.last_name}`.trim() : "Unknown";
  const initials = contactName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
      {/* Nav */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate(-1)} className="text-muted-foreground text-[13px]" style={{ fontFamily: "var(--font-body)" }}>Cancel</button>
        <span className="text-[15px] text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Edit interaction</span>
        <button onClick={() => bothOff ? setDeleteOpen(true) : saveMutation.mutate()} disabled={saveMutation.isPending} className="text-[13px] font-semibold" style={{ color: "#c8622a", fontFamily: "var(--font-body)" }}>
          {saveMutation.isPending ? "..." : bothOff ? "Delete" : "Save"}
        </button>
      </div>

      {/* Contact header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
          <span className="text-xs font-semibold text-secondary-foreground">{initials}</span>
        </div>
        <div>
          <p className="font-medium text-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}>{contactName}</p>
          {contact?.company && <p className="text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "11px" }}>{contact.company}</p>}
        </div>
      </div>

      {/* WHAT HAPPENED */}
      <div className="rounded-[12px] bg-card border border-border overflow-hidden mb-4" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}>
        <div className="px-4 py-3">
          <p className="font-medium uppercase mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "10px", letterSpacing: "0.08em", color: "#9e9e99" }}>What happened</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-foreground" style={{ fontFamily: "var(--font-body)" }}>Interaction logged</span>
            <Switch checked={interactionOn} onCheckedChange={setInteractionOn} className="data-[state=checked]:bg-[#c8622a]" />
          </div>
          {interactionOn && (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>Type</p>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((t) => (
                    <button key={t.value} onClick={() => setConnectType(connectType === t.value ? "" : t.value)}
                      className={`inline-flex items-center gap-1.5 rounded-[20px] px-[13px] py-[7px] text-[11px] font-medium transition-colors ${connectType === t.value ? "bg-[#f5ede7] border-[1.5px] border-[#e8c4a8] text-[#c8622a]" : "bg-white border-[1.5px] border-border text-muted-foreground"}`}
                      style={{ fontFamily: "var(--font-body)" }}>
                      <t.icon size={13} />{t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>Date</p>
                <Popover open={showConnectDatePicker} onOpenChange={setShowConnectDatePicker}>
                  <PopoverTrigger asChild>
                    <button className="inline-flex items-center gap-2 rounded-[12px] border-[1.5px] border-border px-4 py-[10px] text-[13px] font-medium text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                      <CalendarIcon size={14} className="text-muted-foreground" />
                      {connectDate ? format(new Date(connectDate + "T00:00:00"), "MMM d, yyyy") : "Pick a date"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={connectDate ? new Date(connectDate + "T00:00:00") : undefined} onSelect={(d) => { if (d) { setConnectDate(format(d, "yyyy-MM-dd")); setShowConnectDatePicker(false); } }} initialFocus className={cn("p-3 pointer-events-auto")} />
                  </PopoverContent>
                </Popover>
              </div>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-[12px] border-[1.5px] border-border bg-secondary px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground min-h-[56px] resize-none outline-none focus:border-[#e8c4a8] transition-colors" style={{ fontFamily: "var(--font-body)" }} placeholder="Add a note…" />
            </div>
          )}
        </div>
      </div>

      {/* WHAT'S NEXT */}
      <div className="rounded-[12px] bg-card border border-border overflow-hidden mb-6" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}>
        <div className="px-4 py-3">
          <p className="font-medium uppercase mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "10px", letterSpacing: "0.08em", color: "#9e9e99" }}>What's next</p>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[13px] text-foreground" style={{ fontFamily: "var(--font-body)" }}>Follow-up planned</span>
            <Switch checked={followUpOn} onCheckedChange={setFollowUpOn} className="data-[state=checked]:bg-[#c8622a]" />
          </div>
          {followUpOn && (
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>Type</p>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((t) => (
                    <button key={t.value} onClick={() => setFollowUpType(followUpType === t.value ? "" : t.value)}
                      className={`inline-flex items-center gap-1.5 rounded-[20px] px-[11px] py-[5px] text-[10px] font-medium transition-colors ${followUpType === t.value ? "bg-[#f5ede7] border-[1.5px] border-[#e8c4a8] text-[#c8622a]" : "bg-white border-[1.5px] border-border text-muted-foreground"}`}
                      style={{ fontFamily: "var(--font-body)" }}>
                      <t.icon size={11} />{t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>Due</p>
                <div className="flex flex-wrap gap-2">
                  {dateChips.map((chip) => {
                    const chipDate = chip.date();
                    return (
                      <button key={chip.label} onClick={() => { setFollowUpDate(followUpDate === chipDate ? "" : chipDate); setShowDatePicker(false); }}
                        className={`rounded-[20px] px-[11px] py-[5px] text-[10px] font-medium transition-colors ${followUpDate === chipDate ? "bg-[#f5ede7] border-[1.5px] border-[#e8c4a8] text-[#c8622a]" : "bg-white border-[1.5px] border-border text-muted-foreground"}`}
                        style={{ fontFamily: "var(--font-body)" }}>
                        {chip.label}
                      </button>
                    );
                  })}
                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <button className={`rounded-[20px] px-[11px] py-[5px] text-[10px] font-medium transition-colors inline-flex items-center gap-1 ${showDatePicker ? "bg-[#f5ede7] border-[1.5px] border-[#e8c4a8] text-[#c8622a]" : "bg-white border-[1.5px] border-border text-muted-foreground"}`} style={{ fontFamily: "var(--font-body)" }}>
                        <CalendarIcon size={10} />Pick date
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={followUpDate ? new Date(followUpDate + "T00:00:00") : undefined} onSelect={(d) => { if (d) { setFollowUpDate(format(d, "yyyy-MM-dd")); setShowDatePicker(false); } }} disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {bothOff && (
        <div className="rounded-[12px] bg-destructive/10 border border-destructive/20 px-4 py-3 mb-4">
          <p className="text-[13px] text-destructive font-medium" style={{ fontFamily: "var(--font-body)" }}>
            Both sections are turned off. Saving will delete this record.
          </p>
        </div>
      )}

      <button onClick={() => setDeleteOpen(true)} className="w-full text-center text-destructive underline text-[13px]" style={{ fontFamily: "var(--font-body)" }}>
        Delete this interaction
      </button>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditTaskRecord;
