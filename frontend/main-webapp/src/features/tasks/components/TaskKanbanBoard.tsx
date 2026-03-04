import { useState } from "react";
import type { Stage, Task } from "../types";
import TaskColumn from "./TaskColumn";
import { AddIcon, SwitchLeftIcon } from "../../../components/common/Icons";

interface TaskKanbanBoardProps {
  stages: Stage[];
  onAddStage?: () => void;
  onAddTask?: (stageId: string) => void;
  onTaskClick?: (task: Task) => void;
}

export default function TaskKanbanBoard({ stages, onAddStage, onAddTask, onTaskClick }: TaskKanbanBoardProps) {
  const [localStages, setLocalStages] = useState<Stage[]>(stages);

  // Sync from parent when stages change
  if (stages !== localStages && stages.length !== localStages.length) {
    setLocalStages(stages);
  }

  const handleDeleteStage = (stageId: string) => {
    setLocalStages((prev) => prev.filter((s) => s.id !== stageId));
    console.log("Delete stage:", stageId);
  };

  const handleClearTasks = (stageId: string) => {
    setLocalStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, tasks: [] } : s))
    );
    console.log("Clear tasks in stage:", stageId);
  };

  const handleRenameStage = (stageId: string) => {
    const stage = localStages.find((s) => s.id === stageId);
    const newName = prompt("Rename stage:", stage?.title || "");
    if (newName && newName.trim()) {
      setLocalStages((prev) =>
        prev.map((s) => (s.id === stageId ? { ...s, title: newName.trim() } : s))
      );
    }
  };

  // Use localStages for display, but fall back to stages for task operations
  const displayStages = localStages.length > 0 ? localStages : stages;

  return (
    <div className="flex gap-2 h-full overflow-x-auto pb-3">
      {/* Stage Columns */}
      {displayStages.map((stage) => (
        <TaskColumn
          key={stage.id}
          stage={stage}
          onAddTask={() => onAddTask?.(stage.id)}
          onTaskClick={onTaskClick}
          onDeleteStage={() => handleDeleteStage(stage.id)}
          onClearTasks={() => handleClearTasks(stage.id)}
          onRenameStage={() => handleRenameStage(stage.id)}
        />
      ))}

      {/* Add Stage Button */}
      <div className="flex flex-col items-center p-2 min-w-[240px] lg:min-w-[280px] flex-shrink-0 animate-slideIn">
        <button
          onClick={onAddStage}
          className="w-full bg-white border border-neutral-200 rounded-[12px] flex items-center justify-center gap-2 px-3 py-2 text-neutral-400 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200"
        >
          <AddIcon />
          <span className="font-medium text-sm leading-5">Stage</span>
        </button>
      </div>
    </div>
  );
}
