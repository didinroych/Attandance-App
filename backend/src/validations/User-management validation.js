import Joi from "joi";

/**
 * Validation for getting user list
 * GET /admin/users?role=student&page=1&limit=10
 */
const getUserListValidation = Joi.object({
    role: Joi.string().valid('student', 'teacher').required().messages({
        'any.required': 'Role is required',
        'any.only': 'Role must be either student or teacher'
    }),
    page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
    }),
    sortBy: Joi.string().valid('createdAt', 'username', 'email', 'name').default('createdAt').messages({
        'any.only': 'sortBy must be one of: createdAt, username, email, name'
    }),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
        'any.only': 'sortOrder must be either asc or desc'
    })
});

/**
 * Validation for bulk user creation
 * POST /admin/users/bulk
 */
const bulkCreateUsersValidation = Joi.object({
    users: Joi.array().items(
        Joi.object({
            // Common fields for both roles
            username: Joi.string().min(3).max(50).required().messages({
                'string.empty': 'Username is required',
                'string.min': 'Username must be at least 3 characters',
                'string.max': 'Username cannot exceed 50 characters',
                'any.required': 'Username is required'
            }),
            email: Joi.string().email().max(100).required().messages({
                'string.email': 'Must be a valid email',
                'string.empty': 'Email is required',
                'any.required': 'Email is required'
            }),
            password: Joi.string().min(6).max(50).required().messages({
                'string.empty': 'Password is required',
                'string.min': 'Password must be at least 6 characters',
                'any.required': 'Password is required'
            }),
            role: Joi.string().valid('student', 'teacher').required().messages({
                'any.only': 'Role must be either student or teacher',
                'any.required': 'Role is required'
            }),

            // Student-specific fields
            studentId: Joi.when('role', {
                is: 'student',
                then: Joi.string().max(20).required().messages({
                    'string.empty': 'Student ID is required for students',
                    'any.required': 'Student ID is required for students'
                }),
                otherwise: Joi.forbidden()
            }),

            // Teacher-specific fields
            teacherId: Joi.when('role', {
                is: 'teacher',
                then: Joi.string().max(20).required().messages({
                    'string.empty': 'Teacher ID is required for teachers',
                    'any.required': 'Teacher ID is required for teachers'
                }),
                otherwise: Joi.forbidden()
            }),

            // Common profile fields
            fullName: Joi.string().max(100).required().messages({
                'string.empty': 'Full name is required',
                'any.required': 'Full name is required'
            }),
            phone: Joi.string().max(20).allow(null, '').optional(),
            address: Joi.string().max(255).allow(null, '').optional(),

            // Student-specific profile fields
            classId: Joi.when('role', {
                is: 'student',
                then: Joi.number().integer().required().messages({
                    'number.base': 'Class ID must be a number',
                    'any.required': 'Class ID is required for students'
                }),
                otherwise: Joi.forbidden()
            }),
            dateOfBirth: Joi.when('role', {
                is: 'student',
                then: Joi.date().iso().allow(null).optional(),
                otherwise: Joi.forbidden()
            }),
            parentPhone: Joi.when('role', {
                is: 'student',
                then: Joi.string().max(20).allow(null, '').optional(),
                otherwise: Joi.forbidden()
            }),
            enrollmentDate: Joi.when('role', {
                is: 'student',
                then: Joi.date().iso().allow(null).optional(),
                otherwise: Joi.forbidden()
            }),

            // Teacher-specific profile fields
            hireDate: Joi.when('role', {
                is: 'teacher',
                then: Joi.date().iso().allow(null).optional(),
                otherwise: Joi.forbidden()
            })
        })
    ).min(1).max(100).required().messages({
        'array.min': 'At least one user is required',
        'array.max': 'Cannot create more than 100 users at once',
        'any.required': 'Users array is required'
    })
});

/**
 * Validation for searching users
 * GET /admin/users/search?query=john&role=student&page=1&limit=20
 */
const searchUsersValidation = Joi.object({
    query: Joi.string().min(1).max(100).required().messages({
        'string.empty': 'Search query is required',
        'string.min': 'Search query must be at least 1 character',
        'any.required': 'Search query is required'
    }),
    role: Joi.string().valid('student', 'teacher').optional().messages({
        'any.only': 'Role must be either student or teacher'
    }),
    page: Joi.number().integer().min(1).default(1).messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
    }),
    limit: Joi.number().integer().min(1).max(100).default(20).messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
    })
});

/**
 * Validation for updating user
 * PATCH /admin/users/:userId
 */
const updateUserValidation = Joi.object({
    userId: Joi.number().integer().required().messages({
        'number.base': 'User ID must be a number',
        'any.required': 'User ID is required'
    }),
    // User table updates (optional)
    username: Joi.string().min(3).max(50).optional().messages({
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username cannot exceed 50 characters'
    }),
    email: Joi.string().email().max(100).optional().messages({
        'string.email': 'Must be a valid email'
    }),
    isActive: Joi.boolean().optional(),

    // Profile updates (optional)
    studentId: Joi.string().max(20).optional(),
    fullName: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).allow(null, '').optional(),
    address: Joi.string().max(255).allow(null, '').optional(),

    // Student-specific
    classId: Joi.number().integer().optional(),
    dateOfBirth: Joi.date().iso().allow(null).optional(),
    parentPhone: Joi.string().max(20).allow(null, '').optional(),
    enrollmentDate: Joi.date().iso().allow(null).optional(),

    // Teacher-specific
    teacherId: Joi.string().max(20).optional(),
    hireDate: Joi.date().iso().allow(null).optional()
});

/**
 * Validation for deleting user
 * DELETE /admin/users/:userId
 */
const deleteUserValidation = Joi.object({
    userId: Joi.number().integer().required().messages({
        'number.base': 'User ID must be a number',
        'any.required': 'User ID is required'
    }),
    softDelete: Joi.boolean().default(true).optional()
});

export {
    getUserListValidation,
    bulkCreateUsersValidation,
    searchUsersValidation,
    updateUserValidation,
    deleteUserValidation
};