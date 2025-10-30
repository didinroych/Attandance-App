import { ResponseError } from "../error/response-error.js";
import attendanceService from "../services/attendance.service.js";

// POST /api/teacher/sessions/:sessionId/attendance
const markAttendanceController = async(req, res, next) => {
    try {
        if (req.user.role !== "teacher") {
            throw new ResponseError(403, "Only teachers can mark attendance");
        }

        const sessionId = parseInt(req.params.sessionId);

        if (isNaN(sessionId)) {
            throw new ResponseError(400, "Invalid session ID");
        }

        const request = {
            sessionId,
            attendances: req.body.attendances,
            profileId: req.user.profileId
        };

        const result = await attendanceService.markAttendance(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// POST /api/student/attendance/check-in == Ini G aktif
const studentCheckInController = async(req, res, next) => {
    try {
        if (req.user.role !== "student") {
            throw new ResponseError(403, "Only students can check in");
        }

        const request = {
            sessionId: req.body.sessionId,
            studentId: req.user.profileId,
            method: req.body.method || 'face_recognition',
            faceConfidence: req.body.faceConfidence
        };

        const result = await attendanceService.studentCheckIn(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

const getAttendanceSummaryController = async(req, res, next) => {
    try {
        const request = {
            profileId: req.user.profileId,
            role: req.user.role
        };

        const result = await attendanceService.getAttendanceSummary(request);
        res.status(200).json({ data: result });
    } catch (e) {
        next(e);
    }
};

// GET /api/teacher/attendance/report/export
const exportAttendanceReportController = async(req, res, next) => {
    try {
        if (req.user.role !== "teacher" && req.user.role !== "admin") {
            throw new ResponseError(403, "Only teachers and admins can export reports");
        }

        const classId = parseInt(req.query.classId);

        if (isNaN(classId)) {
            throw new ResponseError(400, "Class ID is required");
        }

        if (!req.query.startDate || !req.query.endDate) {
            throw new ResponseError(400, "Start date and end date are required");
        }

        const request = {
            classId,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            format: req.query.format || 'json'
        };

        const result = await attendanceService.exportAttendanceReport(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

//GET /api/admin/attendance/analytics
const getAttendanceAnalyticsController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can view analytics");
        }

        const classId = parseInt(req.query.classId);

        if (isNaN(classId)) {
            throw new ResponseError(400, "Class ID is required");
        }

        if (!req.query.startDate || !req.query.endDate) {
            throw new ResponseError(400, "Start date and end date are required");
        }

        const filters = {
            classId,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            groupBy: req.query.groupBy || 'day'
        };

        const result = await attendanceService.getAttendanceAnalytics(filters);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};



export default {
    markAttendanceController,
    studentCheckInController,
    getAttendanceSummaryController,
    exportAttendanceReportController,
    getAttendanceAnalyticsController
};