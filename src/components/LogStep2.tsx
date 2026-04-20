import { useState, useEffect } from "react";
import { Phone, Mail, MessageSquare, Users, Video, CalendarIcon, Check, Pencil } from "lucide-react";
import { addDays, addWeeks, format, parseISO, getYear } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

const typeOptions = [
  { value: "call", icon: Phone, label: "Call" },
  { value: "email", icon: Mail, label: "Email" },
  { value: "text", icon: MessageSquare, label: "Text" },
  { value: "meet", icon: Users, label: "Meeting" },
  { value: "video", icon: Video, label: "Video" },
];

const dateChips = [
  { label: "Tomorrow", date: () => format(addDays(new Date(), 1), "yyyy-MM-dd") },
  { label: "3 days", date: () => format(addDays(new Date(), 3), "yyyy-MM-dd") },
  { label: "1 week", date: () => format(addWeeks(new Date(), 1), "yyyy-MM-dd") },
  { label: "2 weeks", date: () => format(addWeeks(new Date(), 2), "yyyy-MM-dd") },
];

interface LogStep2Props {
  connectType: string;
  contactName: string;
  note: string;
  onSaveWithFollowup: (type: string, date: string) => void;
  onSkip?: () => void;
  isSaving: boolean;
  onUpdateLog?: (connectType: string, note: string) => void;
  onFollowupStateChange?: (date: string, type: string, reminderNote: string) => void;
}

