import api from '../../../services/api';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PositionTreeNode {
  id: string;       // user ID (null/undefined if vacant)
  positionId: string;
  name: string;
  title: string;
  avatar?: string;
  isVacant: boolean;
  status?: string;
  level?: string;
  role?: string;
  email?: string;
  subordinateCount?: number;
  children?: PositionTreeNode[];
  departmentId?: string;
  departmentName?: string;
}

export interface DepartmentWithEmployees {
  id: string;
  name: string;
  employees: EmployeeData[];
}

export interface EmployeeData {
  id: string;
  positionId: string;
  name: string;
  avatar?: string;
  workPhone?: string;
  workEmail?: string;
  jobPosition: string;
  level?: string;
  role?: string;
  manager?: {
    id: string;
    name: string;
    avatar?: string;
  };
  isVacant: boolean;
}

export interface UnassignedUser {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  email?: string;
}

export interface PositionCreateData {
  title: string;
  description?: string;
  departmentId?: string;
  parentId?: string;
}

export interface PositionResponseData {
  id: string;
  title: string;
  description?: string;
  departmentId?: string;
  departmentName?: string;
  parentId?: string;
  assignedUserId?: string;
  assignedUserName?: string;
  assignedUserLevel?: string;
  assignedUserRole?: string;
  isVacant: boolean;
  createdAt: string;
}

export interface DepartmentItem {
  id: string;
  name: string;
}

export interface CurrentUserPositionInfo {
  userId: string;
  level: string | null;
  role: string;
  positionId: string | null;
  positionTitle: string | null;
}

// ── API Functions ─────────────────────────────────────────────────────────────

export async function getPositionTree(): Promise<PositionTreeNode> {
  const res = await api.get('/positions/tree');
  return res.data;
}

export async function getDepartmentsWithEmployees(): Promise<DepartmentWithEmployees[]> {
  const res = await api.get('/positions/departments');
  return res.data;
}

export async function getDepartmentList(): Promise<DepartmentItem[]> {
  const res = await api.get('/positions/department-list');
  return res.data;
}

export async function getUnassignedUsers(): Promise<UnassignedUser[]> {
  const res = await api.get('/positions/unassigned-users');
  return res.data;
}

export async function getCurrentUserPositionInfo(): Promise<CurrentUserPositionInfo> {
  const res = await api.get('/positions/me');
  return res.data;
}

export async function createPosition(data: PositionCreateData): Promise<PositionResponseData> {
  const res = await api.post('/positions', data);
  return res.data;
}

export async function updatePosition(id: string, data: PositionCreateData) {
  const res = await api.put(`/positions/${id}`, data);
  return res.data;
}

export async function deletePosition(id: string) {
  await api.delete(`/positions/${id}`);
}

export async function movePosition(id: string, newParentId: string | null) {
  const res = await api.patch(`/positions/${id}/move`, { newParentId });
  return res.data;
}

export async function assignUserToPosition(
  positionId: string,
  userId: string,
  displacedAction?: 'unassign' | 'remove'
) {
  await api.post(`/positions/${positionId}/assign`, { userId, displacedAction: displacedAction ?? null });
}

export async function unassignUserFromPosition(positionId: string, userId: string) {
  await api.delete(`/positions/${positionId}/users/${userId}`);
}

export async function removeUnassignedUser(userId: string) {
  await api.delete(`/positions/unassigned-users/${userId}`);
}

