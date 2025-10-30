import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { validate } from "../validations/validation.js";
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

    // Get sessions for this date
    const scheduleIds = schedules.map(s => s.id);
    const sessions = await prismaClient.attendanceSession.findMany({
        where: {
            classScheduleId: { in: scheduleIds },
            date: targetDate
        }
    });

    const sessionMap = new Map();
    sessions.forEach(session => {
        sessionMap.set(session.classScheduleId, session);
    });

    // For students, get their attendance status
    let attendanceMap = new Map();
    if (role === 'student') {
        const sessionIds = sessions.map(s => s.id);
        if (sessionIds.length > 0) {
            const attendances = await prismaClient.attendance.findMany({
                where: {
                    attendanceSessionId: { in: sessionIds },
                    studentId: profileId
                }
            });
            attendances.forEach(att => {
                attendanceMap.set(att.attendanceSessionId, att);
            });
        }
    }

    return schedules.map(schedule => {
        const session = sessionMap.get(schedule.id);
        const baseSchedule = {
            scheduleId: schedule.id,
            subjectName: schedule.subject.name,
            teacherName: schedule.teacher.fullName,
            className: schedule.class.name,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            room: schedule.room
        };

        if (session) {
            baseSchedule.session = {
                id: session.id,
                status: session.status,
                startedAt: session.startedAt,
                endedAt: session.endedAt
            };

            if (role === 'student') {
                const attendance = attendanceMap.get(session.id);
                if (attendance) {
                    baseSchedule.session.myAttendance = {
                        id: attendance.id,
                        status: attendance.status,
                        checkInTime: attendance.checkInTime
                    };
                }
            }
        }

        return baseSchedule;
    });
};

