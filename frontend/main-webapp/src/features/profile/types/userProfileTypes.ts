import type { FullUserProfile } from "../../../types/userType"

export interface OverviewProps {
  icon?: React.ReactNode;
  userInfo: FullUserProfile;
}

export interface DocumentsProps {
  userInfo: FullUserProfile;
}