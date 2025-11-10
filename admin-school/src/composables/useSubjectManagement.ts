import { ref, computed } from 'vue'
import subjectService from '@/services/subject.service'
import type { Subject, SubjectFormData, PaginationMeta } from '@/types/subject'

export const useSubjectManagement = () => {
  // State
  const subjects = ref<Subject[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationMeta>({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // Sorting and filtering
  const sortBy = ref<'name' | 'code' | 'createdAt'>('name')
  const sortOrder = ref<'asc' | 'desc'>('asc')
  const searchQuery = ref('')

  // Computed
  const hasSubjects = computed(() => subjects.value.length > 0)
  const isEmpty = computed(() => !loading.value && !hasSubjects.value)

  /**
   * Fetch subjects with current filters
   */
  const fetchSubjects = async () => {
    try {
      loading.value = true
      error.value = null

      const response = await subjectService.getSubjects({
        page: pagination.value.currentPage,
        limit: pagination.value.limit,
        search: searchQuery.value || undefined,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value
      })

      subjects.value = response.subjects
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch subjects'
      subjects.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Handle page change
   */
  const handlePageChange = (page: number) => {
    pagination.value.currentPage = page
    fetchSubjects()
  }

  /**
   * Handle sort change
   */
  const handleSortChange = (sort: { key: string; order: 'asc' | 'desc' }) => {
    sortBy.value = sort.key as 'name' | 'code' | 'createdAt'
    sortOrder.value = sort.order
    pagination.value.currentPage = 1 // Reset to first page on sort
    fetchSubjects()
  }

  /**
   * Handle search
   */
  const handleSearch = (query: string) => {
    searchQuery.value = query
    pagination.value.currentPage = 1 // Reset to first page on search
    fetchSubjects()
  }

  /**
   * Clear search and refresh
   */
  const clearSearch = () => {
    searchQuery.value = ''
    pagination.value.currentPage = 1
    fetchSubjects()
  }

  /**
   * Refresh current page
   */
  const refresh = () => {
    fetchSubjects()
  }

  /**
   * Create new subject
   */
  const createSubject = async (data: SubjectFormData): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await subjectService.createSubject(data)
      await refresh()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to create subject'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Update subject
   */
  const updateSubject = async (id: number, data: Partial<SubjectFormData>): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await subjectService.updateSubject(id, data)
      await refresh()
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to update subject'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete subject
   */
  const deleteSubject = async (id: number, force: boolean = false): Promise<boolean> => {
    try {
      loading.value = true
      error.value = null
      await subjectService.deleteSubject(id, force)
      await refresh()
      return true
    } catch (err: any) {
      // Extract meaningful error message
      const errorMessage = err.response?.data?.errors || err.response?.data?.message || err.message

      if (force) {
        error.value = `Sorry, the delete failed. ${errorMessage || 'Unable to delete subject and its schedules.'}`
      } else {
        error.value = errorMessage || 'Failed to delete subject. The subject may be in use.'
      }
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Get subject details by ID
   */
  const getSubjectById = async (id: number) => {
    try {
      return await subjectService.getSubjectById(id)
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch subject details'
      return null
    }
  }

  return {
    // State
    subjects,
    loading,
    error,
    pagination,
    sortBy,
    sortOrder,
    searchQuery,

    // Computed
    hasSubjects,
    isEmpty,

    // Methods
    fetchSubjects,
    handlePageChange,
    handleSortChange,
    handleSearch,
    clearSearch,
    refresh,
    createSubject,
    updateSubject,
    deleteSubject,
    getSubjectById
  }
}
