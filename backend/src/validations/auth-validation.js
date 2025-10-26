import Joi from "joi";

const registerUserValidation = Joi.object({
    username: Joi.string().max(12).required(),
    fullName: Joi.string().max(100).optional(),
    email: Joi.string().email().max(30).required(),
    password: Joi.string().min(6).max(20).required(),
    role: Joi.string().valid('admin', 'teacher', 'student').default('student'),
});

const loginUserValidation = Joi.object({
    username: Joi.string().max(100).required(),
    password: Joi.string().max(100).required()
});

const getUserValidation = Joi.number().integer().max(9999).required()

const updateUserValidation = Joi.object({
    id: Joi.number().integer().max(999).required(),
    username: Joi.string().max(50).optional(),
    email: Joi.string().max(100).optional(),
    password: Joi.string().max(255).optional(),

    //student
    fullName: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).optional(),
    address: Joi.string().max(255).optional(),
    date_of_birth: Joi.date().optional(),
    parentPhone: Joi.string().max(20).optional(),

    //admin only 
    role: Joi.string().valid('admin', 'teacher', 'student').optional(),
    isActive: Joi.bool().optional(),
    studentId: Joi.string().max(20).optional(),
    teacherId: Joi.string().max(20).optional(),
    hireDate: Joi.date().optional(),
    classId: Joi.number().integer().max(999).optional()
})



export {
    registerUserValidation,
    loginUserValidation,
    getUserValidation,
    updateUserValidation
}