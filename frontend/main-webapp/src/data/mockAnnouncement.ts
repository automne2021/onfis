export const MOCK_ANNOUNCEMENTS = [
  {
    id: 1,
    authId: 101,
    authName: "Sarah Jenkins",
    position: "CEO",
    date: "Feb 22, 2026 17:00:00",
    avatarUrl: "https://i.pravatar.cc/150?u=sarah", // Ảnh avatar mẫu
    isPinned: true,
    scope: "company", 
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
    likes: [105],
    comments: [
      {
        id: 123,
        userId: 104,
        name: "Jone Smith",
        date: "Feb 22, 2026 17:05:00",
        avatarUrl: "https://i.pravatar.cc/150?u=michael",
        content: "We have a great time together! Thanks everyone! Let's celebrate party!",
        likes: [101, 102, 103],
        replies: [
          {
            id: 126,
            userId: 101,
            name: "Sarah Jenkins",
            date: "Feb 22, 2026 17:06:00",
            avatarUrl: "https://i.pravatar.cc/150?u=sarah",
            content: "You are the ACE, John!",
            likes: [104],
          },
          {
            id: 127,
            userId: 104,
            name: "John Smith",
            date: "Feb 22, 2026 17:08:00",
            avatarUrl: "https://i.pravatar.cc/150?u=michael",
            content: "Thanks, ma'am 😊",
          },
        ]
      },
      {
        id: 124,
        userId: 104,
        name: "Jone Smith",
        date: "Feb 22, 2026 17:05:00",
        avatarUrl: "https://i.pravatar.cc/150?u=michael",
        content: "We have a great time together! Thanks everyone! Let's celebrate party!",
      },
      {
        id: 125,
        userId: 104,
        name: "Jone Smith",
        date: "Feb 22, 2026 17:05:00",
        avatarUrl: "https://i.pravatar.cc/150?u=michael",
        content: "We have a great time together! Thanks everyone! Let's celebrate party!",
        likes: [101, 102, 103, 104],
      }
    ]
  },

  {
    id: 2,
    authId: 102,
    authName: "Michael Chen",
    position: "Head of Engineering",
    date: "Feb 20, 2026 16:00:00",
    avatarUrl: "https://i.pravatar.cc/150?u=michael",
    isPinned: false,
    scope: "department",
    // Danh sách dài để test hiển thị: Engineering, Product +3
    departments: ["Engineering", "Product", "Design", "QA", "Data Science"], 
    title: "System Maintenance Scheduled for Weekend",
    content: "Please be advised that we will be performing critical server upgrades this Saturday from 10 PM to 2 AM. All internal tools will be temporarily unavailable during this window. Ensure your work is saved.",
    attachments: [],
    initialIsLike: false,
    likes: [],
    comments: [],
  },

  {
    id: 3,
    authId: 103,
    authName: "Emily Blunt",
    position: "HR Manager",
    date: "Feb 16, 2026 17:00:00",
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
    likes: [],
    comments: [],
  },
  {
    id: 4,
    authId: 101,
    authName: "Sarah Jenkins",
    position: "CEO",
    date: "Feb 22, 2026 17:00:00",
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
    likes: [105],
    comments: [],
  },

  {
    id: 5,
    authId: 102,
    authName: "Michael Chen",
    position: "Head of Engineering",
    date: "Feb 20, 2026 16:00:00",
    avatarUrl: "https://i.pravatar.cc/150?u=michael",
    isPinned: false,
    scope: "department",
    // Danh sách dài để test hiển thị: Engineering, Product +3
    departments: ["Engineering", "Product", "Design", "QA", "Data Science"], 
    title: "System Maintenance Scheduled for Weekend",
    content: "Please be advised that we will be performing critical server upgrades this Saturday from 10 PM to 2 AM. All internal tools will be temporarily unavailable during this window. Ensure your work is saved.",
    attachments: [],
    initialIsLike: false,
    likes: [],
    comments: [],
  },

  {
    id: 6,
    authId: 103,
    authName: "Emily Blunt",
    position: "HR Manager",
    date: "Feb 16, 2026 17:00:00",
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
    likes: [],
    comments: [],
  }
];