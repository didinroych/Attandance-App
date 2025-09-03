import express from "express";
import userController from "../controller/user-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";

const userRouter = new express.Router();
userRouter.use(authMiddleware);

// User API
userRouter.get('/api/users/current', userController.getCurrentUser);
userRouter.patch('/api/users/current', userController.update);
userRouter.patch('/api/users/current/student', userController.updateStudent);
userRouter.patch('/api/users/current/teacher', userController.updateTeacher);
userRouter.delete('/api/users/logout', userController.logout);



export {
    userRouter
}