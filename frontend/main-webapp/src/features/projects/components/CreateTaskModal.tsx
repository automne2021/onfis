import { useEffect, useState } from "react";
import Modal from "../../../components/common/Modal";
import DateRangePicker from "../../../components/common/DateRangePicker";
import RichTextEditor from "../../../components/common/RichTextEditor";
import { ErrorIcon, ExpandMoreIcon, DescriptionIcon, ChecklistIcon, PersonAddIcon, DeleteIcon, AddIcon } from "../../../components/common/Icons";

interface SubTask {
  id: string;
  name: string;
  completed: boolean;
  assigneeId?: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  users?: Array<{ id: string; name: string; avatar?: string }>;
  projects?: Array<{ id: string; name: string }>;
  availableTags?: string[];
  defaultProjectId?: string;
  onSubmit?: (data: TaskFormData) => void;
}

export interface TaskFormData {
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  assigneeId: string;
  reporterId: string;
  priority: "low" | "medium" | "high" | "urgent";
  estimatedEffort: number;
  projectId: string;
  tags: string[];
  description: string;
  subtasks: SubTask[];
}

const PRIORITIES = [
  { value: "low" as const, label: "Low Priority", color: "bg-green-500" },
  { value: "medium" as const, label: "Medium Priority", color: "bg-yellow-500" },
  { value: "high" as const, label: "High Priority", color: "bg-orange-500" },
  { value: "urgent" as const, label: "Urgent", color: "bg-red-500" },
];

