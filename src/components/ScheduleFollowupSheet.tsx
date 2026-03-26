import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, addWeeks, parseISO, getYear } from "date-fns";
import { Phone, Mail, MessageSquare, Users, Video, CalendarIcon } from "lucide-react";
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

interface ScheduleFollowupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
  taskRecordId?: string | null;
}

const ScheduleFollowupSheet = ({
  open,
  onOpenChange,
  contactId,
  contactName,
  taskRecordId,
}: ScheduleFollowupSheetProps) => {
  const queryClient = useQueryClient();
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viaActivated, setViaActivated] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (taskRecordId) {
        const { error } = await supabase.from("task_records" as any)
          .update({
            planned_follow_up_type: type || null,
            planned_follow_up_date: date,
          })
          .eq("id", taskRecordId);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const { error } = await supabase.from("task_records" as any).insert({
          contact_id: contactId,
          user_id: user.id,
          planned_follow_up_type: type || null,
          planned_follow_up_date: date,
          status: "active",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-records"] });
      queryClient.invalidateQueries({ queryKey: ["task-record"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-today"] });
      queryClient.invalidateQueries({ queryKey: ["task-records-upcoming"] });
      toast.success("Follow-up scheduled");
      handleClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setType("");
      setDate("");
      setViaActivated(false);
    }, 300);
  };

  const handleChipClick = (chipDate: string) => {
    const newDate = date === chipDate ? "" : chipDate;
    setDate(newDate);
    if (newDate && !viaActivated) setViaActivated(true);
    setShowDatePicker(false);
  };

  const handleViaPillClick = (value: string) => {
    if (!viaActivated) setViaActivated(true);
    setType(type === value ? "" : value);
  };

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DrawerContent className="max-h-[85vh]">
        <div className="px-5 pt-4 pb-6 overflow-y-auto">
          <h2 className="text-[20px] text-foreground mb-1" style={{ fontFamily: "var(--font-heading)" }}>
            Schedule a follow-up
          </h2>
          <p className="text-[13px] text-muted-foreground mb-5" style={{ fontFamily: "var(--font-body)" }}>
            with {contactName}
          </p>

          {/* Single card matching step 2 fu-card */}
          <div
            className="rounded-[14px] mb-5"
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
                const selected = date === chipDate;
                return (
                  <button
                    key={chip.label}
                    onClick={() => handleChipClick(chipDate)}
                    className="transition-colors"
                    style={{
                      borderRadius: "100px",
                      padding: "8px 13px",
                      fontSize: "13px",
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
                    selected={date ? new Date(date + "T00:00:00") : undefined}
                    onSelect={(d) => {
                      if (d) {
                        setDate(format(d, "yyyy-MM-dd"));
                        if (!viaActivated) setViaActivated(true);
                        setShowDatePicker(false);
                      }
                    }}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
              {date && !dateChips.some((chip) => chip.date() === date) && (() => {
                const parsed = parseISO(date);
                const label = getYear(parsed) === getYear(new Date()) ? format(parsed, "EEE, MMM d") : format(parsed, "EEE, MMM d, yyyy");
                return (
                  <button
                    onClick={() => setDate("")}
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
                  const selected = type === t.value;
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

          {/* Save button */}
          <button
            onClick={() => mutation.mutate()}
            disabled={!date || mutation.isPending}
            className="w-full py-[16.5px] text-[16.5px] font-semibold text-primary-foreground shadow-md transition-opacity disabled:opacity-[0.38]"
            style={{ borderRadius: "100px", background: "hsl(var(--primary))", fontFamily: "var(--font-body)" }}
          >
            {mutation.isPending ? "Saving..." : "Save →"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ScheduleFollowupSheet;
