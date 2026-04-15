// Các loại tin nhắn hỗ trợ trong hệ thống
export type MessageType = 'text' | 'file' | 'meeting';
export type ChannelType = 'group' | 'direct' | 'self';

export interface ChatUser {
  id: string; // Đổi thành string vì ID Supabase là UUID
  name: string;
  avatarUrl: string;
  status: "online" | "busy" | "offline";
}

export interface ChatChannel {
  id: string;
  name: string;
  type: ChannelType;
  // Thêm 2 trường này để hiển thị avatar/trạng thái cho Direct Message
  avatarUrl?: string; 
  status?: "online" | "busy" | "offline"; 
  membersCount?: number;
  isPinned?: boolean;
  unreadCount?: number;
}

// Cấu trúc cho file đính kèm
export interface FileAttachment {
  name: string;
  size: string;
  type: string; 
  url: string;
}

// Cấu trúc cho thẻ Meeting (Cuộc họp)
export interface MeetingData {
  hostName: string;
  status: 'ongoing' | 'ended';
  participantsCount: number;
  url: string;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  sender: ChatUser;
  timestamp: string; 
  dateSeparator?: string; 
  type: MessageType;
  content: string; 
  file?: FileAttachment;
  meeting?: MeetingData;
}

// DTO ánh xạ trực tiếp từ Spring Boot trả về
export interface BackendMessageDTO {
  id: string;
  conversationId: string;
  userId: string;
  senderName: string | null;   
  senderAvatar: string | null; 
  content: string;
  type: string;
  isEdited: boolean;
  attachmentId: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string | null;
}