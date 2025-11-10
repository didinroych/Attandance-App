import { ref } from 'vue'
import academicPeriodService from '@/services/academicPeriod.service'
import type {
  AcademicPeriod,
  AcademicPeriodFormData,
  AcademicPeriodDetailsResponse,
  PaginationMeta
} from '@/types/academicPeriod'

export const useAcademicPeriodManagement = () => {
  const academicPeriods = ref<AcademicPeriod[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)
  const pagination = ref<PaginationMeta>({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false
  })
  const sortBy = ref<'name' | 'startDate' | 'endDate'>('startDate')
  const sortOrder = ref<'asc' | 'desc'>('desc')
  const searchQuery = ref('')

  let successTimeout: ReturnType<typeof setTimeout> | null = null

  const showSuccess = (message: string) => {
    successMessage.value = message
    error.value = null
    window.scrollTo({ top: 0, behavior: 'smooth' })

    // Auto-clear after 5 seconds
    if (successTimeout) clearTimeout(successTimeout)
    successTimeout = setTimeout(() => {
      successMessage.value = null
    }, 5000)
  }

  const clearMessages = () => {
    error.value = null
    successMessage.value = null
    if (successTimeout) clearTimeout(successTimeout)
  }

  const fetchAcademicPeriods = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await academicPeriodService.getAcademicPeriods({
        page: pagination.value.currentPage,
        limit: pagination.value.limit,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        search: searchQuery.value || undefined
      })

      academicPeriods.value = response.academicPeriods
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err.response?.data?.errors || err.response?.data?.message || err.message || 'Failed to fetch academic periods'
      academicPeriods.value = []
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      loading.value = false
    }
  }

  const createAcademicPeriod = async (data: AcademicPeriodFormData): Promise<boolean> => {
    try {
      loading.value = true
      clearMessages()

      await academicPeriodService.createAcademicPeriod(data)
      await refresh()
      showSuccess('Academic period created successfully')
      return true
    } catch (err: any) {
      error.value = err.response?.data?.errors || err.response?.data?.message || err.message || 'Failed to create academic period'
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return false
    } finally {
      loading.value = false
    }
  }

  const updateAcademicPeriod = async (
    id: number,
    data: Partial<AcademicPeriodFormData>
  ): Promise<boolean> => {
    try {
      loading.value = true
      clearMessages()

      await academicPeriodService.updateAcademicPeriod(id, data)
      await refresh()
      showSuccess('Academic period updated successfully')
      return true
    } catch (err: any) {
      error.value = err.response?.data?.errors || err.response?.data?.message || err.message || 'Failed to update academic period'
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteAcademicPeriod = async (id: number, force: boolean = false): Promise<boolean> => {
    try {
      loading.value = true
      clearMessages()

      await academicPeriodService.deleteAcademicPeriod(id, force)
      await refresh()
      showSuccess('Academic period deleted successfully')
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.errors || err.response?.data?.message || err.message

      if (force) {
        error.value = `Sorry, the delete failed. ${errorMessage || 'Unable to delete academic period and its related data.'}`
      } else {
        error.value = errorMessage || 'Failed to delete academic period. The period may be in use.'
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return false
    } finally {
      loading.value = false
    }
  }

  const getAcademicPeriodById = async (id: number): Promise<AcademicPeriodDetailsResponse | null> => {
    try {
      loading.value = true
      error.value = null

      return await academicPeriodService.getAcademicPeriodById(id)
    } catch (err: any) {
      error.value = err.response?.data?.errors || err.response?.data?.message || err.message || 'Failed to fetch academic period details'
      return null
    } finally {
      loading.value = false
    }
  }

  const handlePageChange = (page: number) => {
    pagination.value.currentPage = page
    fetchAcademicPeriods()
  }

  const handleSortChange = (sort: { key: string; order: 'asc' | 'desc' }) => {
    sortBy.value = sort.key as 'name' | 'startDate' | 'endDate'
    sortOrder.value = sort.order
    pagination.value.currentPage = 1
    fetchAcademicPeriods()
  }

  const handleSearch = (query: string) => {
    searchQuery.value = query
    pagination.value.currentPage = 1
    fetchAcademicPeriods()
  }

  const clearSearch = () => {
    searchQuery.value = ''
    pagination.value.currentPage = 1
    fetchAcademicPeriods()
  }

  const refresh = async () => {
    pagination.value.currentPage = 1
    await fetchAcademicPeriods()
  }

  return {
    academicPeriods,
    loading,
    error,
    successMessage,
    pagination,
    sortBy,
    sortOrder,
    searchQuery,
    fetchAcademicPeriods,
    createAcademicPeriod,
    updateAcademicPeriod,
    deleteAcademicPeriod,
    getAcademicPeriodById,
    handlePageChange,
    handleSortChange,
    handleSearch,
    clearSearch,
    refresh,
    clearMessages
  }
}
