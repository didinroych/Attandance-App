import express from "express";
import sessionController from '../controllers/session.controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import scheduleController from "../controllers/schedule.controller.js";
import attendanceController from "../controllers/attendance.controller.js";

const teacherRouter = new express.Router();
teacherRouter.use(authMiddleware);

//session (4)
teacherRouter.post('/teacher/sessions',
    sessionController.createSessionController); //done
teacherRouter.get('/teacher/sessions/:id',
    sessionController.getSessionController); //done
teacherRouter.get('/teacher/schedule/:scheduleId/sessions',
    sessionController.getSessionsListController); //done
teacherRouter.patch('/teacher/sessions/:id/status',
    sessionController.updateSessionStatusController); //refactor ke jam, so after 1 day status == completed

//schedule (1)
teacherRouter.get('/api/teacher/schedules',
    scheduleController.getTeacherSchedulesController); //done

//attendance (2) => check attendance service logic again
teacherRouter.post('/api/teacher/sessions/:sessionId/attendance',
    attendanceController.markAttendanceController); //done
teacherRouter.get('/api/teacher/attendance/report/export',
    attendanceController.exportAttendanceReportController); //done baru export ke json

//Total ada 7 endpoint
export {
    teacherRouter
}