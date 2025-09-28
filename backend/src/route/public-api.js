import express from "express";
import healthController from "../controller/health-controller.js";
import authContoller from "../controller/auth-contoller.js";

const publicRouter = new express.Router();

publicRouter.get('/ping', healthController.ping);

//authentication
publicRouter.post('/api/auth/register', authContoller.registerController);
publicRouter.post('/api/auth/login', authContoller.loginController);
publicRouter.post('/api/auth/logout', authContoller.logoutController);
publicRouter.post('/api/auth/access-token', authContoller.refreshToken);

export {
    publicRouter
}