import passwordResetService from "../services/password.reset.service.js";

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