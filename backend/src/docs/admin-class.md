# Class Management API Documentation

This document provides comprehensive documentation for the Class Management endpoints. All endpoints require admin authentication.

## Overview

The Class Management API allows administrators to perform CRUD operations on classes. Classes represent academic groups of students (e.g., "7A", "8B", "12 IPA 1") and are associated with:
- School Level (SD, SMP, SMA)
- Academic Period (e.g., "2024/2025 Semester 1")
- Grade Level (1-12)
- Homeroom Teacher (optional)

---

## Authentication

All endpoints require:
- Valid JWT token in the `Authorization` header
- User role must be `admin`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_ACCESS_TOKEN",
  "Content-Type": "application/json"
}
```

---

## Endpoints

### 1. Get List of Classes

Retrieve a paginated list of classes with search and sorting capabilities.

**Endpoint:**
```
GET /api/admin/classes
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (min: 1) |
| `limit` | number | 20 | Items per page (min: 1, max: 100) |
| `search` | string | - | Search by class name (e.g., "7A") |
| `sortBy` | string | name | Sort field: `name`, `gradeLevel`, `createdAt` |
| `sortOrder` | string | asc | Sort order: `asc` or `desc` |

**Example Request:**
```bash
curl -X GET "http://localhost:4000/api/admin/classes?page=1&limit=20&search=7&sortBy=gradeLevel&sortOrder=asc" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "data": {
    "classes": [
      {
        "id": 1,
        "name": "7A",
        "gradeLevel": 7,
        "schoolLevel": "SMP",
        "academicPeriod": "2024/2025 Semester 1",
        "homeroomTeacher": "John Doe",
        "studentCount": 32,
        "scheduleCount": 12,
        "createdAt": "2024-08-15T08:00:00.000Z"
      },
      {
        "id": 2,
        "name": "7B",
        "gradeLevel": 7,
        "schoolLevel": "SMP",
        "academicPeriod": "2024/2025 Semester 1",
        "homeroomTeacher": null,
        "studentCount": 28,
        "scheduleCount": 10,
        "createdAt": "2024-08-15T08:05:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 95,
      "limit": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

### 2. Get Class by ID

Retrieve detailed information about a specific class including related students and schedules.

**Endpoint:**
```
GET /api/admin/classes/:id
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Class ID |

**Example Request:**
```bash
curl -X GET "http://localhost:4000/api/admin/classes/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200 OK):**
```json
{
  "data": {
    "id": 1,
    "name": "7A",
    "gradeLevel": 7,
    "schoolLevel": "SMP",
    "academicPeriod": {
      "name": "2024/2025 Semester 1",
      "startDate": "2024-08-15T00:00:00.000Z",
      "endDate": "2025-01-15T00:00:00.000Z"
    },
    "homeroomTeacher": {
      "fullName": "John Doe",
      "email": "john.doe@school.com"
    },
    "studentCount": 32,
    "scheduleCount": 12,
    "students": [
      {
        "id": 101,
        "fullName": "Alice Smith",
        "studentNumber": "2024001"
      },
      {
        "id": 102,
        "fullName": "Bob Johnson",
        "studentNumber": "2024002"
      }
      // ... up to 10 students shown
    ],
    "schedules": [
      {
        "id": 1,
        "subject": "Mathematics",
        "teacher": "Jane Smith",
        "dayOfWeek": 1,
        "startTime": "08:00:00",
        "endTime": "09:30:00"
      },
      {
        "id": 2,
        "subject": "English",
        "teacher": "Mark Brown",
        "dayOfWeek": 1,
        "startTime": "09:30:00",
        "endTime": "11:00:00"
      }
      // ... up to 10 schedules shown
    ],
    "createdAt": "2024-08-15T08:00:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "errors": "Class not found"
}
```

---

### 3. Create New Class

Create a new class with required information.

**Endpoint:**
```
POST /api/admin/classes
```

**Request Body:**
```json
{
  "name": "7A",
  "schoolLevelId": 2,
  "gradeLevel": 7,
  "academicPeriodId": 1,
  "homeroomTeacherId": 5
}
```

**Body Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Class name (max 20 chars, e.g., "7A", "12 IPA 1") |
| `schoolLevelId` | number | Yes | ID of school level (SD/SMP/SMA) |
| `gradeLevel` | number | Yes | Grade level (1-12) |
| `academicPeriodId` | number | Yes | ID of academic period |
| `homeroomTeacherId` | number | No | ID of teacher (must have role: teacher) |

**Example Request:**
```bash
curl -X POST "http://localhost:4000/api/admin/classes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "7A",
    "schoolLevelId": 2,
    "gradeLevel": 7,
    "academicPeriodId": 1,
    "homeroomTeacherId": 5
  }'
