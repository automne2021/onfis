import api from './api';

export interface ApiAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  size?: number;
  uploadedBy?: string;
  uploadedByName?: string;
  createdAt?: string;
}

function toFormData(file: File): FormData {
  const fd = new FormData();
  fd.append('file', file);
  return fd;
}

export async function uploadTaskAttachment(taskId: string, file: File): Promise<ApiAttachment> {
  const { data } = await api.post<ApiAttachment>(
    `/projects/tasks/${taskId}/attachments`,
    toFormData(file),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function getTaskAttachments(taskId: string): Promise<ApiAttachment[]> {
  const { data } = await api.get<ApiAttachment[]>(`/projects/tasks/${taskId}/attachments`);
  return data;
}

export async function uploadTaskSubmission(taskId: string, file: File): Promise<ApiAttachment> {
  const { data } = await api.post<ApiAttachment>(
    `/projects/tasks/${taskId}/submissions`,
    toFormData(file),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function getTaskSubmissions(taskId: string): Promise<ApiAttachment[]> {
  const { data } = await api.get<ApiAttachment[]>(`/projects/tasks/${taskId}/submissions`);
  return data;
}

export async function uploadProjectAttachment(projectId: string, file: File): Promise<ApiAttachment> {
  const { data } = await api.post<ApiAttachment>(
    `/projects/${projectId}/attachments`,
    toFormData(file),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function getProjectAttachments(projectId: string): Promise<ApiAttachment[]> {
  const { data } = await api.get<ApiAttachment[]>(`/projects/${projectId}/attachments`);
  return data;
}

export async function deleteAttachment(id: string): Promise<void> {
  await api.delete(`/projects/attachments/${id}`);
}
