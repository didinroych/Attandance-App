import { ResponseError } from "../error/response-error.js";

const errorMiddleware = async(err, req, res, next) => {
    if (!err) {
        next();
        return;
    }

    if (err instanceof ResponseError) {
        res.status(err.status).json({
            message: err.message,
            ...(err.errors && { errors: err.errors })
        }).end();
    } else {
        res.status(500).json({
            errors: err.message
        }).end();
    }
}

export {
    errorMiddleware
}