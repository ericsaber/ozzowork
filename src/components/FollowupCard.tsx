import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, MessageSquare, Users, Video, Calendar as CalendarIcon, CornerDownRight, MoreVertical, Pencil, X, History } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface FollowupCardProps {
  taskRecordId: string;
  contactId: string;
  name: string;
  company: string | null;
  dueDate: string;
  plannedType: string | null;
  reminderNote: string | null;
  variant: "overdue" | "today" | "upcoming";
  onComplete: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  contactPhone?: string | null;
  contactEmail?: string | null;
  hasInteractions?: boolean;
  onHistoryTap?: () => void;
}

const typeVerb: Record<string, string> = {
  call: "Call", email: "Email", text: "Text", meet: "Meeting", video: "Video call",
};
const typeIcon: Record<string, React.ElementType> = {
  call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video,
};

const FollowupCard = ({
  taskRecordId, contactId, name, company, dueDate, variant,
  plannedType, reminderNote, onComplete,
  onEdit, onCancel, menuOpen, onMenuOpenChange,
  contactPhone, contactEmail, hasInteractions, onHistoryTap,
}: FollowupCardProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  

  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<string | null>(null);
  const [editReminder, setEditReminder] = useState("");

  const isActionable = plannedType === "call" || plannedType === "text" || plannedType === "email";

  const handleActionTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (plannedType === "call" || plannedType === "text") {
      if (contactPhone) {
        window.location.href = plannedType === "call"
          ? `tel:${contactPhone}`
          : `sms:${contactPhone}`;
      } else {
        navigate(`/contact/${contactId}`);
      }
    } else if (plannedType === "email") {
      if (contactEmail) {
        window.location.href = `mailto:${contactEmail}`;
      } else {
        navigate(`/contact/${contactId}`);
      }
    }
  };

  const handleStartEdit = () => {
    setEditDate(dueDate);
    setEditType(plannedType);
    setEditReminder(reminderNote ?? "");
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("follow_ups")
      .update({
        planned_date: editDate,
        planned_type: editType,
        reminder_note: editReminder.trim() || null,
      })
      .eq("id", taskRecordId);

    if (error) {
      console.log("[FollowupCard] inline edit error:", error);
      return;
    }

    if (editDate !== dueDate) {
      await supabase.from("follow_up_edits").insert({
        follow_up_id: taskRecordId,
        user_id: user.id,
        previous_due_date: dueDate,
        previous_type: plannedType,
        changed_at: new Date().toISOString(),
      });
    }

    console.log("[FollowupCard] inline edit saved:", {
      taskRecordId, editDate, editType, editReminder,
    });

    queryClient.invalidateQueries({ queryKey: ["follow-ups-today"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups-upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups-active"] });
    setIsEditing(false);
  };

  const isOverdue = variant === "overdue";
  const isToday = variant === "today";

  const tokens = isOverdue
    ? {
        subframeBg: "rgba(255,240,239,0.5)",
        color: "#c0392b",
        doneBorder: "1px solid rgba(192,57,43,0.35)",
        reminderBg: "rgba(255,240,239,0.6)",
        reminderBorderColor: "rgba(192,57,43,0.35)",
      }
    : isToday
    ? {
        subframeBg: "rgba(231,242,235,0.5)",
        color: "#2e7a4d",
        doneBorder: "1px solid rgba(46,122,77,0.35)",
        reminderBg: "rgba(231,242,235,0.5)",
        reminderBorderColor: "rgba(46,122,77,0.35)",
      }
    : {
        subframeBg: "rgba(253,240,232,0.5)",
        color: "#b05524",
        doneBorder: "1px solid rgba(200,98,42,0.35)",
        reminderBg: "rgba(253,240,232,0.5)",
        reminderBorderColor: "rgba(176,85,36,0.35)",
      };

  const ActionIcon = plannedType ? (typeIcon[plannedType] || CalendarIcon) : CalendarIcon;

  const actionLabel = (() => {
    const typeStr = plannedType ? typeVerb[plannedType] || plannedType : "Follow-up";
    if (isToday) return `${typeStr} Today`;
    if (isOverdue) return `${typeStr} · Due ${format(parseISO(dueDate), "M/d")}`;
    return `${typeStr} · ${format(parseISO(dueDate), "MMM d")}`;
  })();

  const renderEditPanel = () => {
    const typeKeys = Object.keys(typeVerb) as string[];
    const todayStr = format(new Date(), "yyyy-MM-dd");

    return (
      <div style={{
        width: "calc(100% - 24px)",
        borderRadius: "5px",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Top section */}
        <div style={{
          background: tokens.subframeBg,
          borderRadius: "5px 5px 0 0",
          padding: "10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          {/* DATE */}
          <div>
            <span style={{
              fontWeight: 600,
              fontSize: "12px",
              color: tokens.color,
              fontFamily: "var(--font-body)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: "6px",
            }}>DATE</span>
            <div style={{ position: "relative", display: "inline-block" }}>
              <div
                style={{
                  background: "white",
                  border: tokens.doneBorder,
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontWeight: 500,
                  fontSize: "14px",
                  color: tokens.color,
                  whiteSpace: "nowrap",
                  lineHeight: "normal",
                  fontFamily: "var(--font-body)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <CalendarIcon size={14} />
                {format(parseISO(editDate), "MMM d, yyyy")}
              </div>
              <input
                type="date"
                value={editDate}
                min={todayStr}
                onChange={(e) => { if (e.target.value) setEditDate(e.target.value); }}
                onClick={(e) => e.stopPropagation()}
                style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", zIndex: 1 }}
              />
            </div>
          </div>

          {/* TYPE */}
          <div>
            <span style={{
              fontWeight: 600,
              fontSize: "12px",
              color: tokens.color,
              fontFamily: "var(--font-body)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "block",
              marginBottom: "6px",
            }}>TYPE</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {typeKeys.map((key) => {
                const Icon = typeIcon[key];
                const selected = editType === key;
                return (
                  <button
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditType(selected ? null : key);
                    }}
                    style={{
                      background: selected ? `${tokens.color}26` : "white",
                      border: selected ? `1px solid ${tokens.color}` : tokens.doneBorder,
                      borderRadius: "20px",
                      padding: "6px 14px",
                      fontWeight: 500,
                      fontSize: "14px",
                      color: tokens.color,
                      whiteSpace: "nowrap",
                      lineHeight: "normal",
                      cursor: "pointer",
                      fontFamily: "var(--font-body)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Icon size={14} />
                    {typeVerb[key]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div style={{
          background: tokens.reminderBg,
          borderTop: `1px dashed ${tokens.reminderBorderColor}`,
          borderRadius: "0 0 5px 5px",
          padding: "10px 18px",
        }}>
          {/* Reminder row */}
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <CornerDownRight size={16} style={{ color: tokens.color, flexShrink: 0 }} />
            <input
              value={editReminder}
              onChange={(e) => setEditReminder(e.target.value)}
              maxLength={44}
              placeholder="Add a reminder note..."
              onClick={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                border: "none",
                background: "transparent",
                fontSize: "12px",
                fontWeight: 400,
                color: tokens.color,
                fontFamily: "var(--font-body)",
                outline: "none",
                lineHeight: "normal",
              }}
            />
            <span style={{
              fontSize: "12px",
              color: tokens.color,
              opacity: 0.6,
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}>
              {editReminder.length}/44
            </span>
          </div>

          {/* Button row */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button
              onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
              style={{
                background: "transparent",
                border: "none",
                fontSize: "14px",
                fontWeight: 500,
                color: tokens.color,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
              style={{
                background: tokens.color,
                border: "none",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "14px",
                fontWeight: 500,
                color: "white",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
              }}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={() => navigate(`/contact/${contactId}`)}
      style={{
        background: "white",
        boxShadow: "0 1px 5px rgba(0,0,0,.08)",
        borderRadius: "16px",
        overflow: "hidden",
        cursor: "pointer",
        width: "100%",
      }}
    >
      {/* Top row */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        padding: "16px 20px 10px",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            onClick={(e) => { e.stopPropagation(); navigate(`/contact/${contactId}`); }}
            style={{
              fontWeight: 600,
              fontSize: "16px",
              color: "#383838",
              lineHeight: "normal",
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              margin: 0,
              cursor: "pointer",
            }}
          >
            {name}
          </p>
          {company && (
            <p
              onClick={(e) => { e.stopPropagation(); navigate(`/contact/${contactId}`); }}
              style={{
                fontWeight: 400,
                fontSize: "14px",
                color: "#777",
                lineHeight: "normal",
                fontFamily: "var(--font-body)",
                margin: 0,
                cursor: "pointer",
              }}
            >
              {company}
            </p>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, marginTop: "2px" }}>
          {hasInteractions && (
            <History
              size={15}
              style={{ color: "#777", cursor: "pointer" }}
              onClick={(e) => { e.stopPropagation(); onHistoryTap?.(); }}
            />
          )}
          <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "flex-start",
                }}
              >
                <MoreVertical size={16} style={{ color: "#777" }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}>
                  <Pencil size={14} className="mr-2" /> Edit follow-up
                </DropdownMenuItem>
              )}
              {onCancel && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); onCancel(); }}
                    className="text-destructive focus:text-destructive"
                  >
                    <X size={14} className="mr-2" /> Cancel follow-up
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Action subframe + reminder OR edit panel */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingBottom: "16px",
      }}>
        {isEditing ? renderEditPanel() : (
          <div style={{
            width: "calc(100% - 24px)",
            borderRadius: "5px",
            overflow: "hidden",
            flexShrink: 0,
          }}>
            {/* Main action row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 8px",
              background: tokens.subframeBg,
            }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px", cursor: isActionable ? "pointer" : "default" }}
                onClick={isActionable ? handleActionTap : undefined}
              >
                <div style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "6px",
                  background: `${tokens.color}26`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <ActionIcon size={16} strokeWidth={2} style={{ color: tokens.color }} />
                </div>
                <span style={{
                  fontWeight: 600,
                  fontSize: "16px",
                  color: tokens.color,
                  whiteSpace: "nowrap",
                  lineHeight: "normal",
                  fontFamily: "var(--font-body)",
                }}>
                  {actionLabel}
                </span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onComplete(); }}
                style={{
                  background: "white",
                  border: tokens.doneBorder,
                  borderRadius: "20px",
                  padding: "6px 14px",
                  fontWeight: 500,
                  fontSize: "14px",
                  color: tokens.color,
                  whiteSpace: "nowrap",
                  lineHeight: "normal",
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                }}
              >
                Log it
              </button>
            </div>

            {/* Reminder row */}
            {reminderNote && (
              <div style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 18px",
                gap: "7px",
                borderTop: `1px dashed ${tokens.reminderBorderColor}`,
                background: tokens.reminderBg,
              }}>
                <CornerDownRight size={16} style={{ color: tokens.color, flexShrink: 0 }} />
                <span style={{
                  fontWeight: 400,
                  fontSize: "12px",
                  color: tokens.color,
                  whiteSpace: "nowrap",
                  lineHeight: "normal",
                  fontFamily: "var(--font-body)",
                  flex: 1,
                }}>
                  {reminderNote}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FollowupCard;
