import api from './api';

export interface ApiUserSummary {
  id: string;
  name: string;
  avatar?: string;
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