export default function CreateTaskModal({
  isOpen,
  onClose,
  users = [],
  projects = [],
  availableTags = [],
  defaultProjectId,
  onSubmit,
}: CreateTaskModalProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    name: "",
    startDate: null,
    endDate: null,
    assigneeId: "",
    reporterId: "",
    priority: "medium",
    estimatedEffort: 0,
    projectId: "",
    tags: [],
    description: "",
    subtasks: [{ id: "1", name: "", completed: false }],
  });
  const [showReporterDropdown, setShowReporterDropdown] = useState(false);
  const selectedReporter = users.find((a) => a.id === formData.reporterId);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);

  const selectedAssignee = users.find((a) => a.id === formData.assigneeId);
  const selectedPriority = PRIORITIES.find((p) => p.value === formData.priority);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      projectId: defaultProjectId || projects[0]?.id || "",
    }));
  }, [defaultProjectId, isOpen, projects]);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, name: e.target.value }));
    if (e.target.value) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleSubtaskChange = (
    id: string,
    field: "name" | "completed",
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));
  };

  const addSubtask = () => {
    setFormData((prev) => ({
      ...prev,
      subtasks: [
        ...prev.subtasks,
        { id: Date.now().toString(), name: "", completed: false },
      ],
    }));
  };

  const removeSubtask = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((s) => s.id !== id),
    }));
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

  const handleSubmit = () => {
    // Validate
    if (!formData.name.trim()) {
      setErrors({ name: "Task name is required" });
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
      assigneeId: "",
      reporterId: "",
      priority: "medium",
      estimatedEffort: 0,
      projectId: "",
      tags: [],
      description: "",
      subtasks: [{ id: "1", name: "", completed: false }],
    });
    setErrors({});
    onClose();
  };

  const activeSubtasks = formData.subtasks.filter((s) => s.name.trim());

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Create New Task"
      maxWidth="lg"
      footer={
        <>
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-md shadow-blue-500/20 transition-all"
          >
            Create Task
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Task Name */}
        <div className="relative group">
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            Task Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Enter task name"
              className={`
                w-full px-4 py-3 rounded-lg border 
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
          label="Select Task Duration"
        />

        {/* Assignee, Priority, Project */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Assignee */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Assignee
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                className="w-full pl-3 pr-10 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-neutral-50 text-left text-sm flex items-center gap-2"
              >
                {selectedAssignee ? (
                  <>
                    {selectedAssignee.avatar ? (
                      <div
                        className="size-6 rounded-full bg-neutral-300 bg-center bg-cover"
                        style={{
                          backgroundImage: `url('${selectedAssignee.avatar}')`,
                        }}
                      />
                    ) : (
                      <div className="size-6 rounded-full bg-neutral-300 text-[10px] flex items-center justify-center text-neutral-500 font-bold">
                        {getInitials(selectedAssignee.name)}
                      </div>
                    )}
                    <span className="text-neutral-900 truncate">
                      {selectedAssignee.name}
                    </span>
                  </>
                ) : (
                  <span className="text-neutral-400">Select assignee...</span>
                )}
              </button>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none flex">
                <ExpandMoreIcon />
              </div>

              {/* Dropdown */}
              {showAssigneeDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20">
                  {users.map((assignee) => (
                    <button
                      key={assignee.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          assigneeId: assignee.id,
                        }));
                        setShowAssigneeDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-100"
                    >
                      <div className="size-6 rounded-full bg-neutral-300 text-[10px] flex items-center justify-center text-neutral-500 font-bold">
                        {getInitials(assignee.name)}
                      </div>
                      <span>{assignee.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Priority
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
                className="w-full pl-3 pr-10 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-neutral-50 text-left text-sm flex items-center gap-2"
              >
                <span
                  className={`inline-block size-2 rounded-full ${selectedPriority?.color}`}
                />
                <span className="text-neutral-900">
                  {selectedPriority?.label}
                </span>
              </button>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none flex">
                <ExpandMoreIcon />
              </div>

              {/* Dropdown */}
              {showPriorityDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20">
                  {PRIORITIES.map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          priority: priority.value,
                        }));
                        setShowPriorityDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-100"
                    >
                      <span
                        className={`inline-block size-2 rounded-full ${priority.color}`}
                      />
                      <span>{priority.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Associated Project */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Associated Project
            </label>
            <div className="relative">
              <select
                value={formData.projectId}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, projectId: e.target.value }))
                }
                className="w-full appearance-none pl-4 pr-10 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-neutral-50 text-neutral-900 text-sm cursor-pointer"
              >
                <option disabled value="">
                  Select a project...
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none flex">
                <ExpandMoreIcon />
              </div>
            </div>
          </div>
        </div>

        {/* Reporter & Estimated Effort */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reporter / Reviewer */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Reporter / Reviewer
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReporterDropdown(!showReporterDropdown)}
                className="w-full pl-3 pr-10 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-neutral-50 text-left text-sm flex items-center gap-2"
              >
                {selectedReporter ? (
                  <>
                    <div className="size-6 rounded-full bg-amber-400 text-[10px] flex items-center justify-center text-white font-bold">
                      {getInitials(selectedReporter.name)}
                    </div>
                    <span className="text-neutral-900 truncate">
                      {selectedReporter.name}
                    </span>
                  </>
                ) : (
                  <span className="text-neutral-400">Select reviewer...</span>
                )}
              </button>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none flex">
                <ExpandMoreIcon />
              </div>
              {showReporterDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-20">
                  {users.map((assignee) => (
                    <button
                      key={assignee.id}
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, reporterId: assignee.id }));
                        setShowReporterDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-100"
                    >
                      <div className="size-6 rounded-full bg-amber-400 text-[10px] flex items-center justify-center text-white font-bold">
                        {getInitials(assignee.name)}
                      </div>
                      <span>{assignee.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Estimated Effort */}
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-2">
              Estimated Effort (hours)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.estimatedEffort || ""}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, estimatedEffort: Number(e.target.value) || 0 }))
              }
              placeholder="e.g. 8"
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary bg-neutral-50 text-neutral-900 text-sm transition-colors"
            />
          </div>
        </div>

        {/* Shared Tags */}
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
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
            <button className="border-b-2 border-primary py-3 px-1 text-sm font-bold text-primary flex items-center gap-2">
              <DescriptionIcon />
              Overview
            </button>
          </nav>
        </div>

        {/* Description */}
        <RichTextEditor
          onChange={(value: string) =>
            setFormData((prev) => ({ ...prev, description: value }))
          }
        />

        {/* Subtasks */}
        <div className="bg-neutral-100 rounded-xl border border-neutral-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <span className="text-primary"><ChecklistIcon /></span>
              Sub-tasks
            </h3>
            <span className="text-xs text-neutral-500">
              {activeSubtasks.length} sub-task
              {activeSubtasks.length !== 1 ? "s" : ""} added
            </span>
          </div>

          {/* Subtask Rows */}
          <div className="flex flex-col gap-3">
            {formData.subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-3 group bg-white p-2 rounded-lg border border-neutral-200"
              >
                <div className="flex items-center justify-center pl-2">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={(e) =>
                      handleSubtaskChange(
                        subtask.id,
                        "completed",
                        e.target.checked
                      )
                    }
                    className="w-4 h-4 rounded border-neutral-300 text-primary focus:ring-primary"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={subtask.name}
                    onChange={(e) =>
                      handleSubtaskChange(subtask.id, "name", e.target.value)
                    }
                    placeholder="Enter sub-task name"
                    className="w-full px-2 py-1 rounded border-none bg-transparent focus:ring-0 text-neutral-900 text-sm font-medium placeholder:text-neutral-400"
                  />
                </div>
                <div className="flex items-center gap-2 pr-2">
                  <div
                    className="size-6 rounded-full bg-neutral-200 text-[10px] flex items-center justify-center text-neutral-500 font-bold border border-white cursor-pointer hover:bg-neutral-300"
                    title="Assign"
                  >
                    <PersonAddIcon />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSubtask(subtask.id)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete Sub-task"
                  >
                    <DeleteIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Subtask Button */}
          <button
            type="button"
            onClick={addSubtask}
            className="mt-4 flex items-center gap-2 text-primary font-bold text-sm hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors w-max"
          >
            <AddIcon />
            Add Sub-task
          </button>
        </div>
      </div>
    </Modal>
  );
}
