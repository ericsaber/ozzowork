import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addDays, addWeeks, format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

interface CompleteFollowupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interactionId: string;
  contactId: string;
  contactName: string;
  interactionType: string;
  userId: string;
}

const dateChips = [
  { label: "Tomorrow", days: 1 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
];

const CompleteFollowupSheet = ({
  open,
  onOpenChange,
  interactionId,
  contactId,
  contactName,
  interactionType,
  userId,
}: CompleteFollowupSheetProps) => {
  const queryClient = useQueryClient();
  const [note, setNote] = useState(`Completed: ${interactionType}`);
  const [selectedChip, setSelectedChip] = useState<number | null>(null);

  const getFollowUpDate = () => {
    if (selectedChip === null) return null;
    const chip = dateChips[selectedChip];
    return format(
      chip.days <= 7 ? addDays(new Date(), chip.days) : addWeeks(new Date(), chip.days / 7),
      "yyyy-MM-dd"
    );
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // 1. Clear follow_up_date on original interaction
      const { error: updateErr } = await supabase
        .from("interactions")
        .update({ follow_up_date: null })
        .eq("id", interactionId);
      if (updateErr) throw updateErr;

      // 2. Insert new logged interaction
      const followUpDate = getFollowUpDate();
      const { error: insertErr } = await supabase.from("interactions").insert({
        contact_id: contactId,
        user_id: userId,
        planned_follow_up_type: followUpDate ? "call" : "text",
        connect_type: "text",
        note: note || null,
        follow_up_date: followUpDate,
      });
      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["followups-today"] });
      queryClient.invalidateQueries({ queryKey: ["followups-upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      toast.success("Follow-up completed");
      onOpenChange(false);
      // Reset state
      setSelectedChip(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleOpen = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedChip(null);
      setNote(`Completed: ${interactionType}`);
    }
    onOpenChange(isOpen);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpen}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="font-heading text-xl">Logged ✓</DrawerTitle>
          <DrawerDescription>
            Add a note and set your next follow-up with <strong>{contactName}</strong>.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="bg-card"
            placeholder="Add a note..."
          />

          <div>
            <p className="text-sm font-medium text-foreground mb-2">Next follow-up</p>
            <div className="flex flex-wrap gap-2">
              {dateChips.map((chip, i) => (
                <button
                  key={chip.label}
                  onClick={() => setSelectedChip(selectedChip === i ? null : i)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedChip === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DrawerFooter>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full h-12 font-medium"
          >
            {saveMutation.isPending
              ? "Saving..."
              : selectedChip !== null
              ? "Save & set reminder"
              : "Save"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default CompleteFollowupSheet;
