export interface AttachmentItem {
  id: string | number;
  fileName: string;
  url: string;
  size?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetDepartmentId?: string;
  authorId: string;
  createdAt: string;
}

export interface AnnouncementData {
  id: number | string;
  authId: number | string;
  authName: string;
  position?: string;
  date?: string;
  avatarUrl?: string;
  isPinned?: boolean;
  scope: string;
  targetDepartmentId?: string;   
  targetDepartmentName?: string;
  title: string;
  content: string;
  attachments?: AttachmentItem[]; 
  initialIsLike?: boolean;
  likes?: number[];
  comments?: CommentData[]; 
  numberOfLike?: number;
  numberOfComments?: number;
  calculatedLikes?: number;
  calculatedComments?: number;
}

export interface CommentData {
  id: string | number;
  userId: string | number;
  name: string;
  date: string;
  content: string;
  replyingToName?: string;
  avatarUrl?: string;
  likes?: number[]; 
  replies?: CommentData[]; 
}

export interface DepartmentType {
  id: string;
  name: string;
}

export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface Pageable {
  sort: Sort;
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  pageable: Pageable; 
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; 
  sort: Sort;        
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}