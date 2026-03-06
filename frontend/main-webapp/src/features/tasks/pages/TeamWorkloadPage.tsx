import { useState, useMemo } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { SearchIcon } from "../../../components/common/Icons";
import type { TaskStatus } from "../types";

interface TeamMember {
    id: string;
    name: string;
    avatar?: string;
    role: string;
    tasks: {
        TODO: number;
        IN_PROGRESS: number;
        BLOCKED: number;
        IN_REVIEW: number;
        DONE: number;
    };
    totalEffort: number;
    capacity: number;
}

interface MemberTask {
    id: string;
    title: string;
    status: TaskStatus;
    priority: string;
    progress: number;
    dueDate: string;
    projectName: string;
}

// Mock team data
const mockTeamMembers: TeamMember[] = [
    {
        id: "2",
        name: "John Doe",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
        role: "Frontend Developer",
        tasks: { TODO: 2, IN_PROGRESS: 3, BLOCKED: 0, IN_REVIEW: 1, DONE: 5 },
        totalEffort: 28,
        capacity: 40,
    },
    {
        id: "3",
        name: "Alice Smith",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
        role: "Backend Developer",
        tasks: { TODO: 1, IN_PROGRESS: 2, BLOCKED: 1, IN_REVIEW: 2, DONE: 8 },
        totalEffort: 35,
        capacity: 40,
    },
    {
        id: "4",
        name: "Bob Wilson",
        role: "UI/UX Designer",
        tasks: { TODO: 4, IN_PROGRESS: 1, BLOCKED: 0, IN_REVIEW: 1, DONE: 3 },
        totalEffort: 18,
        capacity: 40,
    },
    {
        id: "5",
        name: "Diana Prince",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Diana",
        role: "QA Engineer",
        tasks: { TODO: 3, IN_PROGRESS: 2, BLOCKED: 2, IN_REVIEW: 0, DONE: 6 },
        totalEffort: 32,
        capacity: 40,
    },
    {
        id: "6",
        name: "Charlie Brown",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
        role: "DevOps Engineer",
        tasks: { TODO: 1, IN_PROGRESS: 1, BLOCKED: 0, IN_REVIEW: 0, DONE: 10 },
        totalEffort: 12,
        capacity: 40,
    },
];

// Mock member tasks for drill-down
const mockMemberTasks: Record<string, MemberTask[]> = {
    "2": [
        { id: "t1", title: "Build navigation component", status: "IN_PROGRESS", priority: "high", progress: 60, dueDate: "Mar 15", projectName: "ABC Website" },
        { id: "t2", title: "Implement form validation", status: "IN_PROGRESS", priority: "medium", progress: 30, dueDate: "Mar 18", projectName: "ABC Website" },
        { id: "t3", title: "Dark mode support", status: "TODO", priority: "low", progress: 0, dueDate: "Mar 22", projectName: "ABC Website" },
        { id: "t4", title: "Design system tokens", status: "IN_REVIEW", priority: "medium", progress: 100, dueDate: "Mar 10", projectName: "ABC Website" },
    ],
    "3": [
        { id: "t5", title: "REST API endpoints", status: "IN_PROGRESS", priority: "high", progress: 75, dueDate: "Mar 14", projectName: "ERP Migration" },
        { id: "t6", title: "Database optimization", status: "BLOCKED", priority: "urgent", progress: 20, dueDate: "Mar 12", projectName: "ERP Migration" },
        { id: "t7", title: "Auth middleware", status: "IN_REVIEW", priority: "high", progress: 100, dueDate: "Mar 8", projectName: "ERP Migration" },
    ],
    "4": [
        { id: "t8", title: "Onboarding wireframes", status: "IN_PROGRESS", priority: "urgent", progress: 45, dueDate: "Mar 9", projectName: "ABC Website" },
        { id: "t9", title: "Icon library update", status: "TODO", priority: "low", progress: 0, dueDate: "Mar 20", projectName: "ABC Website" },
        { id: "t10", title: "User flow diagrams", status: "IN_REVIEW", priority: "medium", progress: 100, dueDate: "Mar 7", projectName: "ABC Website" },
    ],
    "5": [
        { id: "t11", title: "E2E test suite", status: "IN_PROGRESS", priority: "high", progress: 55, dueDate: "Mar 16", projectName: "ERP Migration" },
        { id: "t12", title: "Performance testing", status: "BLOCKED", priority: "medium", progress: 10, dueDate: "Mar 19", projectName: "ERP Migration" },
        { id: "t13", title: "Bug regression tests", status: "TODO", priority: "high", progress: 0, dueDate: "Mar 21", projectName: "ERP Migration" },
    ],
    "6": [
        { id: "t14", title: "CI/CD pipeline", status: "IN_PROGRESS", priority: "high", progress: 80, dueDate: "Mar 11", projectName: "ERP Migration" },
        { id: "t15", title: "Monitoring setup", status: "TODO", priority: "medium", progress: 0, dueDate: "Mar 24", projectName: "ERP Migration" },
    ],
};

