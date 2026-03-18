import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Mail, MessageSquare, Users, Video, Clock, CalendarIcon } from "lucide-react";
import { addDays, addWeeks, format, parseISO } from "date-fns";
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

const dateChips = [
  { label: "Tomorrow", date: () => format(addDays(new Date(), 1), "yyyy-MM-dd") },
  { label: "3 days", date: () => format(addDays(new Date(), 3), "yyyy-MM-dd") },
  { label: "1 week", date: () => format(addWeeks(new Date(), 1), "yyyy-MM-dd") },
  { label: "2 weeks", date: () => format(addWeeks(new Date(), 2), "yyyy-MM-dd") },
];

interface RescheduleSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskRecordId: string;
  contactName: string;
  currentType: string;
  dueDate: string;
  contactId: string;
}

const RescheduleSheet = ({
  open,
  onOpenChange,
  taskRecordId,
  contactName,
  currentType,
  dueDate,
  contactId,
}: RescheduleSheetProps) => {
  const queryClient = useQueryClient();
  const [followUpType, setFollowUpType] = useState(currentType);
  const [selectedDate, setSelectedDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const typeLabel = currentType ? currentType.charAt(0).toUpperCase() + currentType.slice(1) : "Planned";
  const dueDateFormatted = dueDate ? format(parseISO(dueDate), "MMM d") : "";

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Write edit history
      await supabase.from("follow_up_edits" as any).insert({
        follow_up_id: null,
        task_record_id: taskRecordId,
        previous_type: currentType,
        previous_due_date: dueDate,
        user_id: user.id,
      });

      // Update task record
      const { error } = await supabase.from("task_records" as any)
        .update({
          planned_follow_up_type: followUpType,
          planned_follow_up_date: selectedDate,
        })
        .eq("id", taskRecordId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-records"] });
      queryClient.invalidateQueries({ queryKey: ["task-record"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-upcoming"] });
      toast.success("Follow-up rescheduled");
      handleClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setFollowUpType(currentType);
      setSelectedDate("");
    }, 300);
  };

  const bothSelected = followUpType && selectedDate;

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DrawerContent className="max-h-[90vh]">
        <div className="px-[18px] pt-[14px] pb-[12px] border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[hsl(8,80%,96%)] flex items-center justify-center shrink-0">
              <Clock size={16} className="text-[hsl(12,70%,52%)]" />
            </div>
            <div>
              <h2 className="text-[18px] text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                Reschedule
              </h2>
              <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                {typeLabel} with <span className="font-medium text-foreground">{contactName}</span> · was due {dueDateFormatted}
              </p>
            </div>
          </div>
        </div>

        <div className="px-[18px] py-[14px] pb-[24px] overflow-y-auto space-y-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>
              How will you follow up?
            </p>
            <div className="flex flex-wrap gap-2">
              {typeOptions.map((t) => {
                const selected = followUpType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setFollowUpType(followUpType === t.value ? "" : t.value)}
                    className={`inline-flex items-center gap-1.5 rounded-[20px] px-[13px] py-[7px] text-[11px] font-medium transition-colors ${
                      selected
                        ? "bg-[#f5ede7] border-[1.5px] border-[#e8c4a8] text-[#c8622a]"
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

          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>
              When?
            </p>
            <div className="flex flex-wrap gap-2">
              {dateChips.map((chip) => {
                const chipDate = chip.date();
                const selected = selectedDate === chipDate;
                return (
                  <button
                    key={chip.label}
                    onClick={() => { setSelectedDate(selectedDate === chipDate ? "" : chipDate); setShowDatePicker(false); }}
                    className={`rounded-[20px] px-[13px] py-[7px] text-[11px] font-medium transition-colors ${
                      selected
                        ? "bg-[#f5ede7] border-[1.5px] border-[#e8c4a8] text-[#c8622a]"
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
                        ? "bg-[#f5ede7] border-[1.5px] border-[#e8c4a8] text-[#c8622a]"
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
                    selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
                    onSelect={(date) => { if (date) { setSelectedDate(format(date, "yyyy-MM-dd")); setShowDatePicker(false); } }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={!bothSelected || mutation.isPending}
            className="w-full rounded-[13px] bg-primary text-primary-foreground py-[14px] text-[14px] font-semibold shadow-md transition-opacity disabled:opacity-[0.38]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {mutation.isPending ? "Saving..." : "Save new date"}
          </button>

          <button
            onClick={handleClose}
            disabled={mutation.isPending}
            className="w-full text-center text-[13px] text-muted-foreground underline py-1"
            style={{ fontFamily: "var(--font-body)" }}
          >
            Cancel
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RescheduleSheet;
