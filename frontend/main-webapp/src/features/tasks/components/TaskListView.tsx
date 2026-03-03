import { useState } from "react";
import type { Stage, Task } from "../types";
import TaskListHeader from "./TaskListHeader";
import StageRow from "./StageRow";
import TaskRow from "./TaskRow";

interface TaskListViewProps {
  stages: Stage[];
  onAddTask: (stageId: string) => void;
  onTaskClick?: (task: Task) => void;
}

export default function TaskListView({ stages, onAddTask, onTaskClick }: TaskListViewProps) {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(
    // Default all stages to expanded
    stages.reduce((acc, stage) => ({ ...acc, [stage.id]: true }), {})
  );
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());

  const toggleStage = (stageId: string) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const toggleStageSelection = (stageId: string, tasks: Task[]) => {
    setSelectedStages((prev) => {
      const newStages = new Set(prev);
      const isSelected = newStages.has(stageId);

      if (isSelected) {
        newStages.delete(stageId);
        // Deselect all tasks in this stage
        setSelectedTasks((prevTasks) => {
          const newTasks = new Set(prevTasks);
          tasks.forEach((task) => newTasks.delete(task.id));
          return newTasks;
        });
      } else {
        newStages.add(stageId);
        // Select all tasks in this stage
        setSelectedTasks((prevTasks) => {
          const newTasks = new Set(prevTasks);
          tasks.forEach((task) => newTasks.add(task.id));
          return newTasks;
        });
      }
      return newStages;
    });
  };

  return (
    <div className="bg-white rounded-[12px] overflow-hidden w-full">
      {/* Table Header */}
      <TaskListHeader />

      {/* Stage Rows */}
      <div className="flex flex-col">
        {stages.map((stage) => (
          <div key={stage.id}>
            {/* Stage Header Row */}
            <StageRow
              stage={stage}
              isExpanded={expandedStages[stage.id]}
              isSelected={selectedStages.has(stage.id)}
              onToggleExpand={() => toggleStage(stage.id)}
              onToggleSelect={() => toggleStageSelection(stage.id, stage.tasks)}
              onAddTask={() => onAddTask(stage.id)}
            />

            {/* Task Rows */}
            {expandedStages[stage.id] &&
              stage.tasks.map((task, index) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  isSelected={selectedTasks.has(task.id)}
                  onToggleSelect={() => toggleTaskSelection(task.id)}
                  isLastInStage={index === stage.tasks.length - 1}
                  onClick={() => onTaskClick?.(task)}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
