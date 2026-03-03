import type { InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ icon, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        <div
          className={`
            bg-neutral-50 border border-neutral-200 rounded-[20px]
            flex items-center gap-2.5 px-5 py-3 h-12
            focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20
            transition-colors
            ${error ? "border-action-error" : ""}
            ${className}
          `}
        >
          {icon && (
            <span className="text-neutral-400 flex-shrink-0">{icon}</span>
          )}
          <input
            ref={ref}
            className="
              flex-1 bg-transparent outline-none
              text-neutral-900 text-base font-medium leading-5
              placeholder:text-neutral-400 placeholder:font-medium
            "
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-action-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
