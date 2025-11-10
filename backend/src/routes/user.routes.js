import express from "express";
import { authMiddleware } from '../middleware/auth-middleware.js';
import scheduleController from '../controllers/schedule.controller.js';
import attendanceController from "../controllers/attendance.controller.js";
import sessionController from "../controllers/session.controller.js";
import academicController from "../controllers/academic-periode.controller.js";
import userController from "../controllers/user-controller.js";

const usersRouter = new express.Router();
usersRouter.use(authMiddleware);

//profile
usersRouter.get('/api/users/profile', userController.getUserProfile); //done
usersRouter.put('/api/users/update', userController.updatedUser); //User ga bisa edit - so hapus saja

//schedule (4)
usersRouter.get('/api/users/schedule/date',
    scheduleController.getScheduleByDateController); //done
usersRouter.get('/api/users/schedule/weekly',
    scheduleController.getWeeklyScheduleController); //done
usersRouter.get('/api/users/schedule/academic-period/:academicPeriodId',
    scheduleController.getScheduleByAcademicPeriodController); //done

//attendance (1)
usersRouter.get('/api/users/attendance/summary/',
    attendanceController.getAttendanceSummaryController); //done

//sessions (1)
usersRouter.get('/api/users/sessions/last',
    sessionController.getLastSessionsController); //done - ongoing for students, ongoing+completed for teachers

//academic-periode 
usersRouter.get('/api/users/academic-periode',
    academicController.getAcademicPeriodCon); //done

export {
    usersRouter
}