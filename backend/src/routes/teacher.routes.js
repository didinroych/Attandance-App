import express from "express";
import sessionController from '../controllers/session.controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import scheduleController from "../controllers/schedule.controller.js";
import attendanceController from "../controllers/attendance.controller.js";

const teacherRouter = new express.Router();
teacherRouter.use(authMiddleware);

//session (7)
teacherRouter.post('/teacher/sessions',
    sessionController.createSessionController);
teacherRouter.get('/teacher/sessions/:id',
    sessionController.getSessionController);
teacherRouter.get('/teacher/schedule/:scheduleId/sessions',
    sessionController.getSessionsListController);
teacherRouter.patch('/teacher/sessions/:id/status',
    sessionController.updateSessionStatusController);
teacherRouter.post('/teacher/sessions/:id/end',
    sessionController.endSessionController);
teacherRouter.post('/teacher/sessions/:id/cancel',
    sessionController.cancelSessionController);

//schedule (1)
teacherRouter.get('/api/teacher/schedules',
    scheduleController.getTeacherSchedulesController);

//attendance (3)
teacherRouter.post('/api/teacher/sessions/:sessionId/attendance',
    attendanceController.markAttendanceController);
teacherRouter.patch('/api/teacher/attendance/:id',
    attendanceController.markSingleAttendanceController);
teacherRouter.get('/api/teacher/attendance/report/export',
    attendanceController.exportAttendanceReportController);

//Total ada 11 endpoint
export {
    teacherRouter
}