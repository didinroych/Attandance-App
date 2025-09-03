import Joi from "joi";

const registerUserValidation = Joi.object({
    username: Joi.string().max(12).required(),
    email: Joi.string().email().max(30).required(),
    password: Joi.string().min(6).max(20).required(),
    fullName: Joi.string().max(30).required(),
    phone: Joi.string().max(20).optional(),
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
    password: Joi.string().max(100).optional(),
    fullName: Joi.string().max(100).optional()
})

export {
    registerUserValidation,
    loginUserValidation,
    getUserValidation,
    updateUserValidation
}