const getWeeklySchedule = async(request) => {
    const { startDate, profileId, role } = request;

    const targetDate = new Date(startDate);
    const start = getStartOfWeek(targetDate);
    const end = getEndOfWeek(targetDate);

    const daysOfWeek = [1, 2, 3, 4, 5, 6, 7];

    let schedules;

    if (role === 'teacher') {
        schedules = await prismaClient.classSchedule.findMany({
            where: {
                teacherId: profileId,
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

/**
 * ========================================
 * UNIFIED ENDPOINT FOR BOTH ROLES
 * Get schedule by academic period
 * - Teachers: See all their schedules with session summaries
 * - Students: See their class schedules with detailed attendance per session
 * Both can access inactive academic periods (historical data)
 * ========================================
 */
const getScheduleByAcademicPeriod = async(request) => {
    const { academicPeriodId, profileId, role, userId, classId } = request;

    // Get academic period info
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
    let result;

    // ========================================
    // TEACHER: Get schedules with session summaries
    // ========================================
    if (role === 'teacher') {
        schedules = await prismaClient.classSchedule.findMany({
            where: {
                teacherId: profileId,
                academicPeriodId: academicPeriodId
                    // Removed isActive filter - show all schedules from this period
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
                }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });

        if (schedules.length === 0) {
            throw new ResponseError(404, "No schedules found for this academic period");
        }

        // Get all sessions for these schedules
        const scheduleIds = schedules.map(s => s.id);
        const sessions = await prismaClient.attendanceSession.findMany({
            where: {
                classScheduleId: { in: scheduleIds }
            },
            include: {
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

        // Group sessions by classScheduleId
        const sessionsBySchedule = sessions.reduce((acc, session) => {
            if (!acc[session.classScheduleId]) {
                acc[session.classScheduleId] = [];
            }

            // Calculate attendance summary for this session
            const attendances = session.attendances;
            const summary = {
                present: attendances.filter(a => a.status === 'present').length,
                absent: attendances.filter(a => a.status === 'absent').length,
                late: attendances.filter(a => a.status === 'late').length,
                excused: attendances.filter(a => a.status === 'excused').length
            };

            acc[session.classScheduleId].push({
                sessionId: session.id,
                date: session.date,
                status: session.status,
                startedAt: session.startedAt,
                endedAt: session.endedAt,
                summary: summary
            });

            return acc;
        }, {});

        // Build response for teacher
        const groupedSchedules = schedules.reduce((acc, schedule) => {
            const scheduleSessions = sessionsBySchedule[schedule.id] || [];

            acc[schedule.id] = {
                id: schedule.id,
                className: schedule.class.name,
                gradeLevel: schedule.class.gradeLevel,
                subjectName: schedule.subject.name,
                subjectCode: schedule.subject.code,
                teacherId: schedule.teacherId,
                teacherName: schedule.teacher.fullName,
                dayOfWeek: schedule.dayOfWeek,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                room: schedule.room,
                totalSessions: scheduleSessions.length,
                sessions: scheduleSessions
            };
            return acc;
        }, {});

        result = {
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
    }
    // ========================================
    // STUDENT: Get schedules with detailed attendance
    // ========================================
    else if (role === 'student') {
        if (!classId) {
            throw new ResponseError(400, "Student must have a class");
        }

        schedules = await prismaClient.classSchedule.findMany({
            where: {
                classId: classId,
                academicPeriodId: academicPeriodId
                    // Removed isActive filter - show all schedules from this period
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
                }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });

        if (schedules.length === 0) {
            throw new ResponseError(404, "No schedules found for this academic period");
        }

        // Get all sessions with student's attendance
        const scheduleIds = schedules.map(s => s.id);
        const sessions = await prismaClient.attendanceSession.findMany({
            where: {
                classScheduleId: { in: scheduleIds }
            },
            include: {
                attendances: {
                    where: {
                        studentId: profileId // Only this student's attendance
                    },
                    select: {
                        id: true,
                        status: true,
                        checkInTime: true,
                        notes: true
                    }
                }
            },
            orderBy: {
                date: 'desc'
            }
        });

        // Group sessions by classScheduleId
        const sessionsBySchedule = sessions.reduce((acc, session) => {
            if (!acc[session.classScheduleId]) {
                acc[session.classScheduleId] = [];
            }

            // Student's attendance for this session (should be 0 or 1 record)
            const myAttendance = session.attendances[0] || null;

            acc[session.classScheduleId].push({
                sessionId: session.id,
                date: session.date,
                status: session.status,
                myAttendance: myAttendance ? {
                    attendanceId: myAttendance.id,
                    status: myAttendance.status,
                    checkInTime: myAttendance.checkInTime,
                    notes: myAttendance.notes
                } : null
            });

            return acc;
        }, {});

        // Calculate summary by schedule
        const summaryBySchedule = {};
        Object.keys(sessionsBySchedule).forEach(scheduleId => {
            const scheduleSessions = sessionsBySchedule[scheduleId];
            const summary = {
                present: 0,
                absent: 0,
                late: 0,
                excused: 0
            };

            scheduleSessions.forEach(session => {
                if (session.myAttendance) {
                    const status = session.myAttendance.status.toLowerCase();
                    if (summary.hasOwnProperty(status)) {
                        summary[status]++;
                    }
                }
            });

            summaryBySchedule[scheduleId] = summary;
        });

        // Build response for student
        const groupedSchedules = schedules.reduce((acc, schedule) => {
            const scheduleSessions = sessionsBySchedule[schedule.id] || [];
            const summary = summaryBySchedule[schedule.id] || {
                present: 0,
                absent: 0,
                late: 0,
                excused: 0
            };

            acc[schedule.id] = {
                id: schedule.id,
                className: schedule.class.name,
                gradeLevel: schedule.class.gradeLevel,
                subjectName: schedule.subject.name,
                subjectCode: schedule.subject.code,
                teacherId: schedule.teacherId,
                teacherName: schedule.teacher.fullName,
                dayOfWeek: schedule.dayOfWeek,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                room: schedule.room,
                totalSessions: scheduleSessions.length,
                sessions: scheduleSessions,
                summary: summary
            };
            return acc;
        }, {});

        result = {
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
    } else {
        throw new ResponseError(403, "Invalid role");
    }

    return result;
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

    const attendanceData = await prismaClient.attendance.findMany({
        where: {
            studentId: validated.profileId,
            attendanceSession: {
                classSchedule: {
                    subjectId: { in: subjectIds }
                }
            }
        },
        select: {
            status: true,
            attendanceSession: {
                select: {
                    classSchedule: {
                        select: {
                            subjectId: true
                        }
                    }
                }
            }
        }
    });
    const countBySubjectAndStatus = attendanceData.reduce((acc, item) => {
        const subjectId = item.attendanceSession.classSchedule.subjectId;
        const status = item.status.toLowerCase(); // Ensure lowercase

        if (!acc[subjectId]) {
            acc[subjectId] = {};
        }
        acc[subjectId][status] = (acc[subjectId][status] || 0) + 1;

        return acc;
    }, {});

    return subjects.map(subject => {
        const counts = countBySubjectAndStatus[subject.subjectId] || {};
        return {
            subjectIds: subject.subjectId,
            subjectName: subject.subject.name,
            time: `${subject.startTime.toTimeString().slice(0, 5)} - ${subject.endTime.toTimeString().slice(0, 5)}`,
            present: counts['present'] || 0,
            excused: counts['excused'] || 0,
            late: counts['late'] || 0,
            absent: counts['absent'] || 0
        };
    });
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