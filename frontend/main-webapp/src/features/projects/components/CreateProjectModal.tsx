import { useState } from "react";
import Modal from "../../../components/common/Modal";
import DateRangePicker from "../../../components/common/DateRangePicker";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { ErrorIcon, ExpandMoreIcon, InfoIcon, FlagOutlineIcon as FlagIcon, DeleteIcon, AddCircleIcon } from "../../../components/common/Icons";
import { Button } from "../../../components/common/Buttons/Button";

interface Milestone {
  id: string;
  name: string;
  targetDate: string;
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
  startDate: Date | null;
  endDate: Date | null;
  managerId: string;
  tags: string[];
  description: string;
  milestones: Milestone[];
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
    startDate: null,
    endDate: null,
    managerId: "",
    tags: [],
    description: "",
    milestones: [{ id: "1", name: "", targetDate: "" }],
  });
  const [errors, setErrors] = useState<{ name?: string }>({});

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
  };

  const handleSubmit = () => {
    // Validate
    if (!formData.name.trim()) {
      setErrors({ name: "Project name is required" });
      return;
    }

    onSubmit?.(formData);
    onClose();
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      startDate: null,
      endDate: null,
      managerId: "",
      tags: [],
      description: "",
      milestones: [{ id: "1", name: "", targetDate: "" }],
    });
    setErrors({});
    onClose();
  };

  const activeMilestones = formData.milestones.filter((m) => m.name.trim());

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

        {/* Date Range Picker */}
        <DateRangePicker
          startDate={formData.startDate}
          endDate={formData.endDate}
          onStartDateChange={(date: Date | null) =>
            setFormData((prev) => ({ ...prev, startDate: date }))
          }
          onEndDateChange={(date: Date | null) =>
            setFormData((prev) => ({ ...prev, endDate: date }))
          }
          label="Select Project Duration"
        />

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
                    onChange={(e) =>
                      handleMilestoneChange(
                        milestone.id,
                        "targetDate",
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1.5 rounded-md border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-white text-neutral-900 text-sm focus:outline-none"
                  />
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
      </div>
    </Modal>
  );
}
