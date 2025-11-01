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
    "classScheduleId": 65,
    "date": "2025-10-28",
    "notes": "Chapter 5: Algebra fundamentals"
}
```

**Success Response:**
- **Status Code:** `201 Created`
- **Response Body:**
```json
{
    "data": {
        "sessionId": 2,
        "className": "Class 10A",
        "subjectName": "Kimia",
        "date": "2025-10-28T00:00:00.000Z",
        "status": "ongoing",
        "startedAt": "2025-11-01T03:50:18.734Z",
        "notes": "Chapter 5: Algebra fundamentals",
        "totalStudents": 2,
        "attendances": [
            {
                "attendanceId": 3,
                "studentId": 1,
                "studentName": "Ahmad Rizki Pratama",
                "studentNumber": "STD2025001",
                "status": "absent"
            },
            {
                "attendanceId": 4,
                "studentId": 2,
                "studentName": "Doni Surahman",
                "studentNumber": "STD2025002",
                "status": "absent"
            }
        ]
    }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid input data
```json
{
    "message": "Class schedule ID is required. Date is required"
}
```
- **403 Forbidden:** User is not a teacher
```json
{
    "message": "Only teachers can create sessions"
}
```
- **404 Not Found:** Schedule not found
```json
{
    "message": "Schedule not found or unauthorized"
}
```
- **409 Conflict:** Session already exists for this date
```json
{
    "message": "Session already exists for this date"
}
```

---

### 2. Get Session Details

**Endpoint:** `GET /teacher/sessions/:sessionId`

**Description:** Get detailed information about a specific session including attendance data.

**Authentication:** Required (Teacher only)

**URL Parameters:**
- `id` - Session ID (integer, required)

**Example Request:**
```
GET /teacher/sessions/2
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
    "data": {
        "sessionId": 2,
        "className": "Class 10A",
        "subjectName": "Kimia",
        "date": "2025-10-28T00:00:00.000Z",
        "status": "ongoing",
        "startedAt": "2025-11-01T03:50:18.734Z",
        "endedAt": null,
        "notes": "Chapter 5: Algebra fundamentals",
        "totalStudents": 2,
        "attendances": [
            {
                "attendanceId": 3,
                "studentId": 1,
                "studentName": "Ahmad Rizki Pratama",
                "studentNumber": "STD2025001",
                "status": "absent",
                "checkInTime": null,
                "attendanceMethod": "face_recognition",
                "notes": null
            },
            {
                "attendanceId": 4,
                "studentId": 2,
                "studentName": "Doni Surahman",
                "studentNumber": "STD2025002",
                "status": "absent",
                "checkInTime": null,
                "attendanceMethod": "face_recognition",
                "notes": null
            }
        ]
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
GET /teacher/schedule/65/sessions
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
    "data": [
        {
            "session": {
                "id": 3,
                "date": "2025-11-07T00:00:00.000Z",
                "status": "ongoing",
                "startedAt": "2025-11-01T03:55:52.079Z",
                "endedAt": null,
                "notes": "Chapter 5: Algebra fundamentals",
                "className": "Class 10A",
                "subject": "Kimia"
            },
            "summary": {
                "present": 0,
                "absent": 2,
                "late": 0,
                "excused": 0,
                "total": 2
            }
        },
        {
            "session": {
                "id": 2,
                "date": "2025-10-28T00:00:00.000Z",
                "status": "ongoing",
                "startedAt": "2025-11-01T03:50:18.734Z",
                "endedAt": null,
                "notes": "Chapter 5: Algebra fundamentals",
                "className": "Class 10A",
                "subject": "Kimia"
            },
            "summary": {
                "present": 0,
                "absent": 2,
                "late": 0,
                "excused": 0,
                "total": 2
            }
        }
    ]
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

### 4. Update Session Status -- Masih error (tapi ini sama nantinya)

**Endpoint:** `PATCH /teacher/sessions/:id/status`

**Description:** Update the status of a session (scheduled, ongoing, completed, cancelled).
You can completed after classend (Attandance still editebel), or session will be completed otomatic after 1 day

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
    "data": [
        {
            "id": 64,
            "className": "Class 10A",
            "gradeLevel": 10,
            "subject": "Fisika",
            "subjectCode": "FIS",
            "dayOfWeek": 1,
            "startTime": "1970-01-01T12:30:00.000Z",
            "endTime": "1970-01-01T14:00:00.000Z",
            "room": "A101",
            "academicPeriod": "Academic Year 2025/2026 - Semester 1",
            "isActive": true,
            "totalSessions": 0
        }, 
        ....
        {
            "id": 80,
            "className": "Class 10A",
            "gradeLevel": 10,
            "subject": "Bimbingan Konseling",
            "subjectCode": "BK",
            "dayOfWeek": 5,
            "startTime": "1970-01-01T12:30:00.000Z",
            "endTime": "1970-01-01T13:15:00.000Z",
            "room": "A101",
            "academicPeriod": "Academic Year 2025/2026 - Semester 1",
            "isActive": true,
            "totalSessions": 0
        }
    ]
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
      "attendanceId": 3,
      "status": "present",
      "notes": null
    },

    {
      "attendanceId": 4,
      "status": "excused",
      "notes": "LLL"
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
        "message": "Attendance marked successfully",
        "sessionId": 2,
        "updated": 2,
        "className": "Class 10A",
        "subject": "Kimia"
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
GET /api/teacher/attendance/report/export?classId=2&startDate=2025-10-01&endDate=2025-10-30&format=json
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body (JSON format):**
```json
{
    "data": {
        "class": {
            "name": "Class 10A",
            "gradeLevel": 10,
            "schoolLevel": "SMP"
        },
        "period": {
            "startDate": "2025-10-01",
            "endDate": "2025-10-30"
        },
        "students": [
            {
                "id": 1,
                "name": "Ahmad Rizki Pratama",
                "studentNumber": "STD2025001",
                "attendances": [
                    {
                        "date": "2025-10-28T00:00:00.000Z",
                        "subject": "Biologi",
                        "status": "absent",
                        "checkInTime": null
                    },
                    {
                        "date": "2025-10-28T00:00:00.000Z",
                        "subject": "Kimia",
                        "status": "present",
                        "checkInTime": "2025-11-01T04:04:03.303Z"
                    }
                ],
                "summary": {
                    "total": 2,
                    "present": 1,
                    "absent": 1,
                    "late": 0,
                    "excused": 0,
                    "attendanceRate": 50
                }
            },
            {
                "id": 2,
                "name": "Doni Surahman",
                "studentNumber": "STD2025002",
                "attendances": [
                    {
                        "date": "2025-10-28T00:00:00.000Z",
                        "subject": "Biologi",
                        "status": "absent",
                        "checkInTime": null
                    },
                    {
                        "date": "2025-10-28T00:00:00.000Z",
                        "subject": "Kimia",
                        "status": "excused",
                        "checkInTime": "2025-11-01T04:04:03.303Z"
                    }
                ],
                "summary": {
                    "total": 2,
                    "present": 0,
                    "absent": 1,
                    "late": 0,
                    "excused": 1,
                    "attendanceRate": 0
                }
            }
        ],
        "totalSessions": 2,
        "format": "json"
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
