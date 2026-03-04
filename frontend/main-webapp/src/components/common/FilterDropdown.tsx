import { useState, useRef, useEffect } from "react";
import { FilterDropdownIcon as FilterIcon, FilterChevronDown as ChevronDownIcon, CloseSmallIcon } from "./Icons";

export interface FilterOption {
    value: string;
    label: string;
    color?: string;
}

export interface FilterCategory {
    key: string;
    label: string;
    options: FilterOption[];
    type?: "single" | "multi";
}

export interface ActiveFilters {
    [categoryKey: string]: string[];
}

interface FilterDropdownProps {
    categories: FilterCategory[];
    activeFilters: ActiveFilters;
    onFiltersChange: (filters: ActiveFilters) => void;
}

export default function FilterDropdown({
    categories,
    activeFilters,
    onFiltersChange,
}: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState<string | null>(
        categories[0]?.key ?? null
    );
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Count total active filters
    const activeCount = Object.values(activeFilters).reduce(
        (sum, arr) => sum + arr.length,
        0
    );

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const toggleFilter = (categoryKey: string, value: string) => {
        const category = categories.find((c) => c.key === categoryKey);
        const current = activeFilters[categoryKey] || [];

        let updated: string[];
        if (category?.type === "single") {
            updated = current.includes(value) ? [] : [value];
        } else {
            updated = current.includes(value)
                ? current.filter((v) => v !== value)
                : [...current, value];
        }

        onFiltersChange({ ...activeFilters, [categoryKey]: updated });
    };

    const clearAll = () => {
        const cleared: ActiveFilters = {};
        categories.forEach((c) => (cleared[c.key] = []));
        onFiltersChange(cleared);
    };

    const removeFilter = (categoryKey: string, value: string) => {
        const current = activeFilters[categoryKey] || [];
        onFiltersChange({
            ...activeFilters,
            [categoryKey]: current.filter((v) => v !== value),
        });
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-[6px] text-xs font-medium transition-colors border ${activeCount > 0
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                    }`}
            >
                <FilterIcon />
                <span>Filter</span>
                {activeCount > 0 && (
                    <span className="flex items-center justify-center min-w-[16px] h-4 px-1 bg-primary text-white text-[10px] font-bold rounded-full">
                        {activeCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-[280px] bg-white border border-neutral-200 rounded-xl shadow-lg z-30 overflow-hidden animate-fadeIn">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                        <span className="text-xs font-bold text-neutral-900">Filters</span>
                        {activeCount > 0 && (
                            <button
                                onClick={clearAll}
                                className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Active filter tags */}
                    {activeCount > 0 && (
                        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-neutral-100 bg-neutral-50/50">
                            {categories.map((cat) =>
                                (activeFilters[cat.key] || []).map((val) => {
                                    const opt = cat.options.find((o) => o.value === val);
                                    return (
                                        <span
                                            key={`${cat.key}-${val}`}
                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-[11px] font-medium rounded-full"
                                        >
                                            {opt?.label || val}
                                            <button
                                                onClick={() => removeFilter(cat.key, val)}
                                                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                            >
                                                <CloseSmallIcon />
                                            </button>
                                        </span>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* Category Accordion */}
                    <div className="max-h-[260px] overflow-y-auto custom-scrollbar">
                        {categories.map((category) => (
                            <div key={category.key} className="border-b border-neutral-100 last:border-b-0">
                                {/* Category Header */}
                                <button
                                    onClick={() =>
                                        setExpandedCategory(
                                            expandedCategory === category.key ? null : category.key
                                        )
                                    }
                                    className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                                >
                                    <span>{category.label}</span>
                                    <span
                                        className={`transition-transform duration-200 ${expandedCategory === category.key ? "rotate-180" : ""
                                            }`}
                                    >
                                        <ChevronDownIcon />
                                    </span>
                                </button>

                                {/* Category Options — smooth accordion */}
                                <div
                                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${expandedCategory === category.key
                                        ? "grid-rows-[1fr]"
                                        : "grid-rows-[0fr]"
                                        }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="px-4 pb-2.5 flex flex-col gap-1">
                                            {category.options.map((option) => {
                                                const isActive = (
                                                    activeFilters[category.key] || []
                                                ).includes(option.value);
                                                return (
                                                    <label
                                                        key={option.value}
                                                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${isActive
                                                            ? "bg-primary/8 text-primary"
                                                            : "text-neutral-600 hover:bg-neutral-50"
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isActive}
                                                            onChange={() =>
                                                                toggleFilter(category.key, option.value)
                                                            }
                                                            className="w-3.5 h-3.5 rounded border-neutral-300 text-primary focus:ring-primary/50 cursor-pointer"
                                                        />
                                                        {option.color && (
                                                            <span
                                                                className={`w-2 h-2 rounded-full ${option.color}`}
                                                            />
                                                        )}
                                                        <span className="text-xs font-medium">
                                                            {option.label}
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
