import type { PaginationMeta } from './user'

// Basic entities used in schedule
export interface ScheduleClass {
  id: number
  name: string
  gradeLevel: number
}

export interface ScheduleSubject {
  id: number
  name: string
  code: string
}

export interface ScheduleTeacher {
  id: number
  fullName: string
}

export interface ScheduleAcademicPeriod {
  id: number
  name: string
  startDate?: string
  endDate?: string
}

// Schedule list item
export interface Schedule {
  id: number
  class: ScheduleClass
  subject: ScheduleSubject
  teacher: ScheduleTeacher
  academicPeriod: ScheduleAcademicPeriod
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
  room: string
  isActive: boolean
  createdAt: string
}

// Schedule details response
export interface ScheduleDetailsResponse {
  id: number
  class: ScheduleClass
  subject: ScheduleSubject
  teacher: ScheduleTeacher
  academicPeriod: ScheduleAcademicPeriod
  dayOfWeek: number
  dayName: string
  startTime: string
  endTime: string
  room: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Form data for create/update
export interface ScheduleFormData {
  classId: number
  subjectId: number
  teacherId: number
  academicPeriodId: number
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string
  isActive?: boolean
}

// Bulk create item (for CSV upload)
export interface ScheduleBulkItem {
  classId: number
  className?: string
  subjectId: number
  subjectName?: string
  teacherId: number
  teacherName?: string
  academicPeriodId: number
  academicPeriodName?: string
  dayOfWeek: number
  dayName?: string
  startTime: string
  endTime: string
  room: string
  isValid?: boolean
  errors?: string[]
}

// API response wrapper
export interface ScheduleApiResponse<T> {
  data: T
}

// List response
export interface ScheduleListResponse {
  schedules: Schedule[]
  pagination: PaginationMeta
}

// Create/Update response
export interface ScheduleMutationResponse {
  message: string
  schedule: Schedule
}

// Delete response
export interface ScheduleDeleteResponse {
  message: string
  scheduleId: number
  deleted: boolean
}

// Bulk create response
export interface ScheduleBulkCreateResponse {
  message: string
  count: number
  schedules: number[]
}

// Filter options for schedule list
export interface ScheduleFilters {
  classId?: number
  subjectId?: number
  teacherId?: number
  academicPeriodId?: number
  search?: string
}

// Day of week options
export interface DayOfWeekOption {
  value: number
  label: string
}

export const DAYS_OF_WEEK: DayOfWeekOption[] = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' }
]
