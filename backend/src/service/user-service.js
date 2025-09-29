import { validate } from "../validation/validation.js";
import {
    getUserValidation,
    updateRoleByAdmin,
    updateStudentProfileValidation,
    updateTeacherProfileValidation,
    updateUserValidation
} from "../validation/user-validation.js";
import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getRoleSpecificData = async(userId, role) => {
    console.log("Ini Get Role", userId)
    if (role === "student") {
        const student = await prismaClient.student.findFirst({
            where: {
                userId: userId
            },
            select: {
                id: true,
                studentId: true,
                fullName: true,
                classId: true,
                phone: true,
                address: true,
                dateOfBirth: true,
                parentPhone: true
            }
        });

        return student ? {
            profileId: student.id,
            studentId: student.studentId,
            fullName: student.fullName,
            classId: student.classId,
            phone: student.phone,
            address: student.address,
            dateOfBirth: student.dateOfBirth,
            parentPhone: student.parentPhone
        } : {};

    } else if (role === "teacher") {
        const teacher = await prismaClient.teacher.findFirst({
            where: {
                userId: userId
            },
            select: {
                id: true,
                teacherId: true,
                fullName: true,
                phone: true,
                address: true
            }
        });

        return teacher ? {
            profileId: teacher.id,
            teacherId: teacher.teacherId,
            fullName: teacher.fullName,
            phone: teacher.phone,
            address: teacher.address
        } : {};
    }

    return {};
};

const getUser = async(request) => {
    console.log("Ini Id Request", request)
    const validatedUser = validate(getUserValidation, request);


    const user = await prismaClient.user.findFirst({
        where: {
            id: validatedUser
        },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
        }
    });

    console.log("Ini", user.id)

    if (!user) {
        throw new ResponseError(404, "User not found");
    }

    const roleSpecificData = await getRoleSpecificData(user.id, user.role);

    return {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            ...roleSpecificData
        }
    };
};

const updateUser = async(request) => {
    const user = validate(updateUserValidation, request);

    const existingUser = await prismaClient.user.findFirst({
        where: {
            id: user.id
        },
        select: {
            id: true,
            username: true,
            email: true,
            password: true
        }
    });

    if (!existingUser) {
        throw new ResponseError(404, "User is not Found");
    }

    const data = {};

    if (user.username) { data.username = user.username; }
    if (user.email) { data.email = user.email; }
    if (user.password) { data.password = await bcrypt.hash(user.password, 10); }

    return prismaClient.user.update({
        where: {
            id: user.id
        },
        data: data,
        select: {
            id: true,
            username: true,
            email: true
        }
    })
}

const updateStudent = async(request) => {
    const user = validate(updateStudentProfileValidation, request);

    const existingUser = await prismaClient.student.findFirst({
        where: {
            userId: user.id
        },
        select: {
            phone: true,
            address: true,
            parentPhone: true,
            dateOfBirth: true
        }
    })
    if (!existingUser) {
        throw new ResponseError(404, "User is not found");
    }

    const data = {};
    if (user.phone) { data.phone = user.phone; }
    if (user.address) { data.address = user.address; }
    if (user.parentPhone) { data.parentPhone = user.parentPhone; }

    return prismaClient.student.update({
        where: { userId: user.id },
        data: data,
        select: {
            userId: true,
            studentId: true,
            fullName: true,
            classId: true,
            phone: true,
            address: true,
            parentPhone: true,
            dateOfBirth: true,
            enrollmentDate: true
        }
    })
}

const updateTeacher = async(request) => {
    const user = validate(updateTeacherProfileValidation, request);

    const existingUser = await prismaClient.teacher.findFirst({
        where: {
            userId: user.id
        },
        select: {
            phone: true,
            address: true,
            hireDate: true
        }
    });

    if (!existingUser) {
        throw new ResponseError(404, "User is not found");
    }
    const data = {};

    if (user.phone) { data.phone = user.phone; }
    if (user.address) { data.address = user.address; }

    return prismaClient.teacher.update({
        where: {
            userId: user.id
        },
        data: data,
        select: {
            userId: true,
            teacherId: true,
            fullName: true,
            phone: true,
            address: true,
            hireDate: true
        }
    })
}

const updateRoleUser = async(req) => {
    const user = validate(updateRoleByAdmin, req);

    const existingUser = await prismaClient.user.findFirst({
        where: {
            id: user.id
        },
        select: {
            id: true,
            role: true
        }
    })

    if (!existingUser) {
        throw new ResponseError(404, "User is not found");
    }
    if (existingUser.role === user.newRole) {
        throw new ResponseError(400, `User is already ${user.newRole}`);
    }

    const data = {};

    if (user.role) { data.role = user.role }

    return prismaClient.user.update({
        where: {
            id: user.id
        },
        data: {
            role: user.newRole
        },
        select: {
            id: true,
            role: true
        }
    })

}


export default {
    getUser,
    updateUser,
    updateStudent,
    updateTeacher,
    updateRoleUser
}