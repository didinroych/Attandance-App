import Joi from "joi";

/**
 * Validation for getting subject list
 * GET /admin/subjects
 */
const getSubjectListValidation = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).optional(),
    sortBy: Joi.string().valid('name', 'code', 'createdAt').default('name'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc')
});

/**
 * Validation for creating subject
 * POST /admin/subjects
 */
const createSubjectValidation = Joi.object({
    name: Joi.string().max(100).required().messages({
        'string.empty': 'Subject name is required',
        'string.max': 'Subject name cannot exceed 100 characters',
        'any.required': 'Subject name is required'
    }),
    code: Joi.string().max(10).optional().allow(null, '').messages({
        'string.max': 'Subject code cannot exceed 10 characters'
    }),
    description: Joi.string().max(1000).optional().allow(null, '').messages({
        'string.max': 'Description cannot exceed 1000 characters'
    })
});

/**
 * Validation for updating subject
 * PATCH /admin/subjects/:id
 */
const updateSubjectValidation = Joi.object({
    subjectId: Joi.number().integer().required().messages({
        'number.base': 'Subject ID must be a number',
        'any.required': 'Subject ID is required'
    }),
    name: Joi.string().max(100).optional().messages({
        'string.max': 'Subject name cannot exceed 100 characters'
    }),
    code: Joi.string().max(10).optional().allow(null, '').messages({
        'string.max': 'Subject code cannot exceed 10 characters'
    }),
    description: Joi.string().max(1000).optional().allow(null, '').messages({
        'string.max': 'Description cannot exceed 1000 characters'
    })
});

/**
 * Validation for deleting subject
 * DELETE /admin/subjects/:id
 */
const deleteSubjectValidation = Joi.object({
    subjectId: Joi.number().integer().required().messages({
        'number.base': 'Subject ID must be a number',
        'any.required': 'Subject ID is required'
    }),
    force: Joi.boolean().default(false).optional()
});

export {
    getSubjectListValidation,
    createSubjectValidation,
    updateSubjectValidation,
    deleteSubjectValidation
};