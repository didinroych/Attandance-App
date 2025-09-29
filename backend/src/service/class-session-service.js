import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { validate } from "../validation/validation.js";
import { getUserClassSessions, createClassSessionVal } from "../validation/class-session-validation.js";
import userService from "./user-service.js";
import jwt from "jsonwebtoken"


// function getDayName(dayNumber) {
//     const days = {
//         1: 'Senin',
//         2: 'Selasa',
//         3: 'Rabu',
//         4: 'Kamis',
//         5: 'Jumat',
//         6: 'Sabtu',
//         7: 'Minggu'
//     };
//     return days[dayNumber];
// }

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

    console.log("service", validatedUser.id, "|", validatedUser.classId)

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
        const classSchedule = await prismaClient.classSchedule.findMany({
            where: {
                teacherId: validatedUser.profileId,
                isActive: true
            },
            select: {
                id: true,
                classId: true,
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
    } else {
        return "Ini admin"
    }
}

const createClassSession = async(request) => {
    const validatedUser = validate(createClassSessionVal, request);

    console.log("validatedUser", validatedUser);

    const dateOnly = new Date(validatedUser.date);

    const classSession = await prismaClient.attendanceSession.create({
        data: {
            classScheduleId: validatedUser.classScheduleId,
            date: dateOnly,
            createdBy: validatedUser.profileId,
            status: 'ongoing',
            startedAt: new Date(),
            notes: validatedUser.notes || null
        },
        select: {
            id: true,
            classScheduleId: true,
            date: true,
            status: true,
            startedAt: true,
            createdBy: true
        }
    });

    console.log("classSession", classSession);

    return classSession;
}

const createAttandanceManual = async(request) => {

}

const createAttandanceFace = async(request) => {

}
export default {
    getClassSessions,
    createClassSession,
    createAttandanceManual,
    createAttandanceFace
}