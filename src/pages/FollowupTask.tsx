import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft, Phone, Mail, MessageSquare, Users, Video,
  Check, MoreHorizontal, Pencil, Trash2, ChevronDown, ChevronUp,
  CalendarIcon, X,
} from "lucide-react";
import { format, parseISO, isToday, isPast } from "date-fns";
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

const FollowupTask = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editNote, setEditNote] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [deleteInteractionOpen, setDeleteInteractionOpen] = useState(false);
  const [followUpRemoved, setFollowUpRemoved] = useState(false);

  // Fetch follow-up
  const { data: followUp, isLoading } = useQuery({
    queryKey: ["follow-up", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_ups")
        .select("*, contacts(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch linked interaction
  const { data: interaction } = useQuery({
    queryKey: ["interaction-for-followup", followUp?.interaction_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interactions")
        .select("*")
        .eq("id", followUp!.interaction_id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!followUp?.interaction_id,
  });

  // Fetch edit history
  const { data: editHistory } = useQuery({
    queryKey: ["follow-up-edits", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("follow_up_edits")
        .select("*")
        .eq("follow_up_id", id!)
        .order("changed_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["follow-up", id] });
    queryClient.invalidateQueries({ queryKey: ["follow-up-edits", id] });
    queryClient.invalidateQueries({ queryKey: ["followups-today"] });
    queryClient.invalidateQueries({ queryKey: ["followups-upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
  };

  // Complete follow-up
  const completeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("follow_ups")
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Follow-up completed");
      navigate("/");
    },
    onError: (e) => toast.error(e.message),
  });

  // Save edits
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // If follow-up was removed
      if (followUpRemoved) {
        const { error } = await supabase.from("follow_ups").delete().eq("id", id!);
        if (error) throw error;
      } else if (editType !== followUp?.follow_up_type || editDate !== followUp?.due_date) {
        // Write edit history
        const { error: editErr } = await supabase.from("follow_up_edits").insert({
          follow_up_id: id!,
          previous_type: followUp!.follow_up_type,
          previous_due_date: followUp!.due_date,
          user_id: user.id,
        });
        if (editErr) throw editErr;

        const { error } = await supabase
          .from("follow_ups")
          .update({ follow_up_type: editType, due_date: editDate })
          .eq("id", id!);
        if (error) throw error;
      }

      // Update interaction note if changed
      if (interaction && editNote !== (interaction.note || "")) {
        const { error } = await supabase
          .from("interactions")
          .update({ note: editNote || null })
          .eq("id", interaction.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateAll();
      if (followUpRemoved) {
        toast.success("Follow-up removed");
        navigate(-1);
      } else {
        toast.success("Changes saved");
        setIsEditing(false);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  // Delete interaction
  const deleteInteractionMutation = useMutation({
    mutationFn: async () => {
      if (!interaction) throw new Error("No interaction");
      const { error } = await supabase.from("interactions").delete().eq("id", interaction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ["interaction-for-followup", followUp?.interaction_id] });
      toast.success("Interaction deleted");
      setDeleteInteractionOpen(false);
      setIsEditing(false);
    },
    onError: (e) => toast.error(e.message),
  });

  // Delete follow-up
  const deleteFollowupMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("follow_ups").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Follow-up deleted");
      navigate(-1);
    },
    onError: (e) => toast.error(e.message),
  });

  const startEditing = () => {
    if (followUp) {
      setEditType(followUp.follow_up_type);
      setEditDate(followUp.due_date);
      setEditNote(interaction?.note || "");
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
          <div className="h-40 bg-secondary animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  if (!followUp) {
    return (
      <div className="min-h-screen pb-24 px-4 pt-4 max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground mb-4">
          <ArrowLeft size={18} /><span className="text-sm">Back</span>
        </button>
        <p className="text-muted-foreground text-center py-16">Task not found</p>
      </div>
    );
  }

  const contact = followUp.contacts as any;
  const contactName = contact ? `${contact.first_name} ${contact.last_name}`.trim() : "Unknown";
  const dueDate = parseISO(followUp.due_date);
  const overdue = isPast(dueDate) && !isToday(dueDate);
  const isDueToday = isToday(dueDate);
  const TypeIcon = typeIcons[followUp.follow_up_type] || MessageSquare;
  const connectType = interaction?.connect_type;
  const ConnectIcon = connectType ? typeIcons[connectType] : null;

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
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem onClick={startEditing}>
                  <Pencil size={14} className="mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => deleteFollowupMutation.mutate()} className="text-destructive focus:text-destructive">
                  <Trash2 size={14} className="mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>

      <p className="font-medium uppercase text-muted-foreground mb-3" style={{ fontFamily: "var(--font-body)", fontSize: "9px", letterSpacing: "0.1em" }}>
        Follow-up Task
      </p>

      {/* Follow-up card */}
      <div className="rounded-[14px] bg-card border border-border overflow-hidden mb-4" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}>
        <div className="flex items-start gap-3 p-4">
          {/* Check circle */}
          {!isEditing && (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="w-[26px] h-[26px] rounded-full border-[1.5px] border-[#e8e4de] flex items-center justify-center shrink-0 transition-colors hover:border-[hsl(142,60%,40%)] hover:bg-[hsl(142,60%,40%)]/10 group mt-0.5"
            >
              <Check size={12} strokeWidth={2.5} className="text-[#ccc] group-hover:text-[hsl(142,60%,40%)] transition-colors" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            {followUpRemoved ? (
              <div className="py-2">
                <p className="text-[13px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>No follow-up scheduled</p>
                <button
                  onClick={() => setFollowUpRemoved(false)}
                  className="text-[12px] text-primary mt-1"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  + Add
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => contact && navigate(`/contact/${contact.id}`)}
                  className="font-medium text-foreground hover:underline text-left"
                  style={{ fontFamily: "var(--font-body)", fontSize: "16px", lineHeight: "22px" }}
                >
                  {contactName}
                </button>
                {contact?.company && (
                  <p className="text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontSize: "12px", lineHeight: "16px" }}>
                    {contact.company}
                  </p>
                )}

                {/* Inline edit fields */}
                {isEditing && (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {typeOptions.map((t) => {
                        const selected = editType === t.value;
                        return (
                          <button
                            key={t.value}
                            onClick={() => setEditType(t.value)}
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
                          {editDate ? format(parseISO(editDate), "EEE, MMM d, yyyy") : "Pick a date"}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={editDate ? new Date(editDate + "T00:00:00") : undefined}
                          onSelect={(d) => { if (d) { setEditDate(format(d, "yyyy-MM-dd")); setShowDatePicker(false); } }}
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
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer strip */}
        {!followUpRemoved && !isEditing && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <span
              className="inline-flex items-center gap-1 rounded-[20px] px-[9px] py-[3px]"
              style={{
                background: "#fdf0e8",
                color: "#c8622a",
                fontSize: "10px",
                fontWeight: 500,
                fontFamily: "var(--font-body)",
              }}
            >
              <TypeIcon size={10} />
              {typeLabels[followUp.follow_up_type] || followUp.follow_up_type} planned
            </span>
            <span
              className="text-[12px] font-medium"
              style={{
                color: overdue ? "hsl(8,72%,51%)" : isDueToday ? "hsl(142,60%,40%)" : "hsl(var(--muted-foreground))",
                fontFamily: "var(--font-body)",
              }}
            >
              {overdue ? "Overdue" : isDueToday ? "Due today" : `Due ${format(dueDate, "MMM d")}`}
            </span>
          </div>
        )}
      </div>

      {/* Last connect card */}
      {interaction && (
        <div className="rounded-[14px] bg-card border border-border overflow-hidden mb-4" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}>
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium uppercase text-[#bbb]" style={{ fontFamily: "var(--font-body)", fontSize: "9px", letterSpacing: "0.1em" }}>
                Last connect
              </p>
              {connectType && ConnectIcon && (
                <span
                  className="inline-flex items-center gap-1"
                  style={{
                    background: "#e8e4de",
                    color: "#666",
                    borderRadius: "20px",
                    padding: "3px 9px",
                    fontSize: "10px",
                    fontWeight: 500,
                  }}
                >
                  <ConnectIcon size={10} />
                  {pastVerb[connectType] || connectType} · {format(parseISO(interaction.date), "MMM d")}
                </span>
              )}
            </div>
            {isEditing ? (
              <textarea
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="w-full bg-transparent border-none outline-none resize-none text-[13px] text-foreground placeholder:text-muted-foreground min-h-[60px]"
                style={{ fontFamily: "var(--font-body)" }}
                placeholder="Add a note..."
              />
            ) : (
              interaction.note && (
                <p className="text-[13px] text-foreground leading-relaxed" style={{ fontFamily: "var(--font-body)" }}>
                  {interaction.note}
                </p>
              )
            )}
          </div>

          {/* Delete interaction button in edit mode */}
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
      )}

      {/* Follow-up edit history */}
      {editHistory && editHistory.length > 0 && !isEditing && (
        <div className="rounded-[14px] bg-card border border-border overflow-hidden mb-4" style={{ boxShadow: "0 1px 5px rgba(0,0,0,.06)" }}>
          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <p className="font-medium uppercase text-[#bbb]" style={{ fontFamily: "var(--font-body)", fontSize: "9px", letterSpacing: "0.1em" }}>
              Follow-up edit history
            </p>
            {historyOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </button>
          {historyOpen && (
            <div className="border-t border-border px-4 py-2 space-y-3">
              {/* Current */}
              {(() => {
                const CurrentIcon = typeIcons[followUp.follow_up_type] || MessageSquare;
                const mostRecentEdit = editHistory[0];
                return (
                  <div className="flex items-start gap-3 py-1">
                    <span
                      className="inline-flex items-center gap-1 rounded-[20px] px-[9px] py-[3px] shrink-0 mt-0.5"
                      style={{ background: "#fdf0e8", color: "#c8622a", fontSize: "10px", fontWeight: 500, fontFamily: "var(--font-body)" }}
                    >
                      <CurrentIcon size={10} />
                      {typeLabels[followUp.follow_up_type] || followUp.follow_up_type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-foreground" style={{ fontFamily: "var(--font-body)", fontWeight: 500, lineHeight: "16px" }}>
                        {format(parseISO(followUp.due_date), "MMM d")} · current
                      </p>
                      <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-body)", lineHeight: "14px" }}>
                        Changed {format(parseISO(mostRecentEdit.changed_at), "MMM d 'at' h:mma").toLowerCase().replace(/ at /, " at ")}
                      </p>
                    </div>
                  </div>
                );
              })()}
              {/* Previous edits */}
              {editHistory.map((edit: any, index: number) => {
                const isOriginal = index === editHistory.length - 1;
                const label = isOriginal ? "original" : "revised";
                const EditIcon = typeIcons[edit.previous_type] || MessageSquare;
                return (
                  <div key={edit.id} className="flex items-start gap-3 py-1">
                    <span
                      className="inline-flex items-center gap-1 rounded-[20px] px-[9px] py-[3px] shrink-0 mt-0.5"
                      style={{ background: "#f0ede8", color: "#999", fontSize: "10px", fontWeight: 500, fontFamily: "var(--font-body)" }}
                    >
                      <EditIcon size={10} />
                      <span className="line-through">{typeLabels[edit.previous_type] || edit.previous_type}</span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)", fontWeight: 500, lineHeight: "16px" }}>
                        <span className="line-through">{format(parseISO(edit.previous_due_date), "MMM d")}</span> · {label}
                      </p>
                      <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-body)", lineHeight: "14px" }}>
                        {isOriginal
                          ? `Set when logged ${format(parseISO(interaction?.date || followUp.created_at), "MMM d")}`
                          : `Changed ${format(parseISO(edit.changed_at), "MMM d 'at' h:mma").toLowerCase().replace(/ at /, " at ")}`
                        }
                      </p>
                    </div>
                  </div>
                );
              })}
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
              Deleting this interaction is permanent, but the follow-up will remain (unlinked).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteInteractionMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete interaction
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FollowupTask;
