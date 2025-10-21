import express from "express";
import userController from "../controller/user-controller.js";
import authContoller from "../controller/auth-contoller.js";
import adminController from "../controller/admin-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import classSessionController from "../controller/class-session-controller.js";

const userRouter = new express.Router();
userRouter.use(authMiddleware);

userRouter.get('/api/users/profile', userController.getUserProfile);
userRouter.put('/api/users/update', userController.updatedUser);

// =======================================
// SCHEDULE ROUTES (Students & Teachers)
// =======================================

//GET /api/users/schedule/date?date=YYYY-MM-DD
userRouter.get('/api/users/schedule/date', classSessionController.getClassScheduleByDateController);
//GET /api/users/schedule/weekly?startDate=YYYY-MM-DD (optional)
userRouter.get('/api/users/schedule/weekly', classSessionController.getWeeklyScheduleController);
//GET /api/users/schedule/academic-period/:academicPeriodId
userRouter.get('/api/users/schedule/academic-period/:academicPeriodId', classSessionController.getScheduleByAcademicPeriodController);


// ===============
// STUDENT ROUTES
// ===============
// Get session yang aktif {tapi bisa pakai ini aja /api/users/schedule/date}
userRouter.get('/api/student/sessions/active', classSessionController.getClassSessionActiveController);
// Get attendance summary for student
userRouter.get('/api/student/attendance/summary', classSessionController.getClassSessionsSummaryController);
// Update student profile
userRouter.patch('/api/student/profile', userController.updateStudent);
//

// ===============
// TEACHER ROUTES - Class Management
// ===============
//Get list of classes taught by teacher
userRouter.get('/api/teacher/classes', classSessionController.getClassListClassTeacherController);
//Get all sessions for a specific class schedule
userRouter.get('/api/teacher/class/:classScheduleId/sessions', classSessionController.getClassSessionsListController);
//Create a new attendance session | @body { classScheduleId: number, date: string }
userRouter.post('/api/teacher/sessions', classSessionController.createClassSessionController);
//Get detailed session information with all attendances
userRouter.get('/api/teacher/session/:id', classSessionController.getClassSessionController);
//Update attendance records for a session | @body { attendances: [{ attendanceId: number, status: string, notes: string }] }
userRouter.patch('/api/teacher/session/:id/attendance', classSessionController.updateClassSessionController);
// Update teacher profile
userRouter.patch('/api/teacher/profile', userController.updateTeacher);


// =============
// ADMIN ROUTES
// =============
// Update user role | @body { role: string } 
userRouter.patch('/api/admin/users/:id/role', adminController.updateRoleUser);

export {
    userRouter
}