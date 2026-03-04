import { useState } from "react";
import type { SubTask } from "./types";
import { CheckboxIconModal as CheckboxIcon, PlusIcon } from "../../../../components/common/Icons";

interface SubTaskItemProps {
  subTask: SubTask;
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
}

function SubTaskItem({ subTask, onToggle, onUpdate }: SubTaskItemProps) {
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
    </div>
  );
}

interface SubTaskListProps {
  subTasks: SubTask[];
  onChange: (subTasks: SubTask[]) => void;
}

export default function SubTaskList({ subTasks, onChange }: SubTaskListProps) {
  const handleToggle = (id: string) => {
    const updated = subTasks.map((st) =>
      st.id === id ? { ...st, completed: !st.completed } : st
    );
    onChange(updated);
  };

  const handleUpdate = (id: string, title: string) => {
    const updated = subTasks.map((st) =>
      st.id === id ? { ...st, title } : st
    );
    onChange(updated);
  };

  const handleAdd = () => {
    const newSubTask: SubTask = {
      id: `subtask-${Date.now()}`,
      title: "New sub-task",
      completed: false,
    };
    onChange([...subTasks, newSubTask]);
  };

  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-medium text-base text-neutral-900 mb-2">Sub-tasks</h3>

      <div className="flex flex-col">
        {subTasks.map((subTask) => (
          <SubTaskItem
            key={subTask.id}
            subTask={subTask}
            onToggle={handleToggle}
            onUpdate={handleUpdate}
          />
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="flex items-center gap-2 py-2 text-primary hover:text-primary-hover transition-colors"
      >
        <PlusIcon />
        <span className="text-sm font-medium">Add item</span>
      </button>
    </div>
  );
}
