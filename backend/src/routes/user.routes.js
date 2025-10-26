import express from "express";
import { authMiddleware } from '../middleware/auth-middleware.js';
import scheduleController from '../controllers/schedule.controller.js';
import attendanceController from "../controllers/attendance.controller.js";
import sessionController from "../controllers/session.controller.js";
import academicController from "../controllers/academic.controller.js";
import userController from "../controllers/user-controller.js";

const usersRouter = new express.Router();
usersRouter.use(authMiddleware);

//profile
usersRouter.get('/api/users/profile', userController.getUserProfile);
usersRouter.put('/api/users/update', userController.updatedUser);

//schedule (3)
usersRouter.get('/users/schedule/date',
    scheduleController.getScheduleByDateController);
usersRouter.get('/users/schedule/weekly',
    scheduleController.getWeeklyScheduleController);
usersRouter.get('/users/schedule/academic-period/:academicPeriodId',
    scheduleController.getScheduleByAcademicPeriodController);

//attendance (2)
usersRouter.get('/users/attendance/session/:sessionId',
    attendanceController.getAttendanceBySessionController);
usersRouter.get('/users/attendance/summary/:type/:id',
    attendanceController.getAttendanceSummaryController);
usersRouter.get('/users/attendance/student/:studentId/history',
    attendanceController.getStudentAttendanceHistoryController);

//sessions (1)
usersRouter.get('/users/sessions/active',
    sessionController.getActiveSessionsController);

//academic-periode 
usersRouter.get('/users/academic-periode',
    academicController.getAcademicPeriodCon);


//Total ada 6 endpoint

//Total endpoint re-factor (session, attendance, schedule) = 9 (teacher) + 2 (student) + 6 (admin) + 6 (users) = 23 endpoint
export {
    usersRouter
}