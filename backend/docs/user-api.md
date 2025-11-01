# User API Documentation

## Overview
User endpoints provide general functionality available to all authenticated users regardless of role, including viewing profiles, schedules, attendance summaries, and academic periods.

## Base URL
All endpoints are prefixed with `/api/users`

## Authentication
All endpoints require:
- **Authorization Header:** `Bearer <access_token>`
- **Required Role:** Any authenticated user (student, teacher, admin)

---

## Profile Management

### 1. Get User Profile

**Endpoint:** `GET /api/users/profile`

**Description:** Get the authenticated user's profile information including role-specific details.

**Authentication:** Required (Any role)

**Request Body:** None

**Example Request:**
```
GET /api/users/profile
```

**Success Response (Student):**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
    "data": {
        "user": {
            "id": 5,
            "username": "inistudent2",
            "email": "inistudent2@email.com",
            "role": "student",
            "profileId": 2,
            "studentId": "STD2025002",
            "fullName": "Doni Surahman",
            "classId": 2,
            "className": "Class 10A",
            "phone": "085799560414",
            "address": "Konoha, Negara Api",
            "dateOfBirth": "2005-03-15T00:00:00.000Z",
            "parentPhone": "087654321098"
        }
    }
}
```

**Success Response (Teacher):**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
    "data": {
        "user": {
            "id": 3,
            "username": "initeacher",
            "email": "initeacher@email.com",
            "role": "teacher",
            "profileId": 1,
            "teacherId": "TCH2025001",
            "fullName": "Dr. Siti Nurhaliza",
            "phone": "085799560414",
            "address": "Konoha, Negara Api"
        }
    }
}
```

**Error Responses:**
- **403 Forbiden:** Invalid or missing token
```json
{
    "errors": "Invalid or expired access token"
}
```

---

### 2. Update User Profile -- Belum fix -- Student and teacher canot edit profile

**Endpoint:** `PUT /api/users/update`

**Description:** Update user profile information. Note: This endpoint is marked for removal as users should not be able to edit their own profiles.

**Authentication:** Required (Any role)

**Status:** **DEPRECATED** - This endpoint will be removed in future versions.

**Request Body:**
```json
{
  "fullName": "string (max 100 characters, optional)",
  "phone": "string (max 20 characters, optional)",
  "address": "string (max 255 characters, optional)",
  "dateOfBirth": "string (YYYY-MM-DD, optional)",
  "parentPhone": "string (max 20 characters, optional, student only)"
}
```

**Example Request:**
```json
{
  "phone": "+62812345678",
  "address": "New Address, Jakarta"
}
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "id": 1,
    "username": "johndoe123",
    "email": "john@example.com",
    "phone": "+62812345678",
    "address": "New Address, Jakarta",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Note:** This endpoint is being deprecated. Profile updates should be handled by administrators.

---

## Schedule Management

### 3. Get Schedule by Date

**Endpoint:** `GET /api/users/schedule/date`

**Description:** Get schedule for a specific date based on user's role (student or teacher).

**Authentication:** Required (Any role)

**Query Parameters:**
```
date: string (YYYY-MM-DD, required) - The date to get schedule for
```

**Example Request:**
```
GET /api/users/schedule/date?date=2025-10-21
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
    "data": {
        "date": "2025-10-21",
        "dayOfWeek": 2,
        "data": [
            {
                "id": 65,
                "classId": 2,
                "dayOfWeek": 2,
                "startTime": "1970-01-01T07:00:00.000Z",
                "endTime": "1970-01-01T08:30:00.000Z",
                "room": "A101",
                "subject": {
                    "id": 5,
                    "name": "Kimia",
                    "code": "KIM"
                },
                "teacher": {
                    "id": 1,
                    "fullName": "Dr. Siti Nurhaliza"
                },
                "class": {
                    "id": 2,
                    "name": "Class 10A"
                },
                "session": {
                    "hasSession": false,
                    "message": "Session not active yet"
                }
            },
            .....
            {
                "id": 68,
                "classId": 2,
                "dayOfWeek": 2,
                "startTime": "1970-01-01T12:30:00.000Z",
                "endTime": "1970-01-01T14:00:00.000Z",
                "room": "LAB1",
                "subject": {
                    "id": 8,
                    "name": "Teknologi Informasi dan Komunikasi",
                    "code": "TIK"
                },
                "teacher": {
                    "id": 1,
                    "fullName": "Dr. Siti Nurhaliza"
                },
                "class": {
                    "id": 2,
                    "name": "Class 10A"
                },
                "session": {
                    "hasSession": false,
                    "message": "Session not active yet"
                }
            }
        ]
    }
}
```

**Error Responses:**
- **400 Bad Request:** Missing date parameter
```json
{
  "errors": "Date parameter is required"
}
```

---

### 4. Get Weekly Schedule

**Endpoint:** `GET /api/users/schedule/weekly`

**Description:** Get schedule for a week starting from specified date.

**Authentication:** Required (Any role)

**Query Parameters:**
```
startDate: string (YYYY-MM-DD, optional) - Start date of the week (defaults to current date)
```

**Example Request:**
```
GET /api/users/schedule/weekly?startDate=2024-01-15
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
    "data": {
        "startDate": "2025-10-27T00:00:00.000Z",
        "endDate": "2025-11-02T00:00:00.000Z",
        "schedule": {
            "1": [
                {
                    "scheduleId": 61,
                    "subjectName": "Matematika",
                    "subjectCode": "MTK",
                    "teacherName": "Dr. Bahlil bahlil",
                    "className": "Class 10A",
                    "startTime": "1970-01-01T07:00:00.000Z",
                    "endTime": "1970-01-01T08:30:00.000Z",
                    "room": "A101",
                    "session": null
                },
                ...
                {
                    "scheduleId": 64,
                    "subjectName": "Fisika",
                    "subjectCode": "FIS",
                    "teacherName": "Dr. Siti Nurhaliza",
                    "className": "Class 10A",
                    "startTime": "1970-01-01T12:30:00.000Z",
                    "endTime": "1970-01-01T14:00:00.000Z",
                    "room": "A101",
                    "session": null
                }
            ],
            "2": [ ],
            "3": [ ],
            "4": [ ],
            "5": [
                {
                    "scheduleId": 77,
                    "subjectName": "Bahasa Indonesia",
                    "subjectCode": "BIND",
                    "teacherName": "Dr. Bahlil bahlil",
                    "className": "Class 10A",
                    "startTime": "1970-01-01T07:00:00.000Z",
                    "endTime": "1970-01-01T08:30:00.000Z",
                    "room": "A101",
                    "session": null
                },
                ..
                {
                    "scheduleId": 80,
                    "subjectName": "Bimbingan Konseling",
                    "subjectCode": "BK",
                    "teacherName": "Dr. Siti Nurhaliza",
                    "className": "Class 10A",
                    "startTime": "1970-01-01T12:30:00.000Z",
                    "endTime": "1970-01-01T13:15:00.000Z",
                    "room": "A101",
                    "session": null
                }
            ],
            "6": [],
            "7": []
        }
    }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid date format
