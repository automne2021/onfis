import type { FullUserProfile } from "../../../types/userType"

export interface OverviewProps {
  icon?: React.ReactNode;
  userInfo: FullUserProfile;
}

export interface PersonalDetailsProps {
  icon?: React.ReactNode;
  userInfo: FullUserProfile;
  role?: string;
}

export interface DocumentsProps {
  userInfo: FullUserProfile;
}