```

**Success Response (201 Created):**
```json
{
  "data": {
    "message": "Class created successfully",
    "class": {
      "id": 15,
      "name": "7A",
      "gradeLevel": 7,
      "schoolLevel": "SMP",
      "academicPeriod": "2024/2025 Semester 1",
      "homeroomTeacher": "John Doe",
      "createdAt": "2024-11-10T08:30:00.000Z"
    }
  }
}
```

**Error Responses:**

**400 Bad Request - Duplicate Name:**
```json
{
  "errors": "Class with this name already exists in this academic period"
}
```

**404 Not Found - Invalid School Level:**
```json
{
  "errors": "School level not found"
}
```

**404 Not Found - Invalid Academic Period:**
```json
{
  "errors": "Academic period not found"
}
```

**404 Not Found - Invalid Teacher:**
```json
{
  "errors": "Teacher not found"
}
```

---

### 4. Update Class

Update an existing class. All fields are optional - only send fields you want to update.

**Endpoint:**
```
PATCH /api/admin/classes/:id
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Class ID |

**Request Body (all optional):**
```json
{
  "name": "7A Updated",
  "schoolLevelId": 2,
  "gradeLevel": 7,
  "academicPeriodId": 1,
  "homeroomTeacherId": 6
}
```

**Example Request:**
```bash
curl -X PATCH "http://localhost:4000/api/admin/classes/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "7A Updated",
    "homeroomTeacherId": 6
  }'
```

**Success Response (200 OK):**
```json
{
  "data": {
    "message": "Class updated successfully",
    "class": {
      "id": 1,
      "name": "7A Updated",
      "gradeLevel": 7,
      "schoolLevel": "SMP",
      "academicPeriod": "2024/2025 Semester 1",
      "homeroomTeacher": "Jane Smith",
      "createdAt": "2024-08-15T08:00:00.000Z"
    }
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "errors": "Class not found"
}
```

**Error Response (400 Bad Request - Duplicate):**
```json
{
  "errors": "Class with this name already exists in this academic period"
}
```

---

### 5. Delete Class

Delete a class. If the class has students or schedules, use `force=true` to cascade delete.

**Endpoint:**
```
DELETE /api/admin/classes/:id
```

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Class ID |

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `force` | boolean | false | Force delete even if class has students/schedules |

**Example Request (Safe Delete):**
```bash
curl -X DELETE "http://localhost:4000/api/admin/classes/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Request (Force Delete):**
```bash
curl -X DELETE "http://localhost:4000/api/admin/classes/1?force=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200 OK) - No Dependencies:**
```json
{
  "data": {
    "message": "Class deleted successfully",
    "classId": 1,
    "className": "7A",
    "deletedStudents": 0,
    "deletedSchedules": 0
  }
}
```

**Success Response (200 OK) - Force Delete:**
```json
{
  "data": {
    "message": "Class deleted successfully (32 student(s) and 12 schedule(s) also deleted)",
    "classId": 1,
    "className": "7A",
    "deletedStudents": 32,
    "deletedSchedules": 12
  }
}
```

**Error Response (400 Bad Request) - Has Dependencies:**
```json
{
  "errors": "Cannot delete class. It has 32 student(s) and 12 schedule(s). Use force=true query parameter to force delete."
}
```

**Error Response (404 Not Found):**
```json
{
  "errors": "Class not found"
}
```

---

## Business Rules

### Uniqueness Constraint
- Class `name` must be unique within the same `academicPeriodId`
- Example: You can have "7A" in "2024/2025 Semester 1" and "7A" in "2024/2025 Semester 2"

