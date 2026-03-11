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
      <div className="flex items-center gap-0">
        {/* Step 1 circle */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[12px] font-medium transition-colors ${
            step1Complete
              ? "bg-primary text-primary-foreground"
              : step1Active
              ? "bg-white border-2 border-primary text-primary"
              : "bg-secondary border border-border text-muted-foreground"
          }`}
          style={{ fontFamily: "var(--font-body)" }}
        >
          {step1Complete ? (
            <Check size={14} strokeWidth={2.5} />
          ) : (
            "1"
          )}
        </div>

        {/* Connecting line */}
        <div
          className={`flex-1 h-[2px] rounded-[2px] transition-colors ${
            step1Complete ? "bg-primary" : "bg-border"
          }`}
        />

        {/* Step 2 circle */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[12px] font-medium transition-colors ${
            step2Active
              ? "bg-white border-2 border-primary text-primary"
              : "bg-secondary border border-border text-muted-foreground"
          }`}
          style={{ fontFamily: "var(--font-body)" }}
        >
          2
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2">
        <span
          className={`text-[12px] font-medium ${
            step1Active || step1Complete ? "text-foreground" : "text-muted-foreground"
          }`}
          style={{ fontFamily: "var(--font-body)" }}
        >
          What happened
        </span>
        <span
          className={`text-[12px] font-medium ${
            step2Active ? "text-foreground" : "text-muted-foreground"
          }`}
          style={{ fontFamily: "var(--font-body)" }}
        >
          What's next
        </span>
      </div>
    </div>
  );
};

export default StepIndicator;
