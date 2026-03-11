import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, Voicemail, MessageSquare, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const typeOptions = [
  { value: "call", icon: Phone, label: "Call" },
  { value: "email", icon: Mail, label: "Email" },
  { value: "voicemail", icon: Voicemail, label: "VM" },
  { value: "text", icon: MessageSquare, label: "Text" },
];

interface EditInteractionDialogProps {
  interaction: {
    id: string;
    date: string;
    planned_follow_up_type: string;
    connect_type: string | null;
    note: string | null;
    follow_up_date: string | null;
  };
  open: boolean;
  onClose: () => void;
  contactId: string;
}

const EditInteractionDialog = ({ interaction, open, onClose, contactId }: EditInteractionDialogProps) => {
  const queryClient = useQueryClient();
  const [plannedType, setPlannedType] = useState(interaction.planned_follow_up_type);
  const [connectType, setConnectType] = useState(interaction.connect_type || interaction.planned_follow_up_type);
  const [note, setNote] = useState(interaction.note || "");
  const [date, setDate] = useState(format(parseISO(interaction.date), "yyyy-MM-dd"));
  const [followUpDate, setFollowUpDate] = useState(interaction.follow_up_date || "");

  const updateInteraction = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("interactions")
        .update({
          planned_follow_up_type: plannedType,
          connect_type: connectType,
          note: note || null,
          date: new Date(date).toISOString(),
          follow_up_date: followUpDate || null,
        })
        .eq("id", interaction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions", contactId] });
      queryClient.invalidateQueries({ queryKey: ["followups-today"] });
      toast.success("Interaction updated");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteInteraction = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("interactions").delete().eq("id", interaction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interactions", contactId] });
      queryClient.invalidateQueries({ queryKey: ["followups-today"] });
      toast.success("Interaction deleted");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Interaction</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Type</label>
            <div className="flex gap-2">
              {typeOptions.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    type === t.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-background" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Note</label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="bg-background" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Follow-up Date</label>
            <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="bg-background" />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => updateInteraction.mutate()} disabled={updateInteraction.isPending} className="flex-1">
              {updateInteraction.isPending ? "Saving..." : "Save"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 size={16} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete interaction?</AlertDialogTitle>
                  <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteInteraction.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditInteractionDialog;
