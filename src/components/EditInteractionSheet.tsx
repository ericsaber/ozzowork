import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Mail, MessageSquare, Users, Video, CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const typeOptions = [
  { value: "call", icon: Phone, label: "Call" },
  { value: "email", icon: Mail, label: "Email" },
  { value: "text", icon: MessageSquare, label: "Text" },
  { value: "meet", icon: Users, label: "Meeting" },
  { value: "video", icon: Video, label: "Video" },
];

interface EditInteractionSheetProps {
  open: boolean;
  onClose: () => void;
  interaction: {
    id: string;
    date: string;
    connect_type: string | null;
    note: string | null;
    contact_id: string;
  };
  followUp?: {
    id: string;
    follow_up_type: string;
    due_date: string;
  } | null;
  contactId: string;
}

const EditInteractionSheet = ({ open, onClose, interaction, followUp, contactId }: EditInteractionSheetProps) => {
  const queryClient = useQueryClient();
  const [connectType, setConnectType] = useState(interaction.connect_type || "");
  const [date, setDate] = useState(format(parseISO(interaction.date), "yyyy-MM-dd"));
  const [note, setNote] = useState(interaction.note || "");
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Follow-up fields
  const [followUpType, setFollowUpType] = useState(followUp?.follow_up_type || "");
  const [followUpDate, setFollowUpDate] = useState(followUp?.due_date || "");
  const [showFollowUpDatePicker, setShowFollowUpDatePicker] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update the interaction
      const { error: intErr } = await supabase
        .from("interactions")
        .update({
          connect_type: connectType || null,
          note: note || null,
          date: new Date(date).toISOString(),
        })
        .eq("id", interaction.id);
      if (intErr) throw intErr;

      // If follow-up fields changed, update follow_ups and write edit history
      if (followUp && (followUpType !== followUp.follow_up_type || followUpDate !== followUp.due_date)) {
        // Write edit history
        const { error: editErr } = await supabase.from("follow_up_edits").insert({
          follow_up_id: followUp.id,
          previous_type: followUp.follow_up_type,
          previous_due_date: followUp.due_date,
          user_id: user.id,
        });
        if (editErr) throw editErr;

        // Update follow-up
        const { error: fuErr } = await supabase
          .from("follow_ups")
          .update({
            follow_up_type: followUpType,
            due_date: followUpDate,
          })
          .eq("id", followUp.id);
        if (fuErr) throw fuErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions", contactId] });
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["followups-today"] });
      queryClient.invalidateQueries({ queryKey: ["followups-upcoming"] });
      toast.success("Interaction updated");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="max-h-[90vh]">
        <div className="px-[18px] pt-[14px] pb-[12px] border-b border-border">
          <h2 className="text-[20px] text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Edit interaction
          </h2>
        </div>

        <div className="px-[18px] py-[14px] pb-[24px] overflow-y-auto space-y-5">
          {/* Connect type */}
          <div>
            <p className="font-medium uppercase tracking-[0.1em] mb-2" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
              How did you connect?
            </p>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((t) => {
                const selected = connectType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setConnectType(connectType === t.value ? "" : t.value)}
                    className={`inline-flex items-center gap-1.5 rounded-[20px] px-[13px] py-[7px] text-[13px] font-medium transition-colors ${
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
          </div>

          {/* Date */}
          <div>
            <p className="font-medium uppercase tracking-[0.1em] mb-2" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
              Date
            </p>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex items-center gap-2 rounded-[12px] border-[1.5px] border-border px-4 py-[10px] font-medium text-foreground hover:border-[#f0c4a8] transition-colors"
                  style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <CalendarIcon size={14} className="text-muted-foreground" />
                  {date ? format(parseISO(date), "EEE, MMM d, yyyy") : "Pick a date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date ? new Date(date + "T00:00:00") : undefined}
                  onSelect={(d) => {
                    if (d) {
                      setDate(format(d, "yyyy-MM-dd"));
                      setShowDatePicker(false);
                    }
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Note */}
          <div>
            <p className="font-medium uppercase tracking-[0.1em] mb-2" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
              Note
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-[12px] border-[1.5px] border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground min-h-[80px] resize-none outline-none focus:border-[#f0c4a8] transition-colors"
              style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}
              style={{ fontFamily: "var(--font-body)" }}
              placeholder="What happened?"
            />
          </div>

          {/* Follow-up section divider */}
          {followUp && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="font-medium uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
                  Follow-up
                </span>
                <div className="flex-1 border-t border-border" />
              </div>

              {/* Follow-up type */}
              <div>
                <p className="font-medium uppercase tracking-[0.1em] mb-2" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
                  Follow-up type
                </p>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((t) => {
                    const selected = followUpType === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => setFollowUpType(t.value)}
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
              </div>

              {/* Follow-up date */}
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>
                  Follow-up due date
                </p>
                <Popover open={showFollowUpDatePicker} onOpenChange={setShowFollowUpDatePicker}>
                  <PopoverTrigger asChild>
                    <button
                      className="inline-flex items-center gap-2 rounded-[12px] border-[1.5px] border-border px-4 py-[10px] text-[13px] font-medium text-foreground hover:border-[#f0c4a8] transition-colors"
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      <CalendarIcon size={14} className="text-muted-foreground" />
                      {followUpDate ? format(parseISO(followUpDate), "EEE, MMM d, yyyy") : "Pick a date"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={followUpDate ? new Date(followUpDate + "T00:00:00") : undefined}
                      onSelect={(d) => {
                        if (d) {
                          setFollowUpDate(format(d, "yyyy-MM-dd"));
                          setShowFollowUpDatePicker(false);
                        }
                      }}
                      disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          {/* Save */}
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full rounded-[13px] bg-primary text-primary-foreground py-[14px] text-[14px] font-semibold shadow-md transition-opacity disabled:opacity-[0.38]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {mutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditInteractionSheet;
