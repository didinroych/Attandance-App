import express from "express";
import { publicRouter } from "../routes/auth.routes.js";
import { errorMiddleware } from "../middleware/error-middleware.js";
import { userRouter } from "../route/api.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import { teacherRouter } from "../routes/teacher.routes.js";
import { adminRouter } from "../routes/admin.routes.js";
import { studentRouter } from "../routes/student.routes.js";
import { usersRouter } from "../routes/user.routes.js";

export const web = express();
web.use(cookieParser());
web.use(express.json());
web.use(cors());

web.use(publicRouter);
web.use(userRouter);
web.use(teacherRouter);
web.use(adminRouter);
web.use(studentRouter);
web.use(usersRouter);

web.use(errorMiddleware);