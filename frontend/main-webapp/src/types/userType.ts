// Định nghĩa cấu trúc cho thông tin chi tiết của nhân viên
export interface UserProfile {
  id: string | number;
  name: string;
  position: string;
  department: string;
  email: string; // Work Email
  phone?: string; // Work Phone
  location?: string;
  avatarUrl?: string;

  // --- THÔNG TIN TỪ TAB OVERVIEW ---
  team?: string;
  reportsTo?: string; // Tên của quản lý
  bio?: string;
  skills?: string[];

  // --- THÔNG TIN TỪ TAB PERSONAL DETAILS ---
  officeLocation?: string;
  nationality?: string;
  gender?: string;
  nationalId?: string; // SSN / CCCD
  personalEmail?: string;
  personalPhone?: string;
  homeAddress?: {
    line1: string;
    cityStateZip: string;
    country: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  education?: {
    degree: string;
    major: string;
    institution: string;
    graduationYear: string | number;
  };

  // --- THÔNG TIN TỪ BẢO MẬT / HR & SALARY ---
  banking?: {
    bankName: string;
    accountNumber: string;
    taxId: string;
  };
  compensation?: {
    baseSalary: string;
    payFrequency: string;
    bonusTarget: string;
    nextReview: string;
  };
  contract?: {
    type: string;
    schedule: string;
    startDate: string;
    endDate?: string | null;
    noticePeriod: string;
    probationPeriod: string;
    documentName?: string;
  };
}