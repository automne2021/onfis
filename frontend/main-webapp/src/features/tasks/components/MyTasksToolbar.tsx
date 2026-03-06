import { useState } from "react";
import type { ReactElement } from "react";
import {
    SearchIcon,
    KanbanIcon,
    ListIcon,
} from "../../../components/common/Icons";
import FilterDropdown, { type ActiveFilters, type FilterCategory } from "../../../components/common/FilterDropdown";
import { useAuth } from "../../../contexts/AuthContext";

type MyTasksViewMode = "board" | "list";

const FILTER_CATEGORIES: FilterCategory[] = [
    {
        key: "priority",
        label: "Priority",
        options: [
            { value: "urgent", label: "Urgent", color: "bg-red-500" },
            { value: "high", label: "High", color: "bg-[#FF6900]" },
            { value: "medium", label: "Medium", color: "bg-[#FFD230]" },
            { value: "low", label: "Low", color: "bg-neutral-400" },
        ],
    },
    {
        key: "project",
        label: "Project",
        options: [
            { value: "erp", label: "ERP Migration" },
            { value: "mobile", label: "Mobile App" },
            { value: "marketing", label: "Q4 Marketing" },
        ],
    },
];

interface MyTasksToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    viewMode: MyTasksViewMode;
    onViewModeChange: (mode: MyTasksViewMode) => void;
}

export default function MyTasksToolbar({
    searchQuery,
    onSearchChange,
    viewMode,
    onViewModeChange,
}: MyTasksToolbarProps) {
    const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
    const { currentUser } = useAuth();

    const viewModes: { mode: MyTasksViewMode; icon: (active: boolean) => ReactElement }[] = [
        { mode: "board", icon: (active) => <KanbanIcon active={active} /> },
        { mode: "list", icon: (active) => <ListIcon active={active} /> },
    ];

    return (
        <div className="bg-white grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-1.5 rounded-[12px] shadow-sm border border-neutral-300">
            {/* Left: Breadcrumb */}
            <div className="flex items-center gap-2">
                <nav className="flex items-center h-7">
                    <span className="font-normal text-xs leading-4 text-black">
                        <span className="text-primary font-medium">My Tasks</span>
                    </span>
                </nav>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200">
                    <span className="text-[10px] font-medium text-neutral-500">
                        {currentUser.role === "manager" ? "Manager View" : "Employee View"}
                    </span>
                </div>
            </div>

            {/* Center: Search */}
            <div className="justify-self-center w-[260px] lg:w-[380px]">
                <div className="bg-white border border-neutral-200 rounded-[8px] flex items-center gap-1.5 px-2 h-7">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-neutral-900 text-xs font-normal placeholder:text-neutral-400"
                    />
                </div>
            </div>

            {/* Right: Filter + View Toggle */}
            <div className="flex items-center gap-2">
                <FilterDropdown
                    categories={FILTER_CATEGORIES}
                    activeFilters={activeFilters}
                    onFiltersChange={setActiveFilters}
                />
                <div className="flex items-center rounded-[6px] overflow-hidden">
                    {viewModes.map(({ mode, icon }) => (
                        <button
                            key={mode}
                            onClick={() => onViewModeChange(mode)}
                            className={`p-1.5 transition-colors ${viewMode === mode
                                ? "bg-primary"
                                : "bg-neutral-200 hover:bg-neutral-300"
                                }`}
                            aria-label={`${mode} view`}
                        >
                            {icon(viewMode === mode)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
