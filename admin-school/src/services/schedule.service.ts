import api from './api'
import type {
  Schedule,
  ScheduleFormData,
  ScheduleListResponse,
  ScheduleDetailsResponse,
  ScheduleApiResponse,
  ScheduleMutationResponse,
  ScheduleDeleteResponse,
  ScheduleBulkItem,
  ScheduleBulkCreateResponse
} from '@/types/schedule'

export interface GetSchedulesParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'dayOfWeek' | 'class' | 'subject' | 'teacher' | 'startTime'
  sortOrder?: 'asc' | 'desc'
  classId?: number
  subjectId?: number
  teacherId?: number
  academicPeriodId?: number
}

class ScheduleService {
  /**
   * Get list of schedules with pagination, search, and filters
   * GET /admin/schedules
   */
  async getSchedules(params: GetSchedulesParams = {}): Promise<ScheduleListResponse> {
    const queryParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
      sortBy: params.sortBy || 'dayOfWeek',
      sortOrder: params.sortOrder || 'asc'
    })

    if (params.search) {
      queryParams.append('search', params.search)
    }
    if (params.classId) {
      queryParams.append('classId', params.classId.toString())
    }
    if (params.subjectId) {
      queryParams.append('subjectId', params.subjectId.toString())
    }
    if (params.teacherId) {
      queryParams.append('teacherId', params.teacherId.toString())
    }
    if (params.academicPeriodId) {
      queryParams.append('academicPeriodId', params.academicPeriodId.toString())
    }

    const response = await api.get<ScheduleApiResponse<ScheduleListResponse>>(
      `/admin/schedules?${queryParams.toString()}`
    )
    return response.data.data
  }

  /**
   * Get schedule details by ID
   * GET /admin/schedules/:id
   */
  async getScheduleById(id: number): Promise<ScheduleDetailsResponse> {
    const response = await api.get<ScheduleApiResponse<ScheduleDetailsResponse>>(
      `/admin/schedules/${id}`
    )
    return response.data.data
  }

  /**
   * Create new schedule
   * POST /admin/schedules
   */
  async createSchedule(data: ScheduleFormData): Promise<Schedule> {
    const response = await api.post<ScheduleApiResponse<ScheduleMutationResponse>>(
      '/admin/schedules',
      data
    )
    return response.data.data.schedule
  }

  /**
   * Update existing schedule
   * PATCH /admin/schedules/:id
   */
  async updateSchedule(id: number, data: Partial<ScheduleFormData>): Promise<Schedule> {
    const response = await api.patch<ScheduleApiResponse<ScheduleMutationResponse>>(
      `/admin/schedules/${id}`,
      data
    )
    return response.data.data.schedule
  }

  /**
   * Delete schedule
   * DELETE /admin/schedules/:id
   * @param softDelete - Soft delete (set isActive = false) instead of hard delete
   */
  async deleteSchedule(id: number, softDelete: boolean = true): Promise<ScheduleDeleteResponse> {
    const queryParams = softDelete ? '?softDelete=true' : ''
    const response = await api.delete<ScheduleApiResponse<ScheduleDeleteResponse>>(
      `/admin/schedules/${id}${queryParams}`
    )
    return response.data.data
  }

  /**
   * Bulk create schedules from CSV
   * POST /admin/schedules/bulk
   */
  async bulkCreateSchedules(schedules: ScheduleBulkItem[]): Promise<ScheduleBulkCreateResponse> {
    const response = await api.post<ScheduleApiResponse<ScheduleBulkCreateResponse>>(
      '/admin/schedules/bulk',
      { schedules }
    )
    return response.data.data
  }
}

export default new ScheduleService()
