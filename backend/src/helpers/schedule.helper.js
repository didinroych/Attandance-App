import { prismaClient } from "../application/database.js";
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
                        { startTime: { lte: startTime } },
                        { endTime: { gt: startTime } }
                    ]
                },
                {
                    AND: [
                        { startTime: { lt: endTime } },
                        { endTime: { gte: endTime } }
                    ]
                },
                {
                    AND: [
                        { startTime: { gte: startTime } },
                        { endTime: { lte: endTime } }
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
                        { startTime: { lte: startTime } },
                        { endTime: { gt: startTime } }
                    ]
                },
                {
                    AND: [
                        { startTime: { lt: endTime } },
                        { endTime: { gte: endTime } }
                    ]
                },
                {
                    AND: [
                        { startTime: { gte: startTime } },
                        { endTime: { lte: endTime } }
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
    checkTimeConflict,
    mergeSchedulesWithSessions,
};