```json
{
  "errors": "Invalid date format"
}
```

---

### 5. Get Schedule by Academic Period

**Endpoint:** `GET /api/users/schedule/academic-period/:academicPeriodId`

**Description:** Get all schedules for a specific academic period.

**Authentication:** Required (Any role)

**URL Parameters:**
- `academicPeriodId` - Academic Period ID (integer, required)

**Example Request:**
```
GET /api/users/schedule/academic-period/2
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
    "data": {
        "academicPeriod": {
            "id": 2,
            "name": "Academic Year 2025/2026 - Semester 1",
            "startDate": "2025-07-01T00:00:00.000Z",
            "endDate": "2025-12-31T00:00:00.000Z",
            "isActive": true
        },
        "totalSchedules": 20,
        "schedules": {
            "61": {
                "id": 61,
                "className": "Class 10A",
                "gradeLevel": 10,
                "subjectName": "Matematika",
                "subjectCode": "MTK",
                "teacherId": 2,
                "teacherName": "Dr. Bahlil bahlil",
                "dayOfWeek": 1,
                "startTime": "1970-01-01T07:00:00.000Z",
                "endTime": "1970-01-01T08:30:00.000Z",
                "room": "A101",
                "totalSessions": 0,
                "sessions": [],
                "summary": {
                    "present": 0,
                    "absent": 0,
                    "late": 0,
                    "excused": 0
                }
            },
            ...
            "80": {
                "id": 80,
                "className": "Class 10A",
                "gradeLevel": 10,
                "subjectName": "Bimbingan Konseling",
                "subjectCode": "BK",
                "teacherId": 1,
                "teacherName": "Dr. Siti Nurhaliza",
                "dayOfWeek": 5,
                "startTime": "1970-01-01T12:30:00.000Z",
                "endTime": "1970-01-01T13:15:00.000Z",
                "room": "A101",
                "totalSessions": 0,
                "sessions": [],
                "summary": {
                    "present": 0,
                    "absent": 0,
                    "late": 0,
                    "excused": 0
                }
            }
        }
    }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid academic period ID
```json
{
  "errors": "Invalid academic period ID"
}
```
- **404 Not Found:** Academic period not found
```json
{
  "errors": "Academic period not found"
}
```

---

## Attendance

### 6. Get Attendance Summary

**Endpoint:** `GET /api/users/attendance/summary`

**Description:** Get attendance summary for the authenticated user (student or teacher).

**Authentication:** Required (Student or Teacher)

**Query Parameters:**
```
startDate: string (YYYY-MM-DD, optional) - Filter from this date
endDate: string (YYYY-MM-DD, optional) - Filter until this date
academicPeriodId: integer (optional) - Filter by academic period
```

**Example Request:**
```
GET /api/users/attendance/summary?academicPeriodId=2
```

**Success Response (Student):**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "studentId": 15,
    "studentName": "John Doe",
    "summary": {
      "totalSessions": 90,
      "present": 85,
      "absent": 3,
      "late": 2,
      "excused": 0,
      "attendanceRate": 94.4
    },
    "bySubject": [
      {
        "subjectId": 12,
        "subjectName": "Mathematics",
        "totalSessions": 20,
        "present": 19,
        "absent": 1,
        "late": 0,
        "attendanceRate": 95
      },
      {
        "subjectId": 13,
        "subjectName": "Physics",
        "totalSessions": 20,
        "present": 18,
        "absent": 1,
        "late": 1,
        "attendanceRate": 90
      }
    ],
    "recentAbsences": [
      {
        "date": "2024-01-10",
        "subjectName": "Mathematics",
        "reason": "Sick leave"
      }
    ]
  }
}
```

