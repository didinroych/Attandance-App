import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { validate } from "../validation/validation.js";
import {
    getUserClassSessions,
    createClassSessionVal,
    updateClassSessionVal
} from "../validation/class-session-validation.js";

const getStartOfWeek = (date) => {
    /**
     * Get start of week (Monday) for a given date
     * @param {Date} date - Any date in the week
     * @returns {Date} Start of week
     */
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
};

const getEndOfWeek = (date) => {
    /**
     * Get end of week (Sunday) for a given date
     * @param {Date} date - Any date in the week
     * @returns {Date} End of week
     */
    const start = getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
};

const convertToPrismaDay = (jsDay) => {
    return jsDay === 0 ? 7 : jsDay;
};

const getClassScheduleByDate = async(request) => {
    const { date, profileId, role } = request;

    const targetDate = new Date(date);
    const dayOfWeek = convertToPrismaDay(targetDate.getDay());
    const startOfWeek = getStartOfWeek(targetDate);
    const endOfWeek = getEndOfWeek(targetDate);

    let schedules;

    if (role === 'teacher') {
        schedules = await prismaClient.classSchedule.findMany({
            where: {
                teacherId: profileId,
                dayOfWeek: dayOfWeek,
                isActive: true
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                teacher: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });
    } else if (role === 'student') {
        const student = await prismaClient.student.findUnique({
            where: { id: profileId },
            select: { classId: true }
        });

        if (!student) {
            throw new ResponseError(404, "Student not found");
        }

        schedules = await prismaClient.classSchedule.findMany({
            where: {
                classId: student.classId,
                dayOfWeek: dayOfWeek,
                isActive: true
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                teacher: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                startTime: 'asc'
            }
        });
    } else {
        throw new ResponseError(403, "Invalid role");
    }

    if (schedules.length === 0) {
        return {
            date: date,
            dayOfWeek: dayOfWeek,
            data: []
        };
    }
    const scheduleIds = schedules.map(s => s.id);

    const sessions = await prismaClient.attendanceSession.findMany({
        where: {
            classScheduleId: { in: scheduleIds },
            date: {
                gte: startOfWeek,
                lte: endOfWeek
            }
        },
        select: {
            id: true,
            classScheduleId: true,
            date: true,
            status: true,
            startedAt: true,
            endedAt: true,
            createdAt: true
        }
    });

    const sessionMap = new Map();
    sessions.forEach(session => {
        sessionMap.set(session.classScheduleId, session);
    });

    let attendanceMap = new Map();
    if (role === 'student') {
        const sessionIds = sessions.map(s => s.id);

        if (sessionIds.length > 0) {
            const attendances = await prismaClient.attendance.findMany({
                where: {
                    attendanceSessionId: { in: sessionIds },
                    studentId: profileId
                },
                select: {
                    id: true,
                    attendanceSessionId: true,
                    studentId: true,
                    status: true,
                    checkInTime: true,
                    attendanceMethod: true
                }
            });

            attendances.forEach(att => {
                attendanceMap.set(att.attendanceSessionId, att);
            });
        }
    }

    const data = schedules.map(schedule => {
        const session = sessionMap.get(schedule.id);

        let sessionData = null;
        if (session) {
            sessionData = {
                id: session.id,
                status: session.status,
                date: session.date,
                startedAt: session.startedAt,
                endedAt: session.endedAt,
                createdAt: session.createdAt,
                hasSession: true
            };

            if (role === 'student') {
                const attendance = attendanceMap.get(session.id);
                sessionData.hasAttendance = !!attendance;
                sessionData.attendance = attendance ? {
                    id: attendance.id,
                    status: attendance.status,
                    checkInTime: attendance.checkInTime,
                    attendanceMethod: attendance.attendanceMethod
                } : null;
            }
        } else {
            sessionData = {
                hasSession: false,
                message: role === 'student' ?
                    "Session not active yet" : "No session created for this week"
            };
        }

        return {
            id: schedule.id,
            classId: schedule.classId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            room: schedule.room,
            subject: schedule.subject,
            teacher: schedule.teacher,
            class: schedule.class,
            session: sessionData
        };
    });

    return {
        date: date,
        dayOfWeek: dayOfWeek,
        data: data
    };
};

const getWeeklySchedule = async(request) => {
    const { startDate, profileId, role } = request;

    const start = getStartOfWeek(new Date(startDate || new Date()));
    const end = getEndOfWeek(new Date(startDate || new Date()));

    const daysOfWeek = [1, 2, 3, 4, 5, 6, 7];

    let schedules;

    if (role === 'teacher') {
        schedules = await prismaClient.classSchedule.findMany({
            where: {
                teacherId: profileId,
                dayOfWeek: { in: daysOfWeek },
                isActive: true
            },
            include: {
                subject: { select: { id: true, name: true } },
                teacher: { select: { id: true, fullName: true } },
                class: { select: { id: true, name: true } }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });
    } else if (role === 'student') {
        const student = await prismaClient.student.findUnique({
            where: { id: profileId },
            select: { classId: true }
        });

        if (!student) {
            throw new ResponseError(404, "Student not found");
        }

        schedules = await prismaClient.classSchedule.findMany({
            where: {
                classId: student.classId,
                dayOfWeek: { in: daysOfWeek },
                isActive: true
            },
            include: {
                subject: { select: { id: true, name: true } },
                teacher: { select: { id: true, fullName: true } },
                class: { select: { id: true, name: true } }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });
    } else {
        throw new ResponseError(403, "Invalid role");
    }

    // Get all sessions for this week
    const scheduleIds = schedules.map(s => s.id);
    const sessions = await prismaClient.attendanceSession.findMany({
        where: {
            classScheduleId: { in: scheduleIds },
            date: { gte: start, lte: end }
        }
    });

    const sessionMap = new Map();
    sessions.forEach(session => {
        sessionMap.set(session.classScheduleId, session);
    });

    // Group by day
    const weekData = {};
    daysOfWeek.forEach(day => {
        weekData[day] = [];
    });

    schedules.forEach(schedule => {
        const session = sessionMap.get(schedule.id);
        weekData[schedule.dayOfWeek].push({
            ...schedule,
            session: session || null
        });
    });

    return {
        startDate: start,
        endDate: end,
        schedule: weekData
    };
};

const getScheduleByAcademicPeriod = async(request) => {
    const { academicPeriodId, profileId, role, userId, classId } = request;

    const academicPeriod = await prismaClient.academicPeriod.findUnique({
        where: {
            id: academicPeriodId
        },
        select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            isActive: true
        }
    });

    if (!academicPeriod) {
        throw new ResponseError(404, "Academic period not found");
    }

    let schedules;

    if (role === 'teacher') {
        schedules = await prismaClient.classSchedule.findMany({
            where: {
                teacherId: profileId,
                academicPeriodId: academicPeriodId,
                isActive: true
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                teacher: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        gradeLevel: true
                    }
                },
                _count: {
                    select: {
                        attendanceSessions: true
                    }
                }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });
    } else if (role === 'student') {

        let studentClassId = classId;

        if (!studentClassId) {
            const student = await prismaClient.student.findUnique({
                where: { userId: userId }, // Changed from id to userId
                select: { classId: true }
            });

            if (!student) {
                throw new ResponseError(404, "Student not found");
            }

            studentClassId = student.classId;
        }

        schedules = await prismaClient.classSchedule.findMany({
            where: {
                classId: studentClassId, // Use the classId
                academicPeriodId: academicPeriodId,
                isActive: true
            },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                teacher: {
                    select: {
                        id: true,
                        fullName: true
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        gradeLevel: true
                    }
                },
                _count: {
                    select: {
                        attendanceSessions: true
                    }
                }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });
    } else {
        throw new ResponseError(403, "Invalid role");
    }
    const groupedSchedules = schedules.reduce((acc, schedule) => {
        const day = schedule.dayOfWeek;
        if (!acc[day]) {
            acc[day] = [];
        }
        acc[day].push({
            id: schedule.id,
            classId: schedule.classId,
            className: schedule.class.name,
            gradeLevel: schedule.class.gradeLevel,
            subjectId: schedule.subjectId,
            subjectName: schedule.subject.name,
            subjectCode: schedule.subject.code,
            teacherId: schedule.teacherId,
            teacherName: schedule.teacher.fullName,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            room: schedule.room,
            totalSessions: schedule._count.attendanceSessions
        });
        return acc;
    }, {});

    return {
        academicPeriod: {
            id: academicPeriod.id,
            name: academicPeriod.name,
            startDate: academicPeriod.startDate,
            endDate: academicPeriod.endDate,
            isActive: academicPeriod.isActive
        },
        totalSchedules: schedules.length,
        schedules: groupedSchedules
    };
};

const createClassSession = async(request) => {
    /**
     * Create a new attendance session (teacher only)
     */
    const validated = validate(createClassSessionVal, request);
    const { classScheduleId, date, profileId } = validated;

    // Verify teacher owns this schedule
    const schedule = await prismaClient.classSchedule.findFirst({
        where: {
            id: classScheduleId,
            teacherId: profileId,
            isActive: true
        },
        include: {
            class: {
                include: {
                    students: {
                        select: {
                            id: true
                        }
                    }
                }
            }
        }
    });

    if (!schedule) {
        throw new ResponseError(404, "Schedule not found or unauthorized");
    }

    // Check if session already exists for this date
    const existingSession = await prismaClient.attendanceSession.findFirst({
        where: {
            classScheduleId: classScheduleId,
            date: new Date(date)
        }
    });

    if (existingSession) {
        throw new ResponseError(400, "Session already exists for this date");
    }

    // Create session with attendances for all students
    const session = await prismaClient.attendanceSession.create({
        data: {
            classScheduleId: classScheduleId,
            date: new Date(date),
            status: 'ongoing',
            startedAt: new Date(),
            createdBy: profileId,
            attendances: {
                create: schedule.class.students.map(student => ({
                    studentId: student.id,
                    status: 'absent' // Default to absent
                }))
            }
        },
        include: {
            attendances: {
                include: {
                    student: {
                        select: {
                            id: true,
                            fullName: true,
                            studentId: true
                        }
                    }
                }
            },
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
            }
        }
    });

    return {
        sessionId: session.id,
        className: session.classSchedule.class.name,
        subjectName: session.classSchedule.subject.name,
        date: session.date,
        status: session.status,
        totalStudents: session.attendances.length,
        attendances: session.attendances.map(a => ({
            attendanceId: a.id,
            studentId: a.studentId,
            studentName: a.student.fullName,
            studentNumber: a.student.studentId,
            status: a.status
        }))
    };
};

