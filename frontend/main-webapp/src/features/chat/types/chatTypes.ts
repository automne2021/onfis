// Các loại tin nhắn hỗ trợ trong hệ thống
export type MessageType = 'text' | 'file' | 'meeting';
export type ChannelType = 'group' | 'direct';

export interface ChatUser {
  id: string | number;
  name: string;
  avatarUrl: string;
  status: "online" | "busy" | "offline";
}

export interface ChatChannel {
  id: string;
  name: string;
  type: ChannelType;
  membersCount?: number;
  isPinned?: boolean;
  unreadCount?: number;
}

// Cấu trúc cho file đính kèm
export interface FileAttachment {
  name: string;
  size: string;
  type: string; // 'pdf', 'docx', 'png', etc. để render icon cho đúng
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
  timestamp: string; // VD: "10:42 AM"
  dateSeparator?: string; // VD: "Today, October 24" - Dùng để render dải phân cách ngày
  type: MessageType;
  content: string; // Nội dung text (nếu có)
  file?: FileAttachment;
  meeting?: MeetingData;
}