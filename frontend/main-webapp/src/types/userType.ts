export interface UserProfile {
  id: string | number
  name: string
  position: string
  department: string
  email: string
  phone?: string
  location?: string
  avatarUrl?: string
}