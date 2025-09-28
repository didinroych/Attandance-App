import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { loginUserValidation, registerUserValidation } from "../validation/auth-validation.js"
import { validate } from "../validation/validation.js"
import { getRoleSpecificData } from "./user-service.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


const register = async(request) => {
    const user = validate(registerUserValidation, request);

    const [existingUsername, existingEmail] = await Promise.all([
        prismaClient.user.findFirst({
            where: { username: user.username },
            select: { id: true }
        }),
        prismaClient.user.findFirst({
            where: { email: user.email },
            select: { id: true }
        })
    ]);

    const errors = {};

    if (existingUsername) {
        errors.username = "Username already used";
    }

    if (existingEmail) {
        errors.email = "Email already used";
    }

    if (Object.keys(errors).length > 0) {
        throw new ResponseError(400, "Validation failed", errors);
    }

    user.password = await bcrypt.hash(user.password, 10);

    return prismaClient.user.create({
        data: user,
        select: {
            username: true,
            email: true
        }
    });
}

const login = async(request) => {
    const loginRequest = validate(loginUserValidation, request);

    const user = await prismaClient.user.findFirst({
        where: {
            username: loginRequest.username
        },
        select: {
            id: true,
            username: true,
            password: true,
            role: true
        }
    });

    if (!user) {
        throw new ResponseError(403, "Username or Password Invalid")
    }

    const isPasswordValid = await bcrypt.compare(loginRequest.password, user.password);

    if (!isPasswordValid) {
        throw new ResponseError(401, "Username or Password Invalid")
    }

    const roleSpecificData = await getRoleSpecificData(user.id, user.role);
    let minimalRoleData = {};
    if (user.role === 'student' && roleSpecificData) {
        minimalRoleData = {
            studentId: roleSpecificData.studentId,
            classId: roleSpecificData.classId
        };
    } else if (user.role === 'teacher' && roleSpecificData) {
        console.log('roleSpecificData.id:', roleSpecificData.id);
        minimalRoleData = {
            idteacher: roleSpecificData.id,
            teacherId: roleSpecificData.teacherId
        };
        console.log('minimalRoleData after assignment:', minimalRoleData);
    }

    const accessTokenPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        ...minimalRoleData
    }
    const accessToken = jwt.sign(accessTokenPayload, process.env.ACCESS_TOKEN, { expiresIn: '30m' })

    const refreshTokenPayload = {
        id: user.id,
        username: user.username,
        role: user.role,
        ...minimalRoleData
    }
    const refreshToken = jwt.sign(refreshTokenPayload, process.env.REFRESH_TOKEN, { expiresIn: '7d' })

    const savedRefreshToken = await prismaClient.refreshToken.create({
        data: {
            userId: user.id,
            tokenHash: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isRevoked: false
        }
    });
    return {
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        },
        accessToken: accessToken,
        refreshToken: refreshToken
    };
}


const logout = async(refreshToken) => {
    if (!refreshToken) {
        throw new ResponseError(400, "Refresh Token Required");
    }

    await prismaClient.refreshToken.updateMany({
        where: {
            tokenHash: refreshToken
        },
        data: {
            isRevoked: true
        }
    });

    return { message: "Logout Successful" };

}

const renewAccesToken = async(refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN);

        const storedRefreshToken = await prismaClient.refreshToken.findFirst({
            where: {
                tokenHash: decoded.tokenHash,
                userId: decoded.id,
                isRevoked: false,
                expiresAt: {
                    gte: new Date()
                }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        role: true
                    }

                }
            }
        });

        if (!storedRefreshToken) {
            throw new ResponseError(403, "Invalid Refresh Token");
        }

        const roleSpecificData = await getRoleSpecificData(storedRefreshToken.user.id, storedRefreshToken.user.role);
        let minimalRoleData = {};
        if (storedRefreshToken.user.role === 'student' && roleSpecificData) {
            minimalRoleData = {
                studentId: roleSpecificData.studentId,
                classId: roleSpecificData.classId
            };
        } else if (storedRefreshToken.user.role === 'teacher' && roleSpecificData) {
            console.log('roleSpecificData.id:', roleSpecificData.id);
            minimalRoleData = {
                idteacher: roleSpecificData.id,
                teacherId: roleSpecificData.teacherId
            };
            console.log('minimalRoleData after assignment:', minimalRoleData);
        }

        const newAccessToken = jwt.sign({
            id: storedRefreshToken.user.id,
            username: storedRefreshToken.user.username,
            role: storedRefreshToken.user.role,
            ...minimalRoleData
        }, process.env.ACCESS_TOKEN, { expiresIn: '30m' })

        return {
            accessToken: newAccessToken,
            user: {
                id: storedRefreshToken.user.id,
                username: storedRefreshToken.user.username,
                role: storedRefreshToken.user.role,
                ...minimalRoleData
            }
        };

    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            throw new ResponseError(403, "Invalid or expired refresh token");
        }
        throw error;
    }
}


export default {
    register,
    login,
    logout,
    renewAccesToken
}