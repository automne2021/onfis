import { CheckboxIconList as CheckboxIcon, SortIcon } from "../../../../components/common/Icons";
import type { ProjectListColumn, SortConfig } from "./types";

interface ProjectListHeaderProps {
  columns: ProjectListColumn[];
  sortConfig: SortConfig;
  onSort: (key: ProjectListColumn["key"]) => void;
  allSelected: boolean;
  onSelectAll: () => void;
}

export default function ProjectListHeader({
  columns,
  sortConfig,
  onSort,
  allSelected,
  onSelectAll,
}: ProjectListHeaderProps) {
  return (
    <div className="bg-neutral-50 border-b border-neutral-200 px-3 py-2 grid grid-cols-[32px_2fr_1fr_1fr_1fr_100px_90px_48px] gap-3 items-center text-xs font-medium text-neutral-500 sticky top-0 z-10">
      {/* Checkbox */}
      <button
        onClick={onSelectAll}
        className="flex items-center justify-center hover:opacity-80"
        aria-label={allSelected ? "Deselect all" : "Select all"}
      >
        <CheckboxIcon checked={allSelected} />
      </button>

      {/* Column Headers */}
      {columns.map((column) => (
        <button
          key={column.key}
          onClick={() => column.sortable && onSort(column.key)}
          className={`flex items-center gap-2 text-left ${column.sortable ? "cursor-pointer hover:text-neutral-700" : "cursor-default"
            }`}
          disabled={!column.sortable}
        >
          <span className="uppercase tracking-wider">{column.label}</span>
          {column.sortable && (
            <SortIcon
              direction={sortConfig.key === column.key ? sortConfig.direction : null}
            />
          )}
        </button>
      ))}
    </div>
  );
}
