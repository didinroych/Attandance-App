import { ref, computed } from 'vue'
import scheduleService from '@/services/schedule.service'
import type { Schedule, ScheduleFormData, ScheduleDetailsResponse, ScheduleBulkItem } from '@/types/schedule'
import type { PaginationMeta } from '@/types/user'

export const useScheduleManagement = () => {
  // State
  const schedules = ref<Schedule[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationMeta>({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // Sorting, filtering, and search
  const sortBy = ref<'dayOfWeek' | 'class' | 'subject' | 'teacher' | 'startTime'>('dayOfWeek')
  const sortOrder = ref<'asc' | 'desc'>('asc')
  const searchQuery = ref('')

  // Filters
  const classIdFilter = ref<number | undefined>(undefined)
  const subjectIdFilter = ref<number | undefined>(undefined)
  const teacherIdFilter = ref<number | undefined>(undefined)
  const academicPeriodIdFilter = ref<number | undefined>(undefined)

  // Computed
  const hasSchedules = computed(() => schedules.value.length > 0)
  const isEmpty = computed(() => !loading.value && !hasSchedules.value)
  const hasActiveFilters = computed(() => {
    return !!(classIdFilter.value || subjectIdFilter.value || teacherIdFilter.value || academicPeriodIdFilter.value)
  })

  /**
   * Fetch schedules with current filters
   */
  const fetchSchedules = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await scheduleService.getSchedules({
        page: pagination.value.currentPage,
        limit: pagination.value.limit,
        search: searchQuery.value || undefined,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
        classId: classIdFilter.value,
        subjectId: subjectIdFilter.value,
        teacherId: teacherIdFilter.value,
        academicPeriodId: academicPeriodIdFilter.value
      })

      schedules.value = response.schedules
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch schedules'
      schedules.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    pagination.value.currentPage = page
    fetchSchedules()
  }

  /**
   * Handle limit change
   */
  const handleLimitChange = (limit: number) => {
    pagination.value.limit = limit
    pagination.value.currentPage = 1
    fetchSchedules()
  }

  /**
   * Handle sort change
   */
  const handleSortChange = (sort: { key: string; order: 'asc' | 'desc' }) => {
    sortBy.value = sort.key as 'dayOfWeek' | 'class' | 'subject' | 'teacher' | 'startTime'
    sortOrder.value = sort.order
    pagination.value.currentPage = 1 // Reset to first page on sort
    fetchSchedules()
  }

  /**
   * Handle search
   */
  const handleSearch = (query: string) => {
    searchQuery.value = query
    pagination.value.currentPage = 1 // Reset to first page on search
    fetchSchedules()
  }

  /**
   * Clear search and refresh
   */
  const clearSearch = () => {
    searchQuery.value = ''
    pagination.value.currentPage = 1
    fetchSchedules()
  }

  /**
   * Apply filters
   */
  const applyFilters = (filters: {
    classId?: number
    subjectId?: number
    teacherId?: number
    academicPeriodId?: number
  }) => {
    classIdFilter.value = filters.classId
    subjectIdFilter.value = filters.subjectId
    teacherIdFilter.value = filters.teacherId
    academicPeriodIdFilter.value = filters.academicPeriodId
    pagination.value.currentPage = 1 // Reset to first page on filter
    fetchSchedules()
  }

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    classIdFilter.value = undefined
    subjectIdFilter.value = undefined
    teacherIdFilter.value = undefined
    academicPeriodIdFilter.value = undefined
    pagination.value.currentPage = 1
    fetchSchedules()
  }

  /**
   * Refresh current page
   */
  const refresh = () => {
    fetchSchedules()
  }

  /**
   * Create new schedule
   */
  const createSchedule = async (data: ScheduleFormData): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await scheduleService.createSchedule(data)
      await refresh()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.errors || err.response?.data?.message || err.message || 'Failed to create schedule'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Update schedule
   */
  const updateSchedule = async (id: number, data: Partial<ScheduleFormData>): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await scheduleService.updateSchedule(id, data)
      await refresh()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.errors || err.response?.data?.message || err.message || 'Failed to update schedule'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete schedule
   */
  const deleteSchedule = async (id: number, softDelete: boolean = true): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await scheduleService.deleteSchedule(id, softDelete)
      await refresh()
      return true
    } catch (err: any) {
      const errorMessage = err.response?.data?.errors || err.response?.data?.message || err.message

      if (softDelete) {
        error.value = errorMessage || 'Failed to deactivate schedule.'
      } else {
        error.value = errorMessage || 'Failed to delete schedule. The schedule may have active sessions.'
      }
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Get schedule details by ID
   */
  const getScheduleById = async (id: number): Promise<ScheduleDetailsResponse | null> => {
    try {
      return await scheduleService.getScheduleById(id)
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch schedule details'
      return null
    }
  }

  /**
   * Bulk create schedules
   */
  const bulkCreateSchedules = async (schedules: ScheduleBulkItem[]): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await scheduleService.bulkCreateSchedules(schedules)
      await refresh()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.errors || err.response?.data?.message || err.message || 'Failed to bulk create schedules'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    // State
    schedules,
    loading,
    error,
    pagination,
    sortBy,
    sortOrder,
    searchQuery,
    classIdFilter,
    subjectIdFilter,
    teacherIdFilter,
    academicPeriodIdFilter,

    // Computed
    hasSchedules,
    isEmpty,
    hasActiveFilters,

    // Methods
    fetchSchedules,
    handlePageChange,
    handleLimitChange,
    handleSortChange,
    handleSearch,
    clearSearch,
    applyFilters,
    clearFilters,
    refresh,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getScheduleById,
    bulkCreateSchedules
  }
}
