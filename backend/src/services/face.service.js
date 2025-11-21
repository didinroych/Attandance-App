import { prismaClient } from '../application/database.js';
import { ResponseError } from '../error/response-error.js';
import flaskApiService from './flask-api.service.js';

/**
 * Face Recognition Service
 * Handles student face registration and verification
 */
class FaceService {
    /**
     * Register student face
     * @param {Object} request - { studentId, videoBuffer, filename }
     * @returns {Promise<Object>} Registration result
     */
    async registerStudentFace(request) {
        const { studentId, videoBuffer, filename } = request;

        // Validate student exists
        const student = await prismaClient.student.findUnique({
            where: { id: studentId },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true
                    }
                },
                faces: {
                    where: { isActive: true }
                }
            }
        });

        if (!student) {
            throw new ResponseError(404, 'Student not found');
        }

        // Check if student already has active face
        if (student.faces && student.faces.length > 0) {
            throw new ResponseError(400, 'Student already has registered face. Deactivate existing face first.');
        }

        try {
            // Call Flask API to register face
            const flaskResult = await flaskApiService.registerFaceAverage(
                videoBuffer,
                student.fullName,
                null // Let Flask generate uid_face
            );

            // Store face data in database
            const studentFace = await prismaClient.studentFace.create({
                data: {
                    studentId: student.id,
                    faceEmbedding: {
                        uid_face: flaskResult.uid_face,
                        frames_used: flaskResult.frames_used,
                        total_frames: flaskResult.total_frames,
                        registered_name: flaskResult.name
                    },
                    imageFilename: filename,
                    confidenceThreshold: 0.8,
                    isActive: true
                }
            });

            return {
                success: true,
                message: 'Face registered successfully',
                data: {
                    faceId: studentFace.id,
                    studentId: student.id,
                    studentName: student.fullName,
                    uidFace: flaskResult.uid_face,
                    framesUsed: flaskResult.frames_used,
                    totalFrames: flaskResult.total_frames,
                    registeredAt: studentFace.registeredAt
                }
            };
        } catch (error) {
            console.error('Face registration error:', error);
            throw error;
        }
    }

    /**
     * Verify face and get student information
     * @param {Buffer} imageBuffer - Image buffer to verify
     * @returns {Promise<Object>} Verification result with student info
     */
    async verifyFace(imageBuffer) {
        try {
            console.log('🔍 [FaceService.verifyFace] Starting face verification...');
            console.log('   Image buffer size:', imageBuffer.length, 'bytes');

            // Call Flask API to verify face
            const flaskResult = await flaskApiService.verifyFace(imageBuffer);

            console.log('📡 [FaceService.verifyFace] Flask API Response:', flaskResult);
            console.log('   Status:', flaskResult.status);
            console.log('   Name:', flaskResult.name);
            console.log('   UID Face:', flaskResult.uid_face);
            console.log('   Confidence:', flaskResult.confidence);
            console.log('   Spoof:', flaskResult.spoof);

            // Check verification status
            if (flaskResult.status === 'no face detected') {
                console.log('❌ [FaceService.verifyFace] No face detected');
                return {
                    success: false,
                    message: 'No face detected in image',
                    verified: false
                };
            }

            // Check for spoofing
            if (flaskResult.spoof === true) {
                console.log('⚠️ [FaceService.verifyFace] Spoofing detected!');
                return {
                    success: false,
                    message: 'Face verification failed - possible spoofing detected',
                    verified: false,
                    confidence: flaskResult.confidence
                };
            }

            console.log('🔎 [FaceService.verifyFace] Looking up student in database...');
            console.log('   Searching for uid_face:', flaskResult.uid_face);

            // Find student by uid_face
            const studentFace = await prismaClient.studentFace.findFirst({
                where: {
                    faceEmbedding: {
                        path: '$.uid_face',
                        equals: flaskResult.uid_face
                    },
                    isActive: true
                },
                include: {
                    student: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    email: true,
                                    role: true
                                }
                            },
                            class: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    }
                }
            });

            if (!studentFace) {
                console.log('❌ [FaceService.verifyFace] Student NOT found in database');
                console.log('   Flask returned uid_face:', flaskResult.uid_face);
                console.log('   Flask returned name:', flaskResult.name);
                return {
                    success: false,
                    message: 'Face not recognized - student not found in database',
                    verified: false,
                    flaskData: {
                        name: flaskResult.name,
                        uidFace: flaskResult.uid_face,
                        confidence: flaskResult.confidence
                    }
                };
            }

            console.log('✅ [FaceService.verifyFace] Student FOUND in database!');
            console.log('   Student ID:', studentFace.student.id);
            console.log('   Student Name:', studentFace.student.fullName);
            console.log('   Student Class:', studentFace.student.class.name);

            return {
                success: true,
                message: 'Face verified successfully',
                verified: true,
                confidence: flaskResult.confidence,
                student: {
                    id: studentFace.student.id,
                    studentId: studentFace.student.studentId,
                    fullName: studentFace.student.fullName,
                    userId: studentFace.student.user.id,
                    username: studentFace.student.user.username,
                    email: studentFace.student.user.email,
                    class: studentFace.student.class,
                    faceId: studentFace.id,
                    uidFace: flaskResult.uid_face
                }
            };
        } catch (error) {
            console.error('Face verification error:', error);
            throw error;
        }
    }

    /**
     * Deactivate student face
     * @param {number} studentId - Student ID
     * @returns {Promise<Object>} Deactivation result
     */
    async deactivateStudentFace(studentId) {
        const student = await prismaClient.student.findUnique({
            where: { id: studentId },
            include: {
                faces: {
                    where: { isActive: true }
                }
            }
        });

        if (!student) {
            throw new ResponseError(404, 'Student not found');
        }

        if (!student.faces || student.faces.length === 0) {
            throw new ResponseError(400, 'No active face found for student');
        }

        // Deactivate all active faces
        await prismaClient.studentFace.updateMany({
            where: {
                studentId: studentId,
                isActive: true
            },
            data: {
                isActive: false
            }
        });

        return {
            success: true,
            message: 'Student face deactivated successfully',
            deactivatedCount: student.faces.length
        };
    }

    /**
     * Get student face information
     * @param {number} studentId - Student ID
     * @returns {Promise<Object>} Student face information
     */
    async getStudentFace(studentId) {
        const studentFace = await prismaClient.studentFace.findFirst({
            where: {
                studentId: studentId,
                isActive: true
            },
            include: {
                student: {
                    select: {
                        id: true,
                        studentId: true,
                        fullName: true,
                        user: {
                            select: {
                                username: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });

        if (!studentFace) {
            throw new ResponseError(404, 'No active face found for student');
        }

        return {
            success: true,
            data: {
                faceId: studentFace.id,
                studentId: studentFace.student.id,
                studentIdNumber: studentFace.student.studentId,
                studentName: studentFace.student.fullName,
                uidFace: studentFace.faceEmbedding.uid_face,
                imageFilename: studentFace.imageFilename,
                confidenceThreshold: studentFace.confidenceThreshold,
                registeredAt: studentFace.registeredAt,
                updatedAt: studentFace.updatedAt
            }
        };
    }
}

export default new FaceService();