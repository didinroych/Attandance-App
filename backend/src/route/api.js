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
userRouter.get("/api/users/class-schedule", classSessionController.getClassSchedule);
userRouter.post('/api/teacher/class-sessions', classSessionController.createClassSession);
userRouter.get('/api/teacher/class-session/:id/attendance', classSessionController.getClassSessionController);
userRouter.post('/api/teacher/class-session/:id/attendance/update', classSessionController.updateClassSessionContoller);
userRouter.get('/api/users/class-session/active', classSessionController.getClassSessionActive);
userRouter.get('/api/users/class-session/summary', classSessionController.getClassSessionsSummary);
userRouter.get('/api/teacher/classes', classSessionController.getClassListClassTeacher);
userRouter.get('/api/teahcer/class/:classScheduleId/sessions', classSessionController.getClassSessionsListController);

//Student API
userRouter.put('/api/users/update/student', userController.updateStudent);


//teacher API

userRouter.put('/api/users/update/teacher', userController.updateTeacher);

//admin API
userRouter.put('/api/admin/users/:id/role', adminController.updateRoleUser);

//admin and teacher API

// User API
userRouter.patch('/api/users/current/student', userController.updateStudent);
userRouter.patch('/api/users/current/teacher', userController.updateTeacher);

export {
    userRouter
}