import { ResponseError } from "../error/response-error.js";

/**
 * Calculate attendance percentage
 * Returns percentage of attendance (present + late) vs total
 * 
 * @param {Array} attendances - Array of attendance records
 * @returns {Number} Percentage (0-100)
 */
const calculateAttendancePercentage = (attendances) => {
    if (!attendances || attendances.length === 0) {
        return 0;
    }
    const presentCount = attendances.filter(
        a => a.status === 'present' || a.status === 'late'
    ).length;

    return Math.round((presentCount / attendances.length) * 100);
};

/**
 * Determine attendance status based on check-in time
 * Compares check-in time with scheduled start time
 * 
 * @param {Date} checkInTime - When student checked in || @param {Date} sessionDate - Date of the session
 * @param {String} scheduledStartTime - Scheduled start time (HH:MM:SS)
 * @param {Number} lateThresholdMinutes - Minutes after start to mark as late (default: 15) 
 * @returns {String} Status: 'present' or 'late'
 */
const determineAttendanceStatus = (
    checkInTime,
    sessionDate,
    scheduledStartTime,
    lateThresholdMinutes = 15
) => {
    // Combine session date with scheduled time
    const sessionDateStr = sessionDate.toISOString().split('T')[0];
    const scheduledDateTime = new Date(`${sessionDateStr}T${scheduledStartTime}`);

    // Add late threshold
    const lateThreshold = new Date(scheduledDateTime);
    lateThreshold.setMinutes(lateThreshold.getMinutes() + lateThresholdMinutes);

    // Determine status
    if (checkInTime <= lateThreshold) {
        return 'present';
    } else {
        return 'late';
    }
};

/**
 * Validate session is active and modifiable
 * Throws error if session cannot be modified 
 * @param {Object} session - Session object || @throws {ResponseError} If session cannot be modified
 */
const validateSessionActive = (session) => {
    if (session.status === 'completed') {
        throw new ResponseError(400, "Cannot modify attendance for completed session");
    }

    if (session.status === 'cancelled') {
        throw new ResponseError(400, "Cannot modify attendance for cancelled session");
    }

    return true;
};


export {
    calculateAttendancePercentage,
    determineAttendanceStatus,
    validateSessionActive,
};