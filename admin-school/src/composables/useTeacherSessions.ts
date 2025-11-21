import { ref } from 'vue'
import teacherService from '@/services/teacher.service'
import type {
  TeacherSession,
  FaceVerificationResponse,
  RecentAttendance
} from '@/types/teacher.types'

export function useTeacherSessions() {
  const sessions = ref<TeacherSession[]>([])
  const selectedSession = ref<number | null>(null)
  const recentAttendance = ref<RecentAttendance[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch ongoing sessions for the teacher
   */
  const fetchOngoingSessions = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null

      const response = await teacherService.getOngoingSessions()
      sessions.value = response.data || []
    } catch (err: any) {
      console.error('Error fetching sessions:', err)
      error.value = err.message || 'Failed to fetch sessions'
      sessions.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Verify student face and mark attendance
   */
  const verifyAndMarkAttendance = async (
    imageBlob: Blob
  ): Promise<FaceVerificationResponse | null> => {
    if (!selectedSession.value) {
      error.value = 'Please select a session first'
      console.warn('⚠️ No session selected')
      return null
    }

    try {
      error.value = null

      console.log('📸 [verifyAndMarkAttendance] Starting verification...')
      console.log('   Session ID:', selectedSession.value)
      console.log('   Image size:', imageBlob.size, 'bytes')
      console.log('   Image type:', imageBlob.type)

      const result = await teacherService.verifyAttendance(
        selectedSession.value,
        imageBlob
      )

      console.log('✅ [verifyAndMarkAttendance] API Response:', result)

      // If successful, add to recent attendance list
      if (result.success && result.student) {
        console.log('🎉 [verifyAndMarkAttendance] Success! Student:', result.student.fullName)

        const newAttendance: RecentAttendance = {
          id: Date.now(),
          name: result.student.fullName,
          time: new Date().toLocaleTimeString(),
          confidence: result.confidence || 0
        }

        // Keep only last 10 attendance records
        recentAttendance.value = [newAttendance, ...recentAttendance.value].slice(0, 10)
      } else {
        console.log('❌ [verifyAndMarkAttendance] Verification failed:', result.message)
      }

      return result
    } catch (err: any) {
      console.error('💥 [verifyAndMarkAttendance] Error:', err)
      console.error('   Error details:', {
        message: err.message,
        status: err.status,
        data: err.data
      })
      error.value = err.message || 'Network error. Please try again.'
      return null
    }
  }

  /**
   * Clear recent attendance list
   */
  const clearRecentAttendance = (): void => {
    recentAttendance.value = []
  }

  /**
   * Set selected session
   */
  const setSelectedSession = (sessionId: number | null): void => {
    selectedSession.value = sessionId
  }

  return {
    sessions,
    selectedSession,
    recentAttendance,
    isLoading,
    error,
    fetchOngoingSessions,
    verifyAndMarkAttendance,
    clearRecentAttendance,
    setSelectedSession
  }
}
