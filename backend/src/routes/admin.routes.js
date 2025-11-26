import express from "express";
import { authMiddleware } from '../middleware/auth-middleware.js';
import sessionController from '../controllers/session.controller.js';
import scheduleController from "../controllers/schedule.controller.js";
import attendanceController from "../controllers/attendance.controller.js";
import dashboardAdminController from "../controllers/dashboard-admin.controller.js";
import UserManagementController from "../controllers/User-management.controller.js";
import subjectController from "../controllers/subject.controller.js";
import academicPeriodeController from "../controllers/academic-periode.controller.js";
import classController from "../controllers/class.controller.js";
import schedulerTestController from "../controllers/scheduler-test.controller.js";
import faceController from "../controllers/face.controller.js";


const adminRouter = new express.Router();
adminRouter.use(authMiddleware);

//dashboard (1)
adminRouter.get('/admin/dashboard/statistics',
    dashboardAdminController.getDashboardStatisticsController);

//user management (5)
adminRouter.get('/admin/users',
    UserManagementController.getUserListController);
adminRouter.post('/admin/users/bulk',
    UserManagementController.bulkCreateUsersController);
adminRouter.get('/admin/users/search',
    UserManagementController.searchUsersController);
adminRouter.patch('/admin/users/:userId',
    UserManagementController.updateUserController);
adminRouter.delete('/admin/users/:userId',
    UserManagementController.deleteUserController);

//subject management (5)
adminRouter.get('/admin/subjects',
    subjectController.getSubjectListController);
adminRouter.get('/admin/subjects/:id',
    subjectController.getSubjectByIdController);
adminRouter.post('/admin/subjects',
    subjectController.createSubjectController);
adminRouter.patch('/admin/subjects/:id',
    subjectController.updateSubjectController);
adminRouter.delete('/admin/subjects/:id',
    subjectController.deleteSubjectController);

//academic period management (5)
adminRouter.get('/admin/academic-periods',
    academicPeriodeController.getAcademicPeriodListController);
adminRouter.get('/admin/academic-periods/:id',
    academicPeriodeController.getAcademicPeriodByIdController);
adminRouter.post('/admin/academic-periods',
    academicPeriodeController.createAcademicPeriodController);
adminRouter.patch('/admin/academic-periods/:id',
    academicPeriodeController.updateAcademicPeriodController);
adminRouter.delete('/admin/academic-periods/:id',
    academicPeriodeController.deleteAcademicPeriodController);

//class management (5)
adminRouter.get('/admin/classes',
    classController.getClassListController);
adminRouter.get('/admin/classes/:id',
    classController.getClassByIdController);
adminRouter.post('/admin/classes',
    classController.createClassController);
adminRouter.patch('/admin/classes/:id',
    classController.updateClassController);
adminRouter.delete('/admin/classes/:id',
    classController.deleteClassController);

//schedule (6)
adminRouter.get('/admin/schedules',
    scheduleController.getScheduleListController);
adminRouter.get('/admin/schedules/:id',
    scheduleController.getScheduleByIdController);
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
    attendanceController.getAttendanceAnalyticsController); //iki hapus ae next

//session (1)
adminRouter.get('/admin/sessions/statistics',
    sessionController.getSessionStatisticsController); //iki hapus ae next

// Scheduler test endpoints (FOR TESTING ONLY)
adminRouter.post('/admin/scheduler/complete-ongoing',
    schedulerTestController.manualCompleteOngoingController);
adminRouter.post('/admin/scheduler/finalize-old',
    schedulerTestController.manualFinalizeOldController);

// ===== FACE RECOGNITION ENDPOINTS =====
// Bulk register student faces (admin only)
adminRouter.post('/admin/students/register-faces-bulk',
    faceController.bulkRegisterFacesController);

export {
    adminRouter
}