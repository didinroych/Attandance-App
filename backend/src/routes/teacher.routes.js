import express from "express";
import sessionController from '../controllers/session.controller.js';
import { authMiddleware } from '../middleware/auth-middleware.js';
import scheduleController from "../controllers/schedule.controller.js";
import attendanceController from "../controllers/attendance.controller.js";

const teacherRouter = new express.Router();
teacherRouter.use(authMiddleware);

//session (7)
teacherRouter.post('/teacher/sessions',
    sessionController.createSessionController); //done
teacherRouter.get('/teacher/sessions/:id',
    sessionController.getSessionController); //done
teacherRouter.get('/teacher/schedule/:scheduleId/sessions',
    sessionController.getSessionsListController); //done
teacherRouter.patch('/teacher/sessions/:id/status',
    sessionController.updateSessionStatusController);
//schedule (1)
teacherRouter.get('/teacher/schedules',
    scheduleController.getTeacherSchedulesController); //done

//attendance (3) => check attendance service logic again
teacherRouter.post('/teacher/sessions/:sessionId/attendance',
    attendanceController.markAttendanceController); //done 
teacherRouter.get('/teacher/attendance/report/export',
    attendanceController.exportAttendanceReportController);

//Total ada 11 endpoint
export {
    teacherRouter
}