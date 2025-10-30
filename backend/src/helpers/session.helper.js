import { ResponseError } from "../error/response-error.js";
/**
 * Calculate attendance summary for a session. Counts students by attendance status 
 * @param {Array} attendances - Array of attendance records || @returns {Object} Summary with counts { present, absent, late, excused, total }
 */
const calculateSessionSummary = (attendances) => {
    const summary = {
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        total: attendances.length
    };

    attendances.forEach(attendance => {
        const status = attendance.status.toLowerCase();
        if (summary.hasOwnProperty(status)) {
            summary[status]++;
        }
    });

    return summary;
};

/**
 * Validate that a teacher owns/created a session. Throws error if unauthorized
 * @param {Object} session - Session object with createdBy field || @param {Number} teacherId - Teacher's profile ID|  @throws {ResponseError} If teacher doesn't own the session
 */
const validateSessionOwnership = async(session, teacherId) => {
    if (session.createdBy !== teacherId) {
        throw new ResponseError(403, "Unauthorized to access this session");
    }
};

export {
    calculateSessionSummary,
    validateSessionOwnership,
};