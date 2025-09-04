import authService from "../service/auth-service.js";


const registerController = async(req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(200).json({
            data: result
        })
    } catch (e) {
        next(e)
    }
}

const loginController = async(req, res, next) => {
    try {
        const result = await authService.login(req.body);

        res.cookie('refreshToken', result.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            data: {
                user: result.user,
                accessToken: result.accessToken
            }
        });
    } catch (e) {
        next(e)
    }
}

const logoutController = async(req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        await authService.logout(refreshToken);

        res.clearCookie('refreshToken');

        res.status(200).json({
            data: { message: "Logout Successfull2" }
        })

    } catch (e) {
        next(e)
    }
}

const refreshToken = async(req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                errors: "Refresh token not found"
            });
        }

        const result = await authService.renewAccesToken(refreshToken)

        res.status(200).json({
            data: {
                accessToken: result.accessToken,
                user: result.user
            }
        });
    } catch (e) {
        next(e);
    }
}


export default {
    registerController,
    loginController,
    logoutController,
    refreshToken
}