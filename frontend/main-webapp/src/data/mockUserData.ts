import type { UserProfile } from "../types/userType";

export const MOCK_USERS: UserProfile[] = [
  // --- 1. SARAH JENKINS (CEO) ---
  {
    id: 101, 
    name: "Sarah Jenkins",
    position: "CEO",
    department: "Executive Board",
    email: "sarah.jenkins@company.com",
    phone: "+1 (555) 123-4567",
    location: "New York HQ",
    avatarUrl: "https://i.pravatar.cc/150?u=sarah",

    team: "Executive Leadership",
    reportsTo: "Board of Directors",
    bio: "Visionary Chief Executive Officer with over 15 years of experience leading tech companies to scale. Passionate about innovation, building high-performing teams, and driving sustainable growth.",
    skills: ["Strategic Leadership", "Business Development", "Public Speaking", "M&A", "Corporate Finance"],

    officeLocation: "New York HQ, Executive Suite",
    nationality: "American",
    gender: "Female",
    nationalId: "999-88-7777",
    personalEmail: "sarah.j.private@email.com",
    personalPhone: "+1 (555) 999-0000",
    homeAddress: {
      line1: "1 Central Park West, Penthouse",
      cityStateZip: "New York, NY 10023",
      country: "United States"
    },
    emergencyContact: {
      name: "David Jenkins",
      relationship: "Spouse",
      phone: "555-888-9999"
    },
    education: {
      degree: "Master of Business Administration (MBA)",
      major: "Business Strategy",
      institution: "Harvard Business School",
      graduationYear: 2010
    },

    banking: {
      bankName: "Goldman Sachs",
      accountNumber: "000111222333",
      taxId: "88-7776665"
    },
    compensation: {
      baseSalary: "$550,000",
      payFrequency: "Monthly",
      bonusTarget: "50%",
      nextReview: "Jan 2027"
    },
    contract: {
      type: "Executive Contract",
      schedule: "Flexible",
      startDate: "Jan 10, 2018",
      endDate: "-",
      noticePeriod: "6 Months",
      probationPeriod: "Passed",
      documentName: "SJ_Executive_Agreement.pdf"
    }
  },

  // --- 2. MICHAEL CHEN (HEAD OF ENGINEERING) ---
  {
    id: 102, 
    name: "Michael Chen",
    position: "Head of Engineering",
    department: "Engineering",
    email: "michael.chen@company.com",
    phone: "+1 (555) 987-6543",
    location: "San Francisco Office",
    avatarUrl: "https://i.pravatar.cc/150?u=michael",

    team: "Engineering Leadership",
    reportsTo: "Sarah Jenkins",
    bio: "Experienced engineering leader focused on building scalable, resilient cloud architectures. Advocate for open-source technologies and agile methodologies. Leading a global team of 50+ engineers.",
    skills: ["System Architecture", "Cloud Computing", "Team Building", "Go", "Kubernetes", "Python"],

    officeLocation: "San Francisco, Floor 12",
    nationality: "Canadian",
    gender: "Male",
    nationalId: "111-22-3333",
    personalEmail: "m.chen.dev@email.com",
    personalPhone: "+1 (415) 555-2222",
    homeAddress: {
      line1: "1200 Tech Boulevard, Apt 304",
      cityStateZip: "San Francisco, CA 94107",
      country: "United States"
    },
    emergencyContact: {
      name: "Linda Chen",
      relationship: "Sister",
      phone: "415-555-8888"
    },
    education: {
      degree: "Master of Science",
      major: "Software Engineering",
      institution: "University of Toronto",
      graduationYear: 2012
    },

    banking: {
      bankName: "Bank of America",
      accountNumber: "333444555666",
      taxId: "11-2223334"
    },
    compensation: {
      baseSalary: "$220,000",
      payFrequency: "Bi-weekly",
      bonusTarget: "20%",
      nextReview: "Mar 2025"
    },
    contract: {
      type: "Full-time Indefinite",
      schedule: "Standard 40h/week",
      startDate: "Mar 15, 2019",
      endDate: "-",
      noticePeriod: "2 Months",
      probationPeriod: "Passed",
      documentName: "MC_Employment_Contract.pdf"
    }
  },

  // --- 3. EMILY BLUNT (HR MANAGER) ---
  {
    id: 103, 
    name: "Emily Blunt",
    position: "HR Manager",
    department: "Human Resources",
    email: "emily.blunt@company.com",
    phone: "+1 (555) 456-7890",
    location: "New York HQ",
    avatarUrl: "https://i.pravatar.cc/150?u=emily",

    team: "People & Culture",
    reportsTo: "Sarah Jenkins",
    bio: "Dedicated HR professional with a focus on employee well-being, talent acquisition, and fostering an inclusive workplace culture. Believes that people are a company's greatest asset.",
    skills: ["Talent Acquisition", "Employee Relations", "Conflict Resolution", "Workday", "Performance Management"],

    officeLocation: "New York HQ, Floor 5",
    nationality: "British",
    gender: "Female",
    nationalId: "444-55-6666",
    personalEmail: "emily.b.hr@email.com",
    personalPhone: "+1 (646) 555-1111",
    homeAddress: {
      line1: "88 Brooklyn Ave, Unit 2A",
      cityStateZip: "Brooklyn, NY 11216",
      country: "United States"
    },
    emergencyContact: {
      name: "Thomas Blunt",
      relationship: "Brother",
      phone: "646-555-9999"
    },
    education: {
      degree: "Bachelor of Arts",
      major: "Human Resource Management",
      institution: "London School of Economics",
      graduationYear: 2015
    },

    banking: {
      bankName: "Citibank",
      accountNumber: "555666777888",
      taxId: "44-5556667"
    },
    compensation: {
      baseSalary: "$115,000",
      payFrequency: "Bi-weekly",
      bonusTarget: "10%",
      nextReview: "Aug 2024"
    },
    contract: {
      type: "Full-time Indefinite",
      schedule: "Standard 40h/week",
      startDate: "Aug 01, 2021",
      endDate: "-",
      noticePeriod: "1 Month",
      probationPeriod: "Passed",
      documentName: "EB_Contract_2021.pdf"
    }
  },

  // --- 4. JONE SMITH (SENIOR DEVELOPER) ---
  {
    id: 104, 
    name: "Jone Smith", 
    position: "Senior Developer", 
    department: "Engineering",
    email: "john.smith@company.com",
    phone: "+1 (555) 333-2222",
    location: "Remote - Texas",
    avatarUrl: "https://i.pravatar.cc/150?u=jone",

    team: "Core Platform Experience",
    reportsTo: "Michael Chen",
    bio: "Passionate full-stack developer who loves crafting beautiful UIs and robust backend APIs. When not coding, I'm usually hiking or contributing to open-source React libraries.",
    skills: ["React", "TypeScript", "Node.js", "Tailwind CSS", "PostgreSQL", "GraphQL"],

    officeLocation: "Remote",
    nationality: "American",
    gender: "Male",
    nationalId: "777-88-9999",
    personalEmail: "jone.codes@gmail.com",
    personalPhone: "+1 (512) 555-3333",
    homeAddress: {
      line1: "4500 Tech Ridge Blvd",
      cityStateZip: "Austin, TX 78753",
      country: "United States"
    },
    emergencyContact: {
      name: "Mary Smith",
      relationship: "Mother",
      phone: "512-555-7777"
    },
    education: {
      degree: "Bachelor of Science",
      major: "Computer Science",
      institution: "University of Texas at Austin",
      graduationYear: 2018
    },

    banking: {
      bankName: "Wells Fargo",
      accountNumber: "999000111222",
      taxId: "77-8889990"
    },
    compensation: {
      baseSalary: "$145,000",
      payFrequency: "Bi-weekly",
      bonusTarget: "10%",
      nextReview: "Jun 2025"
    },
    contract: {
      type: "Full-time Indefinite",
      schedule: "Standard 40h/week",
      startDate: "Jun 10, 2022",
      endDate: "-",
      noticePeriod: "1 Month",
      probationPeriod: "Passed",
      documentName: "JS_Remote_Agreement.pdf"
    }
  },

  // --- 5. ALEX RIVERA (NEW EMPLOYEE) ---
  {
    id: 105,
    name: "Alex Rivera",
    position: "Senior Product Manager",
    department: "Software Engineering",
    email: "alex.rivera88@gmail.com", 
    phone: "+1 (206) 555-0128", 
    location: "Seattle, WA",
    avatarUrl: "https://i.pravatar.cc/150?u=alex",

    team: "Core Platform Experience",
    reportsTo: "Sarah Jenkins",
    bio: "Experienced Product Manager with over 7 years in SaaS platform development. Passionate about user-centric design and agile methodologies. Previously led product initiatives at TechFlow and Streamline Systems. Currently focused on enhancing the core user experience and streamlining onboarding workflows for enterprise clients.",
    skills: ["Product Strategy", "Agile / Scrum", "TypeScript", "React", "Data Analytics", "User Research", "JIRA"],

    officeLocation: "Seattle HQ, Building A",
    nationality: "American",
    gender: "Male",
    nationalId: "142-55-9012",
    personalEmail: "alex.rivera88@gmail.com",
    personalPhone: "+1 (206) 555-0128",
    homeAddress: {
      line1: "442 Pine St, Apt 4B",
      cityStateZip: "Seattle, WA 98101",
      country: "United States"
    },
    emergencyContact: {
      name: "Sarah Rivera",
      relationship: "Spouse",
      phone: "555-0199"
    },
    education: {
      degree: "Master of Science",
      major: "Computer Science",
      institution: "Univ. of Washington",
      graduationYear: 2014
    },

    banking: {
      bankName: "Chase Bank",
      accountNumber: "9876543210",
      taxId: "12-3456789"
    },
    compensation: {
      baseSalary: "$165,000",
      payFrequency: "Bi-weekly",
      bonusTarget: "15%",
      nextReview: "Dec 2024"
    },
    contract: {
      type: "Full-time Indefinite",
      schedule: "Standard 40h/week",
      startDate: "Oct 12, 2020",
      endDate: "-", 
      noticePeriod: "1 Month",
      probationPeriod: "Passed",
      documentName: "Signed_Employment_Agreement_2020.pdf"
    }
  }
];

export const findUserByName = (name: string): UserProfile | undefined => {
  return MOCK_USERS.find(user => user.name.toLowerCase() === name.toLowerCase());
};

export const findUserById = (id: string | number): UserProfile | undefined => {
  return MOCK_USERS.find(user => user.id === id);
};