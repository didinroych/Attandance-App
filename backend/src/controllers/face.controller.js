import { ResponseError } from "../error/response-error.js";
import faceService from "../services/face.service.js";
import attendanceService from "../services/attendance.service.js";
import attendanceCheckInService from "../services/attendance-checkin.service.js";
import { prismaClient } from "../application/database.js";

/**
 * POST /api/users/register-face
 * Register student face using video
 * Can be used by student themselves or by admin/teacher
 */
const registerFaceController = async(req, res, next) => {
    try {
        // Check if video file exists
        if (!req.files || !req.files.video) {
            throw new ResponseError(400, 'Video file is required');
        }

        const videoFile = req.files.video;

        // Validate file type
        const allowedMimeTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
        if (!allowedMimeTypes.includes(videoFile.mimetype)) {
            throw new ResponseError(400, 'Invalid video format. Allowed formats: MP4, MPEG, MOV, AVI');
        }

        // Determine student ID
        let studentId;

        if (req.user.role === 'student') {
            // Student registering their own face
            studentId = req.user.profileId;
        } else if (req.user.role === 'admin' || req.user.role === 'teacher') {
            // Admin/teacher registering student face
            studentId = parseInt(req.body.studentId);

            if (!studentId || isNaN(studentId)) {
                throw new ResponseError(400, 'Student ID is required');
            }
        } else {
            throw new ResponseError(403, 'Unauthorized to register face');
        }

        const request = {
            studentId: studentId,
            videoBuffer: videoFile.data,
            filename: videoFile.name
        };

        const result = await faceService.registerStudentFace(request);

        res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });
    } catch (e) {
        next(e);
    }
};

const bulkRegisterFacesController = async(req, res, next) => {
    try {
        if (req.user.role !== 'admin') {
            throw new ResponseError(403, 'Only admins can bulk register');
        }

        // req.files akan berisi multiple videos
        const videos = req.files;
        const registrations = req.body.registrations; // JSON array

        const results = [];

        for (const reg of registrations) {
            try {
                const videoFile = videos[reg.videoKey];
                const result = await faceService.registerStudentFace({
                    studentId: reg.studentId,
                    videoBuffer: videoFile.data,
                    filename: videoFile.name
                });
                results.push({ success: true, studentId: reg.studentId, result });
            } catch (error) {
                results.push({ success: false, studentId: reg.studentId, error: error.message });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Bulk registration completed',
            results: results,
            summary: {
                total: results.length,
                success: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        });
    } catch (e) {
        next(e);
    }
};

/**
 * POST /api/users/verify-face
 * Verify face and mark attendance (for teacher/admin manual verification)
 * This allows teacher to verify a student's face and mark attendance manually
 */
const verifyFaceController = async(req, res, next) => {
    try {
        // Only teacher and admin can use this endpoint
        if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
            throw new ResponseError(403, 'Only teachers and admins can verify faces');
        }

        // Check if image file exists
        if (!req.files || !req.files.image) {
            throw new ResponseError(400, 'Image file is required');
        }

        const imageFile = req.files.image;

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedMimeTypes.includes(imageFile.mimetype)) {
            throw new ResponseError(400, 'Invalid image format. Allowed formats: JPEG, JPG, PNG');
        }

        // Verify face
        const verificationResult = await faceService.verifyFace(imageFile.data);

        if (!verificationResult.verified) {
            return res.status(200).json({
                success: false,
                message: verificationResult.message,
                verified: false,
                confidence: verificationResult.confidence
            });
        }

        // If sessionId is provided, mark attendance automatically
        if (req.body.sessionId) {
            const sessionId = parseInt(req.body.sessionId);

            if (isNaN(sessionId)) {
                throw new ResponseError(400, 'Invalid session ID');
            }

            // Mark attendance for this student
            const attendanceRequest = {
                sessionId: sessionId,
                attendances: [{
                    studentId: verificationResult.student.id,
                    status: 'present',
                    notes: 'Face verified by teacher'
                }],
                profileId: req.user.profileId
            };

            const attendanceResult = await attendanceService.markAttendance(attendanceRequest);

            return res.status(200).json({
                success: true,
                message: 'Face verified and attendance marked',
                verified: true,
                confidence: verificationResult.confidence,
                student: verificationResult.student,
                attendance: attendanceResult
            });
        }

        // Just return verification result without marking attendance
        res.status(200).json({
            success: true,
            message: verificationResult.message,
            verified: true,
            confidence: verificationResult.confidence,
            student: verificationResult.student
        });
    } catch (e) {
        next(e);
    }
};

