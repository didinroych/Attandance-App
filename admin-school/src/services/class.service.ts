import api from './api'
import type {
  Class,
  ClassFormData,
  ClassListResponse,
  ClassDetailsResponse,
  ClassApiResponse,
  ClassMutationResponse,
  ClassDeleteResponse
} from '@/types/class'

export interface GetClassesParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: 'name' | 'gradeLevel' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

class ClassService {
  /**
   * Get list of classes with pagination and search
   * GET /admin/classes
   */
  async getClasses(params: GetClassesParams = {}): Promise<ClassListResponse> {
    const queryParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString(),
      sortBy: params.sortBy || 'name',
      sortOrder: params.sortOrder || 'asc'
    })

    if (params.search) {
      queryParams.append('search', params.search)
    }

    const response = await api.get<ClassApiResponse<ClassListResponse>>(
      `/admin/classes?${queryParams.toString()}`
    )
    return response.data.data
  }

  /**
   * Get class details by ID
   * GET /admin/classes/:id
   */
  async getClassById(id: number): Promise<ClassDetailsResponse> {
    const response = await api.get<ClassApiResponse<ClassDetailsResponse>>(
      `/admin/classes/${id}`
    )
    return response.data.data
  }

  /**
   * Create new class
   * POST /admin/classes
   */
  async createClass(data: ClassFormData): Promise<Class> {
    const response = await api.post<ClassApiResponse<ClassMutationResponse>>(
      '/admin/classes',
      data
    )
    return response.data.data.class
  }

  /**
   * Update existing class
   * PATCH /admin/classes/:id
   */
  async updateClass(id: number, data: Partial<ClassFormData>): Promise<Class> {
    const response = await api.patch<ClassApiResponse<ClassMutationResponse>>(
      `/admin/classes/${id}`,
      data
    )
    return response.data.data.class
  }

  /**
   * Delete class
   * DELETE /admin/classes/:id
   * @param force - Force delete even if has students or schedules
   */
  async deleteClass(id: number, force: boolean = false): Promise<ClassDeleteResponse> {
    const queryParams = force ? '?force=true' : ''
    const response = await api.delete<ClassApiResponse<ClassDeleteResponse>>(
      `/admin/classes/${id}${queryParams}`
    )
    return response.data.data
  }
}

export default new ClassService()
