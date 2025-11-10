export interface Subject {
  id: number
  name: string
  code?: string
  description?: string
  createdAt: string
  scheduleCount?: number
  schedules?: SubjectSchedule[]
}

export interface SubjectSchedule {
  id: number
  className: string
  gradeLevel: number
  teacherName: string
  dayOfWeek: number
  startTime: string
  endTime: string
}

export interface SubjectFormData {
  name: string
  code?: string
  description?: string
}

export interface SubjectListResponse {
  subjects: Subject[]
  pagination: PaginationMeta
}

export interface SubjectDetailsResponse {
  id: number
  name: string
  code?: string
  description?: string
  createdAt: string
  scheduleCount: number
  schedules: SubjectSchedule[]
}

export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface SubjectApiResponse<T> {
  data: T
}
