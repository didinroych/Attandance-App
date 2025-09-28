# Auth API Spec

## Register Auth User API

Endpoint :  POST /api/auth/register

Request Body :

```json
{
    "username": "userstudent1",
    "email": "userstudent1@gmail.com",
    "password": "password"
}
```

Response Body Success :

```json
{
    "data": {
        "username": "userstudent1",
        "email": "userstudent1@gmail.com"
    }
}
```

Response Body Error : 

```json
400 Bad Request
{
    "message": "Validation failed",
    "errors": {
        "username": "Username already used",
        "email": "Email already used"
    }
}
```


## Login Auth User API

Endpoint :  POST /api/auth/login

Request Body :

```json
{
    "username": "userstudent1",
    "password": "password"
}
```

Response Body Success :

```json
{
    "data": {
        "user": {
            "id": 5,
            "username": "userstudent1",
            "role": "student"
        },
        "accessToken": "xx.xxx.xx-xx-xx"
    }
}
```

Response Body Error : 

```json
401 Unauthorized
{
    "message": "Username or Password Invalid"
}
```

## Update Access Token Auth User API

Endpoint : /api/auth/access-token

Headers
```
Cookie : refreshToken=xx.xxx.B9-xxx
```

Response Body Success : 
```json
{
    "data": {
        "accessToken": "xx.xx.xx-xxx",
        "user": {
            "id": 4,
            "username": "kayaknya",
            "role": "student",
            "studentId": "STD2025001",
            "classId": 16
        }
    }
}
```

Response Body Error
```json
403 Forbidden
{
    "message": "Invalid or expired refresh token"
}
```

## Logout User API

Endpoint : /api/auth/logout

Headers 
```
Cookie : refreshToken=xx.x.hLSo8V-xxx
```

Respond Body Success 
```
{
    "data": {
        "message": "Logout Successfull2"
    }
}
```
Respond Body Error 
``` json
401 Unauthorized
{
    "message": "Invalid or already revoked refresh token"
}
```