# Authentication API Documentation

## Overview
This document describes the authentication endpoints for user registration, login, logout, and token management.

## Base URL
All endpoints are prefixed with `/api/auth`

---

## Endpoints

### 1. Register User

**Endpoint:** `POST /api/auth/register`

**Description:** Register a new user account with role-based access.

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "string (max 12 characters, required)",
  "fullName": "string (max 100 characters, optional)",
  "email": "string (valid email, max 30 characters, required)",
  "password": "string (min 6, max 20 characters, required)",
  "role": "string (admin | teacher | student, default: student)"
}
```

**Example Request:**
```json
{
  "username": "inistudent6",
  "email": "inistudent6@example.com",
  "password": "securepass123",
  "role": "student" --optional
}
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
    "data": {
        "username": "inistudent6",
        "email": "inistudent6@email.com"
    }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid input data
```json
{
  "errors": "Validation error message"
}
```
- **400 Bad Request** Username or email already exists
```json
{
    "message": "Validation failed",
    "errors": {
        "username": "Username already used",
        "email": "Email already used"
    }
}
```

---

### 2. Login

**Endpoint:** `POST /api/auth/login`

**Description:** Authenticate user and receive access token and refresh token.

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "string (max 20 characters, required)",
  "password": "string (max 20 characters, required)"
}
```

**Example Request:**
```json
{
    "username": "initeacher",
    "password": "password123"
}
```

**Success Response:**
- **Status Code:** `200 OK`
- **Cookies:** Sets `refreshToken` (httpOnly, secure, sameSite: strict, maxAge: 7 days)
- **Response Body:**
```json
{
    "data": {
        "user": {
            "id": 3,
            "username": "initeacher",
            "role": "teacher"
        },
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9......-XhRTc"
    }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid credentials
```json
{
    "message": "Username or Password Invalid"
}
``` 

---

### 3. Logout

**Endpoint:** `POST /api/auth/logout`

**Description:** Invalidate refresh token and clear authentication cookies.

**Authentication:** Requires `refreshToken` cookie

**Request Body:** None

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
    "data": {
        "message": "Logout Successfull2"
    }
}
```

**Error Responses:**
- **401 Unauthorized:** Invalid or missing refresh token
```json
{
    "message": "Invalid or already revoked refresh token"
}
```

---

### 4. Refresh Access Token

**Endpoint:** `POST /api/auth/access-token`

**Description:** Generate a new access token using a valid refresh token.

**Authentication:** Requires `refreshToken` cookie

**Request Body:** None (uses refresh token from cookies)

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..... ",
        "user": {
            "id": 5,
            "username": "inistudent2",
            "role": "student",
            "profileId": 2,
            "classId": 2
        }
    }
}
```

**Error Responses:**
- **401 Unauthorized:** Refresh token not found or invalid
```json
{
    "message": "Invalid or expired refresh token"
}
```

---

## Password Reset Flow

### 5. Request Password Reset

**Endpoint:** `POST /api/auth/request-reset-password`

**Description:** Request a password reset by sending OTP to user's email.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "string (valid email, required)"
}
```

**Example Request:**
```json
{
  "email": "john@example.com"
}
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "message": "OTP sent to your email",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- **404 Not Found:** Email not registered
```json
{
  "errors": "Email not found"
}
```

---

### 6. Verify OTP

**Endpoint:** `POST /api/auth/verify-otp`

**Description:** Verify the OTP sent to user's email.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "string (required)",
  "otp": "string (6 digits, required)"
}
```

**Example Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "message": "OTP verified successfully",
    "resetToken": "temporary_reset_token_here"
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid or expired OTP
```json
{
  "errors": "Invalid or expired OTP"
}
```

---

### 7. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

**Description:** Reset user password using verified reset token.

**Authentication:** Requires valid reset token from OTP verification

**Request Body:**
```json
{ 
  "email": "string (required)",
  "otp": "string (6 digits, required)",
  "newPassword": "string (min 6, max 20 characters, required)"
} 
```

**Example Request:**
```json
{ 
  "email": "didincrypto@gmail.com",
  "otp": "816386",
  "newPassword": "newSecurePassword123"
}
```

**Success Response:**
- **Status Code:** `200 OK`
- **Response Body:**
```json
{
  "data": {
    "message": "Password reset successfully"
  }
}
```

**Error Responses:**
- **400 Bad Request:** Invalid or expired reset token
```json
{
  "errors": "Invalid or expired reset token"
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
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error - Server-side error |

---

## Notes

1. **Refresh Token Storage:** Refresh tokens are stored in httpOnly cookies for security `Cookie: refreshToken= <refresh_token>`
2. **Access Token Usage:** Include access token in `Authorization` header for protected endpoints: `Authorization: Bearer <access_token>`
3. **Token Expiry:** Access tokens typically expire after 15 minutes, refresh tokens after 7 days
4. **OTP Expiry:** OTP codes expire after 10 minutes
5. **Password Requirements:** Minimum 6 characters, maximum 20 characters
