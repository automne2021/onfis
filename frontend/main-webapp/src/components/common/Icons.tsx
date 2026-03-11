/**
 * Centralized Icon Components
 *
 * All icon components for the application are defined here.
 * Import from this file instead of creating new icon files.
 *
 * Usage: import { SearchIcon, CloseIcon } from "@/components/common/Icons";
 */
import Icon from "./Icon";

// ============================================================================
// NAVIGATION ICONS
// ============================================================================

export const ChevronLeftIcon = ({ size = 20 }: { size?: number }) => (
    <Icon name="chevron_left" size={size} color="currentColor" />
);

export const ChevronRightIcon = ({ size = 20 }: { size?: number }) => (
    <Icon name="chevron_right" size={size} color="currentColor" />
);

export const ChevronDownIcon = ({ size = 20 }: { size?: number }) => (
    <Icon name="expand_more" size={size} color="#90A1B9" />
);

/** Collapsible chevron with rotation animation (points down when open, right when collapsed) */
export const ChevronIcon = ({ collapsed }: { collapsed: boolean }) => (
    <span className={`transition-transform duration-200 inline-flex ${collapsed ? "-rotate-90" : "rotate-0"}`}>
        <Icon name="expand_more" size={16} color="#62748E" />
    </span>
);

/** Expand/Collapse chevron with rotation animation (points right, rotates 90° when expanded) */
export const ChevronExpandIcon = ({ expanded }: { expanded: boolean }) => (
    <span className={`inline-flex transition-transform ${expanded ? "rotate-90" : ""}`}>
        <Icon name="chevron_right" size={20} color="#62748E" />
    </span>
);

export const ArrowDropDownIcon = () => (
    <Icon name="arrow_drop_down" size={30} color="#62748E" />
);

export const ArrowRightIcon = ({ size = 16 }: { size?: number }) => (
    <Icon name="chevron_right" size={size} color="#90A1B9" />
);

export const ExpandArrowIcon = () => (
    <Icon name="double_arrow" size={30} color="#0014A8" />
);

export const ChevronDoubleRightIcon = () => (
    <Icon name="keyboard_double_arrow_right" size={30} color="#0014A8" />
);

export const SwitchLeftIcon = () => (
    <Icon name="swap_horiz" size={30} color="#90A1B9" />
);

// ============================================================================
// ACTION ICONS
// ============================================================================

export const SearchIcon = ({ size = 14 }: { size?: number }) => (
    <Icon name="search" size={size} color="#90A1B9" />
);

export const FilterIcon = ({ size = 14 }: { size?: number }) => (
    <Icon name="filter_alt" size={size} color="#62748E" />
);

export const FilterLinesIcon = () => (
    <Icon name="filter_alt" size={20} color="#62748E" />
);

export const AddIcon = ({ size = 24 }: { size?: number }) => (
    <Icon name="add" size={size} color="currentColor" />
);

export const ListAddIcon = () => (
    <Icon name="add" size={24} color="#62748E" />
);

export const PlusIcon = ({ size = 20, color = "#0014A8" }: { size?: number; color?: string }) => (
    <Icon name="add" size={size} color={color} />
);

export const CloseIcon = ({ size = 24, color = "#90A1B9" }: { size?: number; color?: string }) => (
    <Icon name="close" size={size} color={color} />
);

export const CloseSmallIcon = () => (
    <Icon name="close" size={10} color="currentColor" />
);

export const CheckIcon = ({ size = 16 }: { size?: number }) => (
    <Icon name="check" size={size} color="currentColor" />
);

export const MoreVertIcon = ({ size = 24 }: { size?: number }) => (
    <Icon name="more_vert" size={size} color="#62748E" />
);

export const MoreIcon = () => (
    <Icon name="more_vert" size={20} color="#62748E" />
);

export const SettingsIcon = ({ size = 24 }: { size?: number }) => (
    <Icon name="settings" size={size} color="#62748E" />
);

export const SettingsGearIcon = () => (
    <Icon name="settings" size={20} color="#62748E" />
);

export const GroupByIcon = ({ size = 14 }: { size?: number }) => (
    <Icon name="group" size={size} color="currentColor" />
);

export const GridViewIcon = () => (
    <Icon name="grid_view" size={14} color="#90A1B9" />
);

export const TodayIcon = () => (
    <Icon name="adjust" size={14} color="#0B68F7" />
);

export const HistoryIcon = () => (
    <Icon name="history" size={24} color="#62748E" />
);

// ============================================================================
// VIEW TOGGLE ICONS
// ============================================================================

export const KanbanIcon = ({ active }: { active: boolean }) => (
    <Icon name="view_kanban" size={16} color={active ? "white" : "#62748E"} filled />
);

