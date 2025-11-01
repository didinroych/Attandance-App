# Admin API Documentation

## Overview
Admin endpoints provide administrative capabilities for managing sessions, schedules, and attendance analytics. All endpoints require admin role authentication.

## Base URL
All endpoints are prefixed with `/admin` or `/api/admin`

## Authentication
All endpoints require:
- **Authorization Header:** `Bearer <access_token>`
- **Required Role:** `admin`

---

## Endpoints

### 1. Get Session Statistics

**Endpoint:** `GET /admin/sessions/statistics`

**Description:** Retrieve statistical data about sessions with optional filtering.

**Authentication:** Required (Admin only)

**Query Parameters:**
```
startDate: string (YYYY-MM-DD, optional) - Filter sessions from this date
endDate: string (YYYY-MM-DD, optional) - Filter sessions until this date
classId: integer (optional) - Filter by specific class
teacherId: integer (optional) - Filter by specific teacher
```

**Example Request:**
```
GET /admin/sessions/statistics?startDate=2024-01-01&endDate=2024-01-31&classId=5
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "totalSessions": 45,
    "completedSessions": 40,
    "ongoingSessions": 3,
    "cancelledSessions": 2,
    "averageAttendanceRate": 87.5,
    "byClass": [
      {
        "classId": 5,
        "className": "Class 10A",
        "sessionCount": 45,
        "averageAttendance": 87.5
      }
    ],
    "byTeacher": [
      {
        "teacherId": 10,
        "teacherName": "John Smith",
        "sessionCount": 45
      }
    ]
  }
}
```

**Error Responses:**
- **403 Forbidden:** User is not an admin
```json
{
  "errors": "Only admins can view session statistics"
}
```

---

## Schedule Management

### 2. Create Schedule

**Endpoint:** `POST /admin/schedules`

