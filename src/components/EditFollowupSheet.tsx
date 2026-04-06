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

interface EditFollowupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  followUp: {
    id: string;
    planned_type: string | null;
    planned_date: string;
    reminder_note: string | null;
    created_at: string;
    contact_id: string;
  };
}

const EditFollowupSheet = ({ open, onOpenChange, followUp }: EditFollowupSheetProps) => {
  const queryClient = useQueryClient();
  const [followUpType, setFollowUpType] = useState(followUp.planned_type || "");
  const [selectedDate, setSelectedDate] = useState(followUp.planned_date);
  const [reminderNote, setReminderNote] = useState(followUp.reminder_note || "");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const originalDate = format(parseISO(followUp.created_at), "MMM d");
  const originalType = followUp.planned_type
    ? followUp.planned_type.charAt(0).toUpperCase() + followUp.planned_type.slice(1)
    : null;

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const dateChanged = selectedDate !== followUp.planned_date;

      // Only insert follow_up_edits if planned_date changed
      if (dateChanged) {
        const { error: editErr } = await supabase.from("follow_up_edits").insert({
          follow_up_id: followUp.id,
          previous_type: followUp.planned_type || null,
          previous_due_date: followUp.planned_date,
          user_id: user.id,
        });
        if (editErr) throw editErr;
        console.log("[EditFollowupSheet] follow_up_edits inserted:", {
          follow_up_id: followUp.id,
          previous_due_date: followUp.planned_date,
        });
      }

      // Always update the follow-up
      const { error } = await supabase
        .from("follow_ups")
        .update({
          planned_type: followUpType || null,
          planned_date: selectedDate,
          reminder_note: reminderNote || null,
        })
        .eq("id", followUp.id);
      if (error) throw error;
      console.log("[EditFollowupSheet] follow_up updated:", {
        id: followUp.id,
        planned_type: followUpType,
        planned_date: selectedDate,
        date_changed: dateChanged,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["follow-ups-active"] });
      queryClient.invalidateQueries({ queryKey: ["follow-ups-today"] });
      queryClient.invalidateQueries({ queryKey: ["follow-ups-upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["interactions", followUp.contact_id] });
      toast.success("Follow-up updated");
      handleClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setFollowUpType(followUp.planned_type || "");
      setSelectedDate(followUp.planned_date);
      setReminderNote(followUp.reminder_note || "");
    }, 300);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DrawerContent className="max-h-[90vh]">
        <div className="px-[18px] pt-[14px] pb-[12px] border-b border-border">
          <h2 className="text-[20px] text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Edit follow-up
          </h2>
          <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
            Originally set {originalDate}{originalType ? ` · ${originalType}` : ""}
          </p>
        </div>

        <div className="px-[18px] py-[14px] pb-[24px] overflow-y-auto space-y-5">
          {/* Type pills */}
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
                    onClick={() => setFollowUpType(followUpType === t.value ? "" : t.value)}
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

          {/* Due date */}
          <div>
            <p className="font-medium uppercase tracking-[0.1em] mb-2" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
              Due date
            </p>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex items-center gap-2 rounded-[12px] border-[1.5px] border-border px-4 py-[10px] font-medium text-foreground hover:border-[#f0c4a8] transition-colors"
                  style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}
                >
                  <CalendarIcon size={14} className="text-muted-foreground" />
                  {selectedDate ? format(parseISO(selectedDate), "EEE, MMM d, yyyy") : "Pick a date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(format(date, "yyyy-MM-dd"));
                      setShowDatePicker(false);
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Reminder note */}
          <div>
            <p className="font-medium uppercase tracking-[0.1em] mb-2"
              style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
              Reminder note
            </p>
            <input
              type="text"
              value={reminderNote}
              onChange={(e) => {
                if (e.target.value.length <= 44) setReminderNote(e.target.value);
              }}
              maxLength={44}
              placeholder="Optional short note…"
              className="w-full rounded-[12px] border-[1.5px] border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none focus:border-[#f0c4a8] transition-colors"
              style={{ fontFamily: "var(--font-body)", fontSize: "14px" }}
            />
            <p className="text-right mt-1" style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#bbb" }}>
              {reminderNote.length}/44
            </p>
          </div>

          {/* Save */}
          <button
            onClick={() => mutation.mutate()}
            disabled={!selectedDate || mutation.isPending}
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

export default EditFollowupSheet;
