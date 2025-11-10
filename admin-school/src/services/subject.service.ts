import api from './api'
import type {
  Subject,
  SubjectFormData,
  SubjectListResponse,
  SubjectDetailsResponse,
  SubjectApiResponse
} from '@/types/subject'

export interface GetSubjectsParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'name' | 'code' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

class SubjectService {
  /**
   * Get list of subjects with pagination and search
   * GET /admin/subjects
   */
  async getSubjects(params: GetSubjectsParams = {}): Promise<SubjectListResponse> {
    const queryParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
      sortBy: params.sortBy || 'name',
      sortOrder: params.sortOrder || 'asc'
    })

    if (params.search) {
      queryParams.append('search', params.search)
    }

    const response = await api.get<SubjectApiResponse<SubjectListResponse>>(
      `/admin/subjects?${queryParams.toString()}`
    )
    return response.data.data
  }

  /**
   * Get subject details by ID
   * GET /admin/subjects/:id
   */
  async getSubjectById(id: number): Promise<SubjectDetailsResponse> {
    const response = await api.get<SubjectApiResponse<SubjectDetailsResponse>>(
      `/admin/subjects/${id}`
    )
    return response.data.data
  }

  /**
   * Create new subject
   * POST /admin/subjects
   */
  async createSubject(data: SubjectFormData): Promise<Subject> {
    const response = await api.post<SubjectApiResponse<{ message: string; subject: Subject }>>(
      '/admin/subjects',
      data
    )
    return response.data.data.subject
  }

  /**
   * Update existing subject
   * PATCH /admin/subjects/:id
   */
  async updateSubject(id: number, data: Partial<SubjectFormData>): Promise<Subject> {
    const response = await api.patch<SubjectApiResponse<{ message: string; subject: Subject }>>(
      `/admin/subjects/${id}`,
      data
    )
    return response.data.data.subject
  }

  /**
   * Delete subject
   * DELETE /admin/subjects/:id
   * @param force - Force delete even if used in schedules
   */
  async deleteSubject(
    id: number,
    force: boolean = false
  ): Promise<{ message: string; subjectId: number; subjectName: string; deletedSchedules: number }> {
    const queryParams = force ? '?force=true' : ''
    const response = await api.delete<
      SubjectApiResponse<{
        message: string
        subjectId: number
        subjectName: string
        deletedSchedules: number
      }>
    >(`/admin/subjects/${id}${queryParams}`)
    return response.data.data
  }
}

export default new SubjectService()
