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
  description: string;
  createdAt: string;
}

export interface ApiTask {
  id: string;
  projectId?: string;
  projectTitle?: string;
  projectSlug?: string;
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'DONE';
  progress: number;
  startDate: string | null;
  dueDate: string | null;
  assignees: ApiUserSummary[];
  tags: string;
  reporterId?: string;
  reporterName?: string;
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

export interface ReviewQueueQuery {
  projectId?: string;
  status?: Array<'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'DONE'>;
  page?: number;
  size?: number;
  sortBy?: 'updatedAt' | 'createdAt' | 'dueDate' | 'priority' | 'status' | 'title';
  sortDir?: 'asc' | 'desc';
}

export interface PagedApiResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

// ── Task Stage Update ───────────────────────────────────────────────────

export interface TaskStageUpdatePayload {
  stageId: string;
  status: 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'IN_REVIEW' | 'DONE';
  progress?: number;
}

// ── Task Dependencies ───────────────────────────────────────────────────

export interface TaskDependencyPayload {
  blockedByTaskId: string;
}

// ── Subtask Payloads ────────────────────────────────────────────────────

export interface SubtaskPayload {
  title: string;
  completed?: boolean;
}

// ── Tasks ───────────────────────────────────────────────────────────────

export async function listProjectTasks(projectId: string): Promise<ApiTask[]> {
  const { data } = await api.get<ApiTask[]>(`/projects/${projectId}/tasks`);
  return data;
}

export async function listMyTasks(): Promise<ApiTask[]> {
  const { data } = await api.get<ApiTask[]>('/projects/tasks/me');
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

export async function getTaskDetail(taskId: string): Promise<ApiTaskDetail> {
  const { data } = await api.get<ApiTaskDetail>(`/projects/tasks/${taskId}/detail`);
  return data;
}

// ── Task Stage Update ───────────────────────────────────────────────────

export async function updateTaskStage(
  taskId: string,
  payload: TaskStageUpdatePayload,
): Promise<ApiTask> {
  const { data } = await api.patch<ApiTask>(`/projects/tasks/${taskId}/stage`, payload);
  return data;
}

// ── Task Dependencies ───────────────────────────────────────────────────

export async function addTaskDependency(
  taskId: string,
  payload: TaskDependencyPayload,
): Promise<ApiTask> {
  const { data } = await api.post<ApiTask>(`/projects/tasks/${taskId}/dependencies`, payload);
  return data;
}

export async function removeTaskDependency(
  taskId: string,
  blockedByTaskId: string,
): Promise<ApiTask> {
  const { data } = await api.delete<ApiTask>(
    `/projects/tasks/${taskId}/dependencies/${blockedByTaskId}`,
  );
  return data;
}

// ── Reviews ─────────────────────────────────────────────────────────────

export async function reviewTask(taskId: string, payload: ReviewPayload): Promise<ApiTask> {
  const { data } = await api.post<ApiTask>(`/projects/tasks/${taskId}/reviews`, payload);
  return data;
}

export async function getReviewQueue(query: ReviewQueueQuery = {}): Promise<PagedApiResponse<ApiTask>> {
  const params: Record<string, string | number> = {
    page: query.page ?? 0,
    size: query.size ?? 20,
    sortBy: query.sortBy ?? 'updatedAt',
    sortDir: query.sortDir ?? 'desc',
  };

  if (query.projectId) {
    params.projectId = query.projectId;
  }
  if (query.status && query.status.length > 0) {
    params.status = query.status.join(',');
  }

  const { data } = await api.get<PagedApiResponse<ApiTask>>('/projects/reviews', {
    params,
  });
  return data;
}

// ── Comments ────────────────────────────────────────────────────────────

export async function listTaskComments(taskId: string): Promise<ApiTaskComment[]> {
  const { data } = await api.get<ApiTaskComment[]>(`/projects/tasks/${taskId}/comments`);
  return data;
}

export async function addTaskComment(taskId: string, content: string): Promise<ApiTaskComment> {
  const { data } = await api.post<ApiTaskComment>(`/projects/tasks/${taskId}/comments`, { content });
  return data;
}

// ── Subtasks ────────────────────────────────────────────────────────────

export async function createSubtask(
  taskId: string,
  payload: SubtaskPayload,
): Promise<ApiTaskSubtask> {
  const { data } = await api.post<ApiTaskSubtask>(
    `/projects/tasks/${taskId}/subtasks`,
    payload,
  );
  return data;
}

export async function updateSubtask(
  taskId: string,
  subtaskId: string,
  payload: SubtaskPayload,
): Promise<ApiTaskSubtask> {
  const { data } = await api.put<ApiTaskSubtask>(
    `/projects/tasks/${taskId}/subtasks/${subtaskId}`,
    payload,
  );
  return data;
}

export async function deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
  await api.delete(`/projects/tasks/${taskId}/subtasks/${subtaskId}`);
}
