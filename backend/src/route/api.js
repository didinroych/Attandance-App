import express from "express";
import userController from "../controllers/user-controller.js";
import adminController from "../controller/admin-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import classSessionController from "../controller/class-session-controller.js";
import academicPeriodeCon from "../controller/academic-periode-con.js";

const userRouter = new express.Router();
userRouter.use(authMiddleware);

// // =======================================
// // SCHEDULE ROUTES (Students & Teachers)
// // =======================================

// //GET /api/users/schedule/date?date=YYYY-MM-DD
// userRouter.get('/api/users/schedule/date',
//     classSessionController.getClassScheduleByDateController); //done
// //GET /api/users/schedule/weekly?startDate=YYYY-MM-DD (optional)
// userRouter.get('/api/users/schedule/weekly',
//     classSessionController.getWeeklyScheduleController); //done
// //GET /api/users/schedule/academic-period/:academicPeriodId
// userRouter.get('/api/users/schedule/academic-period/:academicPeriodId',
//     classSessionController.getScheduleByAcademicPeriodController); //done


// // ===============
// // STUDENT ROUTES
// // ===============
// // Get session yang aktif {tapi bisa pakai ini aja /api/users/schedule/date}
// userRouter.get('/api/student/sessions/active',
//     classSessionController.getClassSessionActiveController); //jadi di /users -- done
// // Get attendance summary for student
// userRouter.get('/api/student/attendance/summary',
//     classSessionController.getClassSessionsSummaryController); //jadi di /users --done
// // Update student profile
// userRouter.patch('/api/student/profile',
//     userController.updateStudent); //jadi di /users/profile --done
// //

// // ===============
// // TEACHER ROUTES - Class Management
// // ===============
// //Get list of classes taught by teacher
// userRouter.get('/api/teacher/classes',
//     classSessionController.getClassListClassTeacherController); //done -- /teacher/schedules
// //Get all sessions for a specific class schedule
// userRouter.get('/api/teacher/class/:classScheduleId/sessions',
//     classSessionController.getClassSessionsListController); //done
// //Create a new attendance session | @body { classScheduleId: number, date: string }
// userRouter.post('/api/teacher/sessions',
//     classSessionController.createClassSessionController); //done
// //Get detailed session information with all attendances
// userRouter.get('/api/teacher/session/:id',
//     classSessionController.getClassSessionController); //done
// //Update attendance records for a session | @body { attendances: [{ attendanceId: number, status: string, notes: string }] }
// userRouter.patch('/api/teacher/session/:id/attendance',
//     classSessionController.updateClassSessionController); //done
// // Update teacher profile
// userRouter.patch('/api/teacher/profile',
//     userController.updateTeacher); //done -- jadi /users/profile


// // =============
// // ADMIN ROUTES
// // =============
// // Update user role | @body { role: string } 
// userRouter.patch('/api/admin/users/:id/role',
//     adminController.updateRoleUser); //dihapus -- turn into //admin/user/:userId --edit profile user

// userRouter.get('/api/users/academic-periode',
//     academicPeriodeCon.getAcademicPeriodCon); //done

export {
    userRouter
}