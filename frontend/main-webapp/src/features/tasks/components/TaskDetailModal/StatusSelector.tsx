import { useState, useRef, useEffect } from "react";
import type { TaskStatus, Task } from "../../types";
import { ChevronDownIcon } from "../../../../components/common/Icons";
import { getTransitionError, ALLOWED_TRANSITIONS, STATUS_CONFIG } from "../../workflowUtils";
import { useToast } from "../../../../contexts/useToast";

interface StatusSelectorProps {
  value: TaskStatus;
  task: Pick<Task, "assignees" | "reporterId">;
  onChange: (status: TaskStatus) => void;
  disabled?: boolean;
}

const ALL_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE"];

export default function StatusSelector({ value, task, onChange, disabled }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const selectedStatus = STATUS_CONFIG[value];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (targetStatus: TaskStatus) => {
    if (targetStatus === value) {
      setIsOpen(false);
      return;
    }

    // Skip blockedReason check here — the modal will prompt for it
    const error = targetStatus === "BLOCKED"
      ? getTransitionError(value, targetStatus, task, undefined, "__skip__")
      : getTransitionError(value, targetStatus, task);
    if (error) {
      showToast(error, "error");
      setIsOpen(false);
      return;
    }

    onChange(targetStatus);
    setIsOpen(false);
  };

  // Determine which statuses are reachable from current
  const allowedTargets = ALLOWED_TRANSITIONS[value] || [];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-neutral-500">Status</label>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl transition-colors ${disabled
            ? "opacity-60 cursor-not-allowed"
            : "hover:border-neutral-300 cursor-pointer"
            }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${selectedStatus.color}`} />
            <span className="text-sm font-medium text-neutral-900">
              {selectedStatus.label}
            </span>
          </div>
          {!disabled && <ChevronDownIcon />}
        </button>

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-neutral-200 shadow-lg z-10 overflow-hidden">
            {ALL_STATUSES.map((status) => {
              const config = STATUS_CONFIG[status];
              const isAllowed = status === value || allowedTargets.includes(status);
              const transitionError = status !== value ? getTransitionError(value, status, task) : null;

              return (
                <button
                  key={status}
                  onClick={() => handleSelect(status)}
                  disabled={!isAllowed}
                  title={transitionError || undefined}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 transition-colors ${value === status
                    ? "bg-neutral-50"
                    : isAllowed
                      ? "hover:bg-neutral-50 cursor-pointer"
                      : "opacity-40 cursor-not-allowed"
                    }`}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                  <span className="text-sm text-neutral-900">{config.label}</span>
                  {!isAllowed && (
                    <span className="ml-auto text-xs text-neutral-400">Blocked</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
