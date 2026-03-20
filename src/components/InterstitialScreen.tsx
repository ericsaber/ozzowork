import { Phone, Mail, MessageSquare, Users, Video, Calendar, Link, Eraser, SquareSplitVertical } from "lucide-react";
import { differenceInDays, format, parseISO, isToday as isDateToday, isTomorrow, isPast, startOfDay } from "date-fns";

const typeIcons: Record<string, typeof Phone> = {
  call: Phone, email: Mail, text: MessageSquare, meet: Users, video: Video,
};
const typeLabels: Record<string, string> = {
  call: "Call", email: "Email", text: "Text", meet: "Meeting", video: "Video",
};

export interface ExistingFollowup {
  id: string;
  planned_follow_up_type: string | null;
  planned_follow_up_date: string;
  connect_type: string | null;
  note: string | null;
}

interface InterstitialScreenProps {
  existingFollowup: ExistingFollowup;
  contactName: string;
  onLinkAndUpdate?: () => void;
  onClearAndSetNew: () => void;
  onKeepSeparate: () => void;
  onBack?: () => void;
}

const getDateContext = (dateStr: string): { text: string; isOverdue: boolean } => {
  const date = startOfDay(parseISO(dateStr));
  const today = startOfDay(new Date());

  if (isDateToday(date)) return { text: "Due today", isOverdue: false };
  if (isTomorrow(date)) return { text: "Due tomorrow", isOverdue: false };

  if (isPast(date)) {
    const daysAgo = differenceInDays(today, date);
    if (daysAgo <= 14) return { text: `Overdue from ${daysAgo} day${daysAgo !== 1 ? "s" : ""} ago`, isOverdue: true };
    return { text: `Overdue from ${format(date, "MMM d")}`, isOverdue: true };
  }

  const daysUntil = differenceInDays(date, today);
  if (daysUntil <= 7) return { text: `Due in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`, isOverdue: false };
  return { text: `Due ${format(date, "MMM d")}`, isOverdue: false };
};

const InterstitialScreen = ({
  existingFollowup, contactName, onLinkAndUpdate, onClearAndSetNew, onKeepSeparate, onBack,
}: InterstitialScreenProps) => {
  const isTailsOnly = !existingFollowup.connect_type && !existingFollowup.note;
  const { text: dateLabel, isOverdue } = getDateContext(existingFollowup.planned_follow_up_date);

  const typeName = existingFollowup.planned_follow_up_type
    ? (typeLabels[existingFollowup.planned_follow_up_type] || existingFollowup.planned_follow_up_type)
    : null;
  const TypeIcon = existingFollowup.planned_follow_up_type
    ? (typeIcons[existingFollowup.planned_follow_up_type] || Calendar)
    : Calendar;

  console.log("[interstitial] rendering:", {
    taskRecordId: existingFollowup.id,
    type: existingFollowup.planned_follow_up_type,
    date: existingFollowup.planned_follow_up_date,
    hasPriorInteraction: !!(existingFollowup.connect_type || existingFollowup.note),
    isTailsOnly,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <h2
        className="text-center pt-2"
        style={{
          fontFamily: "var(--font-heading)",
          fontSize: "20px",
          fontWeight: 700,
          color: "hsl(var(--foreground))",
        }}
      >
        Outstanding follow-up
      </h2>

      {/* Outstanding follow-up card */}
      <div
        className="rounded-[14px]"
        style={{
          background: isOverdue ? "#fceae8" : "#fdf5f0",
          border: isOverdue
            ? "1px solid rgba(176,56,40,0.15)"
            : "1px solid rgba(28,24,18,0.11)",
          padding: "14px 16px",
        }}
      >
        <div className="flex items-center gap-[10px]">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: isOverdue ? "rgba(176,56,40,0.1)" : "rgba(200,98,42,0.1)",
            }}
          >
            <TypeIcon size={16} style={{ color: isOverdue ? "#b03828" : "#c8622a" }} />
          </div>
          <div>
            <div
              className="font-semibold"
              style={{ fontSize: "15px", fontFamily: "var(--font-body)", color: "#1c1812" }}
            >
              {typeName ? `${typeName} follow-up` : "Planned follow-up"}
            </div>
            <div
              style={{
                fontSize: "13px",
                fontFamily: "var(--font-body)",
                color: isOverdue ? "#b03828" : "#b0a89e",
              }}
            >
              {dateLabel}
            </div>
          </div>
        </div>
        {isTailsOnly && (
          <div style={{ fontSize: "11px", color: "#b0a89e", fontFamily: "var(--font-body)", marginTop: 8 }}>
            No prior interaction logged
          </div>
        )}
      </div>

      {/* Body text */}
      <p
        className="text-center"
        style={{ fontSize: "13px", color: "#7a746c", fontFamily: "var(--font-body)", lineHeight: 1.5 }}
      >
        You can only have one active follow-up per contact. What would you like to do?
      </p>

      {/* Option cards */}
      <div className="flex flex-col gap-[10px]">
        {isTailsOnly && onLinkAndUpdate && (
          <InterstitialOption
            icon={<Link size={18} style={{ color: "#c8622a" }} />}
            iconBg="#fdf5f0"
            label="Link and update"
            description="Merge this log with the existing follow-up and reschedule."
            onClick={onLinkAndUpdate}
          />
        )}
        <InterstitialOption
          icon={<Eraser size={18} style={{ color: "#7a746c" }} />}
          iconBg="#f3f2f0"
          label="Clear and set new"
          description="Mark the previous follow-up as cleared and set a new one."
          onClick={onClearAndSetNew}
        />
        <InterstitialOption
          icon={<SquareSplitVertical size={18} style={{ color: "#7a746c" }} />}
          iconBg="#f3f2f0"
          label="Keep separate"
          description="Log this interaction separately. The previous follow-up stays active."
          onClick={onKeepSeparate}
        />
      </div>

      {/* Back link */}
      {onBack && (
        <button
          onClick={onBack}
          className="w-full text-center text-[13px] text-muted-foreground underline py-1"
          style={{ fontFamily: "var(--font-body)" }}
        >
          ← Back
        </button>
      )}
    </div>
  );
};

interface InterstitialOptionProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  description: string;
  onClick: () => void;
}

const InterstitialOption = ({ icon, iconBg, label, description, onClick }: InterstitialOptionProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-start gap-3 text-left transition-all active:scale-[0.98]"
    style={{
      padding: "14px 16px",
      borderRadius: 14,
      border: "1.5px solid rgba(28,24,18,0.11)",
      background: "hsl(var(--card))",
    }}
  >
    <div
      className="flex items-center justify-center shrink-0"
      style={{ width: 36, height: 36, borderRadius: 10, background: iconBg }}
    >
      {icon}
    </div>
    <div>
      <div className="font-medium" style={{ fontSize: "13px", fontFamily: "var(--font-body)", color: "#1c1812" }}>
        {label}
      </div>
      <div style={{ fontSize: "11px", fontFamily: "var(--font-body)", color: "#7a746c", marginTop: 2, lineHeight: 1.4 }}>
        {description}
      </div>
    </div>
  </button>
);

export default InterstitialScreen;
