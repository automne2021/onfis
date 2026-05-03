interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
  /** Use light-mode colors (for white backgrounds). Defaults to dark-mode */
  variant?: "dark" | "light";
}

export default function StepIndicator({
  currentStep,
  totalSteps,
  labels,
  variant = "dark",
}: StepIndicatorProps) {
  const isLight = variant === "light";

  return (
    <div className="flex items-center gap-1 w-full max-w-2xl mx-auto">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        /* ── Circle colors ── */
        const circleClass = isCompleted
          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
          : isActive
          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/40 ring-4 ring-blue-600/20"
          : isLight
          ? "bg-neutral-100 text-neutral-400 border border-neutral-200"
          : "bg-white/10 text-white/40 border border-white/20";

        /* ── Label colors ── */
        const labelClass = isActive
          ? isLight
            ? "text-blue-700"
            : "text-white"
          : isCompleted
          ? isLight
            ? "text-emerald-600"
            : "text-emerald-300/80"
          : isLight
          ? "text-neutral-400"
          : "text-white/30";

        /* ── Connector track colors ── */
        const trackClass = isLight ? "bg-neutral-200" : "bg-white/10";

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${circleClass}`}
              >
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3.5 8L6.5 11L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={`text-[11px] font-medium text-center leading-tight transition-colors duration-300 ${labelClass}`}
              >
                {labels[i]}
              </span>
            </div>

            {/* Connector line */}
            {step < totalSteps && (
              <div className="flex-1 h-0.5 mx-2 mt-[-20px] relative">
                <div className={`absolute inset-0 rounded-full ${trackClass}`} />
                <div
                  className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: isCompleted ? "100%" : "0%" }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
