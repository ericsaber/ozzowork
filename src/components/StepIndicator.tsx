interface StepIndicatorProps {
  currentStep: 1 | 2;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const step1Complete = currentStep === 2;
  const step1Active = currentStep === 1;
  const step2Active = currentStep === 2;
  const step2Inactive = currentStep === 1;

  const circleStyle = (state: "active" | "completed" | "inactive"): React.CSSProperties => ({
    width: "22px",
    height: "22px",
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
    fontSize: "10px",
    fontWeight: 600,
    lineHeight: 1,
    color:
      state === "completed" ? "#fff" :
      state === "active" ? "#c8622a" : "#a09890",
    fontFamily: "var(--font-body)",
  });

  const labelStyle = (active: boolean): React.CSSProperties => ({
    fontSize: "9px",
    fontWeight: 500,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: active ? "#1c1812" : "#a09890",
    fontFamily: "var(--font-body)",
  });

  return (
    <div className="py-5 px-5">
      <div className="flex items-start">
        {/* Step 1 */}
        <div className="flex flex-col items-start" style={{ gap: "4px" }}>
          <div style={circleStyle(step1Complete ? "completed" : step1Active ? "active" : "inactive")}>
            <span style={numberStyle(step1Complete ? "completed" : step1Active ? "active" : "inactive")}>1</span>
          </div>
          <span style={labelStyle(step1Active || step1Complete)}>What happened</span>
        </div>

        {/* Connecting line */}
        <div className="flex-1 self-start" style={{ marginTop: "10px" }}>
          <div style={{ height: "1px", background: step1Complete ? "#c8622a" : "#e8e4de" }} />
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-end" style={{ gap: "4px" }}>
          <div style={circleStyle(step2Active ? "active" : "inactive")}>
            <span style={numberStyle(step2Active ? "active" : "inactive")}>2</span>
          </div>
          <span style={labelStyle(step2Active)}>What's next</span>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
