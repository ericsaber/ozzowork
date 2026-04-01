import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Phone, Mail, MessageSquare, Users, Video, CalendarIcon, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
    connect_date: string;
    connect_type: string | null;
    note: string | null;
    contact_id: string;
  };
  contactId: string;
}

const EditInteractionSheet = ({ open, onClose, interaction, contactId }: EditInteractionSheetProps) => {
  const queryClient = useQueryClient();
  const [connectType, setConnectType] = useState(interaction.connect_type || "");
  const [date, setDate] = useState(format(parseISO(interaction.connect_date), "yyyy-MM-dd"));
  const [note, setNote] = useState(interaction.note || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error: intErr } = await supabase
        .from("interactions")
        .update({
          connect_type: connectType || null,
          note: note || null,
          connect_date: new Date(date + "T12:00:00").toISOString(),
        })
        .eq("id", interaction.id);
      if (intErr) throw intErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions", contactId] });
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      toast.success("Interaction updated");
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("interactions")
        .delete()
        .eq("id", interaction.id);
      if (error) throw error;
      console.log("[EditInteractionSheet] interaction deleted:", interaction.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions", contactId] });
      queryClient.invalidateQueries({ queryKey: ["interactions"] });
      toast.success("Interaction deleted");
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <>
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
                    disabled={(d) => d > new Date()}
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
                placeholder="What happened?"
              />
            </div>

            {/* Save */}
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full rounded-[13px] bg-primary text-primary-foreground py-[14px] text-[14px] font-semibold shadow-md transition-opacity disabled:opacity-[0.38]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </button>

            {/* Delete */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full rounded-[13px] border border-border bg-background py-[14px] text-[14px] font-medium text-destructive transition-opacity flex items-center justify-center gap-2"
              style={{ fontFamily: "var(--font-body)" }}
            >
              <Trash2 size={15} />
              Delete interaction
            </button>
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this interaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditInteractionSheet;
