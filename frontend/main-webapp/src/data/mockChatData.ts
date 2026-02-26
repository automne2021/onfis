import type { ChatUser, ChatChannel, ChatMessage } from '../features/chat/types/chatTypes'

// --- 1. MOCK USERS ---
export const CURRENT_USER: ChatUser = {
  id: 105, 
  name: "You", 
  avatarUrl: "https://i.pravatar.cc/150?img=11", 
  status: "online", // Đã sửa
};

export const MOCK_USERS: Record<string, ChatUser> = {
  bob: { id: "bob", name: "Bob Smith", avatarUrl: "https://i.pravatar.cc/150?img=12", status: "online" },
  sarah: { id: 101, name: "Sarah Jenkins", avatarUrl: "https://i.pravatar.cc/150?u=sarah", status: "offline" },
  david: { id: "david", name: "David Kim", avatarUrl: "https://i.pravatar.cc/150?img=14", status: "busy" }, // Cố tình set busy để test màu đỏ
  alice: { id: "alice", name: "Alice", avatarUrl: "https://i.pravatar.cc/150?img=5", status: "online" },
};

// --- 2. MOCK CHANNELS (SIDEBAR) ---
export const MOCK_CHANNELS: ChatChannel[] = [
  // Project Groups
  { id: "proj-alpha", name: "Project-Alpha", type: "group", membersCount: 32, isPinned: true },
  { id: "mkt-q4", name: "Marketing-Q4", type: "group", membersCount: 10, isPinned: false },
  { id: "ds-system", name: "Design-System", type: "group", membersCount: 15, isPinned: true },
  // Direct Messages (Lấy tên User làm tên Channel luôn cho tiện)
  { id: "dm-bob", name: "Bob Smith", type: "direct" },
  { id: "dm-sarah", name: "Sarah Jenkins", type: "direct" },
  { id: "dm-david", name: "David Kim", type: "direct" },
];

// --- 3. MOCK MESSAGES (CHO CHANNEL 'Project-Alpha') ---
export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "msg-1",
    channelId: "proj-alpha",
    sender: MOCK_USERS.bob,
    timestamp: "10:42 AM",
    dateSeparator: "Today, October 24", // Sẽ render dòng chữ ngày tháng ở trên tin nhắn này
    type: "text",
    content: "Hey team, I've just uploaded the finalized requirements for the backend refactor. Please take a look when you have a moment.",
  },
  {
    id: "msg-2",
    channelId: "proj-alpha",
    sender: MOCK_USERS.sarah,
    timestamp: "10:45 AM",
    type: "file",
    content: "Here are the latest specifications regarding the new architecture.",
    file: {
      name: "Project_Specs.pdf",
      size: "1.4 MB",
      type: "pdf",
      url: "#",
    }
  },
  {
    id: "msg-3",
    channelId: "proj-alpha",
    sender: MOCK_USERS.alice,
    timestamp: "10:50 AM",
    type: "meeting",
    content: "", 
    meeting: {
      hostName: "Alice",
      status: "ongoing",
      participantsCount: 4,
      url: "#",
    }
  },
  {
    id: "msg-4",
    channelId: "proj-alpha",
    sender: CURRENT_USER,
    timestamp: "10:55 AM",
    type: "text",
    content: "Joining now! Just had to grab a coffee ☕",
  },
];