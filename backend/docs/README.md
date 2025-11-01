# Attendance Application API Documentation

## Overview

Welcome to the comprehensive API documentation for the Attendance Application. This system is designed to manage school attendance with role-based access for administrators, teachers, and students.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints by Role](#api-endpoints-by-role)
- [Common Conventions](#common-conventions)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Support](#support)

---

## Getting Started

### Base URL

```
http://localhost:3000
```

### Quick Start

1. **Register a user account:** 
   ```bash
   POST /api/auth/register
   ```

2. **Login to receive access token:**
   ```bash
   POST /api/auth/login
   ```

3. **Use the access token in subsequent requests:**
   ```bash
   Authorization: Bearer <your_access_token>
   ```

---

## Authentication

All protected endpoints require authentication using JWT (JSON Web Tokens).

### Authentication Flow

1. **Register** → Create a new account
2. **Login** → Receive access token and refresh token
3. **Access Protected Resources** → Include access token in Authorization header
4. **Refresh Token** → Get new access token when expired
5. **Logout** → Invalidate refresh token

### Token Types

- **Access Token:** Short-lived (15 minutes), used for API requests
- **Refresh Token:** Long-lived (7 days), stored in httpOnly cookie, used to get new access tokens

### Security Best Practices

- Store access tokens securely (never in localStorage for web apps)
- Refresh tokens are automatically managed via httpOnly cookies
- Always use HTTPS in production
- Tokens are invalidated on logout

**Documentation:** [Authentication API](auth-api.md)

---

## API Endpoints by Role

### Public Endpoints (No Authentication Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/ping` | GET | Health check endpoint |
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | User login |
| `/api/auth/logout` | POST | User logout |
| `/api/auth/access-token` | POST | Refresh access token |
| `/api/auth/request-reset-password` | POST | Request password reset |
| `/api/auth/verify-otp` | POST | Verify OTP code |
| `/api/auth/reset-password` | POST | Reset password |

**Documentation:** [Authentication API](auth-api.md)

---

### Admin Endpoints

Endpoints for administrative tasks (requires `admin` role):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/sessions/statistics` | GET | Get session statistics |
| `/admin/schedules` | POST | Create single schedule |
| `/admin/schedules/:id` | PATCH | Update schedule |
| `/admin/schedules/:id` | DELETE | Delete schedule |
| `/admin/schedules/bulk` | POST | Bulk create schedules |
| `/admin/attendance/analytics` | GET | Get attendance analytics |

**Documentation:** [Admin API](admin-api.md)

---

### Teacher Endpoints

Endpoints for teachers (requires `teacher` role):

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/teacher/sessions` | POST | Create class session |
| `/teacher/sessions/:id` | GET | Get session details |
| `/teacher/schedule/:scheduleId/sessions` | GET | Get sessions list |
| `/teacher/sessions/:id/status` | PATCH | Update session status |
| `/api/teacher/schedules` | GET | Get teacher schedules |
| `/api/teacher/sessions/:sessionId/attendance` | POST | Mark attendance |
| `/api/teacher/attendance/report/export` | GET | Export attendance report |

**Documentation:** [Teacher API](teacher-api.md)

---

### Student Endpoints

Endpoints for students (requires `student` role):

| Endpoint | Method | Description | Status |
|----------|--------|-------------|--------|
| `/api/student/attendance/check-in` | POST | Student check-in | INACTIVE |

**Note:** Student check-in is currently inactive and being replaced with face recognition.

**Documentation:** [Student API](student-api.md)

---

### User Endpoints (All Roles)

Endpoints available to all authenticated users:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/users/profile` | GET | Get user profile |
| `/api/users/update` | PUT | Update profile (deprecated) |
| `/api/users/schedule/date` | GET | Get schedule by date |
| `/api/users/schedule/weekly` | GET | Get weekly schedule |
| `/api/users/schedule/academic-period/:id` | GET | Get schedule by academic period |
| `/api/users/attendance/summary` | GET | Get attendance summary |
| `/api/users/sessions/active` | GET | Get active sessions |
| `/api/users/academic-periode` | GET | Get academic periods |

**Documentation:** [User API](user-api.md)

---

## Common Conventions

### Request Format

- **Content-Type:** `application/json`
- **Accept:** `application/json`
- **Authorization:** `Bearer <access_token>` (for protected endpoints)

### Date and Time Formats

- **Date:** `YYYY-MM-DD` (e.g., `2024-01-15`)
- **Time:** `HH:mm:ss` or `HH:mm` (24-hour format, e.g., `08:00:00` or `08:00`)
- **DateTime:** ISO 8601 format (e.g., `2024-01-15T08:00:00.000Z`)

### Day of Week

Days are represented as integers:
- `1` = Monday
- `2` = Tuesday
- `3` = Wednesday
- `4` = Thursday
- `5` = Friday
- `6` = Saturday
- `7` = Sunday

### Pagination

For endpoints that support pagination:

```
?page=1&limit=20
```

- **page:** Page number (default: 1)
- **limit:** Items per page (default: 20, max: 100)

### Filtering

Common filter parameters:
- `startDate` / `endDate`: Date range filtering
- `isActive`: Boolean filtering
- `classId`: Filter by class
- `teacherId`: Filter by teacher
- `academicPeriodId`: Filter by academic period

---

## Response Format

### Success Response

```json
{
  "data": {
    // Response data here
  }
}
```

### Error Response

```json
{
  "errors": "Error message describing what went wrong"
}
```

---

## Error Handling

### HTTP Status Codes

| Status Code | Meaning | Description |
|-------------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | User doesn't have required permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate entry) |
| 500 | Internal Server Error | Server-side error |

### Common Error Scenarios

#### 401 Unauthorized
```json
{
  "errors": "Unauthorized"
}
```
**Solution:** Include valid access token in Authorization header

#### 403 Forbidden
```json
{
  "errors": "Only admins can perform this action"
}
```
**Solution:** User doesn't have required role/permissions

#### 400 Bad Request
```json
{
  "errors": "Validation error: email must be a valid email"
}
```
**Solution:** Fix validation errors in request body

---

## Data Models

### User Roles

- **admin:** Full system access, manage schedules and analytics
- **teacher:** Create sessions, mark attendance, view reports
- **student:** Check-in to sessions, view schedules and attendance

### Session Status

- **scheduled:** Session is planned but not started
- **ongoing:** Session is currently active
- **completed:** Session has ended
- **cancelled:** Session was cancelled

### Attendance Status

- **present:** Student attended
- **absent:** Student did not attend
- **late:** Student arrived late
- **excused:** Student absent with valid excuse

---

## Rate Limiting

To ensure fair usage and system stability:

- **Default Limit:** 100 requests per 15 minutes per IP
- **Authentication Endpoints:** 10 requests per 15 minutes per IP
- **Bulk Operations:** 5 requests per 15 minutes per user

When rate limit is exceeded:
```json
{
  "errors": "Too many requests, please try again later",
  "retryAfter": 900
}
```

---

## Validation Rules

### User Registration

- **Username:** 3-12 characters, alphanumeric
- **Email:** Valid email format, max 30 characters
- **Password:** 6-20 characters, must contain letters and numbers
- **Role:** One of: `admin`, `teacher`, `student`

### Schedule Creation

- **Day of Week:** Integer 1-7 (Monday to Sunday)
- **Time:** HH:mm format, startTime must be before endTime
- **Room:** Optional, max 50 characters

### Attendance

- **Status:** One of: `present`, `absent`, `late`, `excused`
- **Notes:** Optional, max 255 characters

---

## API Versioning

Current API version: **v1**

Future versions will be accessible via URL prefix:
- v1: `/api/...` (current)
- v2: `/api/v2/...` (future)

---

## Development Notes

### Current Status

- **Production Ready:** Authentication, Admin, Teacher, User endpoints
- **In Development:** Student face recognition check-in
- **Deprecated:** `/api/users/update` endpoint

### Upcoming Features

1. **Face Recognition Attendance**
   - AI-powered face detection and matching
   - Liveness detection for security
   - Geolocation verification

2. **Bulk User Import**
   - CSV import for students and teachers
   - Validation and error reporting
   - Dry-run mode for testing

3. **Advanced Analytics**
   - Predictive attendance analytics
   - Student performance correlation
   - Teacher effectiveness metrics

4. **Mobile App Integration**
   - Native mobile apps for iOS and Android
   - Push notifications for sessions
   - Offline attendance marking

---

## Testing

### Health Check

Test if the API is running:

```bash
GET /ping
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Sample API Workflow

1. **Register User**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "student" --optional {can be teacher or admin}
  }'
```

2. **Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

3. **Get Profile**
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <access_token>"
```

---

## Environment Variables

Required environment variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=""

# JWT Secret
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-key-here

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Face Recognition API (future)
FACE_RECOGNITION_API_KEY=your-api-key
FACE_RECOGNITION_API_URL=https://api.example.com
```

---

## Support

### Documentation Links

- [Authentication API](auth-api.md)
- [Admin API](admin-api.md)
- [Teacher API](teacher-api.md)
- [Student API](student-api.md)
- [User API](user-api.md)

### Contact

For questions, issues, or feature requests:

- **GitHub Issues:** [Link to repository]
- **Email:** support@example.com
- **Documentation:** This README and linked API docs

### Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Update documentation
6. Submit a pull request

---

## Changelog

### Version 1.0.0 (Current)

- Initial API release
- Authentication system with JWT
- Admin schedule management
- Teacher session and attendance management
- User profile and schedule viewing
- Password reset functionality
- Comprehensive API documentation

### Upcoming in Version 1.1.0

- Face recognition attendance
- Bulk user import via CSV
- Advanced analytics dashboard
- Export reports in multiple formats (CSV, Excel, PDF)

---

## License

Copyright © 2024. All rights reserved.

---

## Quick Reference

### Authentication Header
```
Authorization: Bearer <access_token>
```

### Common Response Codes
- ✅ 200/201: Success
- ❌ 400: Bad Request
- 🔒 401: Unauthorized
- 🚫 403: Forbidden
- ❓ 404: Not Found

### Date Format
```
YYYY-MM-DD (e.g., 2024-01-15)
```

### Time Format
```
HH:mm:ss (e.g., 08:00:00)
```

---

**Last Updated:** January 2024

**API Version:** 1.0.0
