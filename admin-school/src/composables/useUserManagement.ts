import { ref, computed } from 'vue'
import userManagementService from '@/services/userManagement.service'
import type {
  Student,
  Teacher,
  PaginationMeta,
  BulkCreateResult,
  StudentFormData,
  TeacherFormData
} from '@/types/user'

export function useUserManagement<T extends Student | Teacher>(
  role: 'student' | 'teacher'
) {
  // State
  const users = ref<T[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref<PaginationMeta>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false
  })

  // Sorting and filtering
  const sortBy = ref('createdAt')
  const sortOrder = ref<'asc' | 'desc'>('desc')
  const searchQuery = ref('')

  // Computed
  const hasUsers = computed(() => users.value.length > 0)
  const isEmpty = computed(() => !loading.value && users.value.length === 0)

  /**
   * Fetch users list
   */
  const fetchUsers = async (page: number = 1) => {
    loading.value = true
    error.value = null

    try {
      let response

      if (searchQuery.value.trim()) {
        // Search mode
        response = await userManagementService.searchUsers<T>({
          query: searchQuery.value,
          role,
          page,
          limit: pagination.value.limit
        })
      } else {
        // Normal list mode
        response = await userManagementService.getUsers<T>({
          role,
          page,
          limit: pagination.value.limit,
          sortBy: sortBy.value,
          sortOrder: sortOrder.value
        })
      }

      users.value = response.users
      pagination.value = response.pagination
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to fetch users'
      console.error('Error fetching users:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Handle page change
   */
  const handlePageChange = async (page: number) => {
    await fetchUsers(page)
  }

  /**
   * Handle sort change
   */
  const handleSortChange = async (sort: { key: string; order: 'asc' | 'desc' }) => {
    sortBy.value = sort.key
    sortOrder.value = sort.order
    await fetchUsers(1) // Reset to first page when sorting changes
  }

  /**
   * Handle search
   */
  const handleSearch = async (query: string) => {
    searchQuery.value = query
    await fetchUsers(1) // Reset to first page when searching
  }

  /**
   * Clear search
   */
  const clearSearch = async () => {
    searchQuery.value = ''
    await fetchUsers(1)
  }

  /**
   * Refresh current page
   */
  const refresh = async () => {
    await fetchUsers(pagination.value.currentPage)
  }

  /**
   * Delete user
   */
  const deleteUser = async (userId: number): Promise<boolean> => {
    try {
      await userManagementService.deleteUser(userId)
      await refresh() // Refresh the list after deletion
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to delete user'
      console.error('Error deleting user:', err)
      return false
    }
  }

  /**
   * Create a single user by using the bulk endpoint with a single-item array
   */
  const createUser = async (userData: StudentFormData | TeacherFormData): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      // Use bulk endpoint with single item array
      const result = await userManagementService.bulkCreateUsers([userData])

      // Check if creation was successful
      if (result && result.successCount > 0) {
        await fetchUsers(1) // Refresh list and go to first page
        return true
      } else {
        // Extract error message from bulk result
        const errorMsg = result?.errors?.[0] || 'Failed to create user'
        error.value = errorMsg
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to create user'
      console.error('Error creating user:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Bulk create users from CSV
   */
  const bulkCreateUsers = async (
    usersData: (StudentFormData | TeacherFormData)[]
  ): Promise<BulkCreateResult | null> => {
    loading.value = true
    error.value = null

    try {
      const result = await userManagementService.bulkCreateUsers(usersData)
      await fetchUsers(1) // Refresh list after bulk creation
      return result
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to create users'
      console.error('Error creating users:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update user status
   */
  const updateUserStatus = async (
    userId: number,
    isActive: boolean
  ): Promise<boolean> => {
    try {
      await userManagementService.updateUserStatus(userId, isActive)
      await refresh() // Refresh the list after status update
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to update user status'
      console.error('Error updating user status:', err)
      return false
    }
  }

  /**
   * Update user profile
   */
  const updateUser = async (
    userId: number,
    data: (StudentFormData | TeacherFormData) & { userId?: number }
  ): Promise<boolean> => {
    try {
      if (role === 'student') {
        await userManagementService.updateStudent(userId, data as Partial<StudentFormData>)
      } else {
        await userManagementService.updateTeacher(userId, data as Partial<TeacherFormData>)
      }
      await refresh() // Refresh the list after update
      return true
    } catch (err: any) {
      error.value = err.response?.data?.message || err.message || 'Failed to update user'
      console.error('Error updating user:', err)
      return false
    }
  }

  return {
    // State
    users,
    loading,
    error,
    pagination,
    sortBy,
    sortOrder,
    searchQuery,

    // Computed
    hasUsers,
    isEmpty,

    // Methods
    fetchUsers,
    handlePageChange,
    handleSortChange,
    handleSearch,
    clearSearch,
    refresh,
    deleteUser,
    createUser,
    bulkCreateUsers,
    updateUserStatus,
    updateUser
  }
}
