import express from "express";
import { authMiddleware } from '../middleware/auth-middleware.js';
import sessionController from '../controllers/session.controller.js';
import scheduleController from "../controllers/schedule.controller.js";
import attendanceController from "../controllers/attendance.controller.js";

const adminRouter = new express.Router();
adminRouter.use(authMiddleware);

//session (1)
adminRouter.get('/admin/sessions/statistics',
    sessionController.getSessionStatisticsController);

//schedule (4)
adminRouter.post('/admin/schedules',
    scheduleController.createScheduleController);
adminRouter.patch('/admin/schedules/:id',
    scheduleController.updateScheduleController);
adminRouter.delete('/admin/schedules/:id',
    scheduleController.deleteScheduleController);
adminRouter.post('/admin/schedules/bulk',
    scheduleController.bulkCreateSchedulesController);

//attendance (1)
adminRouter.get('/admin/attendance/analytics',
    attendanceController.getAttendanceAnalyticsController);

/* Next, buat endpoint admin, untuk bulk registration user via csv
 - Harus megisi data table
 1. User
 2. Teacher/Student (Sesuai Role)
 */

export {
    adminRouter
}