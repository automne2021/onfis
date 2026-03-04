import KanbanColumn from "./KanbanColumn";
import type { Project, ProjectsByStatus } from "../types";

interface KanbanBoardProps {
  projectsByStatus: ProjectsByStatus;
  onProjectClick?: (project: Project) => void;
}

const columns = [
  { key: "planning" as const, title: "PLANNING" },
  { key: "in_progress" as const, title: "IN PROGRESS" },
  { key: "on_hold" as const, title: "ON HOLD" },
  { key: "completed" as const, title: "COMPLETED" },
];

export default function KanbanBoard({ projectsByStatus, onProjectClick }: KanbanBoardProps) {
  return (
    <div className="flex gap-3 h-full overflow-x-auto pb-2">
      {columns.map((column) => (
        <KanbanColumn
          key={column.key}
          title={column.title}
          projects={projectsByStatus[column.key]}
          status={column.key}
          onProjectClick={onProjectClick}
        />
      ))}
    </div>
  );
}