const LogStep2 = ({
  connectType,
  contactName,
  note,
  onSaveWithFollowup,
  onSkip,
  isSaving,
  onUpdateLog,
  onFollowupStateChange,
}: LogStep2Props) => {
  useEffect(() => {
    console.log("[LogStep2] connectType received on mount:", connectType);
  }, []);

  console.log("[LogStep2] mounted:", { connectType, contactName });

  const [followUpType, setFollowUpType] = useState(connectType || "");
  const [selectedDate, setSelectedDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [reminderNote, setReminderNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editConnectType, setEditConnectType] = useState(connectType);
  const [editNote, setEditNote] = useState(note);

  useEffect(() => {
    onFollowupStateChange?.(selectedDate, followUpType, reminderNote);
  }, [selectedDate, followUpType, reminderNote]);

  const handlePillClick = (value: string) => {
    setFollowUpType(followUpType === value ? "" : value);
  };

  const handleChipClick = (chipDate: string) => {
    const newDate = selectedDate === chipDate ? "" : chipDate;
    setSelectedDate(newDate);
    setShowCalendar(false);
  };

  const handleDoneEditing = () => {
    setIsEditing(false);
    onUpdateLog?.(editConnectType, editNote);
  };

  const typeLabel = connectType ? connectType.charAt(0).toUpperCase() + connectType.slice(1) : "";
  const showSummary = !!(connectType || note);
  const isCustomDate = selectedDate && !dateChips.some((c) => c.date() === selectedDate);
  const customDateLabel = (() => {
    if (!selectedDate) return "";
    const parsed = parseISO(selectedDate);
    return getYear(parsed) === getYear(new Date())
      ? format(parsed, "EEE, MMM d")
      : format(parsed, "EEE, MMM d, yyyy");
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Section 1 — Summary pill (always visible when there is content) */}
      {showSummary && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#f0f7f4",
            border: "1px solid #b7d9cc",
            borderRadius: 100,
            padding: "6px 10px 6px 8px",
            alignSelf: "flex-start",
            maxWidth: "100%",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#2d6a4f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Check size={10} color="#fff" strokeWidth={3} />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#2d6a4f",
              fontFamily: "Outfit, sans-serif",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {connectType ? `${typeLabel} · ${contactName}` : `Connected · ${contactName}`}
          </span>
          {onUpdateLog && !isEditing && (
            <>
              <span style={{ fontSize: 13, color: "rgba(45,106,79,0.6)", flexShrink: 0 }}>·</span>
              <button
                onClick={() => {
                  setEditConnectType(connectType);
                  setEditNote(note);
                  setIsEditing(true);
                }}
                style={{
                  fontSize: 13,
                  color: "rgba(45,106,79,0.6)",
                  fontFamily: "Outfit, sans-serif",
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                edit
              </button>
            </>
          )}
        </div>
      )}

      {isEditing && (
        <div
          style={{
            marginTop: 12,
            background: "#faf8f5",
            border: "1px solid #e8e4de",
            borderRadius: 16,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            onInput={(e) => {
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = e.currentTarget.scrollHeight + "px";
            }}
            placeholder="What happened?"
            style={{
              width: "100%",
              minHeight: 60,
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              fontFamily: "Outfit, sans-serif",
              fontSize: 16,
              color: "#1c1a17",
            }}
          />
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#888480",
                fontFamily: "Outfit, sans-serif",
                marginBottom: 6,
              }}
            >
              Type
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {typeOptions.map((t) => {
                const selected = editConnectType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setEditConnectType(selected ? "" : t.value)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 100,
                      fontSize: 13,
                      fontFamily: "Outfit, sans-serif",
                      cursor: "pointer",
                      ...(selected
                        ? { background: "#fdf4f0", color: "#c8622a", border: "1.5px solid #c8622a" }
                        : { background: "#faf8f5", color: "#6b6860", border: "1px solid #e8e4de" }),
                    }}
                  >
                    <t.icon size={13} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditConnectType(connectType);
                setEditNote(note);
              }}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 14,
                fontWeight: 500,
                color: "#888480",
                fontFamily: "Outfit, sans-serif",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDoneEditing}
              style={{
                background: "transparent",
                border: "1.5px solid #c8622a",
                borderRadius: 100,
                padding: "7px 18px",
                fontSize: 14,
                fontWeight: 500,
                color: "#c8622a",
                fontFamily: "Outfit, sans-serif",
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Section 2 — Heading */}
      <h2
        style={{
          fontFamily: "'Crimson Pro', serif",
          fontSize: 28,
          fontWeight: 500,
          color: "#1c1a17",
          letterSpacing: "-0.01em",
          margin: "16px 0",
        }}
      >
        Set a follow-up
      </h2>

      {/* Section 3 — Date chips */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 8,
        }}
      >
        {dateChips.map((chip) => {
          const chipDate = chip.date();
          const selected = selectedDate === chipDate;
          return (
            <button
              key={chip.label}
              onClick={() => handleChipClick(chipDate)}
              style={{
                background: selected ? "#fdf4f0" : "#faf8f5",
                border: selected ? "1.5px solid #c8622a" : "1px solid #e8e4de",
                borderRadius: 12,
                padding: "13px 8px",
                fontSize: 14,
                fontWeight: 500,
                color: selected ? "#c8622a" : "#1c1a17",
                fontFamily: "Outfit, sans-serif",
                textAlign: "center",
                width: "100%",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setShowCalendar((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          background: isCustomDate ? "#fdf4f0" : "#faf8f5",
          border: isCustomDate ? "1.5px solid #c8622a" : "1px solid #e8e4de",
          borderRadius: 12,
          padding: 13,
          fontSize: 14,
          fontWeight: 500,
          color: isCustomDate ? "#c8622a" : "#1c1a17",
          fontFamily: "Outfit, sans-serif",
          width: "100%",
          cursor: "pointer",
          transition: "all 0.12s ease",
        }}
      >
        <CalendarIcon size={15} color={isCustomDate ? "#c8622a" : "#888480"} />
        {isCustomDate ? customDateLabel : "Pick date"}
      </button>

      {/* Section 4 — Inline calendar */}
      {showCalendar && (
        <div
          style={{
            marginTop: 8,
            background: "#faf8f5",
            border: "1px solid #e8e4de",
            borderRadius: 12,
            overflow: "hidden",
            width: "100%",
          }}
        >
          <Calendar
            mode="single"
            selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
            onSelect={(date) => {
              if (date) {
                setSelectedDate(format(date, "yyyy-MM-dd"));
                setShowCalendar(false);
              }
            }}
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className="pointer-events-auto w-full"
          />
        </div>
      )}

      {/* Section 5 — Via + reminder */}
      {selectedDate && (
        <div
          style={{
            marginTop: 24,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Via row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                fontSize: 11,
                color: "#888480",
                fontFamily: "Outfit, sans-serif",
                flexShrink: 0,
              }}
            >
              via
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {typeOptions.map((t) => {
                const selected = followUpType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => handlePillClick(t.value)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      background: selected ? "#c8622a" : "white",
                      border: selected ? "none" : "1px solid #e8e4de",
                      transition: "all 0.12s ease",
                    }}
                    title={t.label}
                  >
                    <t.icon size={14} color={selected ? "#fff" : "#6b6860"} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reminder row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderTop: "1px dashed #d8d4ce",
              paddingTop: 10,
            }}
          >
            <Pencil size={13} color="#888480" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={reminderNote}
              onChange={(e) => setReminderNote(e.target.value)}
              placeholder="Add a reminder note..."
              maxLength={44}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "#1c1a17",
                fontFamily: "Outfit, sans-serif",
                minWidth: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: "#888480",
                fontFamily: "Outfit, sans-serif",
                flexShrink: 0,
              }}
            >
              {reminderNote.length}/44
            </span>
          </div>
        </div>
      )}

      {/* Save/Skip moved to parent (LogInteractionSheet / CompleteFollowupSheet) */}
      {(() => { void onSaveWithFollowup; void onSkip; void isSaving; return null; })()}
    </div>
  );
};

export default LogStep2;
