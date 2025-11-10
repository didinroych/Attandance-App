export interface AcademicPeriod {
  id: number
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  classCount?: number
  scheduleCount?: number
}

export interface AcademicPeriodFormData {
  name: string
  startDate: string
  endDate: string
  isActive?: boolean
}

export interface AcademicPeriodDetailsResponse {
  id: number
  name: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  classCount: number
  scheduleCount: number
  classes?: Array<{
    id: number
    name: string
    gradeLevel: number
    schoolLevel: string
  }>
}

export interface AcademicPeriodListResponse {
  academicPeriods: AcademicPeriod[]
  pagination: PaginationMeta
}

export interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface AcademicPeriodApiResponse<T> {
  data: T
}

export interface GetAcademicPeriodsParams {
  page?: number
  limit?: number
  sortBy?: 'name' | 'startDate' | 'endDate'
  sortOrder?: 'asc' | 'desc'
  search?: string
  isActive?: boolean
}
