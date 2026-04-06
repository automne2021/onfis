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
  status: 'completed' | 'upcoming' | 'at_risk' | 'in_progress' | 'late';
  progress: number;
  suggestedProgress: number;
  progressOverridden: boolean;
}

export interface ApiProjectDetail {
  id: string;
  slug: string;
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
  slug: string;
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

export interface ApiProjectCustomRole {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export interface ApiProjectMember {
  id: string;
  name: string;
  avatar?: string;
  projectRole: 'Lead' | 'Developer' | 'Designer' | 'QA' | 'Analyst';
  joinedAt: string;
  taskCount: number;
  customRoles: ApiProjectCustomRole[];
}

export interface ApiCompanyTag {
  id: string;
  name: string;
  color: string;
  createdAt: string | null;
  updatedAt: string | null;
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

export interface UpsertCompanyTagPayload {
  name: string;
  color?: string;
}

// ── Workflow Stages ─────────────────────────────────────────────────────

export interface ApiWorkflowStage {
  id: string;
  name: string;
  stageOrder: number;
}

export interface WorkflowStagePayload {
  name: string;
}

export interface WorkflowStageReorderPayload {
  orderedStageIds: string[];
}

// ── Milestones ──────────────────────────────────────────────────────────

export interface MilestonePayload {
  title: string;
  targetDate?: string;
  status: 'completed' | 'upcoming' | 'at_risk' | 'in_progress' | 'late';
  sortOrder?: number;
  progress?: number;
}

// ── Current user ────────────────────────────────────────────────────────

export async function getCurrentProjectUser(): Promise<ApiCurrentUser> {
  const { data } = await api.get<ApiCurrentUser>('/projects/me');
  return data;
}

// ── User search ─────────────────────────────────────────────────────────

export async function searchProjectUsers(query: string): Promise<ApiUserSummary[]> {
  const { data } = await api.get<ApiUserSummary[]>('/projects/users/search', { params: { q: query } });
  return data;
}

// ── Settings: Company tags ─────────────────────────────────────────────

export async function listCompanyTags(): Promise<ApiCompanyTag[]> {
  const { data } = await api.get<ApiCompanyTag[]>('/projects/settings/tags');
  return data;
}

export async function createCompanyTag(payload: UpsertCompanyTagPayload): Promise<ApiCompanyTag> {
  const { data } = await api.post<ApiCompanyTag>('/projects/settings/tags', payload);
  return data;
}

export async function updateCompanyTag(tagId: string, payload: UpsertCompanyTagPayload): Promise<ApiCompanyTag> {
  const { data } = await api.put<ApiCompanyTag>(`/projects/settings/tags/${tagId}`, payload);
  return data;
}

export async function deleteCompanyTag(tagId: string): Promise<void> {
  await api.delete(`/projects/settings/tags/${tagId}`);
}

// ── Projects ────────────────────────────────────────────────────────────

export async function listProjects(): Promise<ApiProject[]> {
  const { data } = await api.get<ApiProject[]>('/projects');
  return data;
}

export async function createProject(payload: CreateProjectPayload): Promise<ApiProject> {
  const { data } = await api.post<ApiProject>('/projects', payload);
  return data;
}

export async function getProject(projectId: string): Promise<ApiProject> {
  const { data } = await api.get<ApiProject>(`/projects/${projectId}`);
  return data;
}

export async function getProjectDetail(projectId: string): Promise<ApiProjectDetail> {
  const { data } = await api.get<ApiProjectDetail>(`/projects/${projectId}/detail`);
  return data;
}

export async function updateProject(projectId: string, payload: CreateProjectPayload): Promise<ApiProject> {
  const { data } = await api.put<ApiProject>(`/projects/${projectId}`, payload);
  return data;
}

export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${projectId}`);
}

export async function toggleProjectFavorite(projectId: string): Promise<{ isStarred: boolean }> {
  const { data } = await api.post<{ isStarred: boolean }>(`/projects/${projectId}/favorite`);
  return data;
}

// ── Members ─────────────────────────────────────────────────────────────

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

// ── Project custom roles ───────────────────────────────────────────────

export interface ProjectCustomRolePayload {
  name: string;
  color?: string;
}

export async function getProjectCustomRoles(projectId: string): Promise<ApiProjectCustomRole[]> {
  const { data } = await api.get<ApiProjectCustomRole[]>(`/projects/${projectId}/roles`);
  return data;
}

export async function createProjectCustomRole(
  projectId: string,
  payload: ProjectCustomRolePayload,
): Promise<ApiProjectCustomRole> {
  const { data } = await api.post<ApiProjectCustomRole>(`/projects/${projectId}/roles`, payload);
  return data;
}

export async function updateProjectCustomRole(
  projectId: string,
  roleId: string,
  payload: ProjectCustomRolePayload,
): Promise<ApiProjectCustomRole> {
  const { data } = await api.put<ApiProjectCustomRole>(`/projects/${projectId}/roles/${roleId}`, payload);
  return data;
}

export async function deleteProjectCustomRole(projectId: string, roleId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/roles/${roleId}`);
}

export async function assignMemberCustomRole(
  projectId: string,
  memberId: string,
  roleId: string,
): Promise<void> {
  await api.post(`/projects/${projectId}/members/${memberId}/roles/${roleId}`);
}

export async function removeMemberCustomRole(
  projectId: string,
  memberId: string,
  roleId: string,
): Promise<void> {
  await api.delete(`/projects/${projectId}/members/${memberId}/roles/${roleId}`);
}

// ── Workflow Stages ─────────────────────────────────────────────────────

export async function getProjectStages(projectId: string): Promise<ApiWorkflowStage[]> {
  const { data } = await api.get<ApiWorkflowStage[]>(`/projects/${projectId}/stages`);
  return data;
}

export async function createProjectStage(
  projectId: string,
  payload: WorkflowStagePayload,
): Promise<ApiWorkflowStage> {
  const { data } = await api.post<ApiWorkflowStage>(`/projects/${projectId}/stages`, payload);
  return data;
}

export async function updateProjectStage(
  projectId: string,
  stageId: string,
  payload: WorkflowStagePayload,
): Promise<ApiWorkflowStage> {
  const { data } = await api.put<ApiWorkflowStage>(
    `/projects/${projectId}/stages/${stageId}`,
    payload,
  );
  return data;
}

export async function deleteProjectStage(projectId: string, stageId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/stages/${stageId}`);
}

export async function reorderProjectStages(
  projectId: string,
  payload: WorkflowStageReorderPayload,
): Promise<ApiWorkflowStage[]> {
  const { data } = await api.put<ApiWorkflowStage[]>(
    `/projects/${projectId}/stages/reorder`,
    payload,
  );
  return data;
}

// ── Milestones ──────────────────────────────────────────────────────────

export async function getProjectMilestones(projectId: string): Promise<ApiMilestone[]> {
  const { data } = await api.get<ApiMilestone[]>(`/projects/${projectId}/milestones`);
  return data;
}

export async function createMilestone(
  projectId: string,
  payload: MilestonePayload,
): Promise<ApiMilestone> {
  const { data } = await api.post<ApiMilestone>(`/projects/${projectId}/milestones`, payload);
  return data;
}

export async function updateMilestone(
  projectId: string,
  milestoneId: string,
  payload: MilestonePayload,
): Promise<ApiMilestone> {
  const { data } = await api.put<ApiMilestone>(
    `/projects/${projectId}/milestones/${milestoneId}`,
    payload,
  );
  return data;
}

export async function deleteMilestone(projectId: string, milestoneId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
}
