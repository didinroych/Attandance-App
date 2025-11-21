import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";

import { publicRouter } from "../routes/auth.routes.js";
import { errorMiddleware } from "../middleware/error-middleware.js";
import { teacherRouter } from "../routes/teacher.routes.js";
import { adminRouter } from "../routes/admin.routes.js";
import { studentRouter } from "../routes/student.routes.js";
import { usersRouter } from "../routes/user.routes.js";

export const web = express();
web.use(cookieParser());
web.use(express.json());

web.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
    abortOnLimit: true,
    createParentPath: true,
    useTempFiles: false
}));

web.use(cors({
    origin: true,
    credentials: true,
}));

web.use(publicRouter);
web.use(teacherRouter);
web.use(adminRouter);
web.use(studentRouter);
web.use(usersRouter);

web.use(errorMiddleware);