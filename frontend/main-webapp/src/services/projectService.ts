import api from './api';

export interface ApiUserSummary {
  id: string;
  name: string;
  avatar?: string;
}

export interface ApiMilestone {
  id: string;
  title: string;
  targetDate: string | null;
  status: 'completed' | 'upcoming' | 'at_risk' | 'in_progress';
}

export interface ApiProjectDetail {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  progress: number;
  startDate: string | null;
  endDate: string | null;
  dueDate: string | null;
  tags: string;
  managerId: string | null;
  managerName: string | null;
  managerAvatar: string | null;
  customer: string | null;
  members: ApiUserSummary[];
  memberCount: number;
  canManage: boolean;
  isStarred: boolean;
  milestones: ApiMilestone[];
  recentTasks: import('./taskService').ApiTask[];
  daysRemaining: number;
  createdAt: string | null;
}

export interface ApiCurrentUser {
  id: string;
  name: string;
  role: 'MANAGER' | 'EMPLOYEE';
  permissions: string[];
}

export interface ApiProject {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  progress: number;
  dueDate: string | null;
  tags: string;
  assignees: ApiUserSummary[];
  canManage: boolean;
}

export interface ApiProjectMember {
  id: string;
  name: string;
  avatar?: string;
  projectRole: 'Lead' | 'Developer' | 'Designer' | 'QA' | 'Analyst';
  joinedAt: string;
  taskCount: number;
}

export interface CreateProjectPayload {
  title: string;
  description?: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED';
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  progress: number;
  startDate?: string;
  dueDate?: string;
  tags?: string;
  managerId?: string;
  customer?: string;
}

export interface UpsertProjectMemberPayload {
  userId: string;
  role: 'LEAD' | 'DEVELOPER' | 'DESIGNER' | 'QA' | 'ANALYST' | 'MEMBER';
}

export async function getCurrentProjectUser(): Promise<ApiCurrentUser> {
  const { data } = await api.get<ApiCurrentUser>('/projects/me');
  return data;
}

export async function listProjects(): Promise<ApiProject[]> {
  const { data } = await api.get<ApiProject[]>('/projects');
  return data;
}

export async function createProject(payload: CreateProjectPayload): Promise<ApiProject> {
  const { data } = await api.post<ApiProject>('/projects', payload);
  return data;
}

export async function getProjectMembers(projectId: string): Promise<ApiProjectMember[]> {
  const { data } = await api.get<ApiProjectMember[]>(`/projects/${projectId}/members`);
  return data;
}

export async function addProjectMember(projectId: string, payload: UpsertProjectMemberPayload): Promise<ApiProjectMember> {
  const { data } = await api.post<ApiProjectMember>(`/projects/${projectId}/members`, payload);
  return data;
}

export async function updateProjectMemberRole(
  projectId: string,
  memberId: string,
  payload: UpsertProjectMemberPayload,
): Promise<ApiProjectMember> {
  const { data } = await api.put<ApiProjectMember>(`/projects/${projectId}/members/${memberId}`, payload);
  return data;
}

export async function removeProjectMember(projectId: string, memberId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/members/${memberId}`);
}

export async function getProjectDetail(projectId: string): Promise<ApiProjectDetail> {
  const { data } = await api.get<ApiProjectDetail>(`/projects/${projectId}/detail`);
  return data;
}

export async function toggleProjectFavorite(projectId: string): Promise<{ isStarred: boolean }> {
  const { data } = await api.post<{ isStarred: boolean }>(`/projects/${projectId}/favorite`);
  return data;
}

export async function getProjectStages(projectId: string): Promise<{ id: string; name: string; stageOrder: number }[]> {
  const { data } = await api.get<{ id: string; name: string; stageOrder: number }[]>(`/projects/${projectId}/stages`);
  return data;
}

export async function getProjectMilestones(projectId: string): Promise<ApiMilestone[]> {
  const { data } = await api.get<ApiMilestone[]>(`/projects/${projectId}/milestones`);
  return data;
}

export async function searchProjectUsers(query: string): Promise<ApiUserSummary[]> {
  const { data } = await api.get<ApiUserSummary[]>('/projects/users/search', { params: { q: query } });
  return data;
}
