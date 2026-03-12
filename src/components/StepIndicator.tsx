import { Check } from "lucide-react";

interface StepIndicatorProps {
  currentStep: 1 | 2;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const step1Complete = currentStep === 2;
  const step1Active = currentStep === 1;
  const step2Active = currentStep === 2;

  return (
    <div className="py-5 px-5">
      <div className="flex items-start">
        {/* Step 1 */}
        <div className="flex flex-col items-start" style={{ gap: "4px" }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{
              width: "28px",
              height: "28px",
              background: step1Complete ? "#c8622a" : step1Active ? "#fff" : "#f0ede8",
              border: step1Complete
                ? "none"
                : step1Active
                ? "1.5px solid #c8622a"
                : "1.5px solid #e0dbd3",
            }}
          >
            {step1Complete ? (
              <Check size={14} strokeWidth={2.5} style={{ color: "#fff" }} />
            ) : (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  color: step1Active ? "#c8622a" : "#888",
                  fontFamily: "var(--font-body)",
                }}
              >
                1
              </span>
            )}
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: step1Active || step1Complete ? "#18181a" : "#888",
              fontFamily: "var(--font-body)",
            }}
          >
            What happened
          </span>
        </div>

        {/* Connecting line */}
        <div className="flex-1 self-start" style={{ marginTop: "13px" }}>
          <div
            style={{
              height: "1px",
              background: step1Complete ? "#c8622a" : "#e8e4de",
            }}
          />
        </div>

        {/* Step 2 */}
        <div className="flex flex-col items-end" style={{ gap: "4px" }}>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{
              width: "28px",
              height: "28px",
              background: step2Active ? "#fff" : "#f0ede8",
              border: step2Active ? "1.5px solid #c8622a" : "1.5px solid #e0dbd3",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 500,
                color: step2Active ? "#c8622a" : "#888",
                fontFamily: "var(--font-body)",
              }}
            >
              2
            </span>
          </div>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 500,
              color: step2Active ? "#18181a" : "#888",
              fontFamily: "var(--font-body)",
            }}
          >
            What's next
          </span>
        </div>
      </div>
    </div>
  );
};

export default StepIndicator;
