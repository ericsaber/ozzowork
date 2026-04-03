import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Phone, Mail, MessageSquare, Users, Video, ClipboardList,
  Pencil, Trash2, X, MoreHorizontal, Clock, Check,
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
import LogInteractionSheet from "@/components/LogInteractionSheet";
import CompleteFollowupSheet from "@/components/CompleteFollowupSheet";
import { toast } from "sonner";
import { format, parseISO, startOfToday } from "date-fns";

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
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [completeTarget, setCompleteTarget] = useState<{
    followUpId: string;
    contactId: string;
    contactName: string;
    plannedType: string | null;
  } | null>(null);
  const [newMenuOpen, setNewMenuOpen] = useState(false);

  const { data: contact } = useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Query 1 — active follow-up
  const { data: activeFollowup } = useQuery({
    queryKey: ["follow-ups-active", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*")
        .eq("contact_id", id!)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      console.log("[ContactHistory] active follow-up:", data);
      return data;
    },
    enabled: !!id,
  });

  // Query 2 — published interactions
  const { data: interactions, isLoading: interactionsLoading } = useQuery({
    queryKey: ["interactions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select("*")
        .eq("contact_id", id!)
        .eq("status", "published")
        .order("connect_date", { ascending: false });
      if (error) throw error;
      console.log("[ContactHistory] interactions fetched:", data?.length);
      return data as any[];
    },
    enabled: !!id,
  });

  // Query 3 — completed/cancelled follow-ups + their edits
  const { data: followUps, isLoading: followUpsLoading } = useQuery({
    queryKey: ["follow-ups-history", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*, follow_up_edits(*)")
        .eq("contact_id", id!)
        .in("status", ["completed", "cancelled"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      console.log("[ContactHistory] follow-ups history fetched:", data?.length);
      return data as any[];
    },
    enabled: !!id,
  });

  const isLoading = interactionsLoading || followUpsLoading;

  // Active follow-up display logic
  const hasActiveFollowup = !!activeFollowup;
  const isOverdue = activeFollowup
    ? activeFollowup.planned_date < todayStr
    : false;
  const isUpcoming = activeFollowup
    ? activeFollowup.planned_date >= todayStr
    : false;

  // Featured: most recent published interaction with connect_type or note
  const featuredInteraction = (interactions || []).find(
    (r: any) => r.connect_type || (r.note && r.note.trim())
  ) || null;

  // Build timeline items from three sources:
  type TimelineItem =
    | { kind: "interaction"; record: any; date: string }
    | { kind: "follow_up"; record: any; date: string }
    | { kind: "follow_up_edit"; edit: any; followUp: any; date: string }
    | { kind: "follow_up_scheduled"; followUp: any; date: string };

  const timelineItems: TimelineItem[] = [];

  // 1. All published interactions (excluding featured)
  (interactions || []).forEach((r: any) => {
    if (featuredInteraction && r.id === featuredInteraction.id) return;
    timelineItems.push({ kind: "interaction", record: r, date: r.connect_date || r.created_at });
  });

  // 2. Completed/cancelled follow-ups + their edits
  (followUps || []).forEach((fu: any) => {
    // Always emit a "scheduled" row for every follow-up
    timelineItems.push({ kind: "follow_up_scheduled", followUp: fu, date: fu.created_at });

    // Emit a row for each reschedule edit
    const edits = (fu.follow_up_edits || []).sort(
      (a: any, b: any) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    );
    edits.forEach((edit: any) => {
      timelineItems.push({ kind: "follow_up_edit", edit, followUp: fu, date: edit.changed_at });
    });

    // Emit the follow_up outcome row (completed or cancelled)
    timelineItems.push({
      kind: "follow_up",
      record: fu,
      date: fu.completed_at || fu.created_at,
    });
  });

  // Sort all items by date descending
  timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const interactionCount = (interactions || []).length;

  const allInteractionDates = (interactions || []).map(
    (r: any) => new Date(r.connect_date || r.created_at).getTime()
  );
  const firstContactDate = allInteractionDates.length > 0
    ? format(new Date(Math.min(...allInteractionDates)), "MMM d")
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
            <h1 className="text-foreground" style={{ fontFamily: "var(--font-heading)", fontSize: "22px" }}>{fullName}</h1>
              {contact.company && <p className="text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}>{contact.company}</p>}
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
            <button onClick={() => setLogSheetOpen(true)} className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-[9px] font-medium text-primary-foreground shadow-sm" style={{ background: "#c8622a", border: "1px solid #c8622a", fontFamily: "var(--font-body)", fontSize: "13px" }}>
              <Plus size={14} /> Log
            </button>
            <button onClick={() => { if (contact.phone) window.location.href = `tel:${contact.phone}`; else toast("No phone number added.", { action: { label: "Add", onClick: startEditing } }); }} className="inline-flex items-center gap-1.5 rounded-[10px] border border-border px-4 py-[9px] font-medium text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}>
              <Phone size={14} /> Call
            </button>
            <button onClick={() => { if (contact.email) window.location.href = `mailto:${contact.email}`; else toast("No email added.", { action: { label: "Add", onClick: startEditing } }); }} className="inline-flex items-center gap-1.5 rounded-[10px] border border-border px-4 py-[9px] font-medium text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}>
              <Mail size={14} /> Email
            </button>
            <button onClick={() => { if (contact.phone) window.location.href = `sms:${contact.phone}`; else toast("No phone number added.", { action: { label: "Add", onClick: startEditing } }); }} className="inline-flex items-center gap-1.5 rounded-[10px] border border-border px-4 py-[9px] font-medium text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}>
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

      {/* No follow-up scheduled */}
      {!hasActiveFollowup && contact && (
        <div className="mb-5">
          <p className="font-medium uppercase tracking-[0.08em] mb-2"
            style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
            Next follow-up
          </p>
          <button
            onClick={() => setLogSheetOpen(true)}
            className="w-full rounded-[14px] border-[1.5px] border-dashed border-border bg-card px-4 py-4 text-center hover:border-primary/40 transition-colors"
            style={{ boxShadow: "0 1px 5px rgba(0,0,0,.04)" }}
          >
            <p className="text-muted-foreground mb-1"
              style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}>
              No follow-up scheduled
            </p>
            <span className="text-[12px] text-primary font-medium"
              style={{ fontFamily: "var(--font-body)" }}>
              + Schedule a follow-up
            </span>
          </button>
        </div>
      )}

      {/* Active follow-up card */}
      {activeFollowup && (
        <div className="mb-5">
          <p className="font-medium uppercase tracking-[0.08em] mb-2"
            style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
            {isOverdue ? "Overdue" : "Next follow-up"}
          </p>
          <ContactFollowupCard
            taskRecord={activeFollowup}
            variant={isOverdue ? "overdue" : "upcoming"}
            hidePlannedFallback
            rescheduleCount={0}
            onComplete={() => {
              setCompleteTarget({
                followUpId: activeFollowup.id,
                contactId: id!,
                contactName: fullName,
                plannedType: activeFollowup.planned_type || null,
              });
            }}
          />
        </div>
      )}

      {/* Featured Last Interaction Card */}
      {!isLoading && featuredInteraction && (() => {
        const record = featuredInteraction;
        const type = record.connect_type;
        const TypeIcon = type ? (typeIcons[type] || ClipboardList) : ClipboardList;
        const verb = type ? (typeVerbs[type] || type) : "Connected";
        return (
          <div className="mb-5">
            <p className="font-medium uppercase tracking-[0.08em] mb-2"
              style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
              Last interaction
            </p>
            <div
              className="w-full flex gap-3 bg-white rounded-xl p-3 text-left items-center"
              style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}
            >
              <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
                style={{ background: "#f5ede7" }}>
                <TypeIcon size={14} style={{ color: "#c8622a" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground"
                    style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}>
                    {verb}
                  </span>
                  <span className="text-muted-foreground"
                    style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}>
                    {format(parseISO(record.connect_date || record.created_at), "MMM d")}
                  </span>
                </div>
                {record.note && record.note.trim() && (
                  <p className="line-clamp-2 mt-0.5"
                    style={{ color: "#777", fontFamily: "var(--font-heading)", fontSize: "13px", fontStyle: "italic" }}>
                    {record.note}
                  </p>
                )}
              </div>
              {/* TODO Step 8: add pencil icon for inline interaction edit */}
            </div>
          </div>
        );
      })()}

      {/* History */}
      {!isLoading && timelineItems.length > 0 && (
        <div className="mb-5">
          <p className="font-medium uppercase tracking-[0.08em] mb-2 pt-[10px]"
            style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
            History
          </p>
          <div>
            {timelineItems.map((item, idx) => {
              const isLast = idx === timelineItems.length - 1;
              const dividerStyle = !isLast ? { borderBottom: "1px solid #e8e4de" } : {};

              // Follow-up scheduled row
              if (item.kind === "follow_up_scheduled") {
                const fu = item.followUp;
                const plannedDate = fu.planned_date
                  ? format(parseISO(fu.planned_date), "MMM d")
                  : "—";
                const setDate = format(parseISO(fu.created_at), "MMM d");
                return (
                  <div key={`scheduled-${fu.id}`} style={dividerStyle}>
                    <div className="flex gap-3 py-3 px-2 -mx-2" style={{ opacity: 0.6 }}>
                      <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "#f0ede8" }}>
                        <Clock size={14} style={{ color: "#9e9e99" }} />
                      </div>
                      <div className="flex-1 min-w-0 flex items-center">
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#71717a" }}>
                          Follow-up for {plannedDate} · Set {setDate}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Follow-up edit (reschedule) row
              if (item.kind === "follow_up_edit") {
                const edit = item.edit;
                const newDate = edit.previous_due_date
                  ? format(parseISO(edit.previous_due_date), "MMM d")
                  : "—";
                return (
                  <div key={`edit-${edit.id}`} style={dividerStyle}>
                    <div className="flex gap-3 py-3 px-2 -mx-2" style={{ opacity: 0.6 }}>
                      <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "#f0ede8" }}>
                        <Clock size={14} style={{ color: "#9e9e99" }} />
                      </div>
                      <div className="flex-1 min-w-0 flex items-center">
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#71717a" }}>
                          Follow-up rescheduled to {newDate}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // Follow-up outcome row (completed or cancelled)
              if (item.kind === "follow_up") {
                const fu = item.record;

                if (fu.status === "cancelled") {
                  return (
                    <div key={`fu-${fu.id}`} style={dividerStyle}>
                      <div className="flex gap-3 py-3 px-2 -mx-2" style={{ opacity: 0.6 }}>
                        <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: "#f0ede8" }}>
                          <X size={14} style={{ color: "#a32d2d" }} />
                        </div>
                        <div className="flex-1 min-w-0 flex items-center">
                          <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#71717a" }}>
                            Follow-up cancelled
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (fu.status === "completed") {
                  const type = fu.connect_type;
                  const TypeIcon = type ? (typeIcons[type] || ClipboardList) : ClipboardList;
                  const verb = type ? (typeVerbs[type] || type) : null;
                  const dateStr = fu.connect_date
                    ? format(parseISO(fu.connect_date), "MMM d")
                    : fu.completed_at
                    ? format(parseISO(fu.completed_at), "MMM d")
                    : "";

                  if (verb) {
                    // Completed with connect_type — show as interaction row
                    return (
                      <div key={`fu-${fu.id}`} style={dividerStyle}>
                        <div className="flex gap-3 py-3 px-2 -mx-2 items-start">
                          <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: "#f0ede8" }}>
                            <TypeIcon size={14} className="text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground"
                                style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}>
                                {verb}
                              </span>
                              <span className="text-muted-foreground"
                                style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}>
                                {dateStr}
                              </span>
                            </div>
                            {fu.note && fu.note.trim() && (
                              <p className="line-clamp-2 mt-0.5"
                                style={{ color: "#777", fontFamily: "var(--font-heading)", fontSize: "13px", fontStyle: "italic" }}>
                                {fu.note}
                              </p>
                            )}
                            <p className="mt-0.5"
                              style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "#9e9e99" }}>
                              Follow-up completed
                            </p>
                          </div>
                          {/* TODO Step 8: add pencil icon for inline edit */}
                        </div>
                      </div>
                    );
                  } else {
                    // Completed without connect_type
                    return (
                      <div key={`fu-${fu.id}`} style={dividerStyle}>
                        <div className="flex gap-3 py-3 px-2 -mx-2 items-center" style={{ opacity: 0.6 }}>
                          <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: "#e9f2eb" }}>
                            <Check size={14} style={{ color: "#3d7a4a" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "#71717a" }}>
                              Follow-up completed{dateStr ? ` · ${dateStr}` : ""}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                }
              }

              // Interaction row
              if (item.kind === "interaction") {
                const record = item.record;
                const type = record.connect_type;
                const TypeIcon = type ? (typeIcons[type] || ClipboardList) : ClipboardList;
                const verb = type ? (typeVerbs[type] || type) : "Connected";
                return (
                  <div key={`interaction-${record.id}`} style={dividerStyle}>
                    <div className={`flex gap-3 py-3 px-2 -mx-2 ${record.note && record.note.trim() ? "items-start" : "items-center"}`}>
                      <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 mt-0.5"
                        style={{ background: "#f0ede8" }}>
                        <TypeIcon size={14} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground"
                            style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}>
                            {verb}
                          </span>
                          <span className="text-muted-foreground"
                            style={{ fontFamily: "var(--font-body)", fontSize: "13px" }}>
                            {format(parseISO(record.connect_date || record.created_at), "MMM d")}
                          </span>
                        </div>
                        {record.note && record.note.trim() && (
                          <p className="line-clamp-2 mt-0.5"
                            style={{ color: "#777", fontFamily: "var(--font-heading)", fontSize: "13px", fontStyle: "italic" }}>
                            {record.note}
                          </p>
                        )}
                      </div>
                      {/* TODO Step 8: add pencil icon for inline interaction edit */}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      )}

      {isLoading && <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />)}</div>}

      {/* Footer */}
      {!isLoading && interactionCount > 0 && (
        <p className="text-center text-muted-foreground py-4" style={{ fontFamily: "var(--font-body)", fontSize: "12px" }}>
          {interactionCount} interaction{interactionCount !== 1 ? "s" : ""}{firstContactDate ? ` · First contact ${firstContactDate}` : ""}
        </p>
      )}

      {/* Sheets */}
      <LogInteractionSheet open={logSheetOpen} onOpenChange={setLogSheetOpen} preselectedContactId={id} />
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
