import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { validate } from "../validation/validation.js";
import { getUserClassSessions } from "../validation/class-session-validation.js";
import userService from "./user-service.js";
import jwt from "jsonwebtoken"


function getDayName(dayNumber) {
    const days = {
        1: 'Senin',
        2: 'Selasa',
        3: 'Rabu',
        4: 'Kamis',
        5: 'Jumat',
        6: 'Sabtu',
        7: 'Minggu'
    };
    return days[dayNumber];
}

const getClassSessions = async(request) => {
    const validatedUser = validate(getUserClassSessions, request)

    console.log(validatedUser)
    const user = await prismaClient.user.findFirst({
        where: {
            id: validatedUser.id
        },
        select: {
            id: true,
            role: true
        }
    });

    if (!user) {
        throw new ResponseError(404, "User not found");
    }

    if (user.role === "student") {
        const classSchedule = await prismaClient.classSchedule.findMany({
            where: {
                classId: validatedUser.classId,
                isActive: true
            },
            select: {
                id: true,
                dayOfWeek: true,
                startTime: true,
                endTime: true,
                subjectId: true,
                teacherId: true,
                room: true,
                subject: {
                    select: {
                        name: true
                    }
                },
                teacher: {
                    select: {
                        fullName: true
                    }
                },
                class: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: [{
                    dayOfWeek: 'asc'
                },
                {
                    startTime: 'asc'
                }
            ]
        });

        return classSchedule;
    } else if (user.role === "teacher") {
        return "Ini teacher"
    } else {
        return "Ini admin"
    }
}



const StudentgetClassSessions = async(request) => {
    try {
        const user = await prismaClient
    } catch {

    }
}

export default {
    getClassSessions,
    StudentgetClassSessions
}