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
adminRouter.post('/api/admin/schedules',
    scheduleController.createScheduleController);
adminRouter.patch('/api/admin/schedules/:id',
    scheduleController.updateScheduleController);
adminRouter.delete('/api/admin/schedules/:id',
    scheduleController.deleteScheduleController);
adminRouter.post('/api/admin/schedules/bulk',
    scheduleController.bulkCreateSchedulesController);

//attendance (1)
adminRouter.get('/api/admin/attendance/analytics',
    attendanceController.getAttendanceAnalyticsController);


//Total ada 6 endpoint

export {
    adminRouter
}