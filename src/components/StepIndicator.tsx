interface StepIndicatorProps {
  currentStep: 1 | 2;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const step1Complete = currentStep === 2;
  const step1Active = currentStep === 1;
  const step2Active = currentStep === 2;

  const circleStyle = (state: "active" | "completed" | "inactive"): React.CSSProperties => ({
    width: "26px",
    height: "26px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background:
      state === "completed" ? "#c8622a" :
      state === "active" ? "transparent" : "#e8e4de",
    border:
      state === "completed" ? "none" :
      state === "active" ? "1.5px solid #c8622a" : "1.5px solid #d5d0c8",
  });

  const numberStyle = (state: "active" | "completed" | "inactive"): React.CSSProperties => ({
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: 1,
    color:
      state === "completed" ? "#fff" :
      state === "active" ? "#c8622a" : "#a09890",
    fontFamily: "var(--font-body)",
  });

  const labelStyle = (state: "active" | "completed" | "inactive"): React.CSSProperties => ({
    fontSize: "11px",
    fontWeight: state === "active" ? 600 : 400,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: "#999",
    fontFamily: "var(--font-body)",
  });

  const step1State = step1Complete ? "completed" : step1Active ? "active" : "inactive";
  const step2State = step2Active ? "active" : "inactive";

  return (
    <div className="py-5 px-5">
      <div className="flex items-start">
        {/* Step 1 */}
        <div className="flex flex-col items-start" style={{ gap: "4px" }}>
          <div style={circleStyle(step1State)}>
            <span style={numberStyle(step1State)}>1</span>
          </div>
          <span style={labelStyle(step1State)}>What happened</span>
        </div>

        {/* Connecting line */}
        <div className="flex-1 self-start" style={{ marginTop: "12px" }}>
          <div style={{ height: "1px", background: step1Complete ? "#c8622a" : "#e8e4de" }} />
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-end" style={{ gap: "4px" }}>
          <div style={circleStyle(step2State)}>
            <span style={numberStyle(step2State)}>2</span>
          </div>
          <span style={labelStyle(step2State)}>What's next</span>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;