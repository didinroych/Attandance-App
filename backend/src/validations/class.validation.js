import Joi from "joi";

/**
 * Validation for getting class list
 * GET /admin/classes
 */
const getClassListValidation = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(50).optional(),
    sortBy: Joi.string().valid('name', 'gradeLevel', 'createdAt').default('name'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

/**
 * Validation for creating class
 * POST /admin/classes
 */
const createClassValidation = Joi.object({
    name: Joi.string().max(20).required().messages({
        'string.empty': 'Class name is required',
        'any.required': 'Class name is required'
    }),
    schoolLevelId: Joi.number().integer().required().messages({
        'any.required': 'School level ID is required'
    }),
    gradeLevel: Joi.number().integer().min(1).max(12).required().messages({
        'any.required': 'Grade level is required'
    }),
    academicPeriodId: Joi.number().integer().required().messages({
        'any.required': 'Academic period ID is required'
    }),
    homeroomTeacherId: Joi.number().integer().optional().allow(null)
});

/**
 * Validation for updating class
 * PATCH /admin/classes/:id
 */
const updateClassValidation = Joi.object({
    classId: Joi.number().integer().required().messages({
        'any.required': 'Class ID is required'
    }),
    name: Joi.string().max(20).optional(),
    schoolLevelId: Joi.number().integer().optional(),
    gradeLevel: Joi.number().integer().min(1).max(12).optional(),
    academicPeriodId: Joi.number().integer().optional(),
    homeroomTeacherId: Joi.number().integer().optional().allow(null)
});

/**
 * Validation for deleting class
 * DELETE /admin/classes/:id
 */
const deleteClassValidation = Joi.object({
    classId: Joi.number().integer().required().messages({
        'any.required': 'Class ID is required'
    }),
    force: Joi.boolean().default(false).optional()
});

export {
    getClassListValidation,
    createClassValidation,
    updateClassValidation,
    deleteClassValidation
};
