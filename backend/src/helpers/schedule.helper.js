import { prismaClient } from "../application/database.js";

/**
 * Convert time string (HH:mm:ss) to ISO DateTime string for Prisma comparison
 * @param {string} timeStr - Time in HH:mm:ss format
 * @returns {string} ISO DateTime string
 */
const timeToDateTime = (timeStr) => {
    return `1970-01-01T${timeStr}.000Z`;
};

/**
 * Check for time conflicts
 * Prevents scheduling conflicts for teachers, classes, and rooms
 *
 * @param {Object} params - Schedule parameters
 * @returns {Object} { hasConflict: boolean, message: string }
 */
const checkTimeConflict = async(params) => {
    const {
        teacherId,
        classId,
        dayOfWeek,
        startTime,
        endTime,
        academicPeriodId,
        excludeScheduleId
    } = params;

    // Convert time strings to DateTime format for Prisma comparison
    const startDateTime = timeToDateTime(startTime);
    const endDateTime = timeToDateTime(endTime);

    const whereClause = {
        dayOfWeek: dayOfWeek,
        academicPeriodId: academicPeriodId,
        isActive: true
    };

    if (excludeScheduleId) {
        whereClause.id = { not: excludeScheduleId };
    }

    // Check teacher conflict
    const teacherConflict = await prismaClient.classSchedule.findFirst({
        where: {
            ...whereClause,
            teacherId: teacherId,
            OR: [{
                    AND: [
                        { startTime: { lte: startDateTime } },
                        { endTime: { gt: startDateTime } }
                    ]
                },
                {
                    AND: [
                        { startTime: { lt: endDateTime } },
                        { endTime: { gte: endDateTime } }
                    ]
                },
                {
                    AND: [
                        { startTime: { gte: startDateTime } },
                        { endTime: { lte: endDateTime } }
                    ]
                }
            ]
        }
    });

    if (teacherConflict) {
        return {
            hasConflict: true,
            message: `Teacher has conflicting schedule at ${teacherConflict.startTime}-${teacherConflict.endTime}`
        };
    }

    // Check class conflict
    const classConflict = await prismaClient.classSchedule.findFirst({
        where: {
            ...whereClause,
            classId: classId,
            OR: [{
                    AND: [
                        { startTime: { lte: startDateTime } },
                        { endTime: { gt: startDateTime } }
                    ]
                },
                {
                    AND: [
                        { startTime: { lt: endDateTime } },
                        { endTime: { gte: endDateTime } }
                    ]
                },
                {
                    AND: [
                        { startTime: { gte: startDateTime } },
                        { endTime: { lte: endDateTime } }
                    ]
                }
            ]
        }
    });

    if (classConflict) {
        return {
            hasConflict: true,
            message: `Class has conflicting schedule at ${classConflict.startTime}-${classConflict.endTime}`
        };
    }

    return {
        hasConflict: false,
        message: null
    };
};

/**
 * Merge schedules with session data
 * Combines schedule info with session information
 * 
 * @param {Array} schedules - Array of schedule objects
 * @param {Array} sessions - Array of session objects
 * @returns {Array} Merged schedule+session data
 */
const mergeSchedulesWithSessions = (schedules, sessions) => {
    const sessionMap = new Map();
    sessions.forEach(session => {
        if (!sessionMap.has(session.classScheduleId)) {
            sessionMap.set(session.classScheduleId, []);
        }
        sessionMap.get(session.classScheduleId).push(session);
    });

    return schedules.map(schedule => ({
        ...schedule,
        sessions: sessionMap.get(schedule.id) || []
    }));
};

export {
    timeToDateTime,
    checkTimeConflict,
    mergeSchedulesWithSessions,
};