const getClassSession = async(request) => {
    /**
     * Get detailed information about a specific session
     */
    const { sessionId, profileId } = request;

    const session = await prismaClient.attendanceSession.findUnique({
        where: {
            id: sessionId
        },
        include: {
            classSchedule: {
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
                    }
                }
            },
            attendances: {
                include: {
                    student: {
                        select: {
                            id: true,
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
            }
        }
    });

    if (!session) {
        throw new ResponseError(404, "Session not found");
    }

    if (session.createdBy !== profileId) {
        throw new ResponseError(403, "Unauthorized to view this session");
    }

    return {
        sessionId: session.id,
        className: session.classSchedule.class.name,
        subjectName: session.classSchedule.subject.name,
        date: session.date,
        status: session.status,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        notes: session.notes,
        totalStudents: session.attendances.length,
        attendances: session.attendances.map(a => ({
            attendanceId: a.id,
            studentId: a.studentId,
            studentName: a.student.fullName,
            studentNumber: a.student.studentId,
            status: a.status,
            checkInTime: a.checkInTime,
            attendanceMethod: a.attendanceMethod,
            notes: a.notes
        }))
    };
};

const getClassSessionsList = async(request) => {
    const { classScheduleId, profileId } = request;

    // Verify ownership
    const schedule = await prismaClient.classSchedule.findFirst({
        where: {
            id: classScheduleId,
            teacherId: profileId
        }
    });

    if (!schedule) {
        throw new ResponseError(404, "Schedule not found or unauthorized");
    }

    const sessions = await prismaClient.attendanceSession.findMany({
        where: {
            classScheduleId: classScheduleId
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
                className: session.classSchedule.class.name,
                subject: session.classSchedule.subject.name
            },
            summary: {
                totalStudents: attendances.length,
                present: attendances.filter(a => a.status === 'present').length,
                absent: attendances.filter(a => a.status === 'absent').length,
                late: attendances.filter(a => a.status === 'late').length,
                excused: attendances.filter(a => a.status === 'excused').length
            }
        };
    });
};