### Grade Level Validation
- Must be between 1-12
- Should align with school level:
  - SD (Elementary): 1-6
  - SMP (Junior High): 7-9
  - SMA (Senior High): 10-12

### Cascade Delete
When deleting a class with `force=true`:
- All students in the class will be deleted
- All class schedules will be deleted
- All related attendance records may be affected

### Homeroom Teacher
- Optional field
- Must reference a user with role `teacher`
- Can be set to `null` to remove assignment

---

## Common Use Cases

### Use Case 1: Create New Academic Year Classes

```bash
# Step 1: Get active academic period ID
GET /api/admin/academic-periods

# Step 2: Create classes for the new period
POST /api/admin/classes
{
  "name": "7A",
  "schoolLevelId": 2,
  "gradeLevel": 7,
  "academicPeriodId": 5,
  "homeroomTeacherId": null
}

# Step 3: Assign homeroom teacher later
PATCH /api/admin/classes/15
{
  "homeroomTeacherId": 10
}
```

### Use Case 2: Search and Filter Classes

```bash
# Search classes by name
GET /api/admin/classes?search=7A

# Get all grade 7 classes (via search)
GET /api/admin/classes?search=7

# Sort by grade level
GET /api/admin/classes?sortBy=gradeLevel&sortOrder=desc
```

### Use Case 3: Archive Old Academic Period

```bash
# Step 1: Get all classes from old period
GET /api/admin/classes?search=2023

# Step 2: Delete each class with force
DELETE /api/admin/classes/1?force=true
DELETE /api/admin/classes/2?force=true
# ... etc
```

---

## Error Handling

All endpoints follow consistent error response format:

**Validation Error (400 Bad Request):**
```json
{
  "errors": "Validation error message"
}
```

**Authentication Error (401 Unauthorized):**
```json
{
  "errors": "Unauthorized"
}
```

**Authorization Error (403 Forbidden):**
```json
{
  "errors": "Only admins can [action] classes"
}
```

**Not Found Error (404 Not Found):**
```json
{
  "errors": "Class not found"
}
```

**Server Error (500 Internal Server Error):**
```json
{
  "errors": "Internal server error"
}
```

---

## Testing Tips

### 1. Test Data Setup
```sql
-- Check existing school levels
SELECT * FROM school_level;

-- Check existing academic periods
SELECT * FROM academic_period;

-- Check available teachers
SELECT id, full_name, email FROM users WHERE role = 'teacher';
```

### 2. Test Create with Invalid Data
```bash
# Test missing required field
POST /api/admin/classes
{
  "name": "7A"
  # Missing schoolLevelId, gradeLevel, academicPeriodId
}

# Test duplicate name in same period
POST /api/admin/classes
{
  "name": "7A",  # Already exists
  "schoolLevelId": 2,
  "gradeLevel": 7,
  "academicPeriodId": 1
}
```

### 3. Test Delete Protection
```bash
# Try to delete class with students
DELETE /api/admin/classes/1
# Should fail with error message

# Force delete
DELETE /api/admin/classes/1?force=true
# Should succeed and cascade delete
```

---

## Related Endpoints

For complete class management, you may need:

- **School Levels**: `GET /api/admin/school-levels`
- **Academic Periods**: `GET /api/admin/academic-periods`
- **Teachers**: `GET /api/admin/users?role=teacher`
- **Students**: `GET /api/admin/students?classId=1`
- **Schedules**: `GET /api/admin/schedules?classId=1`

---

## Notes

1. **Soft Delete**: This API uses hard delete (permanent deletion). Deleted classes cannot be recovered.

2. **Performance**: The list endpoint is paginated for performance. Use appropriate `limit` values for your use case.

3. **Search**: Search is case-sensitive and searches within the `name` field only.

4. **Concurrent Operations**: Be careful when multiple admins are managing classes simultaneously to avoid race conditions.

5. **Production Considerations**:
   - Always backup before bulk deletions
   - Consider implementing soft delete for better data recovery
   - Add audit logging for class modifications

---

## Support

For issues or questions:
- Check server logs for detailed error messages
- Verify authentication token is valid
- Ensure user has admin role
- Verify foreign key references exist (school level, academic period, teacher)
