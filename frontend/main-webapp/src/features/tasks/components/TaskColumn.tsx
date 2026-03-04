import { useState, useRef, useEffect } from "react";
import type { Stage, Task } from "../types";
import TaskCard from "./TaskCard";
import { MoreVertIcon, ChevronIcon, AddIcon, RenameIcon, ClearIcon, DeleteCircleIcon as DeleteIcon } from "../../../components/common/Icons";

interface TaskColumnProps {
  stage: Stage;
  onAddTask?: () => void;
  onSettings?: () => void;
  onTaskClick?: (task: Task) => void;
  onDeleteStage?: () => void;
  onRenameStage?: () => void;
  onClearTasks?: () => void;
}

export default function TaskColumn({ stage, onAddTask, onTaskClick, onDeleteStage, onRenameStage, onClearTasks }: TaskColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  return (
    <div
      className={`flex flex-col gap-2 flex-shrink-0 p-1.5 transition-all duration-300 ease-in-out ${isCollapsed ? "min-w-[56px] w-[56px]" : "min-w-[240px] lg:min-w-[280px]"
        }`}
    >
      {/* Column Header */}
      {isCollapsed ? (
        /* Collapsed header — vertical bar */
        <div className="flex flex-col items-center gap-2 py-1.5">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 hover:bg-neutral-100 rounded transition-colors"
            aria-label="Expand stage"
          >
            <ChevronIcon collapsed={true} />
          </button>
          <div className="relative">
            <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center">
              <span className="font-medium text-xs text-neutral-500">
                {stage.tasks.length}
              </span>
            </div>
          </div>
          <span
            className="font-medium text-sm text-neutral-500 whitespace-nowrap"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {stage.title.toUpperCase()}
          </span>
        </div>
      ) : (
        /* Expanded header */
        <div className="flex items-center justify-between py-1.5 px-1.5">
          <div className="flex items-center gap-1.5">
            {/* Collapse chevron */}
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-0.5 hover:bg-neutral-100 rounded transition-colors"
              aria-label="Collapse stage"
            >
              <ChevronIcon collapsed={false} />
            </button>
            <span className="font-medium text-sm leading-5 text-neutral-500 uppercase">
              {stage.title}
            </span>
            {/* Count Badge */}
            <div className="relative">
              <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center">
                <span className="font-medium text-xs text-neutral-500">
                  {stage.tasks.length}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* 3-dots menu */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 hover:bg-neutral-100 rounded transition-colors text-neutral-500"
                aria-label="Stage options"
              >
                <MoreVertIcon />
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-30 min-w-[160px] animate-dropdown">
                  <button
                    className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRenameStage?.();
                    }}
                  >
                    <RenameIcon />
                    Rename Stage
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onClearTasks?.();
                    }}
                  >
                    <ClearIcon />
                    Clear Tasks
                  </button>
                  <div className="h-px bg-neutral-100 my-1" />
                  <button
                    className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDeleteStage?.();
                    }}
                  >
                    <DeleteIcon />
                    Delete Stage
                  </button>
                </div>
              )}
            </div>
            {/* Add task */}
            <button
              onClick={onAddTask}
              className="p-1 hover:bg-neutral-100 rounded transition-colors text-neutral-500"
              aria-label="Add task"
            >
              <AddIcon />
            </button>
          </div>
        </div>
      )}

      {/* Task Cards — animated collapse */}
      {!isCollapsed && (
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1 animate-fadeIn">
          {stage.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick?.(task)} />
          ))}
        </div>
      )}
    </div>
  );
}
