export interface UserDocument {
  id: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  isConfidential: boolean;
  fileUrl?: string;
}

export interface HomeAddress {
  line1: string;
  cityStateZip: string;
  country: string;
}

export interface FullUserProfile {
  id: string | number;
  tenantId?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  email: string;
  role?: string;
  positionId?: string;
  positionName?: string; 
  departmentName?: string; 

  managerId?: string;
  reportsToName?: string;
  reportsToAvatar?: string; 
  workLocation?: string;
  bio?: string;
  skills?: string[];
  workPhone?: string;
  personalEmail?: string;
  phoneNumber?: string; 
  address?: string;
  dob?: string;
  nationId?: string; 
  nationality?: string;
  gender?: string;

  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  } | null;

  educationInfo?: {
    degree?: string;
    major?: string;
    institution?: string;
    graduationYear?: string | number;
  } | null;

  bankingInfo?: {
    bankName?: string;
    accountNumber?: string;
    taxId?: string;
  } | null;

  taxInfo?: {
    taxCode?: string;         
    taxAuthority?: string;    
    dependents?: number;    
  } | null;

  compensationInfo?: {
    baseSalary?: string;
    payFrequency?: string;
    bonusTarget?: string;
    nextReview?: string;
  } | null;

  contractInfo?: {
    type?: string;
    schedule?: string;
    startDate?: string;
    endDate?: string | null;
    noticePeriod?: string;
    probationPeriod?: string;
    fileName?: string;
    fileSize?: string;
    fileUrl?: string;
    uploadDate?: string;
  } | null;

  documents?: UserDocument[];
}