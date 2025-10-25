import express from "express";
import { authMiddleware } from '../middleware/auth-middleware.js';
import sessionController from '../controllers/session.controller.js';
import attendanceController from "../controllers/attendance.controller.js";

const studentRouter = new express.Router();
studentRouter.use(authMiddleware);

// attendance (2)
studentRouter.post('/api/student/attendance/check-in',
    attendanceController.studentCheckInController);
studentRouter.get('/api/users/attendance/student/:studentId/history',
    attendanceController.getStudentAttendanceHistoryController);

//Total ada 2 endpoint   
export {
    studentRouter
}