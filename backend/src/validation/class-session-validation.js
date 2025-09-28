import Joi from "joi";

const getUserClassSessions = Joi.object({
    id: Joi.number().integer().max(999).required()
})



export {
    getUserClassSessions,
}