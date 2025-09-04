import { validate } from "../validation/validation.js";
import {
    getUserValidation,
    loginUserValidation,
    registerUserValidation,
    updateUserValidation
} from "../validation/user-validation.js";
import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from 'dotenv';
import { request, response } from "express";

const register = async(request) => {
    const user = validate(registerUserValidation, request);

    const countUser = await prismaClient.user.count({
        where: {
            username: user.username
        }
    });

    if (countUser === 1) {
        throw new ResponseError(400, "Username already exists");
    }

    user.password = await bcrypt.hash(user.password, 10);

    return prismaClient.user.create({
        data: user,
        select: {
            username: true,
            fullName: true
        }
    });
}

const login = async(request) => {
    const loginRequest = validate(loginUserValidation, request);

    const user = await prismaClient.user.findUnique({
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
        throw new ResponseError(401, "Username or password wrong");
    }

    const isPasswordValid = await bcrypt.compare(loginRequest.password, user.password);
    if (!isPasswordValid) {
        throw new ResponseError(401, "Username or password wrong");
    }

    const token = jwt.sign(user, process.env.ACCESS_TOKEN)

    const refreshToken = await prismaClient.refreshToken.upsert({
        where: {
            userId: user.id
        },
        update: {
            token: token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isRevoked: false
        },
        create: {
            userId: user.id,
            token: token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });


    return {
        user: {
            id: user.id,
            role: user.role
        },
        token: refreshToken.token
    };
}

const get = async(userIdentifier) => {
    userIdentifier = validate(getUserValidation, userIdentifier);

    const user = await prismaClient.user.findUnique({
        where: {
            id: userIdentifier
        },
        select: {
            username: true,
            fullName: true,
            email: true,
            phone: true,
            role: true
        }
    });

    if (!user) {
        throw new ResponseError(404, "user is not found");
    }

    return user;
}

const update = async(request) => {
    const user = validate(updateUserValidation, request);

    const totalUserInDatabase = await prismaClient.user.count({
        where: {
            id: user.id
        }
    });

    if (totalUserInDatabase !== 1) {
        throw new ResponseError(404, "user is not found");
    }

    const data = {};
    if (user.fullName) { data.fullName = user.fullName; }
    if (user.password) { data.password = await bcrypt.hash(user.password, 10); }
    if (user.username) { data.username = user.username; }
    if (user.email) { data.email = user.email; }

    return prismaClient.user.update({
        where: {
            id: user.id
        },
        data: data,
        select: {
            id: true,
            username: true,
            fullName: true,
            email: true
        }
    })
}

const updateStudent = async(request) => {
    const user = validate(updateUserValidation, request);

    const existingUser = await prismaClient.user.findUnique({
        where: {
            id: user.id
        },
        select: {
            role: true
        }
    })

    if (!existingUser) {
        throw new ResponseError(404, "User is not found");
    }

    console.log(existingUser.role)
    if (existingUser.role !== "STUDENT") {
        throw new ResponseError(403, `User is not Student`);
    }


    const data = {};
    data.userId = user.id
    if (user.nis) { data.nis = user.nis }
    if (user.grade) { data.grade = user.grade }

    return prismaClient.student.upsert({
        where: {
            userId: user.id
        },
        create: data,
        update: data,
        select: {
            userId: true,
            nis: true,
            grade: true
        }
    })
}

const updateTeacher = async(request) => {
    const user = validate(updateUserValidation, request);

    const existingUser = await prismaClient.user.findUnique({
        where: {
            id: user.id
        },
        select: {
            role: true
        }
    })

    if (!existingUser) {
        throw new ResponseError(404, "User is not found");
    }
    if (existingUser.role !== "TEACHER") {
        throw new ResponseError(403, "User is not TEACHER");
    }

    const data = {};
    data.userId = user.id
    if (user.nip) { data.nip = user.nip }

    return prismaClient.teacher.upsert({
        where: {
            userId: user.id
        },
        create: data,
        update: data,
        select: {
            userId: true,
            nip: true
        }
    })
}

// const logout = async(username) => {
//     username = validate(getUserValidation, username);

//     const user = await prismaClient.user.findUnique({
//         where: {
//             username: username
//         }
//     });

//     if (!user) {
//         throw new ResponseError(404, "user is not found");
//     }

//     return prismaClient.user.update({
//         where: {
//             username: username
//         },
//         data: {
//             token: null
//         },
//         select: {
//             username: true
//         }
//     })
// }

export default {
    register,
    login,
    get,
    update,
    updateStudent,
    updateTeacher,
    // logout
}