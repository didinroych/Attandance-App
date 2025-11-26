import { ResponseError } from "../error/response-error.js";
import scheduleService from "../services/schedule.service.js";

// GET /api/admin/schedules
// Get list of schedules with pagination and filters
const getScheduleListController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can view schedule list");
        }

        const request = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20,
            search: req.query.search,
            sortBy: req.query.sortBy || 'dayOfWeek',
            sortOrder: req.query.sortOrder || 'asc',
            classId: req.query.classId ? parseInt(req.query.classId) : undefined,
            subjectId: req.query.subjectId ? parseInt(req.query.subjectId) : undefined,
            teacherId: req.query.teacherId ? parseInt(req.query.teacherId) : undefined,
            academicPeriodId: req.query.academicPeriodId ? parseInt(req.query.academicPeriodId) : undefined
        };

        const result = await scheduleService.getScheduleList(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// GET /api/admin/schedules/:id
// Get single schedule by ID with details
const getScheduleByIdController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can view schedule details");
        }

        const scheduleId = parseInt(req.params.id);

        if (isNaN(scheduleId)) {
            throw new ResponseError(400, "Invalid schedule ID");
        }

        const result = await scheduleService.getScheduleById(scheduleId);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// GET /api/users/schedule/date?date=YYYY-MM-DD
const getScheduleByDateController = async(req, res, next) => {
    try {
        const { date } = req.query;

        if (!date) {
            throw new ResponseError(400, "Date parameter is required");
        }

        const request = {
            date,
            profileId: req.user.profileId,
            role: req.user.role
        };

        const result = await scheduleService.getScheduleByDate(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// GET /api/users/schedule/weekly?startDate=YYYY-MM-DD
const getWeeklyScheduleController = async(req, res, next) => {
    try {
        const { startDate } = req.query;

        const request = {
            startDate: startDate || new Date().toISOString().split('T')[0],
            profileId: req.user.profileId,
            role: req.user.role
        };

        const result = await scheduleService.getWeeklySchedule(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// GET /api/users/schedule/academic-period/:academicPeriodId
const getScheduleByAcademicPeriodController = async(req, res, next) => {
    try {
        const academicPeriodId = parseInt(req.params.academicPeriodId);

        if (isNaN(academicPeriodId)) {
            throw new ResponseError(400, "Invalid academic period ID");
        }

        const request = {
            academicPeriodId,
            profileId: req.user.profileId,
            role: req.user.role,
            classId: req.user.classId
        };

        const result = await scheduleService.getScheduleByAcademicPeriod(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// GET /api/teacher/schedules
const getTeacherSchedulesController = async(req, res, next) => {
    try {
        if (req.user.role !== "teacher" && req.user.role !== "admin") {
            throw new ResponseError(403, "Only teachers and admins can view teacher schedules");
        }

        const teacherId = req.user.role === "admin" && req.query.teacherId ?
            parseInt(req.query.teacherId) :
            req.user.profileId;

        const academicPeriodId = req.query.academicPeriodId ?
            parseInt(req.query.academicPeriodId) :
            undefined;

        const isActive = req.query.isActive !== undefined ?
            req.query.isActive === 'true' :
            undefined;

        const request = {
            teacherId,
            academicPeriodId,
            isActive
        };

        const result = await scheduleService.getTeacherSchedules(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// POST /api/admin/schedules (Single)
const createScheduleController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can create schedules");
        }

        const result = await scheduleService.createSchedule(req.body);

        res.status(201).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// PATCH /api/admin/schedules/:id
const updateScheduleController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can update schedules");
        }

        const scheduleId = parseInt(req.params.id);

        if (isNaN(scheduleId)) {
            throw new ResponseError(400, "Invalid schedule ID");
        }

        const request = {
            scheduleId,
            updates: req.body
        };

        const result = await scheduleService.updateSchedule(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// DELETE /api/admin/schedules/:id?softDelete=true
const deleteScheduleController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can delete schedules");
        }

        const scheduleId = parseInt(req.params.id);

        if (isNaN(scheduleId)) {
            throw new ResponseError(400, "Invalid schedule ID");
        }

        const softDelete = req.query.softDelete === 'true';

        const request = {
            scheduleId,
            softDelete
        };

        const result = await scheduleService.deleteSchedule(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

// POST /api/admin/schedules/bulk
const bulkCreateSchedulesController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can bulk create schedules");
        }

        const result = await scheduleService.bulkCreateSchedules(req.body);

        res.status(201).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};
export default {
    getScheduleListController,
    getScheduleByIdController,
    getScheduleByDateController,
    getWeeklyScheduleController,
    getScheduleByAcademicPeriodController,
    getTeacherSchedulesController,
    createScheduleController,
    updateScheduleController,
    deleteScheduleController,
    bulkCreateSchedulesController,
};