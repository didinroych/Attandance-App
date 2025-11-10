import api from './api'

interface DashboardStatistics {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalSubjects: number
}

interface DashboardResponse {
  data: DashboardStatistics
}

class DashboardService {
  async getStatistics(): Promise<DashboardStatistics> {
    const response = await api.get<DashboardResponse>('/admin/dashboard/statistics')
    return response.data.data
  }
}

export default new DashboardService()
