import { useState } from "react";
import type { SubTask } from "./types";
import { CheckboxIconModal as CheckboxIcon, PlusIcon } from "../../../../components/common/Icons";
import { createSubtask, updateSubtask, deleteSubtask } from "../../../../services/taskService";
import ConfirmDialog from "../../../../components/common/ConfirmDialog";

interface SubTaskItemProps {
  subTask: SubTask;
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

function SubTaskItem({ subTask, onToggle, onUpdate, onDelete }: SubTaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(subTask.title);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() !== subTask.title) {
      onUpdate(subTask.id, editValue.trim());
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 group">
      <button
        onClick={() => onToggle(subTask.id)}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
        aria-label={subTask.completed ? "Mark incomplete" : "Mark complete"}
      >
        <CheckboxIcon checked={subTask.completed} />
      </button>

      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === "Enter" && handleBlur()}
          className="flex-1 text-sm text-neutral-900 bg-transparent outline-none border-b border-primary"
          autoFocus
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`flex-1 text-sm leading-5 cursor-text ${subTask.completed
              ? "text-neutral-400 line-through"
              : "text-neutral-900"
            }`}
        >
          {subTask.title}
        </span>
      )}

      {/* Delete button – visible on hover */}
      <button
        onClick={() => onDelete(subTask.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600"
        aria-label="Delete subtask"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 16 }}>close</span>
      </button>
    </div>
  );
}

interface SubTaskListProps {
  taskId: string;
  subTasks: SubTask[];
  onChange: (subTasks: SubTask[]) => void;
}

export default function SubTaskList({ taskId, subTasks, onChange }: SubTaskListProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleToggle = async (id: string) => {
    const subTask = subTasks.find((st) => st.id === id);
    if (!subTask) return;
    const newCompleted = !subTask.completed;

    // Optimistic UI update
    const updated = subTasks.map((st) =>
      st.id === id ? { ...st, completed: newCompleted } : st
    );
    onChange(updated);

    try {
      await updateSubtask(taskId, id, { title: subTask.title, completed: newCompleted });
    } catch {
      // Revert on failure
      onChange(subTasks);
    }
  };

  const handleUpdate = async (id: string, title: string) => {
    const subTask = subTasks.find((st) => st.id === id);
    if (!subTask) return;

    const updated = subTasks.map((st) =>
      st.id === id ? { ...st, title } : st
    );
    onChange(updated);

    try {
      await updateSubtask(taskId, id, { title, completed: subTask.completed });
    } catch {
      onChange(subTasks);
    }
  };

  const handleAdd = async () => {
    if (isAdding) return;
    setIsAdding(true);

    try {
      const created = await createSubtask(taskId, { title: "New sub-task", completed: false });
      onChange([...subTasks, { id: created.id, title: created.title, completed: created.completed }]);
    } catch {
      // silently fail – toast could be added via context
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);

    const prev = subTasks;
    onChange(subTasks.filter((st) => st.id !== id));

    try {
      await deleteSubtask(taskId, id);
    } catch {
      onChange(prev);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <h3 className="body-3-medium text-neutral-900 mb-2">Sub-tasks</h3>

      <div className="flex flex-col">
        {subTasks.map((subTask) => (
          <SubTaskItem
            key={subTask.id}
            subTask={subTask}
            onToggle={(id) => void handleToggle(id)}
            onUpdate={(id, title) => void handleUpdate(id, title)}
            onDelete={(id) => setDeleteTarget(id)}
          />
        ))}
      </div>

      <button
        onClick={() => void handleAdd()}
        disabled={isAdding}
        className="flex items-center gap-2 py-2 text-primary hover:text-primary-hover transition-colors disabled:opacity-50"
      >
        <PlusIcon />
        <span className="text-sm font-medium">{isAdding ? "Adding..." : "Add item"}</span>
      </button>

      {/* Confirmation dialog for deleting a subtask */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Sub-task"
        message="Are you sure you want to delete this sub-task? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => void handleDeleteConfirmed()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
