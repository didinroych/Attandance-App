# Student API Documentation

## Overview
Student endpoints provide functionality for checking in to class sessions. Currently, the face recognition feature is under development, and attendance is primarily marked by teachers.

## Base URL
All endpoints are prefixed with `/api/student`

## Authentication
All endpoints require:
- **Authorization Header:** `Bearer <access_token>`
- **Required Role:** `student`

---

## Endpoints

### 1. Student Check-In

**Endpoint:** `POST /api/student/attendance/check-in`

**Description:** Allow students to check in to an active session. This endpoint is currently inactive and being replaced with face recognition functionality.

**Authentication:** Required (Student only)

**Status:** **INACTIVE** - This endpoint is planned to be replaced with face recognition attendance system.

**Request Body:**
```json
{
  "sessionId": "integer (required)",
  "method": "string (face_recognition | manual, default: face_recognition)",
  "faceConfidence": "number (0-100, optional) - Confidence score from face recognition"
}
```

**Example Request:**
```json
{
  "sessionId": 234,
  "method": "face_recognition",
  "faceConfidence": 95.7
}
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "attendanceId": 1001,
    "sessionId": 234,
    "studentId": 15,
    "status": "present",
    "checkInTime": "2024-01-15T08:05:00.000Z",
    "method": "face_recognition",
    "faceConfidence": 95.7
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid session ID or method
```json
{
  "errors": "Invalid session ID"
}
```
- **403 Forbidden:** User is not a student
```json
{
  "errors": "Only students can check in"
}
```
- **404 Not Found:** Session not found or not active
```json
{
  "errors": "No active session found"
}
```
- **409 Conflict:** Already checked in
```json
{
  "errors": "Already checked in to this session"
}
```

---

## Attendance Status Values

| Status | Description |
|--------|-------------|
| present | Student attended the session |
| absent | Student did not attend |
| late | Student arrived late |
| excused | Student absent with valid excuse |

---

## Future Features

### Face Recognition Check-In (Coming Soon)

The face recognition check-in system will include:

1. **Camera Integration:**
   - Real-time face capture
   - Automatic face detection and alignment
   - Quality validation

2. **Security Features:**
   - Liveness detection to prevent photo spoofing
   - Multi-factor authentication
   - Geolocation verification

3. **Enhanced Request:**
```json
{
  "sessionId": 234,
  "method": "face_recognition",
  "faceImage": "base64_encoded_image",
  "location": {
    "latitude": -6.200000,
    "longitude": 106.816666
  },
  "deviceInfo": {
    "deviceId": "unique_device_identifier",
    "platform": "android"
  }
}
```

4. **Enhanced Response:**
```json
{
  "data": {
    "attendanceId": 1001,
    "sessionId": 234,
    "studentId": 15,
    "status": "present",
    "checkInTime": "2024-01-15T08:05:00.000Z",
    "method": "face_recognition",
    "faceMatch": {
      "confidence": 95.7,
      "matchQuality": "high"
    },
    "locationVerified": true,
    "livenessCheck": "passed"
  }
}
```

---

## Notes

1. **Current Status:** The student check-in endpoint is currently inactive and under development
2. **Primary Attendance Method:** Teachers mark attendance manually through the teacher endpoints
3. **Authentication:** Students need a valid JWT access token
4. **Authorization Header Format:** `Authorization: Bearer <access_token>`
5. **Face Recognition:** Face recognition features are planned for future implementation
6. **Session Validation:** Students can only check in to active sessions during their scheduled time
7. **Geolocation:** Future versions will validate student location to prevent remote check-ins

---

## Related Endpoints

Students can also use the following general user endpoints:

- [Get User Profile](user-api.md#1-get-user-profile)
- [Get Schedule by Date](user-api.md#2-get-schedule-by-date)
- [Get Weekly Schedule](user-api.md#3-get-weekly-schedule)
- [Get Schedule by Academic Period](user-api.md#4-get-schedule-by-academic-period)
- [Get Attendance Summary](user-api.md#5-get-attendance-summary)
- [Get Active Sessions](user-api.md#6-get-active-sessions)
- [Get Academic Periods](user-api.md#7-get-academic-periods)

See [User API Documentation](user-api.md) for details on these endpoints.

---

## Common Error Codes

| Status Code | Description |
|------------|-------------|
| 400 | Bad Request - Invalid input or validation error |
| 401 | Unauthorized - Invalid or missing authentication |
| 403 | Forbidden - User is not a student |
| 404 | Not Found - Session not found or not active |
| 409 | Conflict - Already checked in |
| 500 | Internal Server Error - Server-side error |

---

## Development Notes

**For Developers:**

This endpoint is marked for refactoring. The planned implementation includes:

1. **Face Recognition Service Integration:**
   - Integration with AI/ML face recognition service
   - Face encoding storage in database
   - Real-time matching algorithm

2. **Database Schema Changes:**
   - Add `face_encoding` field to student profile
   - Add `check_in_method` enum to attendance table
   - Add `face_confidence_score` field
   - Add `location_verified` boolean field

3. **Security Considerations:**
   - Implement rate limiting for check-in attempts
   - Add device fingerprinting
   - Log all check-in attempts for audit trail
   - Implement anti-spoofing measures

4. **Performance Optimization:**
   - Cache face encodings for faster matching
   - Implement asynchronous processing for face verification
   - Use CDN for face image storage
