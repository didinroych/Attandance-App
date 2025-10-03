import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { validate } from "../validation/validation.js";
import { getUserClassSessions, createClassSessionVal, updateClassSessionVal } from "../validation/class-session-validation.js";
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

const getClassSchedule = async(request) => {
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

    const classSchedule = await prismaClient.classSchedule.findUnique({
        where: { id: validatedUser.classScheduleId },
        select: { classId: true }
    });

    if (!classSchedule) {
        throw new Error("Class schedule not found");
    }

    const students = await prismaClient.student.findMany({
        where: { classId: classSchedule.classId },
        select: { id: true }
    });

    const result = await prismaClient.$transaction(async(tx) => {
        const classSession = await tx.attendanceSession.create({
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

        if (students.length > 0) {
            await tx.attendance.createMany({
                data: students.map(student => ({
                    attendanceSessionId: classSession.id,
                    studentId: student.id,
                    status: "absent",
                    attendanceMethod: "manual",
                    markedBy: validatedUser.profileId,
                }))
            });
        }

        return classSession;
    });

    console.log("classSession created with", students.length, "attendance records");

    return result;
}


const getClassSession = async(request) => {
    const sessionId = request.sessionId;
    const profileId = request.profileId;

    const session = await prismaClient.attendanceSession.findUnique({
        where: { id: sessionId },
        include: {
            classSchedule: {
                include: {
                    class: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    })

    if (!session) {
        throw new ResponseError(404, "Session not Found")
    }

    if (session.createdBy !== profileId) {
        throw new ResponseError(403, "Unauthorized")
    }

    const attendances = await prismaClient.attendance.findMany({
        where: {
            attendanceSessionId: sessionId
        },
        include: {
            student: {
                select: {
                    fullName: true,
                    studentId: true
                }
            }
        },
        orderBy: {
            student: {
                fullName: 'asc'
            }
        }
    });

    const summary = {
        totalStudent: attendances.length,
        present: attendances.filter(a => a.status === 'present').length,
        absent: attendances.filter(a => a.status === 'absent').length,
        late: attendances.filter(a => a.status === 'late').length,
        excused: attendances.filter(a => a.status === 'excused').length,
    }

    return {
        session: {
            id: session.id,
            date: session.date,
            status: session.status,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            notes: session.notes,
            nameClass: session.classSchedule.class.name,
        },
        summary,
        attendances: attendances.map(a => ({
            id: a.id,
            student: a.student,
            status: a.status,
            attendanceMethod: a.attendanceMethod,
            checkedInAt: a.checkedInAt,
            notes: a.notes
        }))
    }
}

const updateClassSession = async(request) => {
    const UpdateStatus = validate(updateClassSessionVal, request);
    const profileId = request.profileId;

    console.log("Service: ", UpdateStatus)

    const session = await prismaClient.attendanceSession.findUnique({
        where: {
            id: UpdateStatus.sessionId
        },
        include: {
            classSchedule: {
                include: {
                    class: {
                        select: {
                            name: true
                        }
                    }
                }
            }
        }
    });

    if (!session) {
        throw new ResponseError(404, "Session not Found");
    }

    if (session.createdBy !== profileId) {
        throw new ResponseError(403, "Unauthorized")
    }

    if (session.status !== 'ongoing') {
        throw new Error("Cannot edit completed session");
    }

    const result = await prismaClient.$transaction(
        UpdateStatus.attendances.map(att => {
            console.log('Processing attendance:', att.attendanceId);

            return prismaClient.attendance.update({
                where: {
                    id: att.attendanceId,
                    attendanceSessionId: UpdateStatus.sessionId
                },
                data: {
                    status: att.status,
                    checkInTime: att.status !== 'absent' ? new Date() : null,
                    notes: att.notes || null,
                    updatedAt: new Date()
                }
            });
        })
    );
    return {
        message: "Attendance updated successfully",
        updated: result.length,

    };

}

const getClassSessionActive = async(request) => {
    const validatedUser = (getUserClassSessions, request);

    console.log('ValidatedUser', validatedUser)
    const session = await prismaClient.attendance.findMany({
        where: {
            studentId: validatedUser.id,
            attendanceSession: {
                status: 'ongoing'
            }
        },
        select: {
            id: true,
            attendanceSessionId: true,
            status: true,
            attendanceSession: {
                select: {
                    classSchedule: {
                        select: {
                            subject: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    return session.map(session => ({
        id: session.id,
        attendanceSessionId: session.attendanceSessionId,
        status: session.status,
        subject: session.attendanceSession.classSchedule.subject.name
    }));
}

const getClassSessionsSummary = async(request) => {
    const validatedUser = validate(getUserClassSessions, request);

    const subjects = await prismaClient.classSchedule.findMany({
        where: {
            classId: validatedUser.classId
        },
        select: {
            subjectId: true,
            subject: {
                select: {
                    name: true
                }
            },
            startTime: true,
            endTime: true
        },
        distinct: ['subjectId']
    });

    const subjectIds = subjects.map(s => s.subjectId);

    const attendanceData = await prismaClient.attendance.groupBy({
        by: ['status'],
        where: {
            studentId: validatedUser.id,
            attendanceSession: {
                classSchedule: {
                    subjectId: { in: subjectIds }
                }
            }
        },
        _count: { status: true }
    });

    const countByStatus = attendanceData.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
    }, {});

    return subjects.map(subject => ({
        subjectName: subject.subject.name,
        time: `${subject.startTime.toTimeString().slice(0, 5)} - ${subject.endTime.toTimeString().slice(0, 5)}`,
        hadir: countByStatus['present'] || 0,
        izin: countByStatus['excused'] || 0,
        sakit: countByStatus['late'] || 0, // Ini nanti gw ganti nama nya wkwkwk
        alpha: countByStatus['absent'] || 0
    }));
};

const getClassListClassTeacher = async(request) => {
    const ValidatedUser = (getUserClassSessions, request);
    console.log(ValidatedUser.id)

    const classes = await prismaClient.classSchedule.findMany({
        where: {
            teacherId: ValidatedUser.id,
            isActive: true
        },
        include: {
            class: {
                select: {
                    name: true
                }
            },
            subject: {
                select: {
                    name: true
                }
            },
            _count: {
                select: {
                    attendanceSessions: true
                }
            }
        }
    })

    if (classes.length === 0) {
        throw new ResponseError(404, "The teacher doesn't have any classes");
    }

    return classes.map(cls => ({
        id: cls.id,
        name: cls.class.name,
        subject: cls.subject.name,
        totalSessions: cls._count.attendanceSessions
    }));
}

const getClassSessionsList = async(request) => {
    const classScheduleId = request.classScheduleId;
    const profileId = request.profileId;

    const sessions = await prismaClient.attendanceSession.findMany({
        where: {
            classScheduleId: classScheduleId,
            createdBy: profileId
        },
        include: {
            classSchedule: {
                select: {
                    class: {
                        select: {
                            name: true
                        }
                    },
                    subject: {
                        select: {
                            name: true
                        }
                    }
                }
            },
            attendances: {
                select: {
                    status: true
                }
            }
        },
        orderBy: {
            date: 'desc'
        }
    });

    return sessions.map(session => {
        const attendances = session.attendances;

        return {
            session: {
                id: session.id,
                date: session.date,
                status: session.status,
                startedAt: session.startedAt,
                endedAt: session.endedAt,
                notes: session.notes,
                nameClass: session.classSchedule.class.name,
                subject: session.classSchedule.subject.name
            },
            summary: {
                totalStudent: attendances.length,
                present: attendances.filter(a => a.status === 'present').length,
                absent: attendances.filter(a => a.status === 'absent').length,
                late: attendances.filter(a => a.status === 'late').length,
                excused: attendances.filter(a => a.status === 'excused').length
            }
        };
    });
};


export default {
    getClassSchedule,
    createClassSession,
    getClassSession,
    updateClassSession,
    getClassSessionActive,
    getClassSessionsSummary,
    getClassListClassTeacher,
    getClassSessionsList
}