import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { publicRouter } from "../routes/auth.routes.js";
import { errorMiddleware } from "../middleware/error-middleware.js";
import { userRouter } from "../route/api.js";
import { teacherRouter } from "../routes/teacher.routes.js";
import { adminRouter } from "../routes/admin.routes.js";
import { studentRouter } from "../routes/student.routes.js";
import { usersRouter } from "../routes/user.routes.js";

export const web = express();
web.use(cookieParser());
web.use(express.json());

const allowedOrigins = [];

if (process.env.NODE_ENV === "development") {
    allowedOrigins.push("http://localhost:3000");
}
if (process.env.NODE_ENV === "staging") {
    allowedOrigins.push("https://staging.redevoid.site");
}
if (process.env.NODE_ENV === "production") {
    allowedOrigins.push("https://redevoid.site");
}

web.use(
    cors({
        origin: function(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                return callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

web.use(publicRouter);
web.use(userRouter);
web.use(teacherRouter);
web.use(adminRouter);
web.use(studentRouter);
web.use(usersRouter);

web.use(errorMiddleware);