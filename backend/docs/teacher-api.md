# Teacher API Documentation

## Overview
Teacher endpoints provide functionality for managing class sessions, viewing schedules, marking attendance, and exporting attendance reports. All endpoints require teacher role authentication.

## Base URL
All endpoints are prefixed with `/teacher` or `/api/teacher`

## Authentication
All endpoints require:
- **Authorization Header:** `Bearer <access_token>`
- **Required Role:** `teacher` (some endpoints also allow `admin`)

---

## Session Management

### 1. Create Session

**Endpoint:** `POST /teacher/sessions`

**Description:** Create a new class session for a scheduled class.

**Authentication:** Required (Teacher only)

**Request Body:**
```json
{
  "classScheduleId": "integer (required)",
  "date": "string (YYYY-MM-DD, required)",
  "notes": "string (optional)"
}
```

**Example Request:**
```json
{
  "classScheduleId": 45,
  "date": "2024-01-15",
  "notes": "Chapter 5: Algebra fundamentals"
}
```

**Success Response:**
- **Status Code:** `201 Created`
- **Response Body:**
```json
{
  "data": {
    "id": 234,
    "classScheduleId": 45,
    "teacherId": 8,
    "date": "2024-01-15",
    "status": "scheduled",
    "notes": "Chapter 5: Algebra fundamentals",
    "createdAt": "2024-01-15T07:30:00.000Z",
    "schedule": {
      "id": 45,
      "className": "Class 10A",
      "subjectName": "Mathematics",
      "startTime": "08:00:00",
      "endTime": "09:30:00",
      "room": "Room 301"
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid input data
```json
{
  "errors": "Invalid session data"
}
```
- **403 Forbidden:** User is not a teacher
```json
{
  "errors": "Only teachers can create sessions"
}
```
- **404 Not Found:** Schedule not found
```json
{
  "errors": "Class schedule not found"
}
```
- **409 Conflict:** Session already exists for this date
```json
{
  "errors": "Session already exists for this schedule on this date"
}
```

---

### 2. Get Session Details

**Endpoint:** `GET /teacher/sessions/:id`

**Description:** Get detailed information about a specific session including attendance data.

**Authentication:** Required (Teacher only)

**URL Parameters:**
- `id` - Session ID (integer, required)

**Example Request:**
```
GET /teacher/sessions/234
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "id": 234,
    "classScheduleId": 45,
    "teacherId": 8,
    "date": "2024-01-15",
    "status": "completed",
    "notes": "Chapter 5: Algebra fundamentals",
    "createdAt": "2024-01-15T07:30:00.000Z",
    "schedule": {
      "id": 45,
      "className": "Class 10A",
      "subjectName": "Mathematics",
      "startTime": "08:00:00",
      "endTime": "09:30:00",
      "room": "Room 301"
    },
    "attendance": {
      "totalStudents": 40,
      "present": 38,
      "absent": 2,
      "attendanceRate": 95,
      "students": [
        {
          "studentId": 15,
          "studentName": "John Doe",
          "status": "present",
          "checkInTime": "2024-01-15T08:05:00.000Z"
        },
        {
          "studentId": 16,
          "studentName": "Jane Smith",
          "status": "absent",
          "checkInTime": null
        }
      ]
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid session ID
```json
{
  "errors": "Invalid session ID"
}
```
- **403 Forbidden:** User is not a teacher or not authorized
```json
{
  "errors": "Only teachers can view session details"
}
```
- **404 Not Found:** Session not found
```json
{
  "errors": "Session not found"
}
```

---

### 3. Get Sessions List by Schedule

**Endpoint:** `GET /teacher/schedule/:scheduleId/sessions`

**Description:** Get all sessions for a specific class schedule.

**Authentication:** Required (Teacher only)

**URL Parameters:**
- `scheduleId` - Class Schedule ID (integer, required)

**Example Request:**
```
GET /teacher/schedule/45/sessions
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "scheduleId": 45,
    "className": "Class 10A",
    "subjectName": "Mathematics",
    "sessions": [
      {
        "id": 234,
        "date": "2024-01-15",
        "status": "completed",
        "attendanceRate": 95,
        "notes": "Chapter 5: Algebra fundamentals"
      },
      {
        "id": 235,
        "date": "2024-01-17",
        "status": "ongoing",
        "attendanceRate": 92.5,
        "notes": "Chapter 5 continued"
      },
      {
        "id": 236,
        "date": "2024-01-22",
        "status": "scheduled",
        "attendanceRate": null,
        "notes": null
      }
    ],
    "statistics": {
      "totalSessions": 3,
      "completedSessions": 1,
      "ongoingSessions": 1,
      "scheduledSessions": 1,
      "averageAttendanceRate": 93.75
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid class schedule ID
```json
{
  "errors": "Invalid class schedule ID"
}
```
- **403 Forbidden:** Not authorized
```json
{
  "errors": "Only teachers can view sessions list"
}
```

---

### 4. Update Session Status

**Endpoint:** `PATCH /teacher/sessions/:id/status`

**Description:** Update the status of a session (scheduled, ongoing, completed, cancelled).

**Authentication:** Required (Teacher only)

**URL Parameters:**
- `id` - Session ID (integer, required)

**Request Body:**
```json
{
  "status": "string (ongoing | completed | cancelled, required)"
}
```

**Example Request:**
```json
{
  "status": "completed"
}
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "id": 234,
    "status": "completed",
    "updatedAt": "2024-01-15T09:35:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid session ID or status
```json
{
  "errors": "Invalid session status"
}
```
- **403 Forbidden:** Not authorized
```json
{
  "errors": "Only teachers can update session status"
}
```

**Note:** Sessions are automatically marked as "completed" after 1 day.

---

## Schedule Management

### 5. Get Teacher Schedules

**Endpoint:** `GET /api/teacher/schedules`

**Description:** Get all schedules for the authenticated teacher.

**Authentication:** Required (Teacher or Admin)

**Query Parameters:**
```
teacherId: integer (optional, admin only) - Get schedules for specific teacher
academicPeriodId: integer (optional) - Filter by academic period
isActive: boolean (optional) - Filter by active/inactive schedules
```

**Example Request:**
```
GET /api/teacher/schedules?academicPeriodId=2&isActive=true
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "teacherId": 8,
    "teacherName": "John Smith",
    "schedules": [
      {
        "id": 45,
        "classId": 5,
        "className": "Class 10A",
        "subjectId": 12,
        "subjectName": "Mathematics",
        "academicPeriodId": 2,
        "academicPeriod": "2024 Semester 1",
        "dayOfWeek": 1,
        "dayName": "Monday",
        "startTime": "08:00:00",
        "endTime": "09:30:00",
        "room": "Room 301",
        "isActive": true
      },
      {
        "id": 46,
        "classId": 6,
        "className": "Class 10B",
        "subjectId": 12,
        "subjectName": "Mathematics",
        "academicPeriodId": 2,
        "academicPeriod": "2024 Semester 1",
        "dayOfWeek": 1,
        "dayName": "Monday",
        "startTime": "09:45:00",
        "endTime": "11:15:00",
        "room": "Room 302",
        "isActive": true
      }
    ]
  }
}
```

**Error Responses:**
- **403 Forbidden:** Not authorized
```json
{
  "errors": "Only teachers and admins can view teacher schedules"
}
```

---

## Attendance Management

### 6. Mark Attendance

**Endpoint:** `POST /api/teacher/sessions/:sessionId/attendance`

**Description:** Mark attendance for students in a session.

**Authentication:** Required (Teacher only)

**URL Parameters:**
- `sessionId` - Session ID (integer, required)

**Request Body:**
```json
{
  "attendances": [
    {
      "studentId": "integer (required)",
      "status": "string (present | absent | late | excused, required)",
      "notes": "string (optional)"
    }
  ]
}
```

**Example Request:**
```json
{
  "attendances": [
    {
      "studentId": 15,
      "status": "present",
      "notes": null
    },
    {
      "studentId": 16,
      "status": "absent",
      "notes": "Sick leave"
    },
    {
      "studentId": 17,
      "status": "late",
      "notes": "Arrived 15 minutes late"
    }
  ]
}
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "sessionId": 234,
    "marked": 3,
    "summary": {
      "present": 1,
      "absent": 1,
      "late": 1,
      "excused": 0
    },
    "attendances": [
      {
        "id": 1001,
        "studentId": 15,
        "status": "present",
        "markedAt": "2024-01-15T08:10:00.000Z"
      },
      {
        "id": 1002,
        "studentId": 16,
        "status": "absent",
        "markedAt": "2024-01-15T08:10:00.000Z"
      },
      {
        "id": 1003,
        "studentId": 17,
        "status": "late",
        "markedAt": "2024-01-15T08:10:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid session ID or attendance data
```json
{
  "errors": "Invalid session ID"
}
```
- **403 Forbidden:** Not authorized
```json
{
  "errors": "Only teachers can mark attendance"
}
```
- **404 Not Found:** Session not found
```json
{
  "errors": "Session not found"
}
```

---

### 7. Export Attendance Report

**Endpoint:** `GET /api/teacher/attendance/report/export`

**Description:** Export attendance report for a class within a date range.

**Authentication:** Required (Teacher or Admin)

**Query Parameters:**
```
classId: integer (required) - Class ID
startDate: string (YYYY-MM-DD, required) - Start date
endDate: string (YYYY-MM-DD, required) - End date
format: string (json | csv, default: json) - Export format
```

**Example Request:**
```
GET /api/teacher/attendance/report/export?classId=5&startDate=2024-01-01&endDate=2024-01-31&format=json
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body (JSON format):**
```json
{
  "data": {
    "classId": 5,
    "className": "Class 10A",
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "students": [
      {
        "studentId": 15,
        "studentName": "John Doe",
        "totalSessions": 45,
        "present": 42,
        "absent": 2,
        "late": 1,
        "excused": 0,
        "attendanceRate": 93.3
      },
      {
        "studentId": 16,
        "studentName": "Jane Smith",
        "totalSessions": 45,
        "present": 40,
        "absent": 4,
        "late": 1,
        "excused": 0,
        "attendanceRate": 88.9
      }
    ],
    "summary": {
      "totalStudents": 40,
      "totalSessions": 45,
      "averageAttendanceRate": 87.5
    }
  }
}
```

**Error Responses:**
- **400 Bad Request:** Missing required parameters
```json
{
  "errors": "Class ID is required"
}
```
- **403 Forbidden:** Not authorized
```json
{
  "errors": "Only teachers and admins can export reports"
}
```

---

## Common Error Codes

| Status Code | Description |
|------------|-------------|
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - User is not a teacher or not authorized |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict (e.g., duplicate session) |
| 500 | Internal Server Error - Server-side error |

---

## Notes

1. **Authentication:** All endpoints require a valid JWT access token with teacher role
2. **Authorization Header Format:** `Authorization: Bearer <access_token>`
3. **Session Status Lifecycle:** scheduled → ongoing → completed (or cancelled)
4. **Auto-completion:** Sessions are automatically marked as "completed" after 1 day
5. **Attendance Status Values:** `present`, `absent`, `late`, `excused`
6. **Time Format:** All times are in 24-hour HH:mm:ss format
7. **Date Format:** All dates are in YYYY-MM-DD format
8. **Export Formats:** Currently supports JSON format (CSV planned for future)