**Description:** Create a single class schedule.

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "classId": "integer (required)",
  "subjectId": "integer (required)",
  "teacherId": "integer (required)",
  "academicPeriodId": "integer (required)",
  "dayOfWeek": "integer (1-7, required, 1=Monday)",
  "startTime": "string (HH:mm format, required)",
  "endTime": "string (HH:mm format, required)",
  "room": "string (optional)"
}
```

**Example Request:**
```json
{
  "classId": 5,
  "subjectId": 12,
  "teacherId": 8,
  "academicPeriodId": 2,
  "dayOfWeek": 1,
  "startTime": "08:00",
  "endTime": "09:30",
  "room": "Room 301"
}
```

**Success Response:**
- **Status Code:** `201 Created`
- **Response Body:**
```json
{
  "data": {
    "id": 123,
    "classId": 5,
    "subjectId": 12,
    "teacherId": 8,
    "academicPeriodId": 2,
    "dayOfWeek": 1,
    "startTime": "08:00:00",
    "endTime": "09:30:00",
    "room": "Room 301",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid input data
```json
{
  "errors": "Invalid schedule data"
}
```
- **403 Forbidden:** User is not an admin
```json
{
  "errors": "Only admins can create schedules"
}
```
- **409 Conflict:** Schedule conflict detected
```json
{
  "errors": "Teacher already has a class scheduled at this time"
}
```

---

### 3. Update Schedule

**Endpoint:** `PATCH /admin/schedules/:id`

**Description:** Update an existing schedule by ID.

**Authentication:** Required (Admin only)

**URL Parameters:**
- `id` - Schedule ID (integer, required)

**Request Body:**
```json
{
  "classId": "integer (optional)",
  "subjectId": "integer (optional)",
  "teacherId": "integer (optional)",
  "dayOfWeek": "integer (1-7, optional)",
  "startTime": "string (HH:mm format, optional)",
  "endTime": "string (HH:mm format, optional)",
  "room": "string (optional)",
  "isActive": "boolean (optional)"
}
```

**Example Request:**
```json
{
  "startTime": "09:00",
  "endTime": "10:30",
  "room": "Room 302"
}
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "id": 123,
    "classId": 5,
    "subjectId": 12,
    "teacherId": 8,
    "academicPeriodId": 2,
    "dayOfWeek": 1,
    "startTime": "09:00:00",
    "endTime": "10:30:00",
    "room": "Room 302",
    "isActive": true,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid schedule ID
```json
{
  "errors": "Invalid schedule ID"
}
```
- **403 Forbidden:** User is not an admin
```json
{
  "errors": "Only admins can update schedules"
}
```
- **404 Not Found:** Schedule not found
```json
{
  "errors": "Schedule not found"
}
```

---

### 4. Delete Schedule

**Endpoint:** `DELETE /admin/schedules/:id`

**Description:** Delete or soft delete a schedule.

**Authentication:** Required (Admin only)

**URL Parameters:**
- `id` - Schedule ID (integer, required)

**Query Parameters:**
```
softDelete: boolean (default: false) - If true, marks as inactive instead of deleting
```

**Example Request:**
```
DELETE /admin/schedules/123?softDelete=true
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "message": "Schedule deleted successfully",
    "scheduleId": 123,
    "deleted": true
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid schedule ID
```json
{
  "errors": "Invalid schedule ID"
}
```
- **403 Forbidden:** User is not an admin
```json
{
  "errors": "Only admins can delete schedules"
}
```
- **404 Not Found:** Schedule not found
```json
{
  "errors": "Schedule not found"
}
```

---

### 5. Bulk Create Schedules

**Endpoint:** `POST /admin/schedules/bulk`

**Description:** Create multiple schedules at once.

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "schedules": [
    {
      "classId": "integer (required)",
      "subjectId": "integer (required)",
      "teacherId": "integer (required)",
      "academicPeriodId": "integer (required)",
      "dayOfWeek": "integer (1-7, required)",
      "startTime": "string (HH:mm format, required)",
      "endTime": "string (HH:mm format, required)",
      "room": "string (optional)"
    }
  ]
}
```

**Example Request:**
```json
{
  "schedules": [
    {
      "classId": 5,
      "subjectId": 12,
      "teacherId": 8,
      "academicPeriodId": 2,
      "dayOfWeek": 1,
      "startTime": "08:00",
      "endTime": "09:30",
      "room": "Room 301"
    },
    {
      "classId": 5,
      "subjectId": 13,
      "teacherId": 9,
      "academicPeriodId": 2,
      "dayOfWeek": 1,
      "startTime": "09:45",
      "endTime": "11:15",
      "room": "Room 301"
    }
  ]
}
```

**Success Response:**
- **Status Code:** `201 Created`
- **Response Body:**
```json
{
  "data": {
    "created": 2,
    "failed": 0,
    "schedules": [
      {
        "id": 123,
        "classId": 5,
        "subjectId": 12,
        "status": "created"
      },
      {
        "id": 124,
        "classId": 5,
        "subjectId": 13,
        "status": "created"
      }
    ]
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid input data
```json
{
  "errors": "Invalid schedule data in bulk request"
}
```
- **403 Forbidden:** User is not an admin
```json
{
  "errors": "Only admins can bulk create schedules"
}
```

---

## Attendance Analytics

### 6. Get Attendance Analytics

**Endpoint:** `GET /admin/attendance/analytics`

**Description:** Get detailed attendance analytics with various grouping options.

**Authentication:** Required (Admin only)

**Query Parameters:**
```
classId: integer (required) - Filter by class
startDate: string (YYYY-MM-DD, required) - Start date for analytics
endDate: string (YYYY-MM-DD, required) - End date for analytics
groupBy: string (day | week | month, default: day) - Group results by time period
```

**Example Request:**
```
GET /admin/attendance/analytics?classId=5&startDate=2024-01-01&endDate=2024-01-31&groupBy=week
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "classId": 5,
    "className": "Class 10A",
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "summary": {
      "totalSessions": 45,
      "averageAttendanceRate": 87.5,
      "totalPresent": 1575,
      "totalAbsent": 225,
      "totalStudents": 40
    },
    "byTimePeriod": [
      {
        "period": "2024-W01",
        "sessions": 9,
        "attendanceRate": 88.3,
        "present": 320,
        "absent": 40
      },
      {
        "period": "2024-W02",
        "sessions": 9,
        "attendanceRate": 86.7,
        "present": 312,
        "absent": 48
      }
    ],
    "topAbsentees": [
      {
        "studentId": 15,
        "studentName": "Jane Doe",
        "absentCount": 8,
        "attendanceRate": 82.2
      }
    ],
    "bySubject": [
      {
        "subjectId": 12,
        "subjectName": "Mathematics",
        "attendanceRate": 89.1
      }
    ]
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
- **403 Forbidden:** User is not an admin
```json
{
  "errors": "Only admins can view analytics"
}
```

---

## Common Error Codes

| Status Code | Description |
|------------|-------------|
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - User is not an admin |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict (e.g., schedule overlap) |
| 500 | Internal Server Error - Server-side error |

---

## Notes

1. **Authentication:** All endpoints require a valid JWT access token with admin role
2. **Authorization Header Format:** `Authorization: Bearer <access_token>`
3. **Soft Delete:** Use `softDelete=true` to preserve data integrity while marking schedules as inactive
4. **Bulk Operations:** Maximum 100 schedules can be created in a single bulk request
5. **Time Format:** All times should be in 24-hour HH:mm format
6. **Date Format:** All dates should be in YYYY-MM-DD format
7. **Day of Week:** 1 = Monday, 7 = Sunday
