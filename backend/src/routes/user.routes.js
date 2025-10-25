import express from "express";
import { authMiddleware } from '../middleware/auth-middleware.js';
import scheduleController from '../controllers/schedule.controller.js';
import attendanceController from "../controllers/attendance.controller.js";
import sessionController from "../controllers/session.controller.js";

const usersRouter = new express.Router();
usersRouter.use(authMiddleware);

//schedule (3)
usersRouter.get('/users/schedule/date',
    scheduleController.getScheduleByDateController);
usersRouter.get('/users/schedule/weekly',
    scheduleController.getWeeklyScheduleController);
usersRouter.get('/users/schedule/academic-period/:academicPeriodId',
    scheduleController.getScheduleByAcademicPeriodController);

//attendance (2)
usersRouter.get('/api/users/attendance/session/:sessionId',
    attendanceController.getAttendanceBySessionController);
usersRouter.get('/api/users/attendance/summary/:type/:id',
    attendanceController.getAttendanceSummaryController);

//sessions (1)
usersRouter.get('/teacher/sessions/active',
    sessionController.getActiveSessionsController);

//Total ada 6 endpoint

//Total endpoint re-factor (session, attendance, schedule) = 10 (teacher) + 2 (student) + 6 (admin) + 6 (users) = 24 endpoint
export {
    usersRouter
}