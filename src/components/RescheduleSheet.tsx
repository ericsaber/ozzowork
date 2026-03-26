import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Mail, MessageSquare, Users, Video, Clock, CalendarIcon } from "lucide-react";
import { addDays, addWeeks, format, parseISO, getYear } from "date-fns";
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
  { label: "Today", date: () => format(new Date(), "yyyy-MM-dd") },
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
  const [followUpType, setFollowUpType] = useState(currentType || "");
  const [selectedDate, setSelectedDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Via row starts activated if currentType exists
  const [viaActivated, setViaActivated] = useState(!!currentType);

  const typeLabel = currentType ? currentType.charAt(0).toUpperCase() + currentType.slice(1) : "Planned";
  const dueDateFormatted = dueDate ? format(parseISO(dueDate), "MMM d") : "";

  // Pre-select existing date chip on mount
  useEffect(() => {
    if (open && dueDate) {
      setFollowUpType(currentType || "");
      setViaActivated(!!currentType);
      // Check if dueDate matches a standard chip
      const matchingChip = dateChips.find((chip) => chip.date() === dueDate);
      setSelectedDate(matchingChip ? dueDate : dueDate);
    }
  }, [open, dueDate, currentType]);

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
          planned_follow_up_type: followUpType || null,
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
      setFollowUpType(currentType || "");
      setSelectedDate("");
      setViaActivated(!!currentType);
    }, 300);
  };

  const handleChipClick = (chipDate: string) => {
    const newDate = selectedDate === chipDate ? "" : chipDate;
    setSelectedDate(newDate);
    if (newDate && !viaActivated) setViaActivated(true);
    setShowDatePicker(false);
  };

  const handleViaPillClick = (value: string) => {
    if (!viaActivated) setViaActivated(true);
    setFollowUpType(followUpType === value ? "" : value);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DrawerContent className="max-h-[90vh]">
        <div className="px-[18px] pt-[14px] pb-[12px] border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-[hsl(8,80%,96%)] flex items-center justify-center shrink-0">
              <Clock size={16} className="text-[hsl(12,70%,52%)]" />
            </div>
            <div>
              <h2 className="text-[20px] text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                Reschedule
              </h2>
              <p className="text-[11px] text-muted-foreground" style={{ fontFamily: "var(--font-body)" }}>
                {typeLabel} with <span className="font-medium text-foreground">{contactName}</span> · was due {dueDateFormatted}
              </p>
            </div>
          </div>
        </div>

        <div className="px-[18px] py-[14px] pb-[24px] overflow-y-auto space-y-5">
          {/* Single card matching ScheduleFollowupSheet */}
          <div
            className="rounded-[14px]"
            style={{
              background: "#fff",
              border: "0.5px solid rgba(28,24,18,0.11)",
              padding: "13px 14px",
            }}
          >
            {/* Date section */}
            <p
              className="font-semibold uppercase tracking-[0.1em] mb-[10px]"
              style={{ fontSize: "11px", color: "#999", fontFamily: "var(--font-body)" }}
            >
              Next connect
            </p>
            <div className="flex flex-wrap gap-2">
              {dateChips.map((chip) => {
                const chipDate = chip.date();
                const selected = selectedDate === chipDate;
                return (
                  <button
                    key={chip.label}
                    onClick={() => handleChipClick(chipDate)}
                    className="transition-colors"
                    style={{
                      borderRadius: "100px",
                      padding: "8px 13px",
                      fontSize: "12px",
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      ...(selected
                        ? { background: "#c8622a", color: "#fff", border: "0.5px solid transparent" }
                        : { background: "#f0ede8", color: "#1c1812", border: "0.5px solid rgba(28,24,18,0.11)" }),
                    }}
                  >
                    {chip.label}
                  </button>
                );
              })}
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <button
                    className="inline-flex items-center gap-1 transition-colors"
                    style={{
                      borderRadius: "100px",
                      padding: "8px 13px",
                      fontSize: "12px",
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      ...(showDatePicker
                        ? { background: "#c8622a", color: "#fff", border: "0.5px solid transparent" }
                        : { background: "#f0ede8", color: "#1c1812", border: "0.5px solid rgba(28,24,18,0.11)" }),
                    }}
                  >
                    <CalendarIcon size={13} />
                    Pick date
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(format(date, "yyyy-MM-dd"));
                        if (!viaActivated) setViaActivated(true);
                        setShowDatePicker(false);
                      }
                    }}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {/* Custom date chip when selected date doesn't match any standard chip */}
              {selectedDate && !dateChips.some((chip) => chip.date() === selectedDate) && (() => {
                const parsed = parseISO(selectedDate);
                const label = getYear(parsed) === getYear(new Date()) ? format(parsed, "EEE, MMM d") : format(parsed, "EEE, MMM d, yyyy");
                return (
                  <button
                    onClick={() => setSelectedDate("")}
                    className="inline-flex items-center gap-1.5 transition-colors"
                    style={{
                      borderRadius: "100px",
                      padding: "8px 13px",
                      fontSize: "12px",
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      background: "#c8622a",
                      color: "#fff",
                      border: "0.5px solid transparent",
                    }}
                  >
                    <CalendarIcon size={13} />
                    {label}
                    <span className="ml-1 text-[14px] leading-none opacity-70">×</span>
                  </button>
                );
              })()}
            </div>

            {/* Divider */}
            <div style={{ height: "0.5px", background: "rgba(28,24,18,0.11)", margin: "11px 0" }} />

            {/* Via row */}
            <div
              className="flex items-center gap-2.5"
              style={{
                opacity: viaActivated ? 1 : 0.38,
                transition: "opacity 0.2s ease",
              }}
            >
              <span
                className="shrink-0"
                style={{ fontSize: "11px", color: "#b0a89e", fontFamily: "var(--font-body)" }}
              >
                via
              </span>
              <div className="flex items-center gap-2">
                {typeOptions.map((t) => {
                  const selected = followUpType === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => handleViaPillClick(t.value)}
                      className="flex items-center justify-center transition-colors"
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        ...(selected
                          ? { background: "#c8622a", border: "0.5px solid transparent" }
                          : { background: "#f0ede8", border: "0.5px solid rgba(28,24,18,0.11)" }),
                      }}
                      title={t.label}
                    >
                      <t.icon size={14} style={{ color: selected ? "#fff" : "#1c1812" }} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <button
            onClick={() => mutation.mutate()}
            disabled={!selectedDate || mutation.isPending}
            className="w-full py-[16.5px] text-[16.5px] font-semibold text-primary-foreground shadow-md transition-opacity disabled:opacity-[0.38]"
            style={{ borderRadius: "100px", background: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
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
