import { ResponseError } from "../error/response-error.js";
import classSessionService from "../service/class-session-service.js";

const getClassSchedule = async(req, res, next) => {
    try {
        const { id, role, classId, profileId } = req.user
        const request = {
            id,
            ...(role === "student" ? { classId } : { profileId })
        }
        console.log("controller", request)
        const result = await classSessionService.getClassSchedule(request);
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


const getClassSessionController = async(req, res, next) => {
    try {
        const sessionId = parseInt(req.params.id);
        const request = {
            sessionId,
            profileId: req.user.profileId
        }

        console.log("controlelr", request)

        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Unauthorized");
        }

        const result = await classSessionService.getClassSession(request);
        res.status(201).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

const getClassSessionsListController = async(req, res, next) => {
    try {
        const classScheduleId = parseInt(req.params.classScheduleId);
        const request = {
            classScheduleId,
            profileId: req.user.profileId
        }

        console.log("controlelr", request)

        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Unauthorized");
        }

        const result = await classSessionService.getClassSessionsList(request);
        res.status(201).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

const updateClassSessionContoller = async(req, res, next) => {
    try {
        const sessionId = parseInt(req.params.id);
        const { attendances } = req.body;
        const request = {
            attendances,
            sessionId,
            profileId: req.user.profileId
        }

        console.log('Body received:', req.body);
        console.log('Attendances:', attendances);

        console.log('controller', request)
        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Unauthorized");
        }

        const result = await classSessionService.updateClassSession(request)
        res.status(201).json({
            data: result
        });

    } catch (e) {
        next(e)
    }
}

const getClassSessionActive = async(req, res, next) => {
    try {
        const request = {
            id: req.user.id
        }

        console.log("controller", request)
        const result = await classSessionService.getClassSessionActive(request);
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

const getClassSessionsSummary = async(req, res, next) => {
    try {
        const request = {
            id: req.user.id,
            classId: req.user.classId
        }

        console.log("controller", request)
        const result = await classSessionService.getClassSessionsSummary(request);
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

const getClassListClassTeacher = async(req, res, next) => {
    try {
        const request = {
            id: req.user.profileId
        }

        console.log("controller", request)
        const result = await classSessionService.getClassListClassTeacher(request);
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

export default {
    getClassSchedule,
    createClassSession,
    getClassSessionController,
    getClassSessionsListController,
    updateClassSessionContoller,
    getClassSessionActive,
    getClassSessionsSummary,
    getClassListClassTeacher
}