import Joi from "joi";

const getUserClassSessions = Joi.object({
    id: Joi.number().integer().max(999).required(),
    classId: Joi.number().integer().max(999).optional(),
    profileId: Joi.number().integer().max(999).optional()
}).or('classId', 'profileId')

const createClassSessionVal = Joi.object({
    classScheduleId: Joi.number().integer().positive().required(),
    profileId: Joi.number().integer().positive().required(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    notes: Joi.string().optional().allow('', null)
});
const updateClassSessionVal = Joi.object({
    sessionId: Joi.number().integer().positive().required(),
    profileId: Joi.number().integer().positive().required(),
    attendances: Joi.array().items(
            Joi.object({
                attendanceId: Joi.number().integer().positive().required(),
                status: Joi.string()
                    .valid('present', 'absent', 'late', 'excused')
                    .required(),
                notes: Joi.string().max(255).optional().allow(null, '')
            })
        ).min(1).required() // minimal 1 item harus ada
});

export {
    getUserClassSessions,
    createClassSessionVal,
    updateClassSessionVal
}