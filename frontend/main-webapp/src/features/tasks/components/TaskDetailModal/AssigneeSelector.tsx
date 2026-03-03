import { useState, useRef, useEffect } from "react";
import type { Assignee } from "../../types";
import { ChevronDownIcon } from "../../../../components/common/Icons";

interface AssigneeSelectorProps {
  value: Assignee | null;
  options: Assignee[];
  onChange: (assignee: Assignee) => void;
}

export default function AssigneeSelector({ value, options, onChange }: AssigneeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getInitial = (name: string) => name.charAt(0).toUpperCase();

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

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-neutral-500">Assignee</label>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl hover:border-neutral-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            {value ? (
              <>
                <div className="w-8 h-8 rounded-full bg-chart-3 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                  {value.avatar ? (
                    <img
                      src={value.avatar}
                      alt={value.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitial(value.name)
                  )}
                </div>
                <span className="text-sm font-medium text-neutral-900">
                  {value.name}
                </span>
              </>
            ) : (
              <span className="text-sm text-neutral-400">Select assignee</span>
            )}
          </div>
          <ChevronDownIcon />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-neutral-200 shadow-lg z-10 overflow-hidden max-h-[200px] overflow-y-auto">
            {options.map((assignee) => (
              <button
                key={assignee.id}
                onClick={() => {
                  onChange(assignee);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 transition-colors ${value?.id === assignee.id ? "bg-neutral-50" : ""
                  }`}
              >
                <div className="w-8 h-8 rounded-full bg-chart-3 flex items-center justify-center text-white text-sm font-medium overflow-hidden">
                  {assignee.avatar ? (
                    <img
                      src={assignee.avatar}
                      alt={assignee.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitial(assignee.name)
                  )}
                </div>
                <span className="text-sm text-neutral-900">{assignee.name}</span>
              </button>
            ))}
            {options.length === 0 && (
              <p className="text-sm text-neutral-400 px-4 py-3">No team members available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
