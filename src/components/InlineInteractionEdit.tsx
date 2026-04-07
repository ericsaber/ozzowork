import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { Phone, Mail, MessageSquare, Users, Video, CalendarIcon, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface InlineInteractionEditProps {
  interaction: {
    id: string;
    connect_type: string | null;
    connect_date: string;
    note: string | null;
    contact_id: string;
  };
  onClose: () => void;
}

const typeVerbs: Record<string, string> = { call: "Call", email: "Email", text: "Text", meet: "Meeting", video: "Video" };
const typeIconMap: Record<string, typeof Phone> = { call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video };

const InlineInteractionEdit = ({ interaction, onClose }: InlineInteractionEditProps) => {
  const queryClient = useQueryClient();
  const [editDate, setEditDate] = useState(interaction.connect_date);
  const [editType, setEditType] = useState<string | null>(interaction.connect_type);
  const [editNote, setEditNote] = useState(interaction.note ?? "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditDate(interaction.connect_date);
    setEditType(interaction.connect_type);
    setEditNote(interaction.note ?? '');
  }, [interaction.id, interaction.connect_date, interaction.connect_type, interaction.note]);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("interactions")
      .update({
        connect_type: editType,
        connect_date: editDate,
        note: editNote.trim() || null,
      })
      .eq("id", interaction.id);
    if (error) {
      console.log("[InlineInteractionEdit] save error:", error);
      toast.error("Failed to save");
      setIsSaving(false);
      return;
    }
    console.log("[InlineInteractionEdit] saved:", { id: interaction.id, editDate, editType, editNote });
    queryClient.invalidateQueries({ queryKey: ["interactions", interaction.contact_id] });
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("interactions").delete().eq("id", interaction.id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    console.log("[InlineInteractionEdit] deleted:", interaction.id);
    queryClient.invalidateQueries({ queryKey: ["interactions", interaction.contact_id] });
    onClose();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <>
      <div
        style={{
          background: "#faf8f5",
          border: "1px solid #dedad3",
          borderRadius: "12px",
          boxShadow: "0px 1px 5px rgba(0,0,0,0.06)",
          padding: "1px",
          width: "100%",
        }}
      >
        <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "11.8px" }}>
          {/* Header */}
          <p style={{ fontFamily: "var(--font-heading)", fontSize: "15px", fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
            What Happened
          </p>

          {/* DATE */}
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 500, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.88px", margin: "0 0 6px" }}>
              DATE
            </p>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#fff",
                    border: "1.5px solid #dedad3",
                    borderRadius: "20px",
                    padding: "5px 12px",
                    fontFamily: "var(--font-body)",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#1a1a1a",
                    cursor: "pointer",
                  }}
                >
                  <CalendarIcon size={14} style={{ color: "#c8622a" }} />
                  {format(parseISO(editDate), "MMM d, yyyy")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" onPointerDown={(e) => e.stopPropagation()}>
                <Calendar
                  mode="single"
                  selected={parseISO(editDate)}
                  onSelect={(d) => {
                    if (d) {
                      console.log('[InlineInteractionEdit] date selected:', d);
                      setEditDate(format(new Date(d.getFullYear(), d.getMonth(), d.getDate()), "yyyy-MM-dd"));
                      setShowDatePicker(false);
                    }
                  }}
                  disabled={(date) => date > today}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* TYPE */}
          <div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 500, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.88px", margin: "0 0 6px" }}>
              TYPE
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {Object.entries(typeVerbs).map(([key, label]) => {
                const Icon = typeIconMap[key];
                const selected = editType === key;
                return (
                  <button
                    key={key}
                    onClick={() => setEditType(selected ? null : key)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "5px 10px",
                      borderRadius: "20px",
                      fontFamily: "var(--font-body)",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      background: selected ? "#fdf0e8" : "#fff",
                      border: selected ? "1.5px solid #f0c4a8" : "1.5px solid #dedad3",
                      color: selected ? "#c8622a" : "#71717a",
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* NOTE */}
          <div>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Add a note…"
              style={{
                width: "100%",
                background: "#e9e6e2",
                border: "1px solid #dedad3",
                borderRadius: "12px",
                padding: "11px 13px",
                minHeight: "56px",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: 400,
                color: "#71717a",
                resize: "none",
                outline: "none",
              }}
            />
          </div>

          {/* Action row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Trash2
              size={16}
              style={{ color: "#c8622a", cursor: "pointer", flexShrink: 0 }}
              onClick={() => setShowDeleteConfirm(true)}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "#71717a",
                  cursor: "pointer",
                  padding: "5px 8px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  background: "#c8622a",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "5px 12px",
                  fontFamily: "var(--font-body)",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: isSaving ? "default" : "pointer",
                  opacity: isSaving ? 0.6 : 1,
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this log?</AlertDialogTitle>
            <AlertDialogDescription>
              This interaction will be permanently removed and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InlineInteractionEdit;
