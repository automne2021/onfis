import type { FormField } from "../components/ContactForm/type";

export const overviewContents = [
  {
    title: "Workspace & Digital Administration", 
    contents: [
      "Seamless working",
      "Personalized space",
      "Overview reports"
    ]
  },
  {
    title: "Information & Digital Knowledge", 
    contents: [
      "Internal social network",
      "Collaborative exchange",
      "Q&A & Knowledge sharing"
    ]
  },
  {
    title: "Work & Digital Processes", 
    contents: [
      "Progress management",
      "Proposal approval",
      "Automated processes",
      "Track KPIs & OKRs"
    ]
  },
]

export const projectManagementContents = [
  {
    content: "Easy task assignment:",
    subcontent: "Plan & allocate resources appropriately."
  },
  {
    content: "Effective collaboration:",
    subcontent: "Optimize interactions, maximize efficiency.",
  },
  {
    content: "Visual reporting:",
    subcontent: "Quickly track progress.",
  },
  {
    content: "Flexible customization:",
    subcontent: "Gantt, Kanban, table, list, calendar - suitable for all project management methodologies.",
  },
]

export const planOptionContents = [
  {
    type: "Basic",
    description: "Recommended for departments and startups",
    price: "99.99",
    priceDescription: "Mock data",
    contents: [
      "Mock data",
      "Mock data",
      "Mock data",
    ],
  },
  {
    type: "Advance",
    description: "Recommended for businesses ready to scale.",
    price: "1499.99",
    priceDescription: "Mock data",
    contents: [
      "Mock data",
      "Mock data",
      "Mock data",
    ],
  },
  {
    type: "Premium",
    description: "Recommended for established enterprises.",
    price: "2499.9",
    priceDescription: "Mock data",
    contents: [
      "Mock data",
      "Mock data",
      "Mock data",
    ],
  },
]

export const contactFormFields: FormField[] = [
  { 
    id: 'fullname', 
    label: 'Full Name', 
    type: 'text', 
    placeholder: 'Enter your full name' 
  },
  { 
    id: 'email', 
    label: 'Email', 
    type: 'email', 
    placeholder: 'Enter your email' 
  },
  { 
    id: 'telephone', 
    label: 'Phone Number', 
    type: 'tel', 
    placeholder: 'Enter your phone number' 
  },
  { 
    id: 'message', 
    label: 'Message', 
    type: 'textarea', 
    placeholder: 'Enter your message',
    rows: 4 
  },
];