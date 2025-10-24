import passwordResetService from "../service/password-reset-service.js";

/**
 * Request password reset - Send OTP to email
 * POST /auth/request-reset-password
 * 
 * @body { email: string }
 */
const requestResetPasswordController = async(req, res, next) => {
    try {
        const result = await passwordResetService.requestResetPassword(req.body);

        res.status(200).json({
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

/**
 * Verify OTP code
 * POST /auth/verify-otp
 * 
 * @body { email: string, otp: string }
 */
const verifyOTPController = async(req, res, next) => {
    try {
        const result = await passwordResetService.verifyOTP(req.body);

        res.status(200).json({
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

/**
 * Reset password with verified OTP
 * POST /auth/reset-password
 * 
 * @body { email: string, otp: string, newPassword: string }
 */
const resetPasswordController = async(req, res, next) => {
    try {
        const result = await passwordResetService.resetPassword(req.body);

        res.status(200).json({
            data: result,
        });
    } catch (e) {
        next(e);
    }
};

export default {
    requestResetPasswordController,
    verifyOTPController,
    resetPasswordController,
};