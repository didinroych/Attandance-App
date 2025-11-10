export type UserRole = 'admin' | 'teacher' | 'student'

export interface User {
  id: number
  username: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Student {
  id: number
  userId: number
  studentId: string
  fullName: string
  classId: number
  phone?: string
  address?: string
  dateOfBirth?: string
  parentPhone?: string
  enrollmentDate?: string
  createdAt: string
  user?: User
  class?: {
    id: number
    name: string
    gradeLevel: number
  }
}

export interface Teacher {
  id: number
  userId: number
  teacherId: string
  fullName: string
  phone?: string
  address?: string
  hireDate?: string
  createdAt: string
  user?: User
}

export interface StudentFormData {
  username: string
  email: string
  password: string
  role: 'student'
  studentId: string
  fullName: string
  classId: number
  phone?: string
  address?: string
  dateOfBirth?: string
  parentPhone?: string
  enrollmentDate?: string
}

export interface TeacherFormData {
  username: string
  email: string
  password: string
  role: 'teacher'
  teacherId: string
  fullName: string
  phone?: string
  address?: string
  hireDate?: string
}

export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface UserListResponse<T> {
  users: T[]
  pagination: PaginationMeta
}

export interface BulkCreateResult {
  message: string
  totalProcessed: number
  successCount: number
  failedCount: number
  results: {
    success: Array<{
      index: number
      username: string
      email: string
      role: UserRole
      userId: number
      profileId: number
    }>
    failed: Array<{
      index: number
      username: string
      email: string
      error: string
    }>
  }
}

export interface CSVValidationError {
  row: number
  field: string
  message: string
}

export interface ParsedCSVData<T> {
  data: T[]
  errors: CSVValidationError[]
  isValid: boolean
}
