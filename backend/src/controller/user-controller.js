import userService from "../service/user-service.js";

const register = async(req, res, next) => {
    try {
        const result = await userService.register(req.body);
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

const login = async(req, res, next) => {
    try {
        const result = await userService.login(req.body);
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

const getCurrentUser = async(req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await userService.get(userId);
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

const update = async(req, res, next) => {
    try {
        const userId = req.user.id;
        const request = req.body;
        request.id = userId;

        const result = await userService.update(request);
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

const logout = async(req, res, next) => {
    try {
        await userService.logout(req.user.username);
        res.status(200).json({
            data: "OK"
        });
    } catch (e) {
        next(e);
    }
}

export default {
    register,
    login,
    getCurrentUser,
    update,
    logout
}