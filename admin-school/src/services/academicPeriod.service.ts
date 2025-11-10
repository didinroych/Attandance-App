import api from './api'
import type {
  AcademicPeriod,
  AcademicPeriodFormData,
  AcademicPeriodListResponse,
  AcademicPeriodDetailsResponse,
  AcademicPeriodApiResponse,
  GetAcademicPeriodsParams
} from '@/types/academicPeriod'

class AcademicPeriodService {
  async getAcademicPeriods(params: GetAcademicPeriodsParams = {}): Promise<AcademicPeriodListResponse> {
    const queryParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
      sortBy: params.sortBy || 'startDate',
      sortOrder: params.sortOrder || 'desc'
    })

    if (params.search) {
      queryParams.append('search', params.search)
    }

    if (params.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString())
    }

    const response = await api.get<AcademicPeriodApiResponse<AcademicPeriodListResponse>>(
      `/admin/academic-periods?${queryParams.toString()}`
    )

    return response.data.data
  }

  async getAcademicPeriodById(id: number): Promise<AcademicPeriodDetailsResponse> {
    const response = await api.get<AcademicPeriodApiResponse<AcademicPeriodDetailsResponse>>(
      `/admin/academic-periods/${id}`
    )
    return response.data.data
  }

  async createAcademicPeriod(data: AcademicPeriodFormData): Promise<AcademicPeriod> {
    const response = await api.post<
      AcademicPeriodApiResponse<{ message: string; academicPeriod: AcademicPeriod }>
    >('/admin/academic-periods', data)
    return response.data.data.academicPeriod
  }

  async updateAcademicPeriod(
    id: number,
    data: Partial<AcademicPeriodFormData>
  ): Promise<AcademicPeriod> {
    const response = await api.patch<
      AcademicPeriodApiResponse<{ message: string; academicPeriod: AcademicPeriod }>
    >(`/admin/academic-periods/${id}`, data)
    return response.data.data.academicPeriod
  }

  async deleteAcademicPeriod(
    id: number,
    force: boolean = false
  ): Promise<{ message: string }> {
    const queryParams = force ? '?force=true' : ''
    const response = await api.delete<AcademicPeriodApiResponse<{ message: string }>>(
      `/admin/academic-periods/${id}${queryParams}`
    )
    return response.data.data
  }
}

export default new AcademicPeriodService()
