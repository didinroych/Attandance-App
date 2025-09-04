import express from "express";
import userController from "../controller/user-controller.js";
import healthController from "../controller/health-controller.js";
import authContoller from "../controller/auth-contoller.js";

const publicRouter = new express.Router();

publicRouter.post('/api/users', userController.register);
publicRouter.post('/api/users/login', userController.login);
publicRouter.get('/ping', healthController.ping);

//authentication
publicRouter.post('/api/auth/register', authContoller.registerController);
publicRouter.post('/api/auth/login', authContoller.loginController);
publicRouter.post('/api/auth/refresh-token', authContoller.refreshToken);

export {
    publicRouter
}