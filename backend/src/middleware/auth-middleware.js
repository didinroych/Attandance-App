import { prismaClient } from "../application/database.js";

export const authMiddleware = async(req, res, next) => {
    const token = req.get('Authorization');
    if (!token) {
        res.status(401).json({
            errors: "Unauthorized"
        }).end();
    } else {
        const refreshTokenRecord = await prismaClient.refreshToken.findFirst({
            where: {
                token: token
            },
            include: {
                user: true
            }
        });

        if (!refreshTokenRecord) {
            res.status(401).json({
                errors: "Unauthorized"
            }).end();
        } else {
            req.user = refreshTokenRecord.user;
            next();
        }
    }
}