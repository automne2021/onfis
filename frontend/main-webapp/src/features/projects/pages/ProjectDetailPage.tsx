import { useEffect, useRef, useState, type ReactElement } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { SearchIcon, StarIcon, CompletedMilestoneIcon, LateMilestoneIcon, UpcomingMilestoneIcon, TasksViewIcon as KanbanIcon } from "../../../components/common/Icons";
import { ArrowRightAltOutlined } from '@mui/icons-material';
import { useRole } from "../../../hooks/useRole";
import { useTenantPath } from "../../../hooks/useTenantPath";
import { RichTextEditor } from "../../../components/common/RichTextEditor/RichTextEditor";
import {
  createMilestone,
  deleteMilestone,
  deleteProject,
  getProjectDetail,
  getProjectMilestones,
  toggleProjectFavorite,
  updateMilestone,
  updateProject,
  type ApiMilestone,
  type ApiProjectDetail,
  type ApiUserSummary,
} from "../../../services/projectService";
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
        {task.dueDate ? (() => { const [y,m,d] = task.dueDate.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('en', { month: 'short', day: 'numeric' }); })() : ''}
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
const MilestoneStatusBadge = ({ status }: { status: ApiMilestone['status'] }) => {
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
        {milestone.targetDate ? (() => { const [y,m,d] = milestone.targetDate.split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' }); })() : ''}
      </p>
      <MilestoneStatusBadge status={milestone.status} />

      <div className="w-full mt-1">
        <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-status-on_track rounded-full transition-all"
            style={{ width: `${milestone.progress}%` }}
          />
        </div>
        <p className="text-[10px] text-neutral-500 mt-1 text-center">
          {milestone.progress}% {milestone.progressOverridden ? "(manual)" : "(auto)"}
        </p>
      </div>
    </div>
  );
};

function ProjectDetailLoadingSkeleton() {
  return (
    <div className="onfis-section animate-pulse">
      <div className="navbar-style">
        <div className="h-4 w-48 rounded bg-neutral-200" />
        <div className="h-10 w-[320px] rounded-full bg-neutral-100" />
      </div>

      <div className="mt-2 h-14 rounded-t-lg border border-neutral-200 bg-white" />

      <div className="mt-2 rounded-lg border border-neutral-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-6 w-72 rounded bg-neutral-200" />
            <div className="h-3 w-56 rounded bg-neutral-100" />
          </div>
          <div className="h-8 w-24 rounded-full bg-neutral-100" />
        </div>

        <div className="mt-5 h-2 w-full rounded bg-neutral-100" />

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-lg border border-neutral-100 p-4">
              <div className="h-3 w-20 rounded bg-neutral-100" />
              <div className="mt-2 h-4 w-32 rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-100 bg-white p-5 shadow-sm space-y-3">
          <div className="h-4 w-36 rounded bg-neutral-200" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 rounded-lg bg-neutral-100" />
          ))}
        </div>
        <div className="rounded-lg border border-neutral-100 bg-white p-5 shadow-sm space-y-3">
          <div className="h-4 w-28 rounded bg-neutral-200" />
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-10 rounded-lg bg-neutral-100" />
          ))}
        </div>
      </div>
    </div>
  );
}



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
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneEditingId, setMilestoneEditingId] = useState<string | null>(null);
  const [milestoneDeleteId, setMilestoneDeleteId] = useState<string | null>(null);
  const [milestoneDraft, setMilestoneDraft] = useState<{
    title: string;
    targetDate: string;
    status: ApiMilestone["status"];
    progress: string;
  }>({
    title: "",
    targetDate: "",
    status: "upcoming",
    progress: "",
  });

  // Inline editing state
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<string>("");
  const [descEditorDraft, setDescEditorDraft] = useState<string>("");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);

  const startEditing = (field: string, currentValue: string) => {
    if (!isManager) return;
    setEditingField(field);
    setEditDraft(currentValue);
    if (field === 'description') setDescEditorDraft(currentValue);
  };

  useEffect(() => {
    if (editingField === 'title') titleInputRef.current?.focus();
    if (editingField === 'customer') customerInputRef.current?.focus();
  }, [editingField]);

  const saveField = async (field: string, value: string) => {
    if (!projectIdentifier || !project) return;
    setEditingField(null);

    const trimmed = value.trim();
    // Don't save if title is empty or nothing changed
    if (field === 'title' && !trimmed) return;
    const currentVal = field === 'title' ? project.title
      : field === 'description' ? project.description
      : field === 'customer' ? (project.customer ?? '')
      : '';
    if (trimmed === currentVal) return;

    const prev = { ...project };
    const updated = { ...project, [field]: trimmed || null };
    setProject(updated);

    try {
      await updateProject(projectIdentifier, {
        title: updated.title,
        description: updated.description,
        status: status.toUpperCase() as 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED',
        priority: updated.priority.toUpperCase() as 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW',
        progress: updated.progress,
        startDate: updated.startDate ?? undefined,
        dueDate: updated.dueDate ?? undefined,
        tags: updated.tags,
        managerId: updated.managerId ?? undefined,
        customer: updated.customer ?? undefined,
      });
      showToast('Project updated', 'success');
    } catch {
      setProject(prev);
      showToast('Failed to update project', 'error');
    }
  };

  const saveDateField = async (field: 'startDate' | 'dueDate', value: string) => {
    if (!projectIdentifier || !project) return;
    const current = field === 'startDate' ? project.startDate : project.dueDate;
    if ((value || null) === (current || null)) return;

    const prev = { ...project };
    const updated = { ...project, [field]: value || null };
    if (field === 'dueDate') {
      updated.endDate = value || null;
    }
    setProject(updated);

    try {
      await updateProject(projectIdentifier, {
        title: updated.title,
        description: updated.description,
        status: status.toUpperCase() as 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED',
        priority: updated.priority.toUpperCase() as 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW',
        progress: updated.progress,
        startDate: updated.startDate ?? undefined,
        dueDate: updated.dueDate ?? undefined,
        tags: updated.tags,
        managerId: updated.managerId ?? undefined,
        customer: updated.customer ?? undefined,
      });
      showToast('Project updated', 'success');
    } catch {
      setProject(prev);
      showToast('Failed to update project', 'error');
    }
  };

  const savePriority = async (newPriority: Priority) => {
    if (!projectIdentifier || !project) return;
    if (newPriority === project.priority) return;

    const prev = { ...project };
    setProject({ ...project, priority: newPriority });

    try {
      await updateProject(projectIdentifier, {
        title: project.title,
        description: project.description,
        status: status.toUpperCase() as 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED',
        priority: newPriority.toUpperCase() as 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW',
        progress: project.progress,
        startDate: project.startDate ?? undefined,
        dueDate: project.dueDate ?? undefined,
        tags: project.tags,
        managerId: project.managerId ?? undefined,
        customer: project.customer ?? undefined,
      });
      showToast('Project updated', 'success');
    } catch {
      setProject(prev);
      showToast('Failed to update project', 'error');
    }
  };

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

  const refreshMilestones = async () => {
    if (!projectIdentifier) {
      return;
    }
    const latestMilestones = await getProjectMilestones(projectIdentifier);
    setProject((prev) => (prev ? { ...prev, milestones: latestMilestones } : prev));
  };

  const resetMilestoneDraft = () => {
    setMilestoneDraft({
      title: "",
      targetDate: "",
      status: "upcoming",
      progress: "",
    });
    setMilestoneEditingId(null);
    setShowMilestoneForm(false);
  };

  const handleStartCreateMilestone = () => {
    resetMilestoneDraft();
    setShowMilestoneForm(true);
  };

  const handleStartEditMilestone = (milestone: ApiMilestone) => {
    setMilestoneEditingId(milestone.id);
    setMilestoneDraft({
      title: milestone.title,
      targetDate: milestone.targetDate ?? "",
      status: milestone.status,
      progress: milestone.progressOverridden ? String(milestone.progress) : "",
    });
    setShowMilestoneForm(true);
  };

  const handleSaveMilestone = async () => {
    if (!projectIdentifier) {
      return;
    }

    const title = milestoneDraft.title.trim();
    if (!title) {
      showToast("Milestone title is required", "error");
      return;
    }

    const progressOverride = milestoneDraft.progress.trim() === ""
      ? undefined
      : Number(milestoneDraft.progress);
    if (progressOverride !== undefined && Number.isNaN(progressOverride)) {
      showToast("Progress override must be a number", "error");
      return;
    }
    if (progressOverride !== undefined && (progressOverride < 0 || progressOverride > 100)) {
      showToast("Progress override must be between 0 and 100", "error");
      return;
    }

    try {
      if (milestoneEditingId) {
        await updateMilestone(projectIdentifier, milestoneEditingId, {
          title,
          targetDate: milestoneDraft.targetDate || undefined,
          status: milestoneDraft.status,
          progress: progressOverride,
        });
        showToast("Milestone updated", "success");
      } else {
        await createMilestone(projectIdentifier, {
          title,
          targetDate: milestoneDraft.targetDate || undefined,
          status: milestoneDraft.status,
          progress: progressOverride,
        });
        showToast("Milestone created", "success");
      }

      await refreshMilestones();
      resetMilestoneDraft();
    } catch {
      showToast("Unable to save milestone", "error");
    }
  };

  const handleDeleteMilestone = async () => {
    if (!projectIdentifier || !milestoneDeleteId) {
      return;
    }

    const deletingId = milestoneDeleteId;
    setMilestoneDeleteId(null);

    try {
      await deleteMilestone(projectIdentifier, deletingId);
      await refreshMilestones();
      showToast("Milestone deleted", "success");
    } catch {
      showToast("Unable to delete milestone", "error");
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

  if (loading) return <ProjectDetailLoadingSkeleton />;
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
      <div className="flex items-center justify-between gap-3 mt-2 border-b border-neutral-200 bg-white px-2 rounded-t-lg shadow-sm">
        <div className="flex items-center gap-0.5">
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

        <div className="flex items-center gap-2 pb-1">
          <Link
            to={withTenant(`/projects/${id}/tasks`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <KanbanIcon />
            Manage Tasks
          </Link>
          {isManager && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 transition-colors border border-red-200"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>delete</span>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Headline Card */}
      <div className="bg-white flex flex-col gap-4 py-3 px-6 rounded-lg shadow-md mt-2">
        {/* Title Row with Progress */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
          {/* Title + Star */}
          <div className="flex items-center gap-2 shrink-0">
            {editingField === 'title' ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onBlur={() => void saveField('title', editDraft)}
                onKeyDown={(e) => { if (e.key === 'Enter') void saveField('title', editDraft); if (e.key === 'Escape') setEditingField(null); }}
                className="header-h6 leading-snug text-neutral-900 bg-transparent border-b-2 border-primary outline-none min-w-[200px]"
                maxLength={200}
              />
            ) : (
              <p
                className={`header-h6 leading-snug text-neutral-900 ${isManager ? 'cursor-pointer hover:bg-neutral-50 rounded px-1 -mx-1 transition-colors' : ''}`}
                onClick={() => startEditing('title', project.title)}
                title={isManager ? 'Click to edit' : undefined}
              >
                {project.title}
              </p>
            )}
            <button type="button" onClick={handleToggleStar} className="shrink-0 hover:scale-110 transition-transform" aria-label="Toggle star">
              <StarIcon filled={isStarred} />
            </button>
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
            {editingField === 'customer' ? (
              <input
                ref={customerInputRef}
                type="text"
                value={editDraft}
                onChange={(e) => setEditDraft(e.target.value)}
                onBlur={() => void saveField('customer', editDraft)}
                onKeyDown={(e) => { if (e.key === 'Enter') void saveField('customer', editDraft); if (e.key === 'Escape') setEditingField(null); }}
                className="text-xs leading-4 text-neutral-900 bg-transparent border-b border-primary outline-none"
                maxLength={200}
              />
            ) : (
              <span
                className={`text-xs leading-4 text-neutral-900 ${isManager ? 'cursor-pointer hover:bg-neutral-50 rounded px-1 -mx-1 transition-colors' : ''}`}
                onClick={() => startEditing('customer', project.customer ?? '')}
                title={isManager ? 'Click to edit' : undefined}
              >
                {project.customer ?? '—'}
              </span>
            )}

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
              {isManager ? (
                <input
                  type="date"
                  value={project.startDate ?? ''}
                  onChange={(e) => void saveDateField('startDate', e.target.value)}
                  className="text-xs leading-4 text-neutral-900 bg-transparent border-b border-neutral-200 hover:border-primary outline-none cursor-pointer focus:border-primary"
                />
              ) : (
                <span className="text-xs leading-4 text-neutral-900">{plannedStartDate}</span>
              )}
              <ArrowRightAltOutlined fontSize="small"/>
              {isManager ? (
                <input
                  type="date"
                  value={project.dueDate ?? project.endDate ?? ''}
                  onChange={(e) => void saveDateField('dueDate', e.target.value)}
                  className="text-xs leading-4 text-neutral-900 bg-transparent border-b border-neutral-200 hover:border-primary outline-none cursor-pointer focus:border-primary"
                />
              ) : (
                <span className="text-xs leading-4 text-neutral-900">{plannedEndDate}</span>
              )}
            </div>

            {/* Priority */}
            <span className="font-medium text-xs leading-4 text-neutral-900">Priority</span>
            {isManager ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setEditingField(editingField === 'priority' ? null : 'priority')}
                  className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
                >
                  <PriorityBadge priority={project.priority} />
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-transform duration-200 ${editingField === 'priority' ? 'rotate-180' : ''}`}>
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="#90A1B9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <div className={`absolute top-full left-0 mt-1 inline-flex flex-col bg-white border border-neutral-200 rounded-lg shadow-lg py-0.5 z-20 transition-all duration-200 ease-out origin-top ${editingField === 'priority' ? 'opacity-100 scale-y-100 pointer-events-auto' : 'opacity-0 scale-y-75 pointer-events-none'}`}>
                  {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`text-left px-2 py-1 text-xs hover:bg-neutral-50 rounded transition-colors ${project.priority === p ? 'font-bold' : ''}`}
                      onClick={() => { setEditingField(null); void savePriority(p); }}
                    >
                      <PriorityBadge priority={p} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div><PriorityBadge priority={project.priority} /></div>
            )}

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
          {isManager && (
            <button
              type="button"
              onClick={handleStartCreateMilestone}
              className="body-4-regular text-primary hover:underline"
            >
              Add Milestone
            </button>
          )}
        </div>

        {/* Milestones Grid with centered line */}
        <div className="relative px-2 lg:px-4 py-1">
          {/* Horizontal line through the center of the circles */}
          <div className="hidden lg:block absolute left-[60px] right-[60px] top-[24px] h-[2px] bg-neutral-200" style={{ zIndex: 0 }} />
          <div className="flex flex-wrap justify-center lg:justify-between gap-4 lg:gap-6 relative z-10">
          {project.milestones.length === 0 ? (
            <div className="text-xs text-neutral-400 py-3 text-center">No milestones yet</div>
          ) : project.milestones.map((milestone) => (
            <div key={milestone.id} className="flex flex-col items-center gap-2">
              <MilestoneItem milestone={milestone} />

              {isManager && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStartEditMilestone(milestone)}
                    className="px-2 py-1 text-[10px] font-medium text-neutral-700 border border-neutral-200 rounded hover:bg-neutral-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setMilestoneDeleteId(milestone.id)}
                    className="px-2 py-1 text-[10px] font-medium text-red-600 border border-red-200 rounded hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
          </div>
        </div>

        {isManager && showMilestoneForm && (
          <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              {milestoneEditingId ? "Edit Milestone" : "New Milestone"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
              <input
                type="text"
                value={milestoneDraft.title}
                onChange={(event) => setMilestoneDraft((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Milestone title"
                className="px-3 py-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-primary"
                maxLength={120}
              />

              <input
                type="date"
                value={milestoneDraft.targetDate}
                onChange={(event) => setMilestoneDraft((prev) => ({ ...prev, targetDate: event.target.value }))}
                className="px-3 py-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-primary"
              />

              <select
                value={milestoneDraft.status}
                onChange={(event) => setMilestoneDraft((prev) => ({ ...prev, status: event.target.value as ApiMilestone["status"] }))}
                className="px-3 py-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-primary bg-white"
              >
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="at_risk">At Risk</option>
                <option value="completed">Completed</option>
                <option value="late">Late</option>
              </select>

              <input
                type="number"
                min={0}
                max={100}
                value={milestoneDraft.progress}
                onChange={(event) => setMilestoneDraft((prev) => ({ ...prev, progress: event.target.value }))}
                placeholder="Progress override (0-100)"
                className="px-3 py-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-primary"
              />
            </div>

            <p className="text-[11px] text-neutral-500 mt-2">
              Leave progress override empty to use automatic progress from linked tasks.
            </p>

            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={resetMilestoneDraft}
                className="px-3 py-1.5 text-xs font-medium text-neutral-700 border border-neutral-200 rounded-md hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveMilestone()}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
              >
                {milestoneEditingId ? "Save Milestone" : "Create Milestone"}
              </button>
            </div>
          </div>
        )}
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
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm leading-5 text-neutral-900">
            Description
          </h2>
          {isManager && editingField !== 'description' && (
            <button
              type="button"
              onClick={() => startEditing('description', project.description ?? '')}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>edit</span>
              Edit
            </button>
          )}
        </div>
        {editingField === 'description' ? (
          <div className="flex flex-col gap-2">
            <RichTextEditor
              initialContent={descEditorDraft}
              onChange={(html) => setDescEditorDraft(html)}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingField(null)}
                className="px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveField('description', descEditorDraft)}
                className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`text-xs leading-4 text-neutral-900 ${isManager ? 'cursor-pointer hover:bg-neutral-50 rounded p-1 -m-1 transition-colors' : ''}`}
            onClick={() => startEditing('description', project.description ?? '')}
            title={isManager ? 'Click to edit' : undefined}
          >
            {project.description
              ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: project.description }} />
              : <span className="text-neutral-400">No description provided.</span>}
          </div>
        )}
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

      <ConfirmDialog
        isOpen={!!milestoneDeleteId}
        title="Delete Milestone"
        message="Are you sure you want to delete this milestone?"
        confirmLabel="Delete Milestone"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => void handleDeleteMilestone()}
        onCancel={() => setMilestoneDeleteId(null)}
      />
    </div>
  );
}
