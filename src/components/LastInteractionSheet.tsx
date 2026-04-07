import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Phone, Mail, MessageSquare, Users, Video, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface LastInteractionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  contactName: string;
}

const typeIcons: Record<string, React.ElementType> = {
  call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video,
};
const typeVerbs: Record<string, string> = {
  call: "Called", email: "Emailed", text: "Texted", meet: "Met", video: "Video called",
};

const LastInteractionSheet = ({ open, onOpenChange, contactId, contactName }: LastInteractionSheetProps) => {
  const navigate = useNavigate();

  const { data: interaction, isLoading } = useQuery({
    queryKey: ["last-interaction", contactId],
    queryFn: async () => {
      // Try interactions first
      const { data: interactionData, error: intError } = await supabase
        .from("interactions")
        .select("*")
        .eq("contact_id", contactId)
        .eq("status", "published")
        .order("connect_date", { ascending: false })
        .limit(1);
      if (intError) throw intError;
      if (interactionData && interactionData.length > 0) {
        const r = interactionData[0];
        return { type: r.connect_type, date: r.connect_date, note: r.note };
      }
      // Fallback to completed follow_ups
      const { data: fuData, error: fuError } = await supabase
        .from("follow_ups")
        .select("*")
        .eq("contact_id", contactId)
        .eq("status", "completed")
        .not("connect_type", "is", null)
        .order("completed_at", { ascending: false })
        .limit(1);
      if (fuError) throw fuError;
      if (fuData && fuData.length > 0) {
        const r = fuData[0];
        return { type: r.connect_type, date: r.completed_at, note: r.note };
      }
      return null;
    },
    enabled: open,
  });

  const Icon = interaction?.type ? (typeIcons[interaction.type] || MessageSquare) : MessageSquare;
  const verb = interaction?.type ? (typeVerbs[interaction.type] || "Connected") : "Connected";
  const dateStr = interaction?.date ? format(parseISO(interaction.date), "MMM d, yyyy") : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl p-0" hideClose style={{ maxHeight: "70vh" }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 6px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: "#ddd" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 20px 12px" }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 16, fontFamily: "var(--font-body)", margin: 0, color: "#383838" }}>
              Last interaction
            </p>
            <p style={{ fontWeight: 400, fontSize: 14, fontFamily: "var(--font-body)", margin: 0, color: "#777" }}>
              {contactName}
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: 4 }}
          >
            <X size={18} style={{ color: "#777" }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "0 20px 16px" }}>
          {isLoading ? (
            <div style={{ height: 48, borderRadius: 8, background: "#f0f0f0", animation: "pulse 1.5s infinite" }} />
          ) : interaction ? (
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }} className="bg-secondary">
                <Icon size={16} style={{ color: "#777" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 14, fontFamily: "var(--font-body)", color: "#383838" }}>
                    {verb}
                  </span>
                  <span style={{ fontSize: 13, fontFamily: "var(--font-body)", color: "#777" }}>
                    {dateStr}
                  </span>
                </div>
                {interaction.note && (
                  <p style={{
                    fontStyle: "italic", fontSize: 14, fontFamily: "var(--font-body)",
                    color: "#717171", margin: "4px 0 0",
                  }}>
                    {interaction.note}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 14, fontFamily: "var(--font-body)", color: "#777" }}>
              No prior interactions found.
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "0 20px 20px" }}>
          <button
            onClick={() => { onOpenChange(false); navigate(`/contact/${contactId}`); }}
            style={{
              background: "transparent", border: "none", cursor: "pointer", padding: 0,
              fontWeight: 500, fontSize: 14, fontFamily: "var(--font-body)", color: "#c8622a",
            }}
          >
            View full history →
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default LastInteractionSheet;
