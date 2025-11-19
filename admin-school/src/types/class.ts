import type { PaginationMeta } from './user'

// Class list item
export interface Class {
  id: number
  name: string
  gradeLevel: number
  schoolLevel: string
  academicPeriod: string
  homeroomTeacher: string | null
  studentCount: number
  scheduleCount: number
  createdAt: string
}

// Student in class details
export interface ClassStudent {
  id: number
  fullName: string
  studentId: string
}

// Schedule in class details
export interface ClassSchedule {
  id: number
  subject: string
  teacher: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

// Class details response
export interface ClassDetailsResponse {
  id: number
  name: string
  gradeLevel: number
  schoolLevel: string
  academicPeriod: {
    name: string
    startDate: string
    endDate: string
  }
  homeroomTeacher: {
    fullName: string
    email: string
  } | null
  studentCount: number
  scheduleCount: number
  students: ClassStudent[]
  schedules: ClassSchedule[]
  createdAt: string
}

// Form data for create/update
export interface ClassFormData {
  name: string
  schoolLevelId: number
  gradeLevel: number
  academicPeriodId: number
  homeroomTeacherId?: number | null
}

// API response wrapper
export interface ClassApiResponse<T> {
  data: T
}

// List response
export interface ClassListResponse {
  classes: Class[]
  pagination: PaginationMeta
}

// Create/Update response
export interface ClassMutationResponse {
  message: string
  class: Class
}

// Delete response
export interface ClassDeleteResponse {
  message: string
  classId: number
  className: string
  deletedStudents: number
  deletedSchedules: number
}

// School level for dropdown
export interface SchoolLevel {
  id: number
  name: string
  description?: string
}
