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