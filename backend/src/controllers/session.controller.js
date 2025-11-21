import { ResponseError } from "../error/response-error.js";
import sessionService from "../services/session.service.js";

// POST /api/teacher/sessions || Body: { classScheduleId, date, notes? }
const createSessionController = async(req, res, next) => {
    try {
        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Only teachers can create sessions");
        }

        const request = {
            ...req.body,
            profileId: req.user.profileId
        };

        const result = await sessionService.createSession(request);

        res.status(201).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// GET /api/teacher/sessions/:id
const getSessionController = async(req, res, next) => {
    try {
        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Only teachers can view session details");
        }

        const sessionId = parseInt(req.params.id);

        if (isNaN(sessionId)) {
            throw new ResponseError(400, "Invalid session ID");
        }

        const request = {
            sessionId,
            profileId: req.user.profileId
        };

        const result = await sessionService.getSession(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// GET /api/teacher/schedule/:scheduleId/sessions
const getSessionsListController = async(req, res, next) => {
    try {
        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Only teachers can view sessions list");
        }

        const classScheduleId = parseInt(req.params.scheduleId);

        if (isNaN(classScheduleId)) {
            throw new ResponseError(400, "Invalid class schedule ID");
        }

        const request = {
            classScheduleId,
            profileId: req.user.profileId
        };

        const result = await sessionService.getSessionsList(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// PATCH /api/teacher/sessions/:id/status || Body: { status: 'ongoing' | 'completed' | 'cancelled' }
const updateSessionStatusController = async(req, res, next) => {
    try {
        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Only teachers can update session status");
        }

        const sessionId = parseInt(req.params.id);

        if (isNaN(sessionId)) {
            throw new ResponseError(400, "Invalid session ID");
        }

        const request = {
            sessionId,
            status: req.body.status,
            profileId: req.user.profileId
        };

        const result = await sessionService.updateSessionStatus(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// GET /api/users/sessions/last
const getLastSessionsController = async(req, res, next) => {
    try {
        if (req.user.role !== "student" && req.user.role !== "teacher") {
            throw new ResponseError(403, "Only students and teachers can view last sessions");
        }

        const request = {
            profileId: req.user.profileId,
            role: req.user.role,
            status: req.query.status
        };

        const result = await sessionService.getLastSessions(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// GET /api/admin/sessions/statistics || Query: startDate?, endDate?, classId?, teacherId?
const getSessionStatisticsController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can view session statistics");
        }

        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            classId: req.query.classId ? parseInt(req.query.classId) : undefined,
            teacherId: req.query.teacherId ? parseInt(req.query.teacherId) : undefined
        };

        const result = await sessionService.getSessionStatistics(filters);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

export default {
    createSessionController,
    getSessionController,
    getSessionsListController,
    updateSessionStatusController,
    getLastSessionsController,
    getSessionStatisticsController
};