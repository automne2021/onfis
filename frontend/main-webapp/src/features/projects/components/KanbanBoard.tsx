import KanbanColumn from "./KanbanColumn";
import type { Project, ProjectsByStatus } from "../types";
import { useLanguage } from "../../../contexts/LanguageContext";

interface KanbanBoardProps {
  projectsByStatus: ProjectsByStatus;
  onProjectClick?: (project: Project) => void;
}

export default function KanbanBoard({ projectsByStatus, onProjectClick }: KanbanBoardProps) {
  const { t } = useLanguage();

  const columns = [
    { key: "planning" as const, title: t("PLANNING") },
    { key: "in_progress" as const, title: t("IN PROGRESS") },
    { key: "on_hold" as const, title: t("ON HOLD") },
    { key: "completed" as const, title: t("COMPLETED") },
  ];

  return (
    <div className="flex gap-3 h-full overflow-x-auto py-2">
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
