import express from "express";
import { authMiddleware } from '../middleware/auth-middleware.js';
import attendanceController from "../controllers/attendance.controller.js";

const studentRouter = new express.Router();
studentRouter.use(authMiddleware);

// attendance (2)
studentRouter.post('/api/student/attendance/check-in',
    attendanceController.studentCheckInController); //ini buat gantiin face-attendance, nanti diganti


export {
    studentRouter
}