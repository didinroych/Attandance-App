import express from "express";
import { authMiddleware } from '../middleware/auth-middleware.js';
import attendanceController from "../controllers/attendance.controller.js";

const studentRouter = new express.Router();
studentRouter.use(authMiddleware);

// Student attendance check-in with face recognition
// POST /api/student/attendance/check-in
// Requires: image file (JPEG/PNG), optional sessionId
studentRouter.post('/api/student/attendance/check-in',
    attendanceController.studentCheckInController);

export {
    studentRouter
}