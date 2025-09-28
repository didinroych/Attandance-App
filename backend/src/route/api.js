import express from "express";
import userController from "../controller/user-controller.js";
import authContoller from "../controller/auth-contoller.js";
import adminController from "../controller/admin-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import classSessionController from "../controller/class-session-controller.js";

const userRouter = new express.Router();
userRouter.use(authMiddleware);

// User API
userRouter.patch('/api/users/current/student', userController.updateStudent);
userRouter.patch('/api/users/current/teacher', userController.updateTeacher);

//user API

userRouter.get('/api/users/profile', userController.getUserProfile);
userRouter.put('/api/users/update', userController.updatedUser);
userRouter.get("/api/users/class-schedule", classSessionController.getClassSessions);

//Student API
userRouter.put('/api/users/update/student', userController.updateStudent);


//teacher API
userRouter.put('/api/users/update/teacher', userController.updateTeacher);

//admin API
userRouter.put('/api/admin/users/:id/role', adminController.updateRoleUser);

//admin and teacher API



export {
    userRouter
}