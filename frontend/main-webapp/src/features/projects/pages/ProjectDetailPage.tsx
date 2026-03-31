import { useEffect, useState, type ReactElement } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { SearchIcon, StarIcon, CompletedMilestoneIcon, LateMilestoneIcon, UpcomingMilestoneIcon, TasksViewIcon as KanbanIcon } from "../../../components/common/Icons";
import { ArrowRightAltOutlined } from '@mui/icons-material';
import { useRole } from "../../../hooks/useRole";
import { useTenantPath } from "../../../hooks/useTenantPath";
import { getProjectDetail, toggleProjectFavorite, deleteProject, updateProject, type ApiProjectDetail, type ApiMilestone, type ApiUserSummary } from "../../../services/projectService";
import type { ApiTask } from "../../../services/taskService";
import { useToast } from "../../../contexts/useToast";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

// Types for local use
type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed";
type Priority = "urgent" | "high" | "medium" | "low";
type TeamMember = ApiUserSummary;

// Status Badge Component
const StatusBadge = ({ status }: { status: ProjectStatus }) => {
  const styles: Record<ProjectStatus, string> = {
    planning: "bg-status-on_hold/15 text-status-on_hold",
    in_progress: "bg-status-on_track/15 text-status-on_track",
    on_hold: "bg-status-on_hold/15 text-status-on_hold",
    completed: "bg-status-done/15 text-status-done",
  };
  const labels: Record<ProjectStatus, string> = {
    planning: "Planning",
    in_progress: "In Progress",
    on_hold: "On Hold",
    completed: "Completed",
  };
  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full font-medium text-xs leading-4 ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};


// Recent Task Item
const RecentTaskItem = ({ task }: { task: ApiTask }) => {
  const priorityColors: Record<string, string> = {
    urgent: "bg-[#E7000B]",
    high: "bg-[#FF6900]",
    medium: "bg-[#FFD230]",
    low: "bg-neutral-400",
  };
  const firstAssignee = task.assignees[0];

  return (
    <div className="grid grid-cols-[8px_1fr_100px_28px_60px] items-center gap-3 py-2 px-1 hover:bg-neutral-50 rounded-lg transition-colors">
      <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
      <span className="body-3-regular text-neutral-900 truncate">{task.title}</span>
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
          <div className="h-full bg-status-on_track rounded-full" style={{ width: `${task.progress}%` }} />
        </div>
        <span className="body-4-regular w-8 text-right">{task.progress}%</span>
      </div>
      <div className="w-6 h-6 rounded-full bg-status-on_track flex items-center justify-center text-[10px] font-medium text-neutral-900">
        {firstAssignee ? (
          firstAssignee.avatar
            ? <img src={firstAssignee.avatar} alt={firstAssignee.name} className="w-full h-full rounded-full object-cover" />
            : firstAssignee.name.charAt(0).toUpperCase()
        ) : '?'}
      </div>
      <span className="text-xs text-neutral-400 text-right">
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : ''}
      </span>
    </div>
  );
};



// Tag Badge Component (reusing pattern from ProjectCard)
const TagBadge = ({ label, type }: { label: string; type: "department" | "scope" }) => {
  const styles = {
    department: "bg-tag-department/15 text-tag-department",
    scope: "bg-tag-scope/15 text-tag-scope",
  };

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full font-medium text-xs leading-4 ${styles[type]}`}>
      {label}
    </span>
  );
};

// Priority Badge Component
const PriorityBadge = ({ priority }: { priority: Priority }) => {
  const styles: Record<Priority, string> = {
    urgent: "bg-status-off_track/15 text-status-off_track",
    high: "bg-status-off_track/15 text-status-off_track",
    medium: "bg-status-on_track/15 text-status-on_track",
    low: "bg-neutral-500/15 text-neutral-500",
  };
  const labels: Record<Priority, string> = {
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full font-medium text-xs leading-4 ${styles[priority]}`}>
      {labels[priority]}
    </span>
  );
};

