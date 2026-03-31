import type { Task, Assignee, ReviewComment } from "../../types";

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  value?: string;
  description?: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  user: Assignee;
  content: string;
  timestamp: string;
}

export interface TaskDetail extends Task {
  subTasks: SubTask[];
  activities: ActivityItem[];
  comments: Comment[];
  reviews?: ReviewComment[];
  createdAt: string;
  updatedAt: string;
  key: string;
}

export interface TaskDetailModalProps {
  task: TaskDetail;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: TaskDetail) => void;
}