export const ListIcon = ({ active }: { active: boolean }) => (
    <Icon name="list" size={16} color={active ? "white" : "#62748E"} />
);

export const TimelineIcon = ({ active }: { active: boolean }) => (
    <Icon name="bar_chart" size={16} color={active ? "white" : "#62748E"} filled />
);

export const CalendarViewIcon = ({ active }: { active: boolean }) => (
    <Icon name="calendar_month" size={16} color={active ? "white" : "#62748E"} />
);

export const TreeViewIcon = ({ active }: { active: boolean }) => (
    <Icon name="account_tree" size={16} color={active ? "white" : "#62748E"} filled />
);

export const ListViewIcon = ({ active, size = 20 }: { active: boolean; size?: number }) => (
    <Icon name="list" size={size} color={active ? "white" : "#62748E"} />
);

export const BoardViewIcon = ({ active }: { active: boolean }) => (
    <Icon name="view_kanban" size={20} color={active ? "#0014A8" : "#62748E"} filled />
);

export const TimelineViewIcon = ({ active }: { active: boolean }) => (
    <Icon name="timeline" size={20} color={active ? "#0014A8" : "#62748E"} />
);

export const CalendarTabIcon = ({ active }: { active: boolean }) => (
    <Icon name="calendar_month" size={20} color={active ? "#0014A8" : "#62748E"} />
);

// ============================================================================
// CONTENT ICONS
// ============================================================================

export const CalendarIcon = ({ size = 20 }: { size?: number }) => (
    <Icon name="calendar_today" size={size} color="#90A1B9" />
);

export const CalendarSmallIcon = () => (
    <Icon name="calendar_today" size={20} color="#62748E" />
);

export const CalendarDateIcon = ({ size = 14 }: { size?: number }) => (
    <Icon name="calendar_today" size={size} color="#62748E" />
);

export const ClockIcon = () => (
    <Icon name="schedule" size={16} color="#90A1B9" />
);

export const ActivityIcon = () => (
    <Icon name="circle" size={16} color="#0014A8" filled />
);

// ============================================================================
// FLAG / PRIORITY ICONS
// ============================================================================

export const FlagIcon = ({ priority }: { priority: "urgent" | "high" | "medium" | "low" }) => {
    const colors: Record<string, string> = {
        urgent: "#E7000B",
        high: "#FF6900",
        medium: "#FFD230",
        low: "#99A1AF",
    };
    return <Icon name="flag" size={24} color={colors[priority]} filled />;
};

export const FlagIconSmall = ({ priority }: { priority: "urgent" | "high" | "medium" | "low" }) => {
    const colors: Record<string, string> = {
        urgent: "#E7000B",
        high: "#FF6900",
        medium: "#FFD230",
        low: "#99A1AF",
    };
    return <Icon name="flag" size={18} color={colors[priority]} filled />;
};

export const FlagIconColored = ({ color, size = 14 }: { color: string; size?: number }) => (
    <Icon name="flag" size={size} color={color} filled />
);

export const FlagIconGantt = ({ className = "" }: { className?: string }) => (
    <Icon name="flag" size={16} color="currentColor" filled className={className} />
);

// ============================================================================
// TEXT FORMATTING ICONS
// ============================================================================

export const BoldIcon = () => (
    <Icon name="format_bold" size={20} color="#62748E" />
);

export const ItalicIcon = () => (
    <Icon name="format_italic" size={20} color="#62748E" />
);

export const StrikethroughIcon = () => (
    <Icon name="strikethrough_s" size={20} color="#62748E" />
);

export const BulletListIcon = () => (
    <Icon name="format_list_bulleted" size={20} color="#62748E" />
);

export const NumberListIcon = () => (
    <Icon name="format_list_numbered" size={20} color="#62748E" />
);

export const LinkIcon = () => (
    <Icon name="link" size={20} color="#62748E" />
);

export const ImageIcon = () => (
    <Icon name="image" size={20} color="#62748E" />
);

// ============================================================================
// CHECKBOX / STATUS COMPONENTS
// ============================================================================

/** Task list checkbox (25×25, CSS-based) */
export const Checkbox = ({ checked }: { checked: boolean }) => (
    <div
        className={`w-[20px] h-[20px] rounded-[5px] border border-neutral-200 bg-white ${checked ? "bg-primary border-primary" : ""
            }`}
    />
);

/** Task list checked checkbox with checkmark */
export const CheckboxChecked = () => (
    <div className="w-[20px] h-[20px] rounded-[5px] bg-primary flex items-center justify-center">
        <Icon name="check" size={16} color="white" />
    </div>
);

