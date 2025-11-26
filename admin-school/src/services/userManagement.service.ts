import api from './api'
import type {
  Student,
  Teacher,
  UserListResponse,
  BulkCreateResult,
  StudentFormData,
  TeacherFormData,
  UserRole
} from '@/types/user'

interface GetUsersParams {
  role: 'student' | 'teacher'
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface SearchUsersParams {
  query: string
  role: 'student' | 'teacher'
  page?: number
  limit?: number
}

class UserManagementService {
  /**
   * Transform backend response to frontend format
   */
  private transformUser(backendUser: any, role: 'student' | 'teacher'): Student | Teacher {
    const profile = backendUser.profile

    if (role === 'student') {
      return {
        id: profile?.id,
        userId: backendUser.userId,
        studentId: profile?.studentId,
        fullName: profile?.fullName,
        classId: profile?.classId,
        phone: profile?.phone,
        address: profile?.address,
        dateOfBirth: profile?.dateOfBirth,
        parentPhone: profile?.parentPhone,
        enrollmentDate: profile?.enrollmentDate,
        createdAt: backendUser.createdAt,
        user: {
          id: backendUser.userId,
          username: backendUser.username,
          email: backendUser.email,
          role: backendUser.role,
          isActive: backendUser.isActive,
          createdAt: backendUser.createdAt,
          updatedAt: backendUser.createdAt
        },
        class: profile?.class
      } as Student
    } else {
      return {
        id: profile?.id,
        userId: backendUser.userId,
        teacherId: profile?.teacherId,
        fullName: profile?.fullName,
        phone: profile?.phone,
        address: profile?.address,
        hireDate: profile?.hireDate,
        createdAt: backendUser.createdAt,
        user: {
          id: backendUser.userId,
          username: backendUser.username,
          email: backendUser.email,
          role: backendUser.role,
          isActive: backendUser.isActive,
          createdAt: backendUser.createdAt,
          updatedAt: backendUser.createdAt
        }
      } as Teacher
    }
  }

  /**
   * Get list of users (students or teachers) with pagination
   */
  async getUsers<T = Student | Teacher>(
    params: GetUsersParams
  ): Promise<UserListResponse<T>> {
    const queryParams = new URLSearchParams({
      role: params.role,
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc'
    })

    const response = await api.get(`/admin/users?${queryParams.toString()}`)
    const backendData = response.data.data

    console.log('Backend response:', { backendData, hasUsers: !!backendData?.users, usersLength: backendData?.users?.length })

    // Handle empty or undefined users array
    if (!backendData) {
      console.log('No backend data')
      return {
        users: [] as T[],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          limit: params.limit || 10,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }
    }

    // Handle empty users array (valid response but no data)
    if (!Array.isArray(backendData.users)) {
      console.log('Users is not an array')
      return {
        users: [] as T[],
        pagination: backendData.pagination || {
          currentPage: params.page || 1,
          totalPages: 0,
          totalCount: 0,
          limit: params.limit || 10,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }
    }

    if (backendData.users.length === 0) {
      console.log('Users array is empty')
      return {
        users: [] as T[],
        pagination: backendData.pagination || {
          currentPage: params.page || 1,
          totalPages: 0,
          totalCount: 0,
          limit: params.limit || 10,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }
    }

    console.log('Transforming users:', backendData.users.length)
    // Transform users
    const transformedUsers = backendData.users.map((user: any) =>
      this.transformUser(user, params.role)
    ) as T[]

    console.log('Transformed users:', transformedUsers.length)
    return {
      users: transformedUsers,
      pagination: backendData.pagination
    }
  }

  /**
   * Search users by query string
   */
  async searchUsers<T = Student | Teacher>(
    params: SearchUsersParams
  ): Promise<UserListResponse<T>> {
    const queryParams = new URLSearchParams({
      query: params.query,
      role: params.role,
      page: (params.page || 1).toString(),
      limit: (params.limit || 20).toString()
    })

    const response = await api.get(
      `/admin/users/search?${queryParams.toString()}`
    )
    const backendData = response.data.data

    console.log('Search backend response:', { backendData, hasResults: !!backendData?.results, resultsLength: backendData?.results?.length })

    // Handle empty or undefined response
    if (!backendData) {
      return {
        users: [] as T[],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          limit: params.limit || 20,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }
    }

    // Backend search endpoint returns 'results' instead of 'users'
    const resultsArray = backendData.results || backendData.users

    // Handle empty results array (valid response but no data)
    if (!Array.isArray(resultsArray) || resultsArray.length === 0) {
      return {
        users: [] as T[],
        pagination: backendData.pagination || {
          currentPage: params.page || 1,
          totalPages: 0,
          totalCount: 0,
          limit: params.limit || 20,
          hasNextPage: false,
          hasPreviousPage: false
        }
      }
    }

    console.log('Transforming search results:', resultsArray.length)
    // Transform users
    const transformedUsers = resultsArray.map((user: any) =>
      this.transformUser(user, params.role)
    ) as T[]

    console.log('Transformed search results:', transformedUsers.length)
    return {
      users: transformedUsers,
      pagination: backendData.pagination
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: number): Promise<void> {
    await api.delete(`/admin/users/${userId}`)
  }

  /**
   * Create a single user (student or teacher)
   */
  async createUser(userData: StudentFormData | TeacherFormData): Promise<void> {
    await api.post('/admin/users', userData)
  }

  /**
   * Bulk create users from CSV data
   */
  async bulkCreateUsers(
    users: (StudentFormData | TeacherFormData)[]
  ): Promise<BulkCreateResult> {
    const response = await api.post('/admin/users/bulk', { users })
    return response.data.data
  }

  /**
   * Update user status (activate/deactivate)
   */
  async updateUserStatus(
    userId: number,
    isActive: boolean
  ): Promise<void> {
    await api.patch(`/admin/users/${userId}/status`, { isActive })
  }

  /**
   * Update student profile
   */
  async updateStudent(userId: number, data: Partial<StudentFormData>): Promise<void> {
    await api.patch(`/admin/users/${userId}`, data)
  }

  /**
   * Update teacher profile
   */
  async updateTeacher(userId: number, data: Partial<TeacherFormData>): Promise<void> {
    await api.patch(`/admin/users/${userId}`, data)
  }
}

export default new UserManagementService()
