import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Phone, Mail, MessageSquare, Users, Video,
  Plus, Pencil, Trash2, X, MoreHorizontal, Check, ArrowRight,
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
import EditInteractionDialog from "@/components/EditInteractionDialog";
import ContactFollowupCard from "@/components/ContactFollowupCard";
import RescheduleSheet from "@/components/RescheduleSheet";
import CompleteFollowupSheet from "@/components/CompleteFollowupSheet";
import { toast } from "sonner";
import { format, parseISO, isBefore, startOfToday, isToday } from "date-fns";

const typeVerbs: Record<string, string> = {
  call: "Called",
  email: "Emailed",
  text: "Texted",
  meet: "Met",
  video: "Video called",
};

const typeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  call: Phone,
  email: Mail,
  text: MessageSquare,
  meet: Users,
  video: Video,
};

const typeLabels: Record<string, string> = {
  call: "Call",
  email: "Email",
  text: "Text",
  meet: "Meet",
  video: "Video",
};

const ContactHistory = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = startOfToday();

  // State
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", company: "", phone: "", email: "" });
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingInteraction, setEditingInteraction] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  const [rescheduleInteraction, setRescheduleInteraction] = useState<any | null>(null);
  const [logItInteraction, setLogItInteraction] = useState<any | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  // Queries
  const { data: contact } = useQuery({
    queryKey: ["contact", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: interactions, isLoading } = useQuery({
    queryKey: ["interactions", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select("*")
        .eq("contact_id", id!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Mutations
  const updateContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contacts").update({
        first_name: form.first_name, last_name: form.last_name,
        company: form.company || null, phone: form.phone || null, email: form.email || null,
      }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact", id] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setEditing(false);
      toast.success("Contact updated");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contacts").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
      navigate("/contacts", { replace: true });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteInteraction = useMutation({
    mutationFn: async (interactionId: string) => {
      const { error } = await supabase.from("interactions").delete().eq("id", interactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions", id] });
      queryClient.invalidateQueries({ queryKey: ["followups-today"] });
      queryClient.invalidateQueries({ queryKey: ["followups-upcoming"] });
      toast.success("Deleted");
      setDeleteConfirmId(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const startEditing = () => {
    if (contact) {
      setForm({
        first_name: contact.first_name, last_name: contact.last_name,
        company: contact.company || "", phone: contact.phone || "", email: contact.email || "",
      });
      setEditing(true);
    }
  };

  const fullName = contact ? `${contact.first_name} ${contact.last_name}`.trim() : "";
  const initials = fullName
    ? fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  // Categorize interactions
  const todayStr = format(today, "yyyy-MM-dd");
  const upcomingFollowups = (interactions || []).filter(
    (i) => i.follow_up_date && i.follow_up_date >= todayStr
  ).sort((a, b) => a.follow_up_date!.localeCompare(b.follow_up_date!));

  const overdueFollowups = (interactions || []).filter(
    (i) => i.follow_up_date && i.follow_up_date < todayStr
  ).sort((a, b) => a.follow_up_date!.localeCompare(b.follow_up_date!));

  // All interactions for history, sorted newest first (already sorted from query)
  const allInteractions = interactions || [];

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
        <ArrowLeft size={18} />
        <span className="text-sm" style={{ fontFamily: "var(--font-body)" }}>Back</span>
      </button>

      {contact && !editing && (
        <div className="text-center mb-6 animate-fade-in">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <span className="text-xl font-semibold text-secondary-foreground">{initials}</span>
          </div>
          {/* Name */}
          <h1 className="text-2xl text-foreground" style={{ fontFamily: "var(--font-heading)" }}>{fullName}</h1>
          {contact.company && (
            <p className="text-muted-foreground text-sm" style={{ fontFamily: "var(--font-body)" }}>{contact.company}</p>
          )}

          {/* ⋯ circle button */}
          <div className="flex justify-center mt-3">
            <DropdownMenu open={openMenuId === "contact-menu"} onOpenChange={(o) => setOpenMenuId(o ? "contact-menu" : null)}>
              <DropdownMenuTrigger asChild>
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center border-[1.5px] border-border transition-colors"
                  style={{ background: "#f0ede8" }}
                >
                  <MoreHorizontal size={16} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="min-w-[160px]">
                <DropdownMenuItem onClick={startEditing}>
                  <Pencil size={14} className="mr-2" /> Edit contact
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteContactOpen(true)} className="text-destructive focus:text-destructive">
                  <Trash2 size={14} className="mr-2" /> Delete contact
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Action row */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => navigate(`/log?contact=${id}`)}
              className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-[9px] text-[12px] font-medium text-primary-foreground shadow-sm"
              style={{ background: "#c8622a", border: "1px solid #c8622a", fontFamily: "var(--font-body)" }}
            >
              <Plus size={14} /> Log
            </button>
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-border px-4 py-[9px] text-[12px] font-medium text-muted-foreground"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <Phone size={14} /> Call
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-border px-4 py-[9px] text-[12px] font-medium text-muted-foreground"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <Mail size={14} /> Email
              </a>
            )}
            {contact.phone && (
              <a
                href={`sms:${contact.phone}`}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-border px-4 py-[9px] text-[12px] font-medium text-muted-foreground"
                style={{ fontFamily: "var(--font-body)" }}
              >
                <MessageSquare size={14} /> Text
              </a>
            )}
          </div>
        </div>
      )}

      {/* Inline edit form */}
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

      {/* Next follow-up section */}
      {upcomingFollowups.length > 0 && (
        <div className="mb-5">
          <p
            className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Next follow-up
          </p>
          <div className="space-y-3">
            {upcomingFollowups.map((interaction) => (
              <ContactFollowupCard
                key={interaction.id}
                interaction={interaction}
                variant="upcoming"
                onLogIt={() => setLogItInteraction(interaction)}
                onEdit={() => { setOpenMenuId(null); setEditingInteraction(interaction); }}
                onDelete={() => { setOpenMenuId(null); setDeleteConfirmId(interaction.id); }}
                menuOpen={openMenuId === `card-${interaction.id}`}
                onMenuOpenChange={(o) => setOpenMenuId(o ? `card-${interaction.id}` : null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Overdue section */}
      {overdueFollowups.length > 0 && (
        <div className="mb-5">
          <p
            className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Overdue
          </p>
          <div className="space-y-3">
            {overdueFollowups.map((interaction) => (
              <ContactFollowupCard
                key={interaction.id}
                interaction={interaction}
                variant="overdue"
                onLogIt={() => setLogItInteraction(interaction)}
                onReschedule={() => setRescheduleInteraction(interaction)}
                onEdit={() => { setOpenMenuId(null); setEditingInteraction(interaction); }}
                onDelete={() => { setOpenMenuId(null); setDeleteConfirmId(interaction.id); }}
                menuOpen={openMenuId === `card-${interaction.id}`}
                onMenuOpenChange={(o) => setOpenMenuId(o ? `card-${interaction.id}` : null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Interaction history */}
      {!isLoading && allInteractions.length > 0 && (
        <div className="mb-5">
          <p
            className="text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Interaction history
          </p>
          <div className="space-y-0">
            {allInteractions.map((item) => {
              const type = item.connect_type || item.planned_follow_up_type;
              const TypeIcon = typeIcons[type] || MessageSquare;
              const verb = typeVerbs[type] || type;
              const hasFollowUp = item.follow_up_date;
              const isResolved = !item.follow_up_date;
              // Show follow-up indicator if the interaction had a follow_up_date set at some point
              // We can detect "was resolved" by checking if connect_type is set (meaning it was logged)
              const showFollowUpIndicator = item.follow_up_date || item.connect_type;

              return (
                <div key={item.id} className="flex gap-3 py-3 group">
                  {/* Icon */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "#f0ede8" }}
                  >
                    <TypeIcon size={14} className="text-muted-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        {verb}
                      </span>
                      <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                        {format(parseISO(item.date), "MMM d, yyyy")}
                      </span>
                    </div>
                    {item.note && (
                      <p className="text-[11px] line-clamp-2 mt-0.5" style={{ color: "#777", fontFamily: "var(--font-body)" }}>
                        {item.note}
                      </p>
                    )}
                    {/* Follow-up indicator */}
                    {hasFollowUp && (
                      <div className="flex items-center gap-1 mt-1">
                        <ArrowRight size={10} className="text-primary" />
                        <span className="text-[10px] text-primary" style={{ fontFamily: "var(--font-body)" }}>
                          Follow-up {format(parseISO(item.follow_up_date!), "MMM d")} · {typeLabels[item.planned_follow_up_type] || item.planned_follow_up_type}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Dots menu */}
                  <DropdownMenu
                    open={openMenuId === `history-${item.id}`}
                    onOpenChange={(o) => setOpenMenuId(o ? `history-${item.id}` : null)}
                  >
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 text-[#aaa] hover:text-[#666] transition-colors shrink-0 self-start opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <MoreHorizontal size={16} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[140px]">
                      <DropdownMenuItem onClick={() => { setOpenMenuId(null); setEditingInteraction(item); }}>
                        <Pencil size={14} className="mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => { setOpenMenuId(null); setDeleteConfirmId(item.id); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 size={14} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-secondary animate-pulse" />
          ))}
        </div>
      )}

      {/* Edit interaction dialog */}
      {editingInteraction && (
        <EditInteractionDialog
          interaction={editingInteraction}
          open={!!editingInteraction}
          onClose={() => setEditingInteraction(null)}
          contactId={id!}
        />
      )}

      {/* Delete interaction confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(o) => { if (!o) setDeleteConfirmId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete interaction?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteInteraction.mutate(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete contact confirmation */}
      <AlertDialog open={deleteContactOpen} onOpenChange={setDeleteContactOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {fullName} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteContact.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reschedule sheet */}
      {rescheduleInteraction && contact && (
        <RescheduleSheet
          open={!!rescheduleInteraction}
          onOpenChange={(o) => { if (!o) setRescheduleInteraction(null); }}
          interactionId={rescheduleInteraction.id}
          contactName={fullName}
          currentType={rescheduleInteraction.planned_follow_up_type}
          dueDate={rescheduleInteraction.follow_up_date || ""}
          contactId={id!}
        />
      )}

      {/* Log it sheet */}
      {logItInteraction && contact && session && (
        <CompleteFollowupSheet
          open={!!logItInteraction}
          onOpenChange={(o) => { if (!o) setLogItInteraction(null); }}
          interactionId={logItInteraction.id}
          contactId={id!}
          contactName={fullName}
          interactionType={logItInteraction.planned_follow_up_type}
          userId={session.user.id}
        />
      )}
    </div>
  );
};

export default ContactHistory;