// Milestone Status Badge
const MilestoneStatusBadge = ({ status }: { status: ApiMilestone['status'] | 'late' }) => {
  const styles: Record<string, string> = {
    completed: "bg-status-done/15 text-status-done",
    late: "bg-status-off_track/15 text-status-off_track",
    at_risk: "bg-status-off_track/15 text-status-off_track",
    upcoming: "bg-neutral-500/15 text-neutral-500",
    in_progress: "bg-status-on_track/15 text-status-on_track",
  };

  const labels: Record<string, string> = {
    completed: "Completed",
    late: "Late",
    at_risk: "At Risk",
    upcoming: "Upcoming",
    in_progress: "In Progress",
  };

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full font-medium text-xs leading-4 ${styles[status] ?? styles.upcoming}`}>
      {labels[status] ?? "Upcoming"}
    </span>
  );
};

// Avatar Stack Component
const AvatarStack = ({ members, maxDisplay = 3 }: { members: TeamMember[]; maxDisplay?: number }) => {
  const displayMembers = members.slice(0, maxDisplay);
  const remaining = members.length - maxDisplay;

  return (
    <div className="flex items-center -space-x-2">
      {displayMembers.map((member, index) => (
        <div
          key={member.id}
          className="w-7 h-7 rounded-full bg-status-on_track border-2 border-white flex items-center justify-center text-xs font-medium text-neutral-900"
          style={{ zIndex: maxDisplay - index }}
          title={member.name}
        >
          {member.avatar ? (
            <img src={member.avatar} alt={member.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            member.name.charAt(0).toUpperCase()
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-7 h-7 rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center text-xs font-medium text-neutral-900">
          +{remaining}
        </div>
      )}
    </div>
  );
};

// Milestone Item Component
const MilestoneItem = ({ milestone }: { milestone: ApiMilestone }) => {
  const iconMap: Record<string, ReactElement> = {
    completed: <CompletedMilestoneIcon />,
    late: <LateMilestoneIcon />,
    at_risk: <LateMilestoneIcon />,
    upcoming: <UpcomingMilestoneIcon />,
    in_progress: <UpcomingMilestoneIcon />,
  };

  return (
    <div className="flex flex-col items-center gap-1 min-w-[120px] lg:min-w-[140px]">
      {iconMap[milestone.status] ?? <UpcomingMilestoneIcon />}
      <h4 className="body-3-medium text-neutral-900 text-center mt-0.5">
        {milestone.title}
      </h4>
      <p className="body-4-regular text-neutral-400 text-center">
        {milestone.targetDate ? new Date(milestone.targetDate).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
      </p>
      <MilestoneStatusBadge status={milestone.status} />
    </div>
  );
};



export default function ProjectDetailPage() {
  const { projectId: projectIdentifier } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { withTenant } = useTenantPath();
  const location = useLocation();
  const { isManager } = useRole();
  const { showToast } = useToast();
  const [project, setProject] = useState<ApiProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarred, setIsStarred] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>('planning');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!projectIdentifier) return;
      try {
        setLoading(true);
        const detail = await getProjectDetail(projectIdentifier);
        setProject(detail);
        setStatus(detail.status);
        setIsStarred(detail.isStarred);
      } catch {
        showToast('Failed to load project details', 'error');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [projectIdentifier, showToast]);

  const handleToggleStar = async () => {
    if (!projectIdentifier) return;
    try {
      const res = await toggleProjectFavorite(projectIdentifier);
      setIsStarred(res.isStarred);
    } catch {
      showToast('Failed to update favorite', 'error');
    }
  };

  const handleStatusChange = async (newStatus: ProjectStatus) => {
    if (!projectIdentifier || !project) return;
    const prevStatus = status;
    setStatus(newStatus);
    setIsStatusOpen(false);
    try {
      await updateProject(projectIdentifier, {
        title: project.title,
        description: project.description,
        status: newStatus.toUpperCase() as 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED',
        priority: project.priority.toUpperCase() as 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW',
        progress: project.progress,
        startDate: project.startDate ?? undefined,
        dueDate: project.dueDate ?? undefined,
        tags: project.tags,
        managerId: project.managerId ?? undefined,
        customer: project.customer ?? undefined,
      });
      showToast('Project status updated', 'success');
    } catch {
      setStatus(prevStatus);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectIdentifier) return;
    setShowDeleteConfirm(false);
    try {
      await deleteProject(projectIdentifier);
      showToast('Project deleted', 'success');
      navigate(withTenant('/projects'));
    } catch {
      showToast('Failed to delete project', 'error');
    }
  };

  const id = project?.slug || projectIdentifier || '';

  const tabs = [
    { to: withTenant(`/projects/${id}`), label: "Overview", icon: "dashboard" },
    { to: withTenant(`/projects/${id}/tasks`), label: "Tasks", icon: "task_alt" },
    { to: withTenant(`/projects/${id}/members`), label: "Team", icon: "group" },
    ...(isManager ? [{ to: withTenant(`/projects/${id}/reviews`), label: "Reviews", icon: "rate_review" }] : []),
  ];

  const isTabActive = (path: string) => location.pathname === path;

  const statusOptions: { value: ProjectStatus; label: string }[] = [
    { value: "planning", label: "Planning" },
    { value: "in_progress", label: "In Progress" },
    { value: "on_hold", label: "On Hold" },
    { value: "completed", label: "Completed" },
  ];

  if (loading) return <div className="onfis-section"><div className="p-6 text-sm text-neutral-500">Loading project...</div></div>;
  if (!project) return <div className="onfis-section"><div className="p-6 text-sm text-red-500">Project not found.</div></div>;

  const parseTagJson = (raw: string) => {
    try { return JSON.parse(raw) as { label: string; type: 'department' | 'scope' }[]; } catch { return []; }
  };
  const tags = parseTagJson(project.tags ?? '[]');
  const plannedStartDate = project.startDate ? new Date(project.startDate).toLocaleDateString() : '—';
  const plannedEndDate = project.endDate ? new Date(project.endDate).toLocaleDateString() : project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '—';

  return (
    <div className="onfis-section">
      {/* Breadcrumb Bar with Search */}
      <nav className="navbar-style">
        <div className="flex items-center gap-1 body-3-regular">
          <Link to={withTenant("/projects")} className="hover:text-primary transition-colors">
            Project
          </Link>
          <span className="mx-1">/</span>
          <span className="text-primary font-normal">{project.title}</span>
        </div>

        {/* Search Input */}
        <div className={`flex gap-2 items-center px-4 py-2 border bg-white border-neutral-200 outline-none rounded-full transition-colors duration-200 focus-within:border-primary focus-within:bg-white w-[260px] lg:w-[380px]`}>
          <SearchIcon />
          <input
            type="text"
            placeholder={`Search...`}
            className="outline-none w-full body-4-regular"
            maxLength={250}
          />
        </div>
      </nav>

      {/* Project Tab Navigation */}
      <div className="flex items-center gap-0.5 mt-2 border-b border-neutral-200 bg-white px-2 rounded-t-lg shadow-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              isTabActive(tab.to)
                ? "text-primary border-primary"
                : "text-neutral-500 border-transparent hover:text-neutral-800 hover:border-neutral-300"
            }`}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Headline Card */}
      <div className="bg-white flex flex-col gap-4 py-3 px-6 rounded-lg shadow-md mt-2">
        {/* Title Row with Progress */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          {/* Title + Star + Manage Tasks */}
          <div className="flex items-center gap-2 shrink-0">
            <p className="header-h6 leading-snug text-neutral-900">
              {project.title}
            </p>
            <button type="button" onClick={handleToggleStar} className="shrink-0 hover:scale-110 transition-transform" aria-label="Toggle star">
              <StarIcon filled={isStarred} />
            </button>
            <Link
              to={withTenant(`/projects/${id}/tasks`)}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              <KanbanIcon />
              Manage Tasks
            </Link>
            {isManager && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="ml-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 14 }}>delete</span>
                Delete
              </button>
            )}
          </div>

          {/* Progress Section */}
          <div className="flex flex-col gap-0.5 flex-1 max-w-[600px]">
            <div className="flex items-center justify-between">
              <span className="body-4-regular text-neutral-500">
                {project.daysRemaining} days remaining
              </span>
              <span className="body-4-regular text-neutral-900">
                {project.progress}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-status-on_track rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 lg:gap-x-16 gap-y-3 py-1">
          {/* Left Column */}
          <div className="grid grid-cols-[100px_1fr] lg:grid-cols-[120px_1fr] gap-x-4 lg:gap-x-8 gap-y-3 items-center">
            {/* Project Manager */}
            <span className="font-medium text-xs leading-4 text-neutral-900">Project Manager</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-status-on_track flex items-center justify-center text-xs font-medium text-neutral-900">
                {project.managerAvatar ? (
                  <img src={project.managerAvatar} alt={project.managerName ?? ''} className="w-full h-full rounded-full object-cover" />
                ) : (
                  (project.managerName ?? '?').charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-xs leading-4 text-neutral-900">{project.managerName ?? '—'}</span>
            </div>

            {/* Customer */}
            <span className="font-medium text-xs leading-4 text-neutral-900">Customer</span>
            <span className="text-xs leading-4 text-neutral-900">{project.customer ?? '—'}</span>

            {/* Tags */}
            <span className="font-medium text-xs leading-4 text-neutral-900">Tags</span>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag, index) => (
                <TagBadge key={index} label={tag.label} type={tag.type} />
              ))}
              {tags.length === 0 && <span className="text-xs text-neutral-400">—</span>}
            </div>
          </div>

          {/* Right Column */}
          <div className="grid grid-cols-[100px_1fr] lg:grid-cols-[120px_1fr] gap-x-4 lg:gap-x-8 gap-y-3 items-center">
            {/* Team Members */}
            <span className="font-medium text-xs leading-4 text-neutral-900">Team Members</span>
            <AvatarStack members={project.members} maxDisplay={3} />

            {/* Planned Date */}
            <span className="font-medium text-xs leading-4 text-neutral-900">Planned Date</span>
            <div className="flex items-center gap-3">
              <span className="text-xs leading-4 text-neutral-900">{plannedStartDate}</span>
              <ArrowRightAltOutlined fontSize="small"/>
              <span className="text-xs leading-4 text-neutral-900">{plannedEndDate}</span>
            </div>

            {/* Priority */}
            <span className="font-medium text-xs leading-4 text-neutral-900">Priority</span>
            <div><PriorityBadge priority={project.priority} /></div>

            {/* Status */}
            <span className="font-medium text-xs leading-4 text-neutral-900">Status</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
              >
                <StatusBadge status={status} />
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${isStatusOpen ? 'rotate-180' : ''}`}>
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="#90A1B9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div
                className={`absolute top-full left-0 mt-1 inline-flex flex-col bg-white border border-neutral-200 rounded-lg shadow-lg py-0.5 z-20 transition-all duration-200 ease-out origin-top ${isStatusOpen
                  ? 'opacity-100 scale-y-100 pointer-events-auto'
                  : 'opacity-0 scale-y-75 pointer-events-none'
                  }`}
              >
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`text-left px-2 py-1 text-xs hover:bg-neutral-50 rounded transition-colors ${status === option.value ? 'font-bold' : ''
                      }`}
                    onClick={() => {
                      void handleStatusChange(option.value);
                    }}
                  >
                    <StatusBadge status={option.value} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Milestones Card */}
      <div className="bg-white flex flex-col gap-4 py-3 px-6 rounded-lg shadow-md mt-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm leading-5 text-neutral-900">
            Project Milestones
          </h2>
          <button type="button" className="body-4-regular text-primary hover:underline">
            View all
          </button>
        </div>

        {/* Milestones Grid with centered line */}
        <div className="relative px-2 lg:px-4 py-1">
          {/* Horizontal line through the center of the circles */}
          <div className="hidden lg:block absolute left-[60px] right-[60px] top-[24px] h-[2px] bg-neutral-200" style={{ zIndex: 0 }} />
          <div className="flex flex-wrap justify-center lg:justify-between gap-4 lg:gap-6 relative z-10">
          {project.milestones.length === 0 ? (
            <div className="text-xs text-neutral-400 py-3 text-center">No milestones yet</div>
          ) : project.milestones.map((milestone) => (
            <MilestoneItem key={milestone.id} milestone={milestone} />
          ))}
          </div>
        </div>
      </div>

      {/* Recent Tasks Card */}
      <div className="bg-white flex flex-col gap-4 py-3 px-6 rounded-lg shadow-md mt-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm leading-5 text-neutral-900">
            Recent Tasks
          </h2>
          <Link
            to={withTenant(`/projects/${id}/tasks`)}
            className="body-4-regular text-primary hover:underline inline-flex items-center gap-1"
          >
            View All Tasks
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.5 3L7.5 6L4.5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-neutral-200">
          {project.recentTasks.length === 0 ? (
            <div className="text-xs text-neutral-400 py-3 text-center">No recent tasks</div>
          ) : project.recentTasks.map((task) => (
            <RecentTaskItem key={task.id} task={task} />
          ))}
        </div>
      </div>

      {/* Description Card */}
      <div className="bg-white flex flex-col gap-4 py-3 px-6 rounded-lg shadow-md mt-3">
        <h2 className="font-bold text-sm leading-5 text-neutral-900">
          Description
        </h2>
        <p className="text-xs leading-4 text-neutral-900">
          {project.description || <span className="text-neutral-400">No description provided.</span>}
        </p>
      </div>

      {/* Delete project confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Project"
        message={
          <>
            Are you sure you want to delete <strong>{project.title}</strong>? All tasks, milestones, and associated data will be permanently removed. This action cannot be undone.
          </>
        }
        confirmLabel="Delete Project"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => void handleDeleteProject()}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
