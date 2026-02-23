export interface AttachmentItem {
  id: string | number;
  fileName: string;
  url: string;
  size?: number;
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
  departments?: string[];
  title: string;
  content: string;
  attachments?: AttachmentItem[]; 
  initialIsLike?: boolean;
  likes?: number[];
  comments?: CommentData[]; 
  calculatedLikes?: number;
  calculatedComments?: number;
}

export interface CommentData {
  id: string | number;
  userId: string | number;
  name: string;
  date: string;
  content: string;
  avatarUrl?: string;
  likes?: number[]; 
  replies?: CommentData[]; 
}