import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { validate } from "../validations/validation.js";
import {
    getScheduleByDateSchema,
    getWeeklyScheduleSchema,
    getScheduleByAcademicPeriodSchema,
    getTeacherSchedulesSchema,
    createScheduleSchema,
    updateScheduleSchema,
    deleteScheduleSchema,
    bulkCreateSchedulesSchema
} from "../validations/schedule.validation.js";
import {
    getStartOfWeek,
    getEndOfWeek
} from "../helpers/date.helper.js";
import {
    checkTimeConflict,
    mergeSchedulesWithSessions
} from "../helpers/schedule.helper.js";

const convertToPrismaDay = (jsDay) => {
    return jsDay === 0 ? 7 : jsDay;
};
/**
 * ============================================
 * SCHEDULE SERVICE
 * Handles all schedule-related business logic
 * ============================================
 */

/**
 * Get class schedule for a specific date
 * Returns schedules with session information based on user role
 */
const getScheduleByDate = async(request) => {
    const validated = validate(getScheduleByDateSchema, request);
    const { date, profileId, role } = validated;

    const targetDate = new Date(date);
    const dayOfWeek = convertToPrismaDay(targetDate.getDay());

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

    const sessionMap = new Map();
    sessions.forEach(session => {
        sessionMap.set(session.classScheduleId, session);
    });

    // return {
    //     date: date,
    //     dayOfWeek: dayOfWeek,
    //     data: schedules.map(schedule => {
    //         const session = sessionMap.get(schedule.id);
    //         const baseSchedule = {
    //             scheduleId: schedule.id,
    //             subjectName: schedule.subject.name,
    //             subjectCode: schedule.subject.code,
    //             teacherName: schedule.teacher.fullName,
    //             className: schedule.class.name,
    //             startTime: schedule.startTime,
    //             endTime: schedule.endTime,
    //             room: schedule.room
    //         };

    //         if (session) {
    //             baseSchedule.session = {
    //                 id: session.id,
    //                 status: session.status,
    //                 startedAt: session.startedAt,
    //                 endedAt: session.endedAt
    //             };

    //             if (role === 'student') {
    //                 const attendance = attendanceMap.get(session.id);
    //                 if (attendance) {
    //                     baseSchedule.session.myAttendance = {
    //                         id: attendance.id,
    //                         status: attendance.status,
    //                         checkInTime: attendance.checkInTime
    //                     };
    //                 }
    //             }
    //         } else {
    //             baseSchedule.session = false;
    //         }

    //         return baseSchedule;
    //     })
    // };
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

/**
 * Get weekly schedule
 * Returns all schedules for the week grouped by day
 */
const getWeeklySchedule = async(request) => {
    const validated = validate(getWeeklyScheduleSchema, request);
    const { startDate, profileId, role } = validated;

    const start = getStartOfWeek(new Date(startDate || new Date()));
    const end = getEndOfWeek(new Date(startDate || new Date()));

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
            scheduleId: schedule.id,
            subjectName: schedule.subject.name,
            subjectCode: schedule.subject.code,
            teacherName: schedule.teacher.fullName,
            className: schedule.class.name,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            room: schedule.room,
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
 * Get schedule by academic period
 * Returns comprehensive schedule data with sessions
 * This is the UNIFIED endpoint from earlier implementation
 */
const getScheduleByAcademicPeriod = async(request) => {
    const validated = validate(getScheduleByAcademicPeriodSchema, request);
    const { academicPeriodId, profileId, role, classId } = validated;

    // Get academic period info
    const academicPeriod = await prismaClient.academicPeriod.findUnique({
        where: { id: academicPeriodId },
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

    // TEACHER VIEW
    if (role === 'teacher') {
        schedules = await prismaClient.classSchedule.findMany({
            where: {
                teacherId: profileId,
                academicPeriodId: academicPeriodId
            },
            include: {
                subject: {
                    select: { id: true, name: true, code: true }
                },
                teacher: {
                    select: { id: true, fullName: true }
                },
                class: {
                    select: { id: true, name: true, gradeLevel: true }
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

        // Get all sessions with attendance summaries
        const scheduleIds = schedules.map(s => s.id);
        const sessions = await prismaClient.attendanceSession.findMany({
            where: { classScheduleId: { in: scheduleIds } },
            include: {
                attendances: { select: { status: true } },
                classSchedule: {
                    select: {
                        subject: { select: { id: true, name: true, code: true } },
                        class: { select: { name: true } }
                    }
                }
            },
            orderBy: { date: 'asc' }
        });

        // Create a map of schedule to class name for subject naming
        const scheduleClassMap = new Map();
        schedules.forEach(schedule => {
            scheduleClassMap.set(schedule.id, schedule.class.name);
        });

        // Group sessions by subject + class combination
        const groupedBySubject = sessions.reduce((acc, session, index) => {
            const subjectId = session.classSchedule.subject.id;
            const className = session.classSchedule.class.name;
            const key = `${subjectId}-${className}`;

            if (!acc[key]) {
                acc[key] = {
                    subject: {
                        id: session.classSchedule.subject.id,
                        name: `${session.classSchedule.subject.name} - ${className}`,
                        code: session.classSchedule.subject.code
                    },
                    totalMeetings: 0,
                    sessions: []
                };
            }

            const attendances = session.attendances;
            const summary = {
                present: attendances.filter(a => a.status === 'present').length,
                absent: attendances.filter(a => a.status === 'absent').length,
                late: attendances.filter(a => a.status === 'late').length,
                excused: attendances.filter(a => a.status === 'excused').length
            };

            acc[key].totalMeetings++;
            acc[key].sessions.push({
                sessionId: session.id,
                meetingNumber: acc[key].totalMeetings,
                date: session.date,
                status: session.status,
                summary: summary
            });

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
            subjects: Object.values(groupedBySubject)
        };
    }
    // STUDENT VIEW
    else if (role === 'student') {
        if (!classId) {
            throw new ResponseError(400, "Student must have a class");
        }

        schedules = await prismaClient.classSchedule.findMany({
            where: {
                classId: classId,
                academicPeriodId: academicPeriodId
            },
            include: {
                subject: {
                    select: { id: true, name: true, code: true }
                },
                teacher: {
                    select: { id: true, fullName: true }
                },
                class: {
                    select: { id: true, name: true, gradeLevel: true }
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

        // Get sessions with student's attendance
        const scheduleIds = schedules.map(s => s.id);
        const sessions = await prismaClient.attendanceSession.findMany({
            where: { classScheduleId: { in: scheduleIds } },
            include: {
                attendances: {
                    where: { studentId: profileId },
                    select: {
                        id: true,
                        status: true,
                        checkInTime: true,
                        notes: true
                    }
                },
                classSchedule: {
                    select: {
                        subject: { select: { id: true, name: true, code: true } }
                    }
                }
            },
            orderBy: { date: 'asc' }
        });

        // Group sessions by subject
        const groupedBySubject = sessions.reduce((acc, session) => {
            const subjectId = session.classSchedule.subject.id;

            if (!acc[subjectId]) {
                acc[subjectId] = {
                    subject: {
                        id: session.classSchedule.subject.id,
                        name: session.classSchedule.subject.name,
                        code: session.classSchedule.subject.code
                    },
                    totalMeetings: 0,
                    sessions: []
                };
            }

            const myAttendance = session.attendances[0] || null;

            // Format attendance status (capitalize first letter)
            let attendanceStatus = 'Not marked';
            if (myAttendance) {
                const status = myAttendance.status;
                attendanceStatus = status.charAt(0).toUpperCase() + status.slice(1);
            }

            acc[subjectId].totalMeetings++;
            acc[subjectId].sessions.push({
                sessionId: session.id,
                meetingNumber: acc[subjectId].totalMeetings,
                date: session.date,
                status: session.status,
                myAttendance: attendanceStatus,
                attendanceDetails: myAttendance ? {
                    attendanceId: myAttendance.id,
                    checkInTime: myAttendance.checkInTime,
                    notes: myAttendance.notes
                } : null
            });

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
            subjects: Object.values(groupedBySubject)
        };
    } else {
        throw new ResponseError(403, "Invalid role");
    }

    return result;
};

/**
 * Get teacher's schedules (classes they teach)
 * Can be filtered by academic period
 */
const getTeacherSchedules = async(request) => {
    const validated = validate(getTeacherSchedulesSchema, request);
    const { teacherId, academicPeriodId, isActive } = validated;

    const whereClause = {
        teacherId: teacherId
    };

    if (academicPeriodId) {
        whereClause.academicPeriodId = academicPeriodId;
    }

    if (isActive !== undefined) {
        whereClause.isActive = isActive;
    }

    const schedules = await prismaClient.classSchedule.findMany({
        where: whereClause,
        include: {
            class: {
                select: {
                    name: true,
                    gradeLevel: true
                }
            },
            subject: {
                select: {
                    name: true,
                    code: true
                }
            },
            academicPeriod: {
                select: {
                    name: true,
                    isActive: true
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

    return schedules.map(schedule => ({
        id: schedule.id,
        className: schedule.class.name,
        gradeLevel: schedule.class.gradeLevel,
        subject: schedule.subject.name,
        subjectCode: schedule.subject.code,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room,
        academicPeriod: schedule.academicPeriod.name,
        isActive: schedule.isActive,
        totalSessions: schedule._count.attendanceSessions
    }));
};

/**
 * Create new class schedule (Admin only)
 */
const createSchedule = async(request) => {
    const validated = validate(createScheduleSchema, request);
    const {
        classId,
        subjectId,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        room,
        academicPeriodId
    } = validated;

    // Check for time conflicts
    const conflict = await checkTimeConflict({
        teacherId,
        classId,
        dayOfWeek,
        startTime,
        endTime,
        academicPeriodId
    });

    if (conflict.hasConflict) {
        throw new ResponseError(400, conflict.message);
    }

    const schedule = await prismaClient.classSchedule.create({
        data: {
            classId,
            subjectId,
            teacherId,
            dayOfWeek,
            startTime,
            endTime,
            room,
            academicPeriodId,
            isActive: true
        },
        include: {
            class: {
                select: { name: true, gradeLevel: true }
            },
            subject: {
                select: { name: true, code: true }
            },
            teacher: {
                select: { fullName: true }
            }
        }
    });

    return {
        id: schedule.id,
        className: schedule.class.name,
        gradeLevel: schedule.class.gradeLevel,
        subject: schedule.subject.name,
        subjectCode: schedule.subject.code,
        teacher: schedule.teacher.fullName,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room,
        isActive: schedule.isActive
    };
};

/**
 * Update existing schedule (Admin only)
 */
const updateSchedule = async(request) => {
    const validated = validate(updateScheduleSchema, request);
    const { scheduleId, updates } = validated;

    // Get existing schedule
    const existingSchedule = await prismaClient.classSchedule.findUnique({
        where: { id: scheduleId }
    });

    if (!existingSchedule) {
        throw new ResponseError(404, "Schedule not found");
    }

    // If time/day/teacher/class is being updated, check conflicts
    if (updates.dayOfWeek || updates.startTime || updates.endTime ||
        updates.teacherId || updates.classId) {

        const conflict = await checkTimeConflict({
            teacherId: updates.teacherId || existingSchedule.teacherId,
            classId: updates.classId || existingSchedule.classId,
            dayOfWeek: updates.dayOfWeek || existingSchedule.dayOfWeek,
            startTime: updates.startTime || existingSchedule.startTime,
            endTime: updates.endTime || existingSchedule.endTime,
            academicPeriodId: updates.academicPeriodId || existingSchedule.academicPeriodId,
            excludeScheduleId: scheduleId
        });

        if (conflict.hasConflict) {
            throw new ResponseError(400, conflict.message);
        }
    }

    const updated = await prismaClient.classSchedule.update({
        where: { id: scheduleId },
        data: updates,
        include: {
            class: { select: { name: true, gradeLevel: true } },
            subject: { select: { name: true, code: true } },
            teacher: { select: { fullName: true } }
        }
    });

    return {
        id: updated.id,
        className: updated.class.name,
        gradeLevel: updated.class.gradeLevel,
        subject: updated.subject.name,
        subjectCode: updated.subject.code,
        teacher: updated.teacher.fullName,
        dayOfWeek: updated.dayOfWeek,
        startTime: updated.startTime,
        endTime: updated.endTime,
        room: updated.room,
        isActive: updated.isActive
    };
};

/**
 * Delete schedule (Admin only)
 * Can be soft delete (set isActive = false) or hard delete
 */
const deleteSchedule = async(request) => {
    const validated = validate(deleteScheduleSchema, request);
    const { scheduleId, softDelete } = validated;

    const schedule = await prismaClient.classSchedule.findUnique({
        where: { id: scheduleId },
        include: {
            _count: {
                select: {
                    attendanceSessions: true
                }
            }
        }
    });

    if (!schedule) {
        throw new ResponseError(404, "Schedule not found");
    }

    // If has sessions, force soft delete
    if (schedule._count.attendanceSessions > 0 && !softDelete) {
        throw new ResponseError(400,
            "Cannot delete schedule with existing sessions. Use soft delete instead.");
    }

    if (softDelete || schedule._count.attendanceSessions > 0) {
        // Soft delete - set isActive to false
        await prismaClient.classSchedule.update({
            where: { id: scheduleId },
            data: { isActive: false }
        });

        return {
            message: "Schedule deactivated successfully",
            scheduleId: scheduleId,
            deleted: false
        };
    } else {
        // Hard delete
        await prismaClient.classSchedule.delete({
            where: { id: scheduleId }
        });

        return {
            message: "Schedule deleted successfully",
            scheduleId: scheduleId,
            deleted: true
        };
    }
};

/**
 * Bulk create schedules (Admin only)
 * Create multiple schedules in one transaction
 */
const bulkCreateSchedules = async(request) => {
    const validated = validate(bulkCreateSchedulesSchema, request);
    const { schedules } = validated;

    // Validate each schedule for conflicts
    for (const schedule of schedules) {
        const conflict = await checkTimeConflict({
            teacherId: schedule.teacherId,
            classId: schedule.classId,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            academicPeriodId: schedule.academicPeriodId
        });

        if (conflict.hasConflict) {
            throw new ResponseError(400,
                `Conflict for ${conflict.message} - Schedule: ${JSON.stringify(schedule)}`);
        }
    }

    // Create all schedules in transaction
    const created = await prismaClient.$transaction(
        schedules.map(schedule =>
            prismaClient.classSchedule.create({
                data: {
                    ...schedule,
                    isActive: true
                }
            })
        )
    );

    return {
        message: "Schedules created successfully",
        count: created.length,
        schedules: created.map(s => s.id)
    };
};

export default {
    getScheduleByDate,
    getWeeklySchedule,
    getScheduleByAcademicPeriod,
    getTeacherSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    bulkCreateSchedules,
};