/** Modal subtask checkbox (20×20, SVG-based) */
export const CheckboxIconModal = ({ checked }: { checked: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="16" height="16" rx="4" fill={checked ? "#0014A8" : "white"} stroke={checked ? "#0014A8" : "#E2E8F0"} strokeWidth="1.5" />
        {checked && (
            <path d="M6 10l3 3 5-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        )}
    </svg>
);

/** Project list checkbox (20×20, SVG-based) */
export const CheckboxIconList = ({ checked }: { checked: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        {checked ? (
            <>
                <rect x="2" y="2" width="16" height="16" rx="4" fill="#0B68F7" />
                <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </>
        ) : (
            <rect x="2" y="2" width="16" height="16" rx="4" stroke="#90A1B9" strokeWidth="2" />
        )}
    </svg>
);

/** Status dot for task rows */
export const StatusDot = ({
    status,
}: {
    status: "to_do" | "on_track" | "off_track" | "on_hold" | "done";
}) => {
    const colors: Record<string, string> = {
        to_do: "bg-status-to_do",
        on_track: "bg-status-on_track",
        off_track: "bg-status-off_track",
        on_hold: "bg-status-on_hold",
        done: "bg-status-done",
    };
    return <div className={`w-3.5 h-3.5 rounded-full ${colors[status]}`} />;
};

/** Quantity badge circle */
export const QuantityBadge = ({ count }: { count: number }) => (
    <div className="relative w-5 h-5">
        <div className="absolute inset-0 rounded-full border-2 border-neutral-200" />
        <span className="absolute inset-0 flex items-center justify-center font-medium text-xs text-neutral-500">
            {count}
        </span>
    </div>
);

/** Progress bar component */
export const ProgressBar = ({ progress }: { progress: number }) => {
    const getProgressColor = () => {
        if (progress >= 100) return "bg-status-done";
        if (progress >= 50) return "bg-status-on_track";
        if (progress >= 25) return "bg-status-to_do";
        return "bg-status-off_track";
    };
    return (
        <div className="flex-1 max-w-[269px] h-2.5 bg-neutral-200 rounded-[20px] overflow-hidden">
            <div
                className={`h-full rounded-[20px] transition-all duration-300 ${getProgressColor()}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
            />
        </div>
    );
};

// ============================================================================
// SORT ICON (custom SVG)
// ============================================================================

export const SortIcon = ({ direction }: { direction: "asc" | "desc" | null }) => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 3L11 6H5L8 3Z" fill={direction === "asc" ? "#0B68F7" : "#90A1B9"} />
        <path d="M8 13L5 10H11L8 13Z" fill={direction === "desc" ? "#0B68F7" : "#90A1B9"} />
    </svg>
);

// ============================================================================
// STATUS CIRCLE ICONS (custom SVG — colored circles with embedded shapes)
// ============================================================================

/** Completed status (green circle with check) */
export const CheckCircleIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="6" fill="#00A63E" />
        <path d="M5.5 8L7.5 10L10.5 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/** In Progress status (blue circle with clock hand) */
export const ProgressIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="6" fill="#0B68F7" />
        <path d="M8 5V8.5L10 9.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

/** On Hold status (red circle with pause bars) */
export const PauseIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="6" fill="#E7000B" />
        <rect x="5.5" y="5" width="2" height="6" rx="0.5" fill="white" />
        <rect x="8.5" y="5" width="2" height="6" rx="0.5" fill="white" />
    </svg>
);

/** Planning status (orange circle with plus) */
export const PlanningIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="8" cy="8" r="6" fill="#FF6900" />
        <path d="M6 8H10M8 6V10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
);

// ============================================================================
// HEADER / AUTH ICONS
// ============================================================================

export const MessageIcon = () => (
    <Icon name="chat" size={20} color="#62748E" />
);

export const NotificationIcon = () => (
    <Icon name="notifications" size={20} color="#62748E" />
);

export const PersonIcon = () => (
    <Icon name="person" size={24} color="#90A1B9" filled />
);

export const LockIcon = () => (
    <Icon name="lock" size={24} color="#90A1B9" filled />
);

export const PasskeyIcon = () => (
    <Icon name="passkey" size={24} color="#0014A8" />
);

// ============================================================================
// DASHBOARD ICONS
// ============================================================================

export const FolderIcon = () => (
    <Icon name="folder_open" size={30} color="#0014A8" />
);

export const TaskIcon = () => (
    <Icon name="task_alt" size={30} color="#0014A8" />
);

export const CalendarClockIcon = () => (
    <Icon name="calendar_clock" size={30} color="#0014A8" />
);

// ============================================================================
// FILTER DROPDOWN ICONS
// ============================================================================

export const FilterDropdownIcon = () => (
    <Icon name="filter_alt" size={14} color="currentColor" />
);

export const FilterChevronDown = () => (
    <Icon name="expand_more" size={12} color="currentColor" />
);

export const ModalCloseIcon = () => (
    <Icon name="close" size={20} color="currentColor" />
);

// ============================================================================
// CONTEXT MENU / FORM ICONS
// ============================================================================

export const ErrorIcon = () => (
    <Icon name="error" size={20} color="currentColor" />
);

export const ExpandMoreIcon = () => (
    <Icon name="expand_more" size={24} color="currentColor" />
);

export const InfoIcon = () => (
    <Icon name="info" size={18} color="currentColor" />
);

export const DeleteIcon = ({ size = 20 }: { size?: number }) => (
    <Icon name="delete" size={size} color="currentColor" />
);

export const AddCircleIcon = () => (
    <Icon name="add_circle" size={20} color="currentColor" />
);

export const StarIcon = ({ filled = false }: { filled?: boolean }) => (
    <Icon name="star" size={24} color="#FFD230" filled={filled} />
);

export const EyeIcon = () => (
    <Icon name="visibility" size={14} color="currentColor" />
);

export const TasksViewIcon = () => (
    <Icon name="view_kanban" size={14} color="currentColor" />
);

export const MoreHorizIcon = () => (
    <Icon name="more_horiz" size={16} color="#62748E" />
);

export const SortColumnIcon = () => (
    <Icon name="sort" size={14} color="currentColor" />
);

export const RenameIcon = () => (
    <Icon name="edit" size={14} color="currentColor" />
);

export const ClearIcon = () => (
    <Icon name="delete_sweep" size={14} color="currentColor" />
);

export const DeleteCircleIcon = ({ size = 14 }: { size?: number }) => (
    <Icon name="cancel" size={size} color="currentColor" />
);

export const PersonAddIcon = () => (
    <Icon name="person_add" size={14} color="currentColor" />
);

export const DescriptionIcon = () => (
    <Icon name="description" size={18} color="currentColor" />
);

export const ChecklistIcon = () => (
    <Icon name="checklist" size={20} color="currentColor" />
);

export const SendIcon = () => (
    <Icon name="send" size={16} color="currentColor" />
);

export const ArrowForwardIcon = () => (
    <Icon name="arrow_forward" size={24} color="#0F172B" />
);

/** Sidebar collapse/expand icon with rotation animation */
export const CollapseIcon = ({ collapsed }: { collapsed: boolean }) => (
    <span className={`inline-flex transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}>
        <Icon name="keyboard_double_arrow_left" size={16} color="#62748E" />
    </span>
);

/** Flag icon for forms (outline style) */
export const FlagOutlineIcon = () => (
    <Icon name="flag" size={20} color="currentColor" />
);

// ============================================================================
// DATE RANGE PICKER ICONS
// ============================================================================

export const CalendarTodayIcon = () => (
    <Icon name="calendar_today" size={20} color="currentColor" />
);

export const EventIcon = () => (
    <Icon name="event" size={20} color="currentColor" />
);

export const DateRangeIcon = () => (
    <Icon name="date_range" size={20} color="currentColor" />
);

// ============================================================================
// MILESTONE ICONS (custom SVG — large colored circles)
// ============================================================================

/** Completed milestone (green circle with check) */
export const CompletedMilestoneIcon = () => (
    <svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="28" fill="#00A63E" />
        <path d="M20 30L27 37L40 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

/** Late milestone (red circle with exclamation) */
export const LateMilestoneIcon = () => (
    <svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="28" fill="#E7000B" />
        <path d="M30 20V32" stroke="white" strokeWidth="4" strokeLinecap="round" />
        <circle cx="30" cy="40" r="2.5" fill="white" />
    </svg>
);

/** Upcoming milestone (gray outlined circle with calendar) */
export const UpcomingMilestoneIcon = () => (
    <svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="30" cy="30" r="28" stroke="#90A1B9" strokeWidth="2" fill="white" />
        <rect x="20" y="18" width="20" height="20" rx="2" stroke="#90A1B9" strokeWidth="2" fill="none" />
        <line x1="24" y1="16" x2="24" y2="20" stroke="#90A1B9" strokeWidth="2" strokeLinecap="round" />
        <line x1="36" y1="16" x2="36" y2="20" stroke="#90A1B9" strokeWidth="2" strokeLinecap="round" />
        <line x1="20" y1="26" x2="40" y2="26" stroke="#90A1B9" strokeWidth="2" />
    </svg>
);

