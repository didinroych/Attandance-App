import { ResponseError } from "../error/response-error.js";
import classSessionService from "../service/class-session-service.js";

const getClassScheduleByDateController = async(req, res, next) => {
    /**
     * Get class schedule for a specific date
     * Returns session status and attendance info based on user role
     * 
     * Query params:
     * - date: YYYY-MM-DD format
     */
    try {
        const { date } = req.query;

        if (!date) {
            throw new ResponseError(400, "Date parameter is required");
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            throw new ResponseError(400, "Invalid date format. Use YYYY-MM-DD");
        }

        const request = {
            date: date,
            profileId: req.user.profileId,
            role: req.user.role
        };

        const result = await classSessionService.getClassScheduleByDate(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const getWeeklyScheduleController = async(req, res, next) => {
    /**
     * Get weekly schedule
     * Returns all schedules for the week with session information
     * 
     * Query params (optional):
     * - startDate: YYYY-MM-DD format (defaults to current week)
     */
    try {
        const { startDate } = req.query;

        // Validate date format if provided
        if (startDate) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(startDate)) {
                throw new ResponseError(400, "Invalid date format. Use YYYY-MM-DD");
            }
        }

        const request = {
            startDate: startDate || new Date().toISOString().split('T')[0],
            profileId: req.user.profileId,
            role: req.user.role
        };

        const result = await classSessionService.getWeeklySchedule(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const getScheduleByAcademicPeriodController = async(req, res, next) => {
    try {
        const academicPeriodId = parseInt(req.params.academicPeriodId);

        if (isNaN(academicPeriodId)) {
            throw new ResponseError(400, "Invalid academic period ID");
        }

        const request = {
            academicPeriodId,
            profileId: req.user.profileId,
            userId: req.user.id,
            classId: req.user.classId,
            role: req.user.role
        };

        const result = await classSessionService.getScheduleByAcademicPeriod(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const createClassSessionController = async(req, res, next) => {
    /**
     * Create a new attendance session
     * Teacher only endpoint
     * 
     * Body:
     * - classScheduleId: number
     * - date: YYYY-MM-DD
     */
    try {
        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Only teachers can create sessions");
        }

        const request = {
            ...req.body,
            profileId: req.user.profileId
        };

        const result = await classSessionService.createClassSession(request);

        res.status(201).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const getClassSessionController = async(req, res, next) => {
    /**
     * Get detailed session information with all attendances
     * Teacher only endpoint
     * 
     * Params:
     * - id: session ID
     */
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

        const result = await classSessionService.getClassSession(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const getClassSessionsListController = async(req, res, next) => {
    try {
        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Only teachers can view sessions list");
        }

        const classScheduleId = parseInt(req.params.classScheduleId);

        if (isNaN(classScheduleId)) {
            throw new ResponseError(400, "Invalid class schedule ID");
        }

        const request = {
            classScheduleId,
            profileId: req.user.profileId
        };

        const result = await classSessionService.getClassSessionsList(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const updateClassSessionController = async(req, res, next) => {
    /**
     * Update attendance records for a session
     * Teacher only endpoint
     * 
     * Params:
     * - id: session ID
     * 
     * Body:
     * - attendances: array of { attendanceId, status, notes }
     */
    try {
        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Only teachers can update attendance");
        }

        const sessionId = parseInt(req.params.id);

        if (isNaN(sessionId)) {
            throw new ResponseError(400, "Invalid session ID");
        }

        const { attendances } = req.body;

        if (!attendances || !Array.isArray(attendances)) {
            throw new ResponseError(400, "Attendances array is required");
        }

        const request = {
            sessionId,
            attendances,
            profileId: req.user.profileId
        };

        const result = await classSessionService.updateClassSession(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const getClassListClassTeacherController = async(req, res, next) => {
    try {
        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Only teachers can view their classes");
        }

        const request = {
            id: req.user.profileId
        };

        const result = await classSessionService.getClassListClassTeacher(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const getClassSessionActiveController = async(req, res, next) => {
    try {
        if (req.user.role !== "student") {
            throw new ResponseError(403, "Only students can view active sessions");
        }

        const request = {
            id: req.user.id,
            profileId: req.user.profileId,
            classId: req.user.classId
        };

        const result = await classSessionService.getClassSessionActive(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const getClassSessionsSummaryController = async(req, res, next) => {
    try {
        if (req.user.role !== "student") {
            throw new ResponseError(403, "Only students can view their summary");
        }

        const request = {
            id: req.user.id,
            classId: req.user.classId
        };

        const result = await classSessionService.getClassSessionsSummary(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

export default {
    // Schedule
    getClassScheduleByDateController,
    getWeeklyScheduleController,

    getScheduleByAcademicPeriodController,

    // Session Management (Teacher)
    createClassSessionController,
    getClassSessionController,
    getClassSessionsListController,
    updateClassSessionController,
    getClassListClassTeacherController,

    // Student
    getClassSessionActiveController,
    getClassSessionsSummaryController
};