import api from './api';
import type { ApiUserSummary } from './projectService';

export interface ApiReview {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  action: 'approved' | 'changes_requested' | 'comment';
  content: string;
  createdAt: string;
}

export interface ApiTaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
}

export interface ApiTaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface ApiTaskActivity {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  value: string | null;
  createdAt: string;
}

export interface ApiTask {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'DONE';
  progress: number;
  dueDate: string | null;
  assignees: ApiUserSummary[];
  tags: string;
  reporterId?: string;
  estimatedEffort?: number;
  actualEffort?: number;
  blockedBy: string[];
  reviews: ApiReview[];
  key: string;
  canEdit: boolean;
  canReview: boolean;
}

export interface ApiTaskDetail extends ApiTask {
  subtasks: ApiTaskSubtask[];
  comments: ApiTaskComment[];
  activities: ApiTaskActivity[];
}

export interface UpsertTaskPayload {
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'DONE';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  progress: number;
  dueDate?: string;
  reporterId?: string;
  estimatedEffort?: number;
  actualEffort?: number;
  parentTaskId?: string;
  stageId?: string;
  tags?: string;
  assigneeIds: string[];
}

export interface ReviewPayload {
  action: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENT';
  content?: string;
}

export async function listProjectTasks(projectId: string): Promise<ApiTask[]> {
  const { data } = await api.get<ApiTask[]>(`/projects/${projectId}/tasks`);
  return data;
}

export async function createTask(projectId: string, payload: UpsertTaskPayload): Promise<ApiTask> {
  const { data } = await api.post<ApiTask>(`/projects/${projectId}/tasks`, payload);
  return data;
}

export async function getTask(taskId: string): Promise<ApiTask> {
  const { data } = await api.get<ApiTask>(`/projects/tasks/${taskId}`);
  return data;
}

export async function updateTask(taskId: string, payload: UpsertTaskPayload): Promise<ApiTask> {
  const { data } = await api.put<ApiTask>(`/projects/tasks/${taskId}`, payload);
  return data;
}

export async function reviewTask(taskId: string, payload: ReviewPayload): Promise<ApiTask> {
  const { data } = await api.post<ApiTask>(`/projects/tasks/${taskId}/reviews`, payload);
  return data;
}

export async function getReviewQueue(projectId?: string): Promise<ApiTask[]> {
  const { data } = await api.get<ApiTask[]>('/projects/reviews', {
    params: projectId ? { projectId } : undefined,
  });
  return data;
}

export async function getTaskDetail(taskId: string): Promise<ApiTaskDetail> {
  const { data } = await api.get<ApiTaskDetail>(`/projects/tasks/${taskId}/detail`);
  return data;
}

export async function addTaskComment(taskId: string, content: string): Promise<ApiTaskComment> {
  const { data } = await api.post<ApiTaskComment>(`/projects/tasks/${taskId}/comments`, { content });
  return data;
}

export async function listTaskComments(taskId: string): Promise<ApiTaskComment[]> {
  const { data } = await api.get<ApiTaskComment[]>(`/projects/tasks/${taskId}/comments`);
  return data;
}
