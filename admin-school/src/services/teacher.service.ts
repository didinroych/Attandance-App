import api from './api'
import type {
  SessionsResponse,
  FaceVerificationResponse,
} from '@/types/teacher.types'

class TeacherService {
  /**
   * Get teacher's sessions
   * GET /api/users/sessions/last?status=ongoing
   * Returns list of ongoing sessions for the logged-in teacher
   */
  async getOngoingSessions(): Promise<SessionsResponse> {
    const response = await api.get<SessionsResponse>('/api/users/sessions/last', {
      params: { status: 'ongoing' }
    })
    return response.data
  }

  /**
   * Verify student face and mark attendance
   * POST /api/teacher/sessions/:sessionId/verify-attendance
   * Uploads image for face recognition and auto-marks attendance
   */
  async verifyAttendance(sessionId: number, imageBlob: Blob): Promise<FaceVerificationResponse> {
    const formData = new FormData()
    formData.append('image', imageBlob, 'capture.jpg')

    const response = await api.post<FaceVerificationResponse>(
      `/api/teacher/sessions/${sessionId}/verify-attendance`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  }
}

export default new TeacherService()
