import { ResponseError } from "../error/response-error.js";
import attendanceService from "../services/attendance.service.js";
import attendanceCheckInService from "../services/attendance-checkin.service.js";

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

// POST /api/student/attendance/check-in
// Student self check-in using face recognition
const studentCheckInController = async(req, res, next) => {
    try {
        if (req.user.role !== "student") {
            throw new ResponseError(403, "Only students can check in");
        }

        // Check if image file exists
        if (!req.files || !req.files.image) {
            throw new ResponseError(400, 'Image file is required for face verification');
        }

        const imageFile = req.files.image;

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedMimeTypes.includes(imageFile.mimetype)) {
            throw new ResponseError(400, 'Invalid image format. Allowed formats: JPEG, JPG, PNG');
        }

        // Session ID is optional - if not provided, find the ongoing session
        const sessionId = req.body.sessionId ? parseInt(req.body.sessionId) : null;

        const request = {
            sessionId: sessionId,
            studentId: req.user.profileId,
            imageBuffer: imageFile.data
        };

        const result = await attendanceCheckInService.studentCheckIn(request);

        if (!result.success) {
            return res.status(200).json({
                success: false,
                message: result.message,
                verified: result.verified || false,
                hasSession: result.hasSession !== undefined ? result.hasSession : true,
                alreadyCheckedIn: result.alreadyCheckedIn || false,
                sessionStatus: result.sessionStatus,
                attendance: result.attendance
            });
        }

        res.status(200).json({
            success: true,
            message: result.message,
            data: result.data
        });
    } catch (e) {
        next(e);
    }
};

// GET /api/users/attendance/summary
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