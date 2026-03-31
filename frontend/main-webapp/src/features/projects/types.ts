export type TagType = "department" | "scope";

export interface Tag {
  label: string;
  type: TagType;
}

export type Priority = "urgent" | "high" | "medium" | "low";

export type ProjectStatus = "planning" | "in_progress" | "on_hold" | "completed";

export interface Assignee {
  id: string;
  name: string;
  avatar?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: Tag[];
  priority: Priority;
  progress: number;
  dueDate: string;
  status: ProjectStatus;
  assignees: Assignee[];
}

export interface ProjectsByStatus {
  planning: Project[];
  in_progress: Project[];
  on_hold: Project[];
  completed: Project[];
}

export type ProjectRole = "Lead" | "Developer" | "Designer" | "QA" | "Analyst";

export interface ProjectMember {
  id: string;
  name: string;
  avatar?: string;
  projectRole: ProjectRole;
  joinedAt: string;
  taskCount: number;
}