const updateClassSession = async(request) => {
    /**
     * Update attendance records for a session
     */
    const validated = validate(updateClassSessionVal, request);
    const { sessionId, attendances, profileId } = validated;

    const session = await prismaClient.attendanceSession.findUnique({
        where: {
            id: sessionId
        },
        include: {
            classSchedule: {
                select: {
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
        throw new ResponseError(404, "Session not found");
    }

    if (session.createdBy !== profileId) {
        throw new ResponseError(403, "Unauthorized to edit this session");
    }

    if (session.status === 'completed') {
        throw new ResponseError(400, "Cannot edit completed session");
    }

    if (session.status === 'cancelled') {
        throw new ResponseError(400, "Cannot edit cancelled session");
    }

    // Update attendances in transaction
    const result = await prismaClient.$transaction(
        attendances.map(att =>
            prismaClient.attendance.update({
                where: {
                    id: att.attendanceId,
                    attendanceSessionId: sessionId
                },
                data: {
                    status: att.status,
                    checkInTime: att.status !== 'absent' ? new Date() : null,
                    notes: att.notes || null,
                    markedBy: profileId,
                    updatedAt: new Date()
                }
            })
        )
    );

    return {
        message: "Attendance updated successfully",
        updated: result.length
    };
};

const getClassSessionActive = async(request) => {
    /**
     * Get active sessions for a student
     */
    const validated = validate(getUserClassSessions, request);

    const sessions = await prismaClient.attendance.findMany({
        where: {
            studentId: validated.profileId,
            status: 'absent',
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
                    date: true,
                    startedAt: true,
                    classSchedule: {
                        select: {
                            startTime: true,
                            endTime: true,
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
                            }
                        }
                    }
                }
            }
        }
    });

    return sessions.map(session => ({
        attendanceId: session.id,
        sessionId: session.attendanceSessionId,
        status: session.status,
        subject: session.attendanceSession.classSchedule.subject.name,
        teacher: session.attendanceSession.classSchedule.teacher.fullName,
        room: session.attendanceSession.classSchedule.room,
        startTime: session.attendanceSession.classSchedule.startTime,
        endTime: session.attendanceSession.classSchedule.endTime,
        date: session.attendanceSession.date
    }));
};

const getClassSessionsSummary = async(request) => {
    /**
     * Get attendance summary for a student
     */
    const validated = validate(getUserClassSessions, request);

    const subjects = await prismaClient.classSchedule.findMany({
        where: {
            classId: validated.classId
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
            studentId: validated.id,
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
        present: countByStatus['present'] || 0,
        excused: countByStatus['excused'] || 0,
        late: countByStatus['late'] || 0,
        absent: countByStatus['absent'] || 0
    }));
};

const getClassListClassTeacher = async(request) => {
    /**
     * Get list of classes taught by a teacher
     */
    const validated = validate(getUserClassSessions, request);

    const classes = await prismaClient.classSchedule.findMany({
        where: {
            teacherId: validated.id,
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
    });

    if (classes.length === 0) {
        throw new ResponseError(404, "No classes found for this teacher");
    }

    return classes.map(cls => ({
        id: cls.id,
        className: cls.class.name,
        subject: cls.subject.name,
        dayOfWeek: cls.dayOfWeek,
        startTime: cls.startTime,
        endTime: cls.endTime,
        room: cls.room,
        totalSessions: cls._count.attendanceSessions
    }));
};

export default {
    // Schedule
    getClassScheduleByDate,
    getWeeklySchedule,
    getScheduleByAcademicPeriod,

    // Sessions
    createClassSession,
    getClassSession,
    getClassSessionsList,
    updateClassSession,

    // Student specific
    getClassSessionActive,
    getClassSessionsSummary,

    // Teacher specific
    getClassListClassTeacher
};