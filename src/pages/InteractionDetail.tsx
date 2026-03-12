import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Phone, Mail, MessageSquare, Users, Video,
  MoreHorizontal, Pencil, Trash2, ChevronDown, ChevronUp,
  CalendarIcon, X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const typeIcons: Record<string, typeof Phone> = {
  call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video,
};
const typeLabels: Record<string, string> = {
  call: "Call", email: "Email", text: "Text", meet: "Meeting", video: "Video",
};
const pastVerb: Record<string, string> = {
  call: "Called", email: "Emailed", text: "Texted", meet: "Met", video: "Video called",
};
const typeOptions = [
  { value: "call", icon: Phone, label: "Call" },
  { value: "email", icon: Mail, label: "Email" },
  { value: "text", icon: MessageSquare, label: "Text" },
  { value: "meet", icon: Users, label: "Meeting" },
  { value: "video", icon: Video, label: "Video" },
];

const InteractionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editConnectType, setEditConnectType] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editFollowUpType, setEditFollowUpType] = useState("");
  const [editFollowUpDate, setEditFollowUpDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteInteractionOpen, setDeleteInteractionOpen] = useState(false);
  const [followUpRemoved, setFollowUpRemoved] = useState(false);

  // Fetch interaction
  const { data: interaction, isLoading } = useQuery({
    queryKey: ["interaction-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select("*, contacts(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch linked follow-up
  const { data: followUp } = useQuery({
    queryKey: ["followup-for-interaction", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*")
        .eq("interaction_id", id!)
        .eq("completed", false)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Edit history for the linked follow-up
  const { data: editHistory } = useQuery({
    queryKey: ["follow-up-edits-for-interaction", followUp?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_up_edits")
        .select("*")
        .eq("follow_up_id", followUp!.id)
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!followUp?.id,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["interaction-detail", id] });
    queryClient.invalidateQueries({ queryKey: ["followup-for-interaction", id] });
    queryClient.invalidateQueries({ queryKey: ["interactions"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
    queryClient.invalidateQueries({ queryKey: ["followups-today"] });
    queryClient.invalidateQueries({ queryKey: ["followups-upcoming"] });
  };

  // Save edits
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update interaction
      const { error: intErr } = await supabase
        .from("interactions")
        .update({
          connect_type: editConnectType || null,
          note: editNote || null,
        })
        .eq("id", id!);
      if (intErr) throw intErr;

      // Handle follow-up
      if (followUp) {
        if (followUpRemoved) {
          const { error } = await supabase.from("follow_ups").delete().eq("id", followUp.id);
          if (error) throw error;
        } else if (editFollowUpType !== followUp.follow_up_type || editFollowUpDate !== followUp.due_date) {
          // Write edit history
          const { error: editErr } = await supabase.from("follow_up_edits").insert({
            follow_up_id: followUp.id,
            previous_type: followUp.follow_up_type,
            previous_due_date: followUp.due_date,
            user_id: user.id,
          });
          if (editErr) throw editErr;

          const { error } = await supabase
            .from("follow_ups")
            .update({ follow_up_type: editFollowUpType, due_date: editFollowUpDate })
            .eq("id", followUp.id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Changes saved");
      setIsEditing(false);
    },
    onError: (e) => toast.error(e.message),
  });

  // Delete interaction
  const deleteInteractionMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("interactions").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Interaction deleted");
      navigate(-1);
    },
    onError: (e) => toast.error(e.message),
  });

  const startEditing = () => {
    if (interaction) {
      setEditConnectType(interaction.connect_type || "");
      setEditNote(interaction.note || "");
      setEditFollowUpType(followUp?.follow_up_type || "");
      setEditFollowUpDate(followUp?.due_date || "");
      setFollowUpRemoved(false);
      setIsEditing(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
        <div className="h-8 w-20 bg-secondary animate-pulse rounded mb-6" />
        <div className="space-y-4">
          <div className="h-24 bg-secondary animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!interaction) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft size={18} /><span className="text-sm">Back</span>
        </button>
        <p className="text-muted-foreground text-center py-16">Interaction not found</p>
      </div>
    );
  }

  const contact = interaction.contacts as any;
  const connectType = interaction.connect_type;
  const ConnectIcon = connectType ? typeIcons[connectType] : null;
  const FollowUpIcon = followUp ? typeIcons[followUp.follow_up_type] : null;

  return (
    <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
      {/* Nav bar */}
      <div className="flex items-center justify-between mb-5">
        {isEditing ? (
          <>
            <button onClick={() => setIsEditing(false)} className="text-muted-foreground text-[13px]" style={{ fontFamily: "var(--font-body)" }}>
              Cancel
            </button>
            <span className="text-[15px] font-medium text-foreground" style={{ fontFamily: "var(--font-body)" }}>Editing</span>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="rounded-full px-4 py-1.5 text-[13px] font-medium text-primary-foreground"
              style={{ background: "#c8622a", fontFamily: "var(--font-body)" }}
            >
              {saveMutation.isPending ? "..." : "Save"}
            </button>
          </>
        ) : (
          <>
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
                <DropdownMenuItem onClick={startEditing}>
                  <Pencil size={14} className="mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteInteractionOpen(true)} className="text-destructive focus:text-destructive">
                  <Trash2 size={14} className="mr-2" /> Delete interaction
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      {/* Interaction card */}
      <div className="rounded-[14px] bg-card border border-border overflow-hidden mb-4" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}>
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "16px", lineHeight: "22px" }}>
              {contact ? `${contact.first_name} ${contact.last_name}`.trim() : "Unknown"}
            </p>
            {connectType && ConnectIcon && !isEditing && (
              <span
                className="inline-flex items-center gap-1"
                style={{ background: "#e8e4de", color: "#666", borderRadius: "20px", padding: "3px 9px", fontSize: "10px", fontWeight: 500 }}
              >
                <ConnectIcon size={10} />
                {pastVerb[connectType] || connectType} · {format(parseISO(interaction.date), "MMM d")}
              </span>
            )}
          </div>
          {isEditing ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((t) => {
                  const selected = editConnectType === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setEditConnectType(editConnectType === t.value ? "" : t.value)}
                      className={`inline-flex items-center gap-1.5 rounded-[20px] px-[13px] py-[7px] text-[11px] font-medium transition-colors ${
                        selected
                          ? "bg-[#fdf0e8] border-[1.5px] border-[#f0c4a8] text-[#c8622a]"
                          : "bg-white border-[1.5px] border-border text-muted-foreground"
                      }`}
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <t.icon size={13} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-[13px] text-foreground placeholder:text-muted-foreground min-h-[60px]"
                style={{ fontFamily: "var(--font-body)" }}
                placeholder="Add a note..."
              />
            </div>
          ) : (
            interaction.note && (
              <p className="text-[13px] text-foreground leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                {interaction.note}
              </p>
            )
          )}
        </div>
        {isEditing && (
          <div className="border-t border-border px-4 py-3">
            <button
              onClick={() => setDeleteInteractionOpen(true)}
              className="flex items-center gap-1 text-destructive text-[12px] font-medium"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <Trash2 size={12} /> Delete interaction
            </button>
          </div>
        )}
      </div>

      {/* Follow-up card */}
      {(followUp || (isEditing && !followUpRemoved)) && (
        <div className="rounded-[14px] bg-card border border-border overflow-hidden mb-4" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}>
          <div className="px-4 py-3">
            <p className="font-medium uppercase text-[#bbb] mb-2" style={{ fontFamily: "var(--font-body)", fontSize: "9px", letterSpacing: "0.1em" }}>
              Follow-up
            </p>
            {isEditing ? (
              followUpRemoved ? (
                <div className="py-2">
                  <p className="text-[13px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>No follow-up scheduled</p>
                  <button onClick={() => setFollowUpRemoved(false)} className="text-[12px] text-primary mt-1" style={{ fontFamily: "var(--font-body)" }}>+ Add</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {typeOptions.map((t) => {
                      const selected = editFollowUpType === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => setEditFollowUpType(t.value)}
                          className={`inline-flex items-center gap-1.5 rounded-[20px] px-[13px] py-[7px] text-[11px] font-medium transition-colors ${
                            selected
                              ? "bg-[#fdf0e8] border-[1.5px] border-[#f0c4a8] text-[#c8622a]"
                              : "bg-white border-[1.5px] border-border text-muted-foreground"
                          }`}
                          style={{ fontFamily: "var(--font-body)" }}
                        >
                          <t.icon size={13} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <button
                        className="inline-flex items-center gap-2 rounded-[12px] border-[1.5px] border-border px-4 py-[10px] text-[13px] font-medium text-foreground hover:border-[#f0c4a8] transition-colors"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        <CalendarIcon size={14} className="text-muted-foreground" />
                        {editFollowUpDate ? format(parseISO(editFollowUpDate), "EEE, MMM d, yyyy") : "Pick a date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editFollowUpDate ? new Date(editFollowUpDate + "T00:00:00") : undefined}
                        onSelect={(d) => { if (d) { setEditFollowUpDate(format(d, "yyyy-MM-dd")); setShowDatePicker(false); } }}
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <button
                    onClick={() => setFollowUpRemoved(true)}
                    className="flex items-center gap-1 text-destructive text-[12px] font-medium"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    <X size={12} /> Remove follow-up
                  </button>
                </div>
              )
            ) : followUp ? (
              <div className="flex items-center justify-between">
                <span
                  className="inline-flex items-center gap-1 rounded-[20px] px-[9px] py-[3px]"
                  style={{ background: "#fdf0e8", color: "#c8622a", fontSize: "10px", fontWeight: 500, fontFamily: "var(--font-body)" }}
                >
                  {FollowUpIcon && <FollowUpIcon size={10} />}
                  {typeLabels[followUp.follow_up_type] || followUp.follow_up_type} planned
                </span>
                <span className="text-[12px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                  Due {format(parseISO(followUp.due_date), "MMM d")}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Edit history */}
      {editHistory && editHistory.length > 0 && followUp && !isEditing && (
        <div className="rounded-[14px] bg-card border border-border overflow-hidden mb-4" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}>
          <button onClick={() => setHistoryOpen(!historyOpen)} className="w-full flex items-center justify-between px-4 py-3">
            <p className="font-medium uppercase text-[#bbb]" style={{ fontFamily: "var(--font-body)", fontSize: "9px", letterSpacing: "0.1em" }}>
              Follow-up edit history
            </p>
            {historyOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </button>
          {historyOpen && (
            <div className="border-t border-border px-4 py-2 space-y-2">
              <div className="flex items-center justify-between py-1">
                <span className="inline-flex items-center gap-1 rounded-[20px] px-[9px] py-[3px]" style={{ background: "#fdf0e8", color: "#c8622a", fontSize: "10px", fontWeight: 500, fontFamily: "var(--font-body)" }}>
                  {typeLabels[followUp.follow_up_type] || followUp.follow_up_type}
                </span>
                <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                  {format(parseISO(followUp.due_date), "MMM d, yyyy")} · current
                </span>
              </div>
              {editHistory.map((edit: any) => (
                <div key={edit.id} className="flex items-center justify-between py-1">
                  <span className="inline-flex items-center gap-1 rounded-[20px] px-[9px] py-[3px] line-through" style={{ background: "#f0ede8", color: "#999", fontSize: "10px", fontWeight: 500, fontFamily: "var(--font-body)" }}>
                    {typeLabels[edit.previous_type] || edit.previous_type}
                  </span>
                  <span className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                    {format(parseISO(edit.previous_due_date), "MMM d, yyyy")} · {format(parseISO(edit.changed_at), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete interaction confirmation */}
      <AlertDialog open={deleteInteractionOpen} onOpenChange={setDeleteInteractionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete interaction?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this interaction is permanent. The follow-up will remain (unlinked).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteInteractionMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete interaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InteractionDetail;
