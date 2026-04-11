import { useState, useEffect, useMemo, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { CloseIcon, SearchIcon } from "../../../components/common/Icons";

// Types
export interface AddPositionFormData {
  jobTitle: string;
  departmentId: string;
  parentId: string;
  employmentType: "full-time" | "part-time" | "contract";
  isVacant: boolean;
  assignedUser: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface PositionOption {
  id: string;
  title: string;
  holderName?: string;
}

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AddPositionFormData) => void;
  departments: DepartmentOption[];
  positions: PositionOption[];
  unassignedUsers: { id: string; name: string }[];
}

// Employment type options
const employmentTypes = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
] as const;

export default function AddPositionModal({
  isOpen,
  onClose,
  onSubmit,
  departments,
  positions,
  unassignedUsers,
}: AddPositionModalProps) {
  const [formData, setFormData] = useState<AddPositionFormData>({
    jobTitle: "",
    departmentId: "",
    parentId: "",
    employmentType: "full-time",
    isVacant: true,
    assignedUser: "",
  });

  const [reportsToSearch, setReportsToSearch] = useState("");
  const [showReportsToDropdown, setShowReportsToDropdown] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        jobTitle: "",
        departmentId: departments.length > 0 ? departments[0].id : "",
        parentId: "",
        employmentType: "full-time",
        isVacant: true,
        assignedUser: "",
      });
      setReportsToSearch("");
    }
  }, [isOpen, departments]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Filter positions based on search
  const filteredPositions = useMemo(() => {
    if (!reportsToSearch.trim()) return positions;
    const query = reportsToSearch.toLowerCase();
    return positions.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        (p.holderName && p.holderName.toLowerCase().includes(query))
    );
  }, [positions, reportsToSearch]);

  const selectedParentLabel = useMemo(() => {
    if (!formData.parentId) return "";
    const pos = positions.find((p) => p.id === formData.parentId);
    if (!pos) return "";
    return pos.holderName ? `${pos.title} (${pos.holderName})` : pos.title;
  }, [formData.parentId, positions]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container - Laptop-First: max-width 460px */}
      <div className="relative w-full max-w-[460px] mx-4 bg-white rounded-xl shadow-xl overflow-hidden border border-neutral-200 z-10 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-[50px] border-b border-neutral-200">
          <h2 className="text-base font-bold leading-5 text-neutral-900">
            Add New Position
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-50 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <form onSubmit={handleSubmit}>
          <div className="px-4 py-3 max-h-[calc(100vh-180px)] overflow-y-auto space-y-3">
            {/* Job Title */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-900">
                Job Title
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData({ ...formData, jobTitle: e.target.value })
                }
                placeholder="e.g. Senior Product Designer"
                className="w-full h-9 px-3 bg-neutral-50 border border-neutral-200 rounded-lg
                  text-sm text-neutral-900 placeholder:text-neutral-400
                  focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20
                  transition-colors"
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-900">
                Department
              </label>
              <div className="relative">
                <select
                  value={formData.departmentId}
                  onChange={(e) =>
                    setFormData({ ...formData, departmentId: e.target.value })
                  }
                  className="w-full h-9 px-3 pr-10 bg-neutral-50 border border-neutral-200 rounded-lg
                    text-sm text-neutral-900 appearance-none cursor-pointer
                    focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20
                    transition-colors"
                >
                  <option value="">— Select department —</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <DropdownArrowIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Reports To */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-900">
                Reports To
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <SearchIcon size={20} />
                </div>
                <input
                  type="text"
                  value={formData.parentId ? selectedParentLabel : reportsToSearch}
                  onChange={(e) => {
                    setReportsToSearch(e.target.value);
                    setFormData({ ...formData, parentId: "" });
                    setShowReportsToDropdown(true);
                  }}
                  onFocus={() => setShowReportsToDropdown(true)}
                  placeholder="Search position..."
                  className="w-full h-9 pl-10 pr-3 bg-neutral-50 border border-neutral-200 rounded-lg
                    text-sm text-neutral-900 placeholder:text-neutral-400
                    focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20
                    transition-colors"
                />
                {formData.parentId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, parentId: "" });
                      setReportsToSearch("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    ×
                  </button>
                )}
                {/* Reports To Dropdown */}
                {showReportsToDropdown && !formData.parentId && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg max-h-[180px] overflow-y-auto z-20">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, parentId: "" });
                        setReportsToSearch("");
                        setShowReportsToDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-50 transition-colors"
                    >
                      — None (root position) —
                    </button>
                    {filteredPositions.map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, parentId: pos.id });
                          setReportsToSearch("");
                          setShowReportsToDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-neutral-900 hover:bg-primary/5 transition-colors"
                      >
                        <span className="font-medium">{pos.title}</span>
                        {pos.holderName && (
                          <span className="text-neutral-400 ml-1">
                            ({pos.holderName})
                          </span>
                        )}
                      </button>
                    ))}
                    {filteredPositions.length === 0 && (
                      <div className="px-3 py-2 text-sm text-neutral-400">
                        No positions found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Employment Type - Segmented Control */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-900">
                Employment Type
              </label>
              <div className="flex h-9 p-1 bg-neutral-50 border border-neutral-200 rounded-lg">
                {employmentTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, employmentType: type.value })
                    }
                    className={`flex-1 h-full rounded-md text-sm font-medium transition-all
                      ${formData.employmentType === type.value
                        ? "bg-secondary text-primary shadow-sm"
                        : "text-neutral-400 hover:text-neutral-500"
                      }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vacancy Status */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label className="block text-sm font-medium text-neutral-900">
                  Vacancy Status
                </label>
                <p className="text-xs text-neutral-400">
                  Mark position as currently vacant
                </p>
              </div>
              <ToggleSwitch
                checked={formData.isVacant}
                onChange={(checked) =>
                  setFormData({ ...formData, isVacant: checked, assignedUser: checked ? "" : formData.assignedUser })
                }
              />
            </div>

            {/* Assigned User (only show when not vacant) */}
            {!formData.isVacant && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-neutral-900">
                  Assigned User
                </label>
                <div className="relative">
                  <select
                    value={formData.assignedUser}
                    onChange={(e) =>
                      setFormData({ ...formData, assignedUser: e.target.value })
                    }
                    className="w-full h-9 px-3 pr-10 bg-neutral-50 border border-neutral-200 rounded-lg
                      text-sm text-neutral-900 appearance-none cursor-pointer
                      focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20
                      transition-colors"
                  >
                    <option value="">— Select user —</option>
                    {unassignedUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <DropdownArrowIcon className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-4 h-[50px] border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-500 
                border border-neutral-200 rounded-[8px]
                hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-primary 
                bg-secondary border border-primary rounded-[8px]
                hover:bg-secondary/80 transition-colors"
            >
              Create Position
            </button>
          </div>
        </form>
      </div>

      {/* Click-away listener for reports-to dropdown */}
      {showReportsToDropdown && (
        <div
          className="fixed inset-0 z-[49]"
          onClick={() => setShowReportsToDropdown(false)}
        />
      )}
    </div>,
    document.body
  );
}

// ============ Sub-components ============

// Toggle Switch Component
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleSwitch({ checked, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors
        ${checked ? "bg-primary" : "bg-neutral-200"}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform
          ${checked ? "left-[22px]" : "left-0.5"}`}
      />
    </button>
  );
}

// Dropdown Arrow Icon
function DropdownArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M7 10L12 15L17 10"
        stroke="#90A1B9"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
