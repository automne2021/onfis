export const MOCK_ANNOUNCEMENTS = [
  // CASE 1: Tin ghim (Pinned), Toàn công ty (Global), Có file PDF
  {
    id: 1,
    authName: "Sarah Jenkins",
    position: "CEO",
    time: "2 hours ago",
    avatarUrl: "https://i.pravatar.cc/150?u=sarah", // Ảnh avatar mẫu
    isPinned: true,
    scope: "company", // Sửa logic trong Card thành scope === 'company'
    title: "Q4 Town Hall Summary & 2026 Vision",
    content: "Thank you everyone for joining our end-of-year Town Hall. We have achieved remarkable milestones this year. Attached is the summary deck and the recording link for those who missed it. Let's keep pushing boundaries!",
    attachments: [
      {
        id: 101,
        fileName: "Q4_Summary_Report.pdf",
        url: "#",
        size: 2048
      },
      {
        id: 102,
        fileName: "Vision_2026.docx",
        url: "#",
        size: 1024
      }
    ],
    initialIsLike: true,
    numberOfLike: 124,
    numberOfComments: 45
  },

  // CASE 2: Tin ban ngành (Department), Nhiều phòng ban (Test Dropdown +3), Không file
  {
    id: 2,
    authName: "Michael Chen",
    position: "Head of Engineering",
    time: "5 hours ago",
    avatarUrl: "https://i.pravatar.cc/150?u=michael",
    isPinned: false,
    scope: "department",
    // Danh sách dài để test hiển thị: Engineering, Product +3
    departments: ["Engineering", "Product", "Design", "QA", "Data Science"], 
    title: "System Maintenance Scheduled for Weekend",
    content: "Please be advised that we will be performing critical server upgrades this Saturday from 10 PM to 2 AM. All internal tools will be temporarily unavailable during this window. Ensure your work is saved.",
    attachments: [],
    initialIsLike: false,
    numberOfLike: 12,
    numberOfComments: 2
  },

  // CASE 3: Tin ban ngành (Department), Ít phòng ban, Có file ảnh
  {
    id: 3,
    authName: "Emily Blunt",
    position: "HR Manager",
    time: "1 day ago",
    avatarUrl: "https://i.pravatar.cc/150?u=emily",
    isPinned: false,
    scope: "department",
    departments: ["Human Resources", "Finance"],
    title: "New Expense Reimbursement Policy",
    content: "We have updated the travel and expense policy effective immediately. Please review the attached guidelines before submitting your next claim. The limits for daily meals have been increased.",
    attachments: [
      {
        id: 301,
        fileName: "Expense_Policy_v2.pdf",
        url: "#"
      },
      {
        id: 302,
        fileName: "guide_screenshot.png",
        url: "#"
      },
      {
        id: 303,
        fileName: "receipt_template.xlsx",
        url: "#"
      }
    ],
    initialIsLike: false,
    numberOfLike: 8,
    numberOfComments: 0
  }
];