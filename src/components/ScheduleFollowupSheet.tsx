import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, addWeeks } from "date-fns";
import { Phone, Mail, MessageSquare, Users, CalendarIcon } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const typeOptions = [
  { value: "call", icon: Phone, label: "Call" },
  { value: "email", icon: Mail, label: "Email" },
  { value: "meet", icon: Users, label: "Meeting" },
  { value: "text", icon: MessageSquare, label: "Other" },
];

const dateChips = [
  { label: "Today", date: () => format(new Date(), "yyyy-MM-dd") },
  { label: "Tomorrow", date: () => format(addDays(new Date(), 1), "yyyy-MM-dd") },
  { label: "Next week", date: () => format(addWeeks(new Date(), 1), "yyyy-MM-dd") },
];

interface ScheduleFollowupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
  interactionId?: string | null;
}

const ScheduleFollowupSheet = ({
  open,
  onOpenChange,
  contactId,
  contactName,
  interactionId,
}: ScheduleFollowupSheetProps) => {
  const queryClient = useQueryClient();
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("follow_ups").insert({
        contact_id: contactId,
        interaction_id: interactionId || null,
        follow_up_type: type,
        due_date: date,
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["followups-today"] });
      queryClient.invalidateQueries({ queryKey: ["followups-upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["followup-for-interaction"] });
      toast.success("Follow-up scheduled");
      handleClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setType("");
      setDate("");
      setNote("");
    }, 300);
  };

  const bothSelected = type && date;

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DrawerContent className="max-h-[85vh]">
        <div className="px-5 pt-4 pb-6 overflow-y-auto">
          <h2
            className="text-[20px] text-foreground mb-1"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Schedule a follow-up
          </h2>
          <p
            className="text-[13px] text-muted-foreground mb-5"
            style={{ fontFamily: "var(--font-body)" }}
          >
            with {contactName}
          </p>

          {/* Type */}
          <p
            className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Follow-up type
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {typeOptions.map((t) => {
              const selected = type === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setType(type === t.value ? "" : t.value)}
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

          {/* Date */}
          <p
            className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            When
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            {dateChips.map((chip) => {
              const chipDate = chip.date();
              const selected = date === chipDate;
              return (
                <button
                  key={chip.label}
                  onClick={() => {
                    setDate(date === chipDate ? "" : chipDate);
                    setShowDatePicker(false);
                  }}
                  className={`rounded-[20px] px-[13px] py-[7px] text-[11px] font-medium transition-colors ${
                    selected
                      ? "bg-[#fdf0e8] border-[1.5px] border-[#f0c4a8] text-[#c8622a]"
                      : "bg-white border-[1.5px] border-border text-muted-foreground"
                  }`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  {chip.label}
                </button>
              );
            })}
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button
                  className={`rounded-[20px] px-[13px] py-[7px] text-[11px] font-medium transition-colors inline-flex items-center gap-1 ${
                    showDatePicker
                      ? "bg-[#fdf0e8] border-[1.5px] border-[#f0c4a8] text-[#c8622a]"
                      : "bg-white border-[1.5px] border-border text-muted-foreground"
                  }`}
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <CalendarIcon size={12} />
                  Pick date
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
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Note */}
          <p
            className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Reminder note (optional)
          </p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-[12px] border-[1.5px] border-border bg-secondary px-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground min-h-[56px] resize-none outline-none focus:border-[#f0c4a8] transition-colors mb-5"
            style={{ fontFamily: "var(--font-body)" }}
            placeholder="e.g. Discuss Q3 proposal..."
          />

          <button
            onClick={() => mutation.mutate()}
            disabled={!bothSelected || mutation.isPending}
            className="w-full rounded-[13px] bg-primary text-primary-foreground py-[14px] text-[14px] font-semibold shadow-md disabled:opacity-[0.38] transition-opacity"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {mutation.isPending ? "Saving..." : "Schedule follow-up"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ScheduleFollowupSheet;
