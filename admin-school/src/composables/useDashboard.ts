import { ref, onMounted } from 'vue'
import dashboardService from '@/services/dashboard.service'

interface DashboardStatistics {
  totalStudents: number
  totalTeachers: number
  totalClasses: number
  totalSubjects: number
}

export function useDashboard() {
  const statistics = ref<DashboardStatistics>({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchStatistics = async () => {
    loading.value = true
    error.value = null
    try {
      const data = await dashboardService.getStatistics()
      statistics.value = data
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch dashboard statistics'
      console.error('Error fetching dashboard statistics:', err)
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    fetchStatistics()
  })

  return {
    statistics,
    loading,
    error,
    fetchStatistics,
  }
}
