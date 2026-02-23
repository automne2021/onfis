import type { UserProfile } from "../features/announcements/components/Card/ProfileCard";

export const MOCK_USERS: UserProfile[] = [
  // --- TÁC GIẢ BÀI VIẾT TỪ MOCK_ANNOUNCEMENTS ---
  {
    id: 101, // Mình gán ID giả định cho Sarah
    name: "Sarah Jenkins",
    position: "CEO",
    department: "Executive Board",
    email: "sarah.jenkins@company.com",
    phone: "+1 (555) 123-4567",
    location: "New York HQ",
    avatarUrl: "https://i.pravatar.cc/150?u=sarah"
  },
  {
    id: 102, // Gán ID cho Michael
    name: "Michael Chen",
    position: "Head of Engineering",
    department: "Engineering",
    email: "michael.chen@company.com",
    phone: "+1 (555) 987-6543",
    location: "San Francisco Office",
    avatarUrl: "https://i.pravatar.cc/150?u=michael"
  },
  {
    id: 103, // Gán ID cho Emily
    name: "Emily Blunt",
    position: "HR Manager",
    department: "Human Resources",
    email: "emily.blunt@company.com",
    phone: "+1 (555) 456-7890",
    location: "New York HQ",
    avatarUrl: "https://i.pravatar.cc/150?u=emily"
  },

  // --- NGƯỜI BÌNH LUẬN (TỪ PHẦN COMMENTS) ---
  {
    id: 104, // Jone Smith có employeeId: 123 trong mock data của bạn
    name: "Jone Smith", // (Lưu ý: trong mock data chỗ ghi Jone, chỗ ghi John, mình tạm gộp)
    position: "Senior Developer", // Thông tin bịa thêm cho logic
    department: "Engineering",
    email: "john.smith@company.com",
    phone: "+1 (555) 333-2222",
    location: "Remote - Texas",
    avatarUrl: "https://i.pravatar.cc/150?u=michael" // Avatar giống Michael trong mock
  }
];

// Hàm tiện ích (Utility function) để tìm User nhanh bằng tên (Dùng tạm khi frontend chưa có ID người post)
export const findUserByName = (name: string): UserProfile | undefined => {
  return MOCK_USERS.find(user => user.name.toLowerCase() === name.toLowerCase());
};

// Hàm chuẩn: Tìm User bằng ID
export const findUserById = (id: string | number): UserProfile | undefined => {
  return MOCK_USERS.find(user => user.id === id);
};