import express from "express";
import userController from "../controller/user-controller.js";
import authContoller from "../controller/auth-contoller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";


const userRouter = new express.Router();
userRouter.use(authMiddleware);

// User API
userRouter.get('/api/users/current', userController.getCurrentUser);
userRouter.patch('/api/users/current', userController.update);
userRouter.patch('/api/users/current/student', userController.updateStudent);
userRouter.patch('/api/users/current/teacher', userController.updateTeacher);


userRouter.post('/api/auth/logout', authContoller.logoutController);



export {
    userRouter
}