/**
 * DELETE /api/users/:studentId/face
 * Deactivate student face (admin/teacher only)
 */
const deactivateFaceController = async(req, res, next) => {
    try {
        // Only admin and teacher can deactivate faces
        if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
            throw new ResponseError(403, 'Only admins and teachers can deactivate faces');
        }

        const studentId = parseInt(req.params.studentId);

        if (isNaN(studentId)) {
            throw new ResponseError(400, 'Invalid student ID');
        }

        const result = await faceService.deactivateStudentFace(studentId);

        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                studentId: studentId,
                deactivatedCount: result.deactivatedCount
            }
        });
    } catch (e) {
        next(e);
    }
};

/**
 * GET /api/users/:studentId/face
 * Get student face information
 */
const getStudentFaceController = async(req, res, next) => {
    try {
        const studentId = parseInt(req.params.studentId);

        if (isNaN(studentId)) {
            throw new ResponseError(400, 'Invalid student ID');
        }

        // Students can only view their own face
        if (req.user.role === 'student' && req.user.profileId !== studentId) {
            throw new ResponseError(403, 'You can only view your own face information');
        }

        const result = await faceService.getStudentFace(studentId);

        res.status(200).json(result);
    } catch (e) {
        next(e);
    }
};

/**
 * POST /api/teacher/sessions/:sessionId/verify-attendance
 * Verify face and automatically mark attendance for specific session
 * Perfect for "kiosk mode" - teacher selects session, students walk by camera
 */
const verifySessionAttendanceController = async(req, res, next) => {
    try {
        // Only teacher can use this endpoint
        if (req.user.role !== 'teacher') {
            throw new ResponseError(403, 'Only teachers can use session-based verification');
        }

        const sessionId = parseInt(req.params.sessionId);

        if (isNaN(sessionId)) {
            throw new ResponseError(400, 'Invalid session ID');
        }

        // Check if image file exists
        if (!req.files || !req.files.image) {
            throw new ResponseError(400, 'Image file is required');
        }

        const imageFile = req.files.image;

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedMimeTypes.includes(imageFile.mimetype)) {
            throw new ResponseError(400, 'Invalid image format. Allowed formats: JPEG, JPG, PNG');
        }

        // Verify face first
        const verificationResult = await faceService.verifyFace(imageFile.data);

        if (!verificationResult.verified) {
            return res.status(200).json({
                success: false,
                message: verificationResult.message,
                verified: false,
                confidence: verificationResult.confidence
            });
        }

        // Verify teacher owns this session
        const session = await attendanceCheckInService.validateTeacherSession(
            sessionId,
            req.user.profileId
        );

        // Find or create attendance record for verified student
        let attendance = await prismaClient.attendance.findFirst({
            where: {
                attendanceSessionId: sessionId,
                studentId: verificationResult.student.id
            }
        });

        if (attendance) {
            // Update existing attendance record
            attendance = await prismaClient.attendance.update({
                where: { id: attendance.id },
                data: {
                    status: 'present',
                    checkInTime: new Date(),
                    attendanceMethod: 'face_recognition',
                    faceConfidence: verificationResult.confidence,
                    markedBy: req.user.profileId,
                    notes: `Auto-verified via face recognition (confidence: ${verificationResult.confidence})`,
                    updatedAt: new Date()
                }
            });
        } else {
            // Create new attendance record
            attendance = await prismaClient.attendance.create({
                data: {
                    attendanceSessionId: sessionId,
                    studentId: verificationResult.student.id,
                    status: 'present',
                    checkInTime: new Date(),
                    attendanceMethod: 'face_recognition',
                    faceConfidence: verificationResult.confidence,
                    markedBy: req.user.profileId,
                    notes: `Auto-verified via face recognition (confidence: ${verificationResult.confidence})`
                }
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Student verified and attendance marked',
            verified: true,
            confidence: verificationResult.confidence,
            student: {
                id: verificationResult.student.id,
                fullName: verificationResult.student.fullName,
                studentId: verificationResult.student.studentId,
                class: verificationResult.student.class
            },
            attendance: {
                sessionId: sessionId,
                attendanceId: attendance.id,
                status: attendance.status,
                markedAt: attendance.checkInTime
            }
        });
    } catch (e) {
        next(e);
    }
};

export default {
    registerFaceController,
    bulkRegisterFacesController,
    verifyFaceController,
    deactivateFaceController,
    getStudentFaceController,
    verifySessionAttendanceController
};