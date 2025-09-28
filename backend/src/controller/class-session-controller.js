import classSessionService from "../service/class-session-service.js";

const getClassSessions = async(req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await classSessionService.getClassSessions(userId);
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

export default {
    getClassSessions
}