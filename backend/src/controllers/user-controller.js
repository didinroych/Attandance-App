import userService from "../services/user-service.js";

const getUserProfile = async(req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await userService.getUser(userId);
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

const updatedUser = async(req, res, next) => {
    try {
        const userId = req.user.id;
        const request = req.body;
        request.id = userId;

        const result = await userService.updateUser(request);
        console.log(result)
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}


const updateStudent = async(req, res, next) => {
    try {
        const userId = req.user.id;
        const request = req.body;
        request.id = userId;

        const result = await userService.updateStudent(request);
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

const updateTeacher = async(req, res, next) => {
    try {
        const userId = req.user.id;
        const request = req.body;
        request.id = userId;

        const result = await userService.updateTeacher(request);
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
    getUserProfile,
    updatedUser,
    updateStudent,
    updateTeacher,
    logout
}