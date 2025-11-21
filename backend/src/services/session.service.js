import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { validate } from "../validations/validation.js";
import {
    createSessionSchema,
    getSessionSchema,
    getSessionsListSchema
} from "../validations/session.validation.js";
import { calculateSessionSummary, validateSessionOwnership } from "../helpers/session.helper.js";


const createSession = async(request) => {
    /**
     * Create a new attendance session
     * Teacher creates a session for a specific class schedule on a specific date
     * Automatically creates attendance records for all students (default: absent)
     */
    const validated = validate(createSessionSchema, request);
    const { classScheduleId, date, notes, profileId } = validated;

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
            notes: notes || null,
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
                },
                orderBy: {
                    student: {
                        fullName: 'asc'
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
        startedAt: session.startedAt,
        notes: session.notes,
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

const getSession = async(request) => {
    /**
     * Get detailed session information
     * Returns session details with all attendances
     */
    const validated = validate(getSessionSchema, request);
    const { sessionId, profileId } = validated;

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

    // Validate ownership
    await validateSessionOwnership(session, profileId);

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

const getSessionsList = async(request) => {
    /**
     * Get list of sessions for a specific class schedule
     * Returns all sessions with attendance summaries
     */
    const validated = validate(getSessionsListSchema, request);
    const { classScheduleId, profileId } = validated;

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
        const summary = calculateSessionSummary(session.attendances);

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
            summary: summary
        };
    });
};

const getLastSessions = async(request) => {
    /**
     * Get last sessions
     * For students: all ongoing sessions
     * For teachers: all ongoing and completed sessions
     */
    const { profileId, role, status } = request;

    if (role === 'student') {
        // Get student's class first
        const student = await prismaClient.student.findUnique({
            where: { id: profileId },
            select: { classId: true }
        });

        if (!student) {
            throw new ResponseError(404, "Student not found");
        }

        // Get all ongoing sessions for student's class
        const sessions = await prismaClient.attendanceSession.findMany({
            where: {
                status: 'ongoing',
                classSchedule: {
                    classId: student.classId
                }
            },
            include: {
                classSchedule: {
                    select: {
                        class: {
                            select: {
                                name: true
                            }
                        },
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
            },
            orderBy: {
                startedAt: 'desc'
            }
        });

        return sessions.map(session => ({
            sessionId: session.id,
            className: session.classSchedule.class.name,
            subject: session.classSchedule.subject.name,
            teacher: session.classSchedule.teacher.fullName,
            room: session.classSchedule.room,
            startTime: session.classSchedule.startTime,
            endTime: session.classSchedule.endTime,
            date: session.date,
            startedAt: session.startedAt,
            status: session.status
        }));
    } else if (role === 'teacher') {
        // Get all ongoing and completed sessions created by teacher
        const sessions = await prismaClient.attendanceSession.findMany({
            where: {
                createdBy: profileId,
                ...(status ? { status: status } : {
                    status: {
                        in: ['ongoing', 'completed']
                    }
                })
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
                        },
                        startTime: true,
                        endTime: true,
                        room: true
                    }
                },
                _count: {
                    select: {
                        attendances: true
                    }
                }
            },
            orderBy: {
                startedAt: 'desc'
            }
        });

        return sessions.map(session => ({
            sessionId: session.id,
            className: session.classSchedule.class.name,
            subject: session.classSchedule.subject.name,
            date: session.date,
            startedAt: session.startedAt,
            startTime: session.classSchedule.startTime,
            endTime: session.classSchedule.endTime,
            room: session.classSchedule.room,
            totalStudents: session._count.attendances,
            status: session.status
        }));
    } else {
        throw new ResponseError(403, "Invalid role");
    }
};

const updateSessionStatus = async(request) => {
    const validated = validate(updateSessionStatusSchema, request);
    const { sessionId, status, profileId } = validated;

    // Fetch and validate session
    const session = await prismaClient.attendanceSession.findUnique({
        where: { id: sessionId }
    });

    if (!session) {
        throw new ResponseError(404, "Session not found");
    }

    await validateSessionOwnership(session, profileId);

    // Validate status transition
    if (session.status === 'finalized') {
        throw new ResponseError(400, "Cannot modify finalized session");
    }

    if (session.status === 'cancelled') {
        throw new ResponseError(400, "Cannot modify cancelled session");
    }

    // Update session
    const updated = await prismaClient.attendanceSession.update({
        where: { id: sessionId },
        data: {
            status: status,
            endedAt: status === 'completed' || status === 'cancelled' ? new Date() : null
        }
    });

    return {
        sessionId: updated.id,
        status: updated.status,
        endedAt: updated.endedAt,
        message: `Session ${status} successfully`
    };
};

const getSessionStatistics = async(filters = {}) => {
    /**
     * Get session statistics (Admin only)
     * Returns aggregated data about sessions
     */
    const { startDate, endDate, classId, teacherId } = filters;

    const whereClause = {};

    if (startDate && endDate) {
        whereClause.date = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    if (classId) {
        whereClause.classSchedule = {
            classId: classId
        };
    }

    if (teacherId) {
        whereClause.createdBy = teacherId;
    }

    // Get total sessions by status
    const totalSessions = await prismaClient.attendanceSession.count({
        where: whereClause
    });

    const sessionsByStatus = await prismaClient.attendanceSession.groupBy({
        by: ['status'],
        where: whereClause,
        _count: {
            id: true
        }
    });

    // Get sessions by class
    const sessionsByClass = await prismaClient.attendanceSession.groupBy({
        by: ['classScheduleId'],
        where: whereClause,
        _count: {
            id: true
        }
    });

    return {
        totalSessions,
        byStatus: sessionsByStatus.reduce((acc, item) => {
            acc[item.status] = item._count.id;
            return acc;
        }, {}),
        totalClasses: sessionsByClass.length,
        filters: filters
    };
};

export default {
    createSession,
    getSession,
    getSessionsList,
    getLastSessions,
    updateSessionStatus,
    getSessionStatistics
};