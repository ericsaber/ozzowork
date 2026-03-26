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
    follow_up_type: string;
    due_date: string;
    created_at: string;
    contact_id: string;
  };
}

const EditFollowupSheet = ({ open, onOpenChange, followUp }: EditFollowupSheetProps) => {
  const queryClient = useQueryClient();
  const [followUpType, setFollowUpType] = useState(followUp.follow_up_type);
  const [selectedDate, setSelectedDate] = useState(followUp.due_date);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const originalDate = format(parseISO(followUp.created_at), "MMM d");
  const originalType = followUp.follow_up_type.charAt(0).toUpperCase() + followUp.follow_up_type.slice(1);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Write edit history with previous values
      const { error: editErr } = await supabase.from("follow_up_edits").insert({
        follow_up_id: followUp.id,
        previous_type: followUp.follow_up_type,
        previous_due_date: followUp.due_date,
        user_id: user.id,
      });
      if (editErr) throw editErr;

      // Update the follow-up
      const { error } = await supabase
        .from("follow_ups")
        .update({
          follow_up_type: followUpType,
          due_date: selectedDate,
        })
        .eq("id", followUp.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-ups"] });
      queryClient.invalidateQueries({ queryKey: ["interactions", followUp.contact_id] });
      queryClient.invalidateQueries({ queryKey: ["followups-today"] });
      queryClient.invalidateQueries({ queryKey: ["followups-upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["follow-up", followUp.id] });
      toast.success("Follow-up updated");
      handleClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setFollowUpType(followUp.follow_up_type);
      setSelectedDate(followUp.due_date);
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
            Originally set {originalDate} · {originalType}
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

          {/* Due date */}
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground mb-2" style={{ fontFamily: "var(--font-body)" }}>
              Due date
            </p>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button
                  className="inline-flex items-center gap-2 rounded-[12px] border-[1.5px] border-border px-4 py-[10px] text-[13px] font-medium text-foreground hover:border-[#f0c4a8] transition-colors"
                  style={{ fontFamily: "var(--font-body)" }}
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
