import { ref, computed } from 'vue'
import classService from '@/services/class.service'
import type { Class, ClassFormData, ClassDetailsResponse } from '@/types/class'
import type { PaginationMeta } from '@/types/user'

export const useClassManagement = () => {
  // State
  const classes = ref<Class[]>([])
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

  // Sorting and filtering
  const sortBy = ref<'name' | 'gradeLevel' | 'createdAt'>('name')
  const sortOrder = ref<'asc' | 'desc'>('asc')
  const searchQuery = ref('')

  // Computed
  const hasClasses = computed(() => classes.value.length > 0)
  const isEmpty = computed(() => !loading.value && !hasClasses.value)

  /**
   * Fetch classes with current filters
   */
  const fetchClasses = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await classService.getClasses({
        page: pagination.value.currentPage,
        limit: pagination.value.limit,
        search: searchQuery.value || undefined,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value
      })

      classes.value = response.classes
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch classes'
      classes.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    pagination.value.currentPage = page
    fetchClasses()
  }

  /**
   * Handle sort change
   */
  const handleSortChange = (sort: { key: string; order: 'asc' | 'desc' }) => {
    sortBy.value = sort.key as 'name' | 'gradeLevel' | 'createdAt'
    sortOrder.value = sort.order
    pagination.value.currentPage = 1 // Reset to first page on sort
    fetchClasses()
  }

  /**
   * Handle search
   */
  const handleSearch = (query: string) => {
    searchQuery.value = query
    pagination.value.currentPage = 1 // Reset to first page on search
    fetchClasses()
  }

  /**
   * Clear search and refresh
   */
  const clearSearch = () => {
    searchQuery.value = ''
    pagination.value.currentPage = 1
    fetchClasses()
  }

  /**
   * Refresh current page
   */
  const refresh = () => {
    fetchClasses()
  }

  /**
   * Create new class
   */
  const createClass = async (data: ClassFormData): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await classService.createClass(data)
      await refresh()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.errors || err.response?.data?.message || err.message || 'Failed to create class'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Update class
   */
  const updateClass = async (id: number, data: Partial<ClassFormData>): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await classService.updateClass(id, data)
      await refresh()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.errors || err.response?.data?.message || err.message || 'Failed to update class'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete class
   */
  const deleteClass = async (id: number, force: boolean = false): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await classService.deleteClass(id, force)
      await refresh()
      return true
    } catch (err: any) {
      // Extract meaningful error message
      const errorMessage = err.response?.data?.errors || err.response?.data?.message || err.message

      if (force) {
        error.value = `Sorry, the delete failed. ${errorMessage || 'Unable to delete class and its dependencies.'}`
      } else {
        error.value = errorMessage || 'Failed to delete class. The class may have students or schedules.'
      }
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Get class details by ID
   */
  const getClassById = async (id: number): Promise<ClassDetailsResponse | null> => {
    try {
      return await classService.getClassById(id)
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch class details'
      return null
    }
  }

  return {
    // State
    classes,
    loading,
    error,
    pagination,
    sortBy,
    sortOrder,
    searchQuery,

    // Computed
    hasClasses,
    isEmpty,

    // Methods
    fetchClasses,
    handlePageChange,
    handleSortChange,
    handleSearch,
    clearSearch,
    refresh,
    createClass,
    updateClass,
    deleteClass,
    getClassById
  }
}
