import { useState } from "react";
import Modal from "../../../components/common/Modal";
import DateRangePicker from "../../../components/common/DateRangePicker";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { ErrorIcon, ExpandMoreIcon, InfoIcon, FlagOutlineIcon as FlagIcon, DeleteIcon, AddCircleIcon } from "../../../components/common/Icons";
import { Button } from "../../../components/common/Buttons/Button";
import FileAttachmentSection, { type AttachmentFile } from "../../../components/common/FileAttachmentSection";

interface Milestone {
  id: string;
  name: string;
  targetDate: string;
}

interface FormErrors {
  name?: string;
  dateRange?: string;
  milestone?: string;
  milestoneById?: Record<string, string>;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  managers?: Array<{ id: string; name: string }>;
  availableTags?: string[];
  onSubmit?: (data: ProjectFormData) => void;
}

export interface ProjectFormData {
  name: string;
  customer: string;
  startDate: Date | null;
  endDate: Date | null;
  managerId: string;
  tags: string[];
  description: string;
  milestones: Milestone[];
  pendingFiles: File[];
}

function toDateOnly(value: Date) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toIsoDate(value: Date) {
  const normalized = toDateOnly(value);
  const year = normalized.getFullYear();
  const month = String(normalized.getMonth() + 1).padStart(2, "0");
  const day = String(normalized.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date | null {
  if (!value) {
    return null;
  }
  const parts = value.split("-");
  if (parts.length !== 3) {
    return null;
  }
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) {
    return null;
  }
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return toDateOnly(parsed);
}

export default function CreateProjectModal({
  isOpen,
  onClose,
  managers = [],
  availableTags = [],
  onSubmit,
}: CreateProjectModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    customer: "",
    startDate: null,
    endDate: null,
    managerId: "",
    tags: [],
    description: "",
    milestones: [{ id: "1", name: "", targetDate: "" }],
    pendingFiles: [],
  });
  const [pendingAttachments, setPendingAttachments] = useState<AttachmentFile[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, name: e.target.value }));
    if (e.target.value) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleManagerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, managerId: e.target.value }));
  };

  const handleToggleTag = (tagName: string) => {
    setFormData((prev) => {
      const exists = prev.tags.includes(tagName);
      return {
        ...prev,
        tags: exists ? prev.tags.filter((tag) => tag !== tagName) : [...prev.tags, tagName],
      };
    });
  };

  const handleMilestoneChange = (
    id: string,
    field: "name" | "targetDate",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      ),
    }));
    setErrors((prev) => {
      const nextMilestoneErrors = { ...(prev.milestoneById ?? {}) };
      delete nextMilestoneErrors[id];
      return {
        ...prev,
        milestone: undefined,
        milestoneById:
          Object.keys(nextMilestoneErrors).length > 0
            ? nextMilestoneErrors
            : undefined,
      };
    });
  };

  const addMilestone = () => {
    setFormData((prev) => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { id: Date.now().toString(), name: "", targetDate: "" },
      ],
    }));
  };

  const removeMilestone = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((m) => m.id !== id),
    }));
    setErrors((prev) => {
      const nextMilestoneErrors = { ...(prev.milestoneById ?? {}) };
      delete nextMilestoneErrors[id];
      return {
        ...prev,
        milestoneById:
          Object.keys(nextMilestoneErrors).length > 0
            ? nextMilestoneErrors
            : undefined,
      };
    });
  };

  const handleSubmit = () => {
    const nextErrors: FormErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Project name is required";
    }

    const normalizedStart = formData.startDate ? toDateOnly(formData.startDate) : null;
    const normalizedEnd = formData.endDate ? toDateOnly(formData.endDate) : null;

    if (normalizedStart && normalizedEnd && normalizedEnd < normalizedStart) {
      nextErrors.dateRange = "Project end date must be the same as or after start date.";
    }

    const hasAnyMilestoneDate = formData.milestones.some(
      (milestone) => milestone.targetDate.trim() !== "",
    );
    if (hasAnyMilestoneDate && (!normalizedStart || !normalizedEnd)) {
      nextErrors.milestone = "Please choose project start and end dates before assigning milestone dates.";
    }

    const milestoneById: Record<string, string> = {};
    let previousMilestoneDate: Date | null = null;

    for (const milestone of formData.milestones) {
      const hasAnyValue =
        milestone.name.trim() !== "" || milestone.targetDate.trim() !== "";
      if (!hasAnyValue) {
        continue;
      }

      if (!milestone.targetDate.trim()) {
        milestoneById[milestone.id] = "Please choose a target date for this milestone.";
        continue;
      }

      const parsedTargetDate = parseIsoDate(milestone.targetDate);
      if (!parsedTargetDate) {
        milestoneById[milestone.id] = "Invalid milestone date.";
        continue;
      }

      if (normalizedStart && parsedTargetDate < normalizedStart) {
        milestoneById[milestone.id] = "Milestone date must be on or after project start date.";
        continue;
      }

      if (normalizedEnd && parsedTargetDate > normalizedEnd) {
        milestoneById[milestone.id] = "Milestone date must be on or before project end date.";
        continue;
      }

      if (previousMilestoneDate && parsedTargetDate < previousMilestoneDate) {
        milestoneById[milestone.id] = "Milestone date cannot be earlier than the previous milestone.";
        continue;
      }

      previousMilestoneDate = parsedTargetDate;
    }

    if (Object.keys(milestoneById).length > 0) {
      nextErrors.milestoneById = milestoneById;
      if (!nextErrors.milestone) {
        nextErrors.milestone = "Please fix milestone date errors.";
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit?.(formData);
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      customer: "",
      startDate: null,
      endDate: null,
      managerId: "",
      tags: [],
      description: "",
      milestones: [{ id: "1", name: "", targetDate: "" }],
      pendingFiles: [],
    });
    setPendingAttachments([]);
    setErrors({});
    onClose();
  };

  const handleAddPendingFiles = (files: File[]) => {
    setFormData((prev) => ({ ...prev, pendingFiles: [...prev.pendingFiles, ...files] }));
    setPendingAttachments((prev) => [
      ...prev,
      ...files.map((f) => ({ id: `local-${Date.now()}-${f.name}`, fileName: f.name, fileUrl: "", size: f.size, fileType: f.type })),
    ]);
  };

  const handleRemovePendingFile = (id: string) => {
    const idx = pendingAttachments.findIndex((a) => a.id === id);
    if (idx === -1) return;
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id));
    setFormData((prev) => {
      const files = [...prev.pendingFiles];
      files.splice(idx, 1);
      return { ...prev, pendingFiles: files };
    });
  };

  const activeMilestones = formData.milestones.filter((m) => m.name.trim());
  const todayIso = toIsoDate(new Date());
  const startDateIso = formData.startDate ? toIsoDate(formData.startDate) : "";
  const endDateIso = formData.endDate ? toIsoDate(formData.endDate) : "";
  const milestoneMinDate =
    startDateIso && startDateIso > todayIso ? startDateIso : todayIso;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Create New Project"
      maxWidth="xl"
      footer={
        <>
          <Button
            title="Cancel"
            onClick={handleCancel}
            style="sub"
            textStyle='body-3-medium'
          />
          <Button
            title="Create Project"
            onClick={handleSubmit}
            style="primary"
            textStyle='body-3-medium'
          />
        </>
      }
    >
      <div className="space-y-4">
        {/* Project Name */}
        <div className="relative group">
          <label className="block text-xs font-semibold text-neutral-900 mb-1.5">
            Project Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Enter project name"
              className={`
                w-full px-3 py-2 rounded-lg border focus:outline-none
                ${errors.name
                  ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary"
                }
                bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 text-sm transition-colors
              `}
            />
            {errors.name && (
              <>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 cursor-help">
                  <ErrorIcon />
                </div>
                <div className="absolute right-0 top-full mt-1 px-3 py-1 bg-red-500 text-white text-xs rounded shadow-lg z-10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {errors.name}
                  <div className="absolute bottom-full right-4 border-4 border-transparent border-b-red-500" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Customer */}
        <div>
          <label className="block text-xs font-semibold text-neutral-900 mb-1.5">
            Customer / Client
          </label>
          <input
            type="text"
            value={formData.customer}
            onChange={(e) => setFormData((prev) => ({ ...prev, customer: e.target.value }))}
            placeholder="Enter customer or client name (optional)"
            className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-neutral-50 text-neutral-900 placeholder:text-neutral-400 text-sm transition-colors outline-none"
          />
        </div>

        {/* Date Range Picker */}
        <DateRangePicker
          startDate={formData.startDate}
          endDate={formData.endDate}
          onStartDateChange={(date: Date | null) => {
            setFormData((prev) => ({ ...prev, startDate: date }));
            setErrors((prev) => ({
              ...prev,
              dateRange: undefined,
              milestone: undefined,
              milestoneById: undefined,
            }));
          }}
          onEndDateChange={(date: Date | null) => {
            setFormData((prev) => ({ ...prev, endDate: date }));
            setErrors((prev) => ({
              ...prev,
              dateRange: undefined,
              milestone: undefined,
              milestoneById: undefined,
            }));
          }}
          label="Select Project Duration"
          disablePast
          allowClear
          showLunarDay
        />
        {errors.dateRange && (
          <p className="text-xs text-red-500 -mt-2">{errors.dateRange}</p>
        )}

        {/* Project Manager */}
        <div>
          <label className="block text-xs font-semibold text-neutral-900 mb-1.5">
            Project Manager / Lead
          </label>
          
          <div className="relative">
            <select
              value={formData.managerId}
              onChange={handleManagerChange}
              disabled={managers.length === 0}
              className="w-full appearance-none pl-3 pr-10 py-2 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-neutral-50 text-neutral-900 text-sm cursor-pointer"
            >
              <option disabled value="">
                {managers.length === 0 ? "No users available" : "Select a manager..."}
              </option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none flex">
              <ExpandMoreIcon />
            </div>
          </div>
        </div>

        {/* Shared Tags */}
        <div>
          <label className="block text-xs font-semibold text-neutral-900 mb-1.5">
            Tags (Shared In Settings)
          </label>
          {availableTags.length === 0 ? (
            <div className="px-3 py-2 text-xs text-neutral-500 bg-neutral-50 border border-dashed border-neutral-200 rounded-lg">
              No shared tags found. Add tags in Settings first.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tagName) => {
                const active = formData.tags.includes(tagName);
                return (
                  <button
                    key={tagName}
                    type="button"
                    onClick={() => handleToggleTag(tagName)}
                    className={`px-2.5 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      active
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {tagName}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200">
          <nav aria-label="Tabs" className="flex gap-8">
            <button className="border-b-2 border-primary py-2 px-1 text-xs font-bold text-primary flex items-center gap-2">
              <InfoIcon />
              Overview
            </button>
          </nav>
        </div>

        {/* Description */}
        <RichTextEditor
          // value={formData.description}
          onChange={(value: string) =>
            setFormData((prev) => ({ ...prev, description: value }))
          }
          // placeholder="Describe the project scope, key deliverables, and expected outcomes..."
        />

        {/* Milestones */}
        <div className="bg-neutral-100 rounded-lg border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <span className="text-primary"><FlagIcon /></span>
              Key Milestones
            </h3>
            <span className="text-xs text-neutral-500">
              {activeMilestones.length} milestone
              {activeMilestones.length !== 1 ? "s" : ""} added
            </span>
          </div>

          {/* Header */}
          <div className="grid grid-cols-12 gap-3 mb-2 px-2">
            <div className="col-span-7 text-xs font-semibold text-neutral-500 uppercase">
              Milestone Name
            </div>
            <div className="col-span-4 text-xs font-semibold text-neutral-500 uppercase">
              Target Date
            </div>
            <div className="col-span-1" />
          </div>

          {errors.milestone && (
            <p className="text-xs text-red-500 mb-2 px-2">{errors.milestone}</p>
          )}

          {/* Milestone Rows */}
          <div className="flex flex-col gap-2">
            {formData.milestones.map((milestone) => (
              <div
                key={milestone.id}
                className="grid grid-cols-12 gap-3 items-center group"
              >
                <div className="col-span-7">
                  <input
                    type="text"
                    value={milestone.name}
                    onChange={(e) =>
                      handleMilestoneChange(milestone.id, "name", e.target.value)
                    }
                    placeholder="e.g. Design Approval"
                    className="w-full px-2 py-1.5 rounded-md border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-neutral-900 text-sm focus:outline-none"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="date"
                    value={milestone.targetDate}
                    min={milestoneMinDate}
                    max={endDateIso || undefined}
                    onChange={(e) =>
                      handleMilestoneChange(
                        milestone.id,
                        "targetDate",
                        e.target.value
                      )
                    }
                    className={`w-full px-2 py-1.5 rounded-md border bg-white text-neutral-900 text-sm focus:outline-none ${
                      errors.milestoneById?.[milestone.id]
                        ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        : "border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary"
                    }`}
                  />
                  {errors.milestoneById?.[milestone.id] && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {errors.milestoneById[milestone.id]}
                    </p>
                  )}
                </div>
                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removeMilestone(milestone.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Milestone"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Milestone Button */}
          <button
            type="button"
            onClick={addMilestone}
            className="mt-3 flex items-center gap-2 text-primary font-bold text-xs hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors w-max"
          >
            <AddCircleIcon />
            Add Milestone
          </button>
        </div>

        {/* Attachments */}
        <FileAttachmentSection
          title="Project Files"
          attachments={pendingAttachments}
          onUpload={handleAddPendingFiles}
          onDelete={handleRemovePendingFile}
          canUpload
          canDelete
        />
      </div>
    </Modal>
  );
}
