// Teacher Session Types
export type SessionStatus = 'scheduled' | 'ongoing' | 'completed' | 'finalized' | 'cancelled'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export type AttendanceMethod = 'face_recognition' | 'manual'

// Session data from API
export interface TeacherSession {
  sessionId: number
  className: string
  subject: string
  date: string
  startedAt: string
  startTime: string
  endTime: string
  room: string
  totalStudents: number
  status: SessionStatus
}

// Student info from face verification
export interface VerifiedStudent {
  id: number
  fullName: string
  studentId: string
  class: {
    id: number
    name: string
  }
}

// Attendance record
export interface AttendanceRecord {
  sessionId: number
  status: AttendanceStatus
  markedAt: string
}

// Face verification response
export interface FaceVerificationResponse {
  success: boolean
  message: string
  verified: boolean
  confidence?: number
  student?: VerifiedStudent
  attendance?: AttendanceRecord
}

// Recent attendance for UI display
export interface RecentAttendance {
  id: number
  name: string
  time: string
  confidence: number
}

// API response wrappers
export interface SessionsResponse {
  data: TeacherSession[]
}

export interface VerifyAttendanceRequest {
  image: Blob
  sessionId: number
}
