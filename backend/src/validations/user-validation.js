import Joi from "joi";

const registerUserValidation = Joi.object({
    username: Joi.string().max(12).required(),
    email: Joi.string().email().max(30).required(),
    passwordHash: Joi.string().min(6).max(20).required(),
    role: Joi.string().valid('ADMIN', 'TEACHER', 'STUDENT').default('STUDENT'),
});

const loginUserValidation = Joi.object({
    username: Joi.string().max(100).required(),
    password: Joi.string().max(100).required()
});

const getUserValidation = Joi.number().integer().max(999).required()

const updateUserValidation = Joi.object({
    id: Joi.number().integer().max(999).required(),
    username: Joi.string().max(100).optional(),
    email: Joi.string().max(100).optional(),
    password: Joi.string().max(100).optional()
})

const updateStudentProfileValidation = Joi.object({
    id: Joi.number().integer().max(999).required(),
    userId: Joi.number().integer().max(999).optional(),
    phone: Joi.string().max(20).optional(),
    address: Joi.string().max(255).optional(),
    parentPhone: Joi.string().max(20).optional(),
    dateOfBirth: Joi.date().optional()
});

const updateTeacherProfileValidation = Joi.object({
    id: Joi.number().integer().max(999).required(),
    userId: Joi.number().integer().max(999).optional(),
    phone: Joi.string().max(20).optional(),
    address: Joi.string().max(255).optional()
});

const updateRoleByAdmin = Joi.object({
    id: Joi.number().integer().max(999).required(),
    newRole: Joi.string().valid('admin', 'teacher', 'student').required(),
})


export {
    registerUserValidation,
    loginUserValidation,
    getUserValidation,
    updateUserValidation,
    updateStudentProfileValidation,
    updateTeacherProfileValidation,
    updateRoleByAdmin
}