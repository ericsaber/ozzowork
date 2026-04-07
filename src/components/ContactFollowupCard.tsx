import { useState } from "react";
import { Phone, Mail, MessageSquare, Users, Video, Pencil, Clock, Calendar as CalendarIcon, CornerDownRight, X } from "lucide-react";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const typeVerb: Record<string, string> = {
  call: "Call", email: "Email", text: "Text", meet: "Meeting", video: "Video call",
};
const typeIconMap: Record<string, React.ElementType> = {
  call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video,
};

interface ContactFollowupCardProps {
  taskRecord: {
    id: string;
    planned_type: string | null;
    planned_date: string;
    reminder_note: string | null;
    contact_id: string;
  };
  variant: "upcoming" | "overdue";
  onComplete?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  menuOpen?: boolean;
  onMenuOpenChange?: (open: boolean) => void;
  rescheduleCount?: number;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

const ContactFollowupCard = ({
  taskRecord,
  variant,
  onComplete,
  onEdit,
  onCancel,
  menuOpen,
  onMenuOpenChange,
  rescheduleCount,
  contactPhone,
  contactEmail,
}: ContactFollowupCardProps) => {
  const isOverdue = variant === "overdue";
  const isTodayDate = isToday(parseISO(taskRecord.planned_date));
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editType, setEditType] = useState<string | null>(null);
  const [editReminder, setEditReminder] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const tokens = isOverdue
    ? {
        subframeBg: "rgba(255,240,239,0.5)",
        color: "#c0392b",
        doneBorder: "1px solid rgba(192,57,43,0.35)",
        reminderBg: "#fff0ef",
        reminderBorderColor: "rgba(192,57,43,0.35)",
      }
    : isTodayDate
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

  const isActionable = taskRecord.planned_type === "call" || taskRecord.planned_type === "text" || taskRecord.planned_type === "email";

  const handleActionTap = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (taskRecord.planned_type === "call" || taskRecord.planned_type === "text") {
      if (contactPhone) {
        window.location.href = taskRecord.planned_type === "call" ? `tel:${contactPhone}` : `sms:${contactPhone}`;
      }
    } else if (taskRecord.planned_type === "email") {
      if (contactEmail) {
        window.location.href = `mailto:${contactEmail}`;
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("follow_ups").update({
      planned_date: editDate,
      planned_type: editType,
      reminder_note: editReminder.trim() || null,
    }).eq("id", taskRecord.id);

    if (error) { console.log("[ContactFollowupCard] inline edit error:", error); return; }

    if (editDate !== taskRecord.planned_date) {
      await supabase.from("follow_up_edits").insert({
        follow_up_id: taskRecord.id,
        user_id: user.id,
        previous_due_date: taskRecord.planned_date,
        previous_type: taskRecord.planned_type,
        changed_at: new Date().toISOString(),
      });
    }

    console.log("[ContactFollowupCard] inline edit saved:", { id: taskRecord.id, editDate, editType, editReminder });
    queryClient.invalidateQueries({ queryKey: ["follow-ups-today"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups-upcoming"] });
    queryClient.invalidateQueries({ queryKey: ["follow-ups-active"] });
    setIsEditing(false);
  };

  const ActionIcon = taskRecord.planned_type
    ? (typeIconMap[taskRecord.planned_type] || CalendarIcon)
    : CalendarIcon;

  const typeStr = taskRecord.planned_type
    ? typeVerb[taskRecord.planned_type] || taskRecord.planned_type
    : "Follow-up";

  const followUpDate = parseISO(taskRecord.planned_date);
  const datePart = (() => {
    if (isToday(followUpDate)) return "Today";
    if (isTomorrow(followUpDate)) return "Tomorrow";
    if (isOverdue) return `Due ${format(followUpDate, "MMM d")}`;
    return format(followUpDate, "MMM d");
  })();
  const actionLabel = isToday(followUpDate) ? `${typeStr} Today` : `${typeStr} · ${datePart}`;

  const renderEditPanel = () => {
    const typeKeys = Object.keys(typeVerb) as string[];

    return (
      <div style={{
        width: "calc(100% - 24px)",
        margin: "0 auto",
        borderRadius: "5px",
        overflow: "hidden",
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
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
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
                    cursor: "pointer",
                  }}
                >
                  <CalendarIcon size={14} />
                  {format(parseISO(editDate), "MMM d, yyyy")}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
                <Calendar
                  mode="single"
                  selected={new Date(editDate + "T00:00:00")}
                  onSelect={(date) => {
                    if (date) {
                      setEditDate(format(date, "yyyy-MM-dd"));
                      setShowDatePicker(false);
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
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
                const Icon = typeIconMap[key];
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
      style={{
        background: "white",
        boxShadow: "0 1px 5px rgba(0,0,0,.08)",
        borderRadius: "16px",
        overflow: "hidden",
        width: "100%",
        margin: "0 auto",
        padding: "16px 0",
      }}
    >
      {isEditing ? renderEditPanel() : (
        <>
          {/* Action subframe */}
          <div style={{
            width: "calc(100% - 24px)",
            margin: "0 auto",
            borderRadius: "5px",
            overflow: "hidden",
          }}>
            {/* Main action row */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 8px",
              background: tokens.subframeBg,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
                    fontFamily: "var(--font-body)",
                  }}>
                    {actionLabel}
                  </span>
                </div>
              </div>

              {/* Right: Done button + vertical dots */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={(e) => { e.stopPropagation(); onComplete?.(); }}
                  style={{
                    background: "white",
                    border: tokens.doneBorder,
                    borderRadius: "20px",
                    padding: "8px 16px",
                    fontWeight: 500,
                    fontSize: "14px",
                    color: tokens.color,
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Log it
                </button>

                {/* Vertical dots menu */}
                <DropdownMenu open={menuOpen} onOpenChange={onMenuOpenChange}>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        background: "transparent",
                        border: "none",
                        cursor: "pointer",
                        padding: "4px 8px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                        alignItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      {[0,1,2].map((i) => (
                        <div key={i} style={{
                          width: "3px",
                          height: "3px",
                          borderRadius: "50%",
                          background: "#bbb",
                        }} />
                      ))}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[160px]">
                    {onEdit && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setEditDate(taskRecord.planned_date);
                        setEditType(taskRecord.planned_type);
                        setEditReminder(taskRecord.reminder_note ?? "");
                        setIsEditing(true);
                      }}>
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

            {/* Reminder row */}
            {taskRecord.reminder_note && (
              <div style={{
                display: "flex",
                alignItems: "center",
                padding: "10px 17px",
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
                  fontFamily: "var(--font-body)",
                  flex: 1,
                }}>
                  {taskRecord.reminder_note}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Reschedule nudge */}
      {rescheduleCount !== undefined && rescheduleCount >= 3 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "8px 12px 0",
          marginTop: "8px",
        }}>
          <Clock size={11} style={{ color: "#999" }} />
          <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "#999" }}>
            Rescheduled {rescheduleCount} times
          </span>
        </div>
      )}
    </div>
  );
};

export default ContactFollowupCard;
