import Joi from "joi";

/**
 * Validation for getting academic period list
 * GET /admin/academic-periods
 */
const getAcademicPeriodListValidation = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).optional(),
    isActive: Joi.boolean().optional(),
    sortBy: Joi.string().valid('name', 'startDate', 'createdAt').default('startDate'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

/**
 * Validation for creating academic period
 * POST /admin/academic-periods
 */
const createAcademicPeriodValidation = Joi.object({
    name: Joi.string().max(50).required().messages({
        'string.empty': 'Academic period name is required',
        'string.max': 'Academic period name cannot exceed 50 characters',
        'any.required': 'Academic period name is required'
    }),
    startDate: Joi.date().iso().required().messages({
        'date.base': 'Start date must be a valid date',
        'any.required': 'Start date is required'
    }),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required().messages({
        'date.base': 'End date must be a valid date',
        'date.greater': 'End date must be after start date',
        'any.required': 'End date is required'
    }),
    isActive: Joi.boolean().default(false).optional()
});

/**
 * Validation for updating academic period
 * PATCH /admin/academic-periods/:id
 */
const updateAcademicPeriodValidation = Joi.object({
    academicPeriodId: Joi.number().integer().required().messages({
        'number.base': 'Academic period ID must be a number',
        'any.required': 'Academic period ID is required'
    }),
    name: Joi.string().max(50).optional().messages({
        'string.max': 'Academic period name cannot exceed 50 characters'
    }),
    startDate: Joi.date().iso().optional().messages({
        'date.base': 'Start date must be a valid date'
    }),
    endDate: Joi.date().iso().optional().messages({
        'date.base': 'End date must be a valid date'
    }),
    isActive: Joi.boolean().optional()
}).custom((value, helpers) => {
    // If both startDate and endDate are provided, validate endDate > startDate
    if (value.startDate && value.endDate) {
        if (new Date(value.endDate) <= new Date(value.startDate)) {
            return helpers.error('date.greater', { message: 'End date must be after start date' });
        }
    }
    return value;
});

/**
 * Validation for deleting academic period
 * DELETE /admin/academic-periods/:id
 */
const deleteAcademicPeriodValidation = Joi.object({
    academicPeriodId: Joi.number().integer().required().messages({
        'number.base': 'Academic period ID must be a number',
        'any.required': 'Academic period ID is required'
    }),
    force: Joi.boolean().default(false).optional()
});

export {
    getAcademicPeriodListValidation,
    createAcademicPeriodValidation,
    updateAcademicPeriodValidation,
    deleteAcademicPeriodValidation
};