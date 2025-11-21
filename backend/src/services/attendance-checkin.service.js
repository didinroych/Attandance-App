import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import faceService from "./face.service.js";
import { determineAttendanceStatus } from "../helpers/attendance.helper.js";

/**
 * Student check-in with face verification
 * @param {Object} request - { sessionId (optional), studentId, imageBuffer }
 * @returns {Promise<Object>} Check-in result
 */
const studentCheckIn = async(request) => {
    const { sessionId, studentId, imageBuffer } = request;

    // Verify student exists
    const student = await prismaClient.student.findUnique({
        where: { id: studentId },
        include: {
            class: {
                select: {
                    id: true,
                    name: true
                }
            },
            user: {
                select: {
                    username: true,
                    email: true
                }
            }
        }
    });

    if (!student) {
        throw new ResponseError(404, 'Student not found');
    }

    // Verify face using Flask API
    const verificationResult = await faceService.verifyFace(imageBuffer);

    if (!verificationResult.verified) {
        return {
            success: false,
            message: verificationResult.message,
            verified: false,
            confidence: verificationResult.confidence
        };
    }

    // Check if verified student matches the logged-in student
    if (verificationResult.student.id !== studentId) {
        return {
            success: false,
            message: 'Face does not match the logged-in student',
            verified: false,
            verifiedStudent: verificationResult.student.fullName,
            expectedStudent: student.fullName
        };
    }

    // Find the appropriate session
    let session;

    if (sessionId) {
        // Use provided session ID
        session = await prismaClient.attendanceSession.findUnique({
            where: { id: sessionId },
            include: {
                classSchedule: {
                    include: {
                        subject: true,
                        class: true
                    }
                },
                attendances: {
                    where: { studentId: studentId }
                }
            }
        });

        if (!session) {
            throw new ResponseError(404, 'Session not found');
        }

        // Verify student is in the class for this session
        if (session.classSchedule.class.id !== student.classId) {
            throw new ResponseError(403, 'You are not enrolled in this class');
        }
    } else {
        // Find ongoing session for student's class
        const currentDate = new Date();
        const currentDay = currentDate.getDay() || 7; // Convert Sunday (0) to 7

        session = await prismaClient.attendanceSession.findFirst({
            where: {
                status: 'ongoing',
                date: {
                    equals: new Date(currentDate.toISOString().split('T')[0])
                },
                classSchedule: {
                    classId: student.classId,
                    dayOfWeek: currentDay
                }
            },
            include: {
                classSchedule: {
                    include: {
                        subject: true,
                        class: true
                    }
                },
                attendances: {
                    where: { studentId: studentId }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (!session) {
            return {
                success: false,
                message: 'No ongoing session found for your class today',
                hasSession: false
            };
        }
    }

    // Check if session is ongoing
    if (session.status !== 'ongoing') {
        return {
            success: false,
            message: `Session is ${session.status}. Check-in is only allowed for ongoing sessions.`,
            sessionStatus: session.status
        };
    }

    // Check if student has already checked in
    if (session.attendances && session.attendances.length > 0) {
        const existingAttendance = session.attendances[0];
        return {
            success: false,
            message: 'You have already checked in for this session',
            alreadyCheckedIn: true,
            attendance: {
                id: existingAttendance.id,
                status: existingAttendance.status,
                checkInTime: existingAttendance.checkInTime
            }
        };
    }

    // Determine attendance status (present or late)
    const checkInTime = new Date();
    const status = determineAttendanceStatus(
        checkInTime,
        session.date,
        session.classSchedule.startTime,
        15 // 15 minutes late threshold
    );

    // Create attendance record
    const attendance = await prismaClient.attendance.create({
        data: {
            attendanceSessionId: session.id,
            studentId: studentId,
            status: status,
            checkInTime: checkInTime,
            attendanceMethod: 'face_recognition',
            faceConfidence: verificationResult.confidence,
            notes: `Auto check-in via face recognition`
        }
    });

    return {
        success: true,
        message: `Successfully checked in as ${status}`,
        data: {
            attendanceId: attendance.id,
            studentId: student.id,
            studentName: student.fullName,
            status: attendance.status,
            checkInTime: attendance.checkInTime,
            faceConfidence: attendance.faceConfidence,
            session: {
                id: session.id,
                subject: session.classSchedule.subject.name,
                class: session.classSchedule.class.name,
                date: session.date,
                startTime: session.classSchedule.startTime,
                endTime: session.classSchedule.endTime
            }
        }
    };
};
/**
 * Validate that teacher owns the session
 * @param {number} sessionId - Session ID
 * @param {number} teacherProfileId - Teacher profile ID
 * @returns {Promise<Object>} Session object
 */
const validateTeacherSession = async(sessionId, teacherProfileId) => {
    const session = await prismaClient.attendanceSession.findUnique({
        where: { id: sessionId },
        include: {
            classSchedule: {
                include: {
                    subject: true,
                    class: true,
                    teacher: true
                }
            }
        }
    });

    if (!session) {
        throw new ResponseError(404, 'Session not found');
    }

    // Check if teacher owns this session
    if (session.createdBy !== teacherProfileId) {
        throw new ResponseError(403, 'Unauthorized - This session belongs to another teacher');
    }

    // Check session is ongoing
    if (session.status !== 'ongoing') {
        throw new ResponseError(400, `Session is ${session.status}. Only ongoing sessions can accept attendance.`);
    }

    return session;
};


export default {
    studentCheckIn,
    validateTeacherSession
};