**Success Response (Teacher):**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "teacherId": 8,
    "teacherName": "John Smith",
    "summary": {
      "totalSessionsConducted": 85,
      "completedSessions": 80,
      "ongoingSessions": 5,
      "averageClassAttendance": 87.5
    },
    "byClass": [
      {
        "classId": 5,
        "className": "Class 10A",
        "sessionsConducted": 45,
        "averageAttendance": 88.3
      },
      {
        "classId": 6,
        "className": "Class 10B",
        "sessionsConducted": 40,
        "averageAttendance": 86.7
      }
    ]
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid parameters
```json
{
  "errors": "Invalid date format"
}
```

---

## Sessions

### 7. Get Active Sessions

**Endpoint:** `GET /api/users/sessions/active`

**Description:** Get currently active sessions for the authenticated user.

**Authentication:** Required (Student or Teacher)

**Query Parameters:** None

**Example Request:**
```
GET /api/users/sessions/active
```

**Success Response (Student):**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "activeSessions": [
      {
        "sessionId": 234,
        "scheduleId": 45,
        "subjectName": "Mathematics",
        "teacherName": "John Smith",
        "className": "Class 10A",
        "date": "2024-01-15",
        "startTime": "08:00:00",
        "endTime": "09:30:00",
        "room": "Room 301",
        "status": "ongoing",
        "attendance": {
          "hasCheckedIn": true,
          "status": "present",
          "checkInTime": "2024-01-15T08:05:00.000Z"
        }
      }
    ]
  }
}
```

**Success Response (Teacher):**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "activeSessions": [
      {
        "sessionId": 234,
        "scheduleId": 45,
        "subjectName": "Mathematics",
        "className": "Class 10A",
        "date": "2024-01-15",
        "startTime": "08:00:00",
        "endTime": "09:30:00",
        "room": "Room 301",
        "status": "ongoing",
        "attendance": {
          "totalStudents": 40,
          "present": 38,
          "absent": 2,
          "attendanceRate": 95
        }
      }
    ]
  }
}
```

**Error Responses:**
- **403 Forbidden:** Invalid role
```json
{
  "errors": "Only students and teachers can view active sessions"
}
```

---

## Academic Information

### 8. Get Academic Periods

**Endpoint:** `GET /api/users/academic-periode`

**Description:** Get list of academic periods (semesters).

**Authentication:** Required (Any role)

**Query Parameters:**
```
isActive: boolean (optional) - Filter by active/inactive periods
```

**Example Request:**
```
GET /api/users/academic-periode?isActive=true
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "academicPeriods": [
      {
        "id": 2,
        "name": "2024 Semester 1",
        "year": 2024,
        "semester": 1,
        "startDate": "2024-01-01",
        "endDate": "2024-06-30",
        "isActive": true,
        "createdAt": "2023-12-01T00:00:00.000Z"
      },
      {
        "id": 3,
        "name": "2024 Semester 2",
        "year": 2024,
        "semester": 2,
        "startDate": "2024-07-01",
        "endDate": "2024-12-31",
        "isActive": false,
        "createdAt": "2024-06-01T00:00:00.000Z"
      }
    ]
  }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid or missing token
```json
{
  "errors": "Unauthorized"
}
```

---

## Common Error Codes

| Status Code | Description |
|------------|-------------|
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server-side error |

---

## Notes

1. **Authentication:** All endpoints require a valid JWT access token
2. **Authorization Header Format:** `Authorization: Bearer <access_token>`
3. **Role-Based Data:** Response data varies based on user role (student, teacher, admin)
4. **Date Format:** All dates are in YYYY-MM-DD format
5. **Time Format:** All times are in 24-hour HH:mm:ss format
6. **Day of Week:** 1 = Monday, 7 = Sunday
7. **Attendance Rate:** Calculated as (present + late) / totalSessions * 100
8. **Deprecated Endpoints:** The update user profile endpoint will be removed in future versions

---

## Related Documentation

- [Authentication API](auth-api.md) - Login, registration, and token management
- [Student API](student-api.md) - Student-specific endpoints
- [Teacher API](teacher-api.md) - Teacher-specific endpoints
- [Admin API](admin-api.md) - Administrative endpoints