const STATUS_COLORS: Record<TaskStatus, string> = {
    TODO: "bg-neutral-400",
    IN_PROGRESS: "bg-blue-500",
    BLOCKED: "bg-red-500",
    IN_REVIEW: "bg-amber-500",
    DONE: "bg-green-500",
};

const STATUS_LABELS: Record<TaskStatus, string> = {
    TODO: "To Do",
    IN_PROGRESS: "In Progress",
    BLOCKED: "Blocked",
    IN_REVIEW: "In Review",
    DONE: "Done",
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    urgent: { label: "Urgent", color: "text-red-700", bg: "bg-red-50 border-red-200" },
    high: { label: "High", color: "text-orange-700", bg: "bg-orange-50 border-orange-200" },
    medium: { label: "Medium", color: "text-amber-700", bg: "bg-amber-50 border-amber-200" },
    low: { label: "Low", color: "text-neutral-600", bg: "bg-neutral-100 border-neutral-200" },
};

export default function TeamWorkloadPage() {
    const { currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    const isManager = currentUser.role === "manager";

    // For employee, show only their own data
    const visibleMembers = useMemo(() => {
        if (isManager) {
            if (!searchQuery.trim()) return mockTeamMembers;
            const q = searchQuery.toLowerCase();
            return mockTeamMembers.filter(
                (m) => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)
            );
        }
        // Employee self-view
        return mockTeamMembers.filter((m) => m.id === currentUser.id);
    }, [isManager, searchQuery, currentUser.id]);

    const selectedMember = selectedMemberId
        ? mockTeamMembers.find((m) => m.id === selectedMemberId)
        : null;
    const selectedMemberTasks = selectedMemberId ? (mockMemberTasks[selectedMemberId] || []) : [];

    return (
        <div className="flex flex-col h-full w-full max-w-[1440px] mx-auto gap-3 relative">
            {/* Toolbar */}
            <div className="bg-white grid grid-cols-[auto_1fr] items-center gap-2 px-3 py-1.5 rounded-[12px] shadow-sm border border-neutral-300">
                <div className="flex items-center gap-2">
                    <nav className="flex items-center h-7">
                        <span className="text-primary font-medium text-xs">
                            {isManager ? "Team Workload" : "My Workload"}
                        </span>
                    </nav>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-100 border border-neutral-200">
                        <span className="text-[10px] font-medium text-neutral-500">
                            {visibleMembers.length} {isManager ? "members" : "profile"}
                        </span>
                    </div>
                </div>

                {isManager && (
                    <div className="justify-self-center w-[260px] lg:w-[380px]">
                        <div className="bg-white border border-neutral-200 rounded-[8px] flex items-center gap-1.5 px-2 h-7">
                            <SearchIcon />
                            <input
                                type="text"
                                placeholder="Search team members..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="flex-1 bg-transparent outline-none text-neutral-900 text-xs font-normal placeholder:text-neutral-400"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Team Grid */}
            <div className="flex-1 overflow-y-auto px-1">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
                    {visibleMembers.map((member) => {
                        const totalActive = member.tasks.TODO + member.tasks.IN_PROGRESS + member.tasks.BLOCKED + member.tasks.IN_REVIEW;
                        const totalAll = totalActive + member.tasks.DONE;
                        const utilizationPct = Math.round((member.totalEffort / member.capacity) * 100);
                        const isSelected = selectedMemberId === member.id;

                        return (
                            <div
                                key={member.id}
                                onClick={() => setSelectedMemberId(isSelected ? null : member.id)}
                                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${isSelected
                                        ? "border-primary shadow-md ring-1 ring-primary/20"
                                        : "border-neutral-200 hover:border-neutral-300"
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold overflow-hidden flex-shrink-0">
                                        {member.avatar ? (
                                            <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            member.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-neutral-900 truncate">{member.name}</h4>
                                        <span className="text-[10px] text-neutral-400">{member.role}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-bold text-neutral-900">{totalActive}</span>
                                        <span className="text-[10px] text-neutral-400">active</span>
                                    </div>
                                </div>

                                {/* Status distribution bar */}
                                <div className="h-2 rounded-full overflow-hidden flex bg-neutral-100 mb-2">
                                    {(["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE"] as TaskStatus[]).map((status) => {
                                        const count = member.tasks[status];
                                        if (count === 0) return null;
                                        const width = (count / totalAll) * 100;
                                        return (
                                            <div
                                                key={status}
                                                className={`${STATUS_COLORS[status]} transition-all`}
                                                style={{ width: `${width}%` }}
                                                title={`${STATUS_LABELS[status]}: ${count}`}
                                            />
                                        );
                                    })}
                                </div>

                                {/* Status counts */}
                                <div className="flex items-center gap-3 mb-3">
                                    {(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"] as TaskStatus[]).map((status) => (
                                        <div key={status} className="flex items-center gap-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[status]}`} />
                                            <span className="text-[10px] text-neutral-500">{member.tasks[status]}</span>
                                        </div>
                                    ))}
                                    {member.tasks.BLOCKED > 0 && (
                                        <div className="flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                            <span className="text-[10px] text-red-500 font-medium">{member.tasks.BLOCKED} blocked</span>
                                        </div>
                                    )}
                                </div>

                                {/* Utilization */}
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${utilizationPct > 90 ? "bg-red-500" : utilizationPct > 70 ? "bg-amber-500" : "bg-green-500"
                                                }`}
                                            style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-bold ${utilizationPct > 90 ? "text-red-600" : utilizationPct > 70 ? "text-amber-600" : "text-green-600"
                                        }`}>
                                        {utilizationPct}%
                                    </span>
                                    <span className="text-[10px] text-neutral-400">
                                        {member.totalEffort}/{member.capacity}h
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Selected member tasks drill-down */}
                {selectedMember && (
                    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mb-4">
                        <div className="flex items-center gap-3 px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold overflow-hidden flex-shrink-0">
                                {selectedMember.avatar ? (
                                    <img src={selectedMember.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    selectedMember.name.charAt(0).toUpperCase()
                                )}
                            </div>
                            <h3 className="text-sm font-semibold text-neutral-900">{selectedMember.name}'s Tasks</h3>
                            <span className="text-[10px] text-neutral-400 bg-white px-2 py-0.5 rounded-full border border-neutral-200">
                                {selectedMemberTasks.length} tasks
                            </span>
                        </div>

                        {/* Tasks table */}
                        <div className="divide-y divide-neutral-100">
                            {selectedMemberTasks.map((task) => {
                                const pCfg = PRIORITY_CONFIG[task.priority];
                                return (
                                    <div key={task.id} className="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50 transition-colors">
                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[task.status]}`} />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-neutral-900 truncate block">{task.title}</span>
                                            <span className="text-[10px] text-neutral-400">{task.projectName}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${pCfg.bg} ${pCfg.color} flex-shrink-0`}>
                                            {pCfg.label}
                                        </span>
                                        <div className="flex items-center gap-1.5 w-20 flex-shrink-0">
                                            <div className="flex-1 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${task.progress >= 75 ? "bg-green-500" : task.progress >= 50 ? "bg-blue-500" : "bg-primary"}`}
                                                    style={{ width: `${task.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-neutral-500">{task.progress}%</span>
                                        </div>
                                        <span className="text-xs text-neutral-500 w-16 text-right flex-shrink-0">{task.dueDate}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
