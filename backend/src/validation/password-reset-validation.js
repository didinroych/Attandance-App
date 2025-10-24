import Joi from "joi";

/**
 * Validation for request reset password endpoint
 * POST /auth/request-reset-password
 */
const requestResetPasswordValidation = Joi.object({
    email: Joi.string().email().max(100).required().messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email is required",
        "any.required": "Email is required",
    }),
});

/**
 * Validation for verify OTP endpoint
 * POST /auth/verify-otp
 */
const verifyOTPValidation = Joi.object({
    email: Joi.string().email().max(100).required().messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email is required",
        "any.required": "Email is required",
    }),
    otp: Joi.string()
        .length(6)
        .pattern(/^[0-9]{6}$/)
        .required()
        .messages({
            "string.length": "OTP must be exactly 6 digits",
            "string.pattern.base": "OTP must contain only numbers",
            "string.empty": "OTP is required",
            "any.required": "OTP is required",
        }),
});

/**
 * Validation for reset password endpoint
 * POST /auth/reset-password
 */
const resetPasswordValidation = Joi.object({
    email: Joi.string().email().max(100).required().messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email is required",
        "any.required": "Email is required",
    }),
    otp: Joi.string()
        .length(6)
        .pattern(/^[0-9]{6}$/)
        .required()
        .messages({
            "string.length": "OTP must be exactly 6 digits",
            "string.pattern.base": "OTP must contain only numbers",
            "string.empty": "OTP is required",
            "any.required": "OTP is required",
        }),
    newPassword: Joi.string().min(6).max(50).required().messages({
        "string.min": "Password must be at least 6 characters long",
        "string.max": "Password cannot exceed 50 characters",
        "string.empty": "New password is required",
        "any.required": "New password is required",
    }),
});

export {
    requestResetPasswordValidation,
    verifyOTPValidation,
    resetPasswordValidation,
};