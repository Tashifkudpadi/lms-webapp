export type UserRole = "admin" | "faculty" | "student"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}
