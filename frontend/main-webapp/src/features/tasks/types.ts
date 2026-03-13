export type TaskPriority = "urgent" | "high" | "medium" | "low";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "BLOCKED" | "IN_REVIEW" | "DONE";

export type TagType = "department" | "scope";

export interface Tag {
  id: string;
  type: TagType;
  label: string;
}

export interface Assignee {
  id: string;
  name: string;
  avatar?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  dueDate: string;
  assignees: Assignee[];
  tags?: Tag[];
  reporterId?: string;
  estimatedEffort?: number;
  actualEffort?: number;
  blockedBy?: string[];
}

export interface Stage {
  id: string;
  title: string;
  tasks: Task[];
}

export type ViewMode = "kanban" | "list" | "timeline" | "calendar";

export type ReviewAction = "approved" | "changes_requested" | "comment";

export interface ReviewComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  action: ReviewAction;
  content: string;
  createdAt: string;
}
