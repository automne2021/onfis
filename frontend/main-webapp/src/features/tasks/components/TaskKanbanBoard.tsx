import { useState, useRef, useEffect } from "react";
import type { Stage, Task } from "../types";
import TaskColumn from "./TaskColumn";
import { AddIcon } from "../../../components/common/Icons";

interface TaskKanbanBoardProps {
  stages: Stage[];
  onAddStage?: (name: string) => void;
  onAddTask?: (stageId: string) => void;
  onTaskClick?: (task: Task) => void;
  onDeleteStage?: (stageId: string) => void;
  onRenameStage?: (stageId: string, newName: string) => void;
}

export default function TaskKanbanBoard({
  stages,
  onAddStage,
  onAddTask,
  onTaskClick,
  onDeleteStage,
  onRenameStage,
}: TaskKanbanBoardProps) {
  const [localStages, setLocalStages] = useState<Stage[]>(stages);
  const [newStageId, setNewStageId] = useState<string | null>(null);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalStages(stages);
  }, [stages]);

  // Focus the add-stage input when it appears
  useEffect(() => {
    if (isAddingStage && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAddingStage]);

  // Detect newly added stage and scroll to it
  useEffect(() => {
    if (newStageId && containerRef.current) {
      // Smooth scroll to the right to reveal the new stage
      containerRef.current.scrollTo({
        left: containerRef.current.scrollWidth,
        behavior: "smooth",
      });
      // Clear after animation
      const timer = setTimeout(() => setNewStageId(null), 500);
      return () => clearTimeout(timer);
    }
  }, [newStageId]);

  const confirmAddStage = () => {
    const trimmed = newStageName.trim();
    setIsAddingStage(false);
    setNewStageName("");
    if (!trimmed) return;
    onAddStage?.(trimmed);
    setNewStageId(`stage-${localStages.length + 1}`);
  };

  const handleDeleteStage = (stageId: string) => {
    if (onDeleteStage) {
      onDeleteStage(stageId);
    } else {
      setLocalStages((prev) => prev.filter((s) => s.id !== stageId));
    }
  };

  const handleClearTasks = (stageId: string) => {
    setLocalStages((prev) =>
      prev.map((s) => (s.id === stageId ? { ...s, tasks: [] } : s))
    );
  };

  const handleRenameStage = (stageId: string, newName: string) => {
    if (onRenameStage) {
      onRenameStage(stageId, newName);
    } else {
      setLocalStages((prev) =>
        prev.map((s) => (s.id === stageId ? { ...s, title: newName } : s))
      );
    }
  };

  // Use localStages for display, but fall back to stages for task operations
  const displayStages = localStages.length > 0 ? localStages : stages;

  return (
    <div ref={containerRef} className="flex gap-2 h-full overflow-x-auto pb-3">
      {/* Stage Columns */}
      {displayStages.map((stage) => (
        <div
          key={stage.id}
          className={stage.id === newStageId ? "animate-stageAppear" : ""}
        >
          <TaskColumn
            stage={stage}
            onAddTask={() => onAddTask?.(stage.id)}
            onTaskClick={onTaskClick}
            onDeleteStage={() => handleDeleteStage(stage.id)}
            onClearTasks={() => handleClearTasks(stage.id)}
            onRenameStage={(newName) => handleRenameStage(stage.id, newName)}
          />
        </div>
      ))}

      {/* Add Stage */}
      {onAddStage && (
        <div className="flex flex-col items-center p-2 min-w-[240px] lg:min-w-[280px] flex-shrink-0">
          {isAddingStage ? (
            <div className="w-full bg-white border border-primary rounded-[12px] px-3 py-[9px] flex items-center">
              <input
                ref={addInputRef}
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="Stage name..."
                onBlur={confirmAddStage}
                onKeyDown={(e) => {
                  if (e.key === "Enter") confirmAddStage();
                  else if (e.key === "Escape") {
                    setIsAddingStage(false);
                    setNewStageName("");
                  }
                }}
                className="w-full text-sm font-medium text-neutral-800 bg-transparent focus:outline-none placeholder:text-neutral-400"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsAddingStage(true)}
              className="w-full bg-white border border-neutral-200 rounded-[12px] flex items-center justify-center gap-2 px-3 py-2 text-neutral-400 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-600 transition-all duration-200"
            >
              <AddIcon />
              <span className="font-medium text-sm leading-5">Stage</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
