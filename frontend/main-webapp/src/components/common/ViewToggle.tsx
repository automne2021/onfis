import type { ReactElement } from "react";

export interface ViewModeOption<T extends string> {
  mode: T;
  icon: (active: boolean) => ReactElement;
  ariaLabel?: string;
}

export interface ViewToggleProps<T extends string> {
  viewMode: T;
  viewModes: ViewModeOption<T>[];
  onViewModeChange: (mode: T) => void;
  className?: string; 
}

export function ViewToggle<T extends string>({
  viewMode,
  viewModes,
  onViewModeChange,
  className = "",
}: ViewToggleProps<T>) {
  const activeIndex = Math.max(0, viewModes.findIndex((v) => v.mode === viewMode));

  return (
    <div className={`relative flex items-center p-1 rounded-[6px] bg-neutral-200 w-fit isolate ${className}`}>
      <div
        className="absolute top-1 bottom-1 left-1 bg-primary rounded-[4px] transition-transform duration-300 ease-out -z-10"
        style={{
          width: `calc((100% - 8px) / ${viewModes.length})`,
          transform: `translateX(calc(${activeIndex} * 100%))`,
        }}
      />

      {viewModes.map(({ mode, icon, ariaLabel }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode)}
          className={`relative z-10 p-1.5 flex-1 flex items-center justify-center transition-colors duration-300 ${
            viewMode === mode ? "text-white" : "text-neutral-500 hover:text-neutral-800"
          }`}
          aria-label={ariaLabel || `${mode} view`}
        >
          {icon(viewMode === mode)}
        </button>
      ))}
    </div>
  );
}