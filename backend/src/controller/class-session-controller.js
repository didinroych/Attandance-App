import { ResponseError } from "../error/response-error.js";
import classSessionService from "../service/class-session-service.js";

const getClassSessions = async(req, res, next) => {
    try {
        const { id, role, classId, profileId } = req.user
        const request = {
            id,
            ...(role === "student" ? { classId } : { profileId })
        }
        console.log("controller", request)
        const result = await classSessionService.getClassSessions(request);
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

const createClassSession = async(req, res, next) => {
    try {
        const request = req.body;
        request.profileId = req.user.profileId;

        console.log("controller", request);

        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Unauthorized");
        }

        const result = await classSessionService.createClassSession(request);

        res.status(201).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}
export default {
    getClassSessions,
    createClassSession
}