import axios from 'axios';
import FormData from 'form-data';
import { ResponseError } from '../error/response-error.js';

// Flask backend URL - adjust according to your setup
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://localhost:5000';

/**
 * Service to interact with Flask Face Recognition API
 */
class FlaskApiService {
    /**
     * Register a new face with average embedding
     * @param {Buffer} videoBuffer - Video file buffer
     * @param {string} name - Student name
     * @param {number} uidFace - Optional UID, will be generated if not provided
     * @returns {Promise<Object>} Registration result with uid_face
     */
    async registerFaceAverage(videoBuffer, name, uidFace = null) {
        try {
            const formData = new FormData();
            formData.append('video', videoBuffer, {
                filename: 'registration.mp4',
                contentType: 'video/mp4'
            });
            formData.append('name', name);

            if (uidFace) {
                formData.append('uid_face', uidFace.toString());
            }

            const response = await axios.post(
                `${FLASK_API_URL}/register-face-average`,
                formData, {
                    headers: {
                        ...formData.getHeaders()
                    },
                    timeout: 30000 // 30 seconds timeout
                }
            );

            return response.data;
        } catch (error) {
            console.error('Flask API Error (register-face-average):', error.response ? error.response.data : error.message);

            if (error.response?.data?.error) {
                throw new ResponseError(400, error.response.data.error);
            }

            throw new ResponseError(500, 'Failed to register face with Flask API');
        }
    }

    /**
     * Verify a face from image
     * @param {Buffer} imageBuffer - Image file buffer
     * @returns {Promise<Object>} Verification result with name, confidence, uid_face, spoof
     */
    async verifyFace(imageBuffer) {
        try {
            console.log('🐍 [FlaskApiService.verifyFace] Calling Flask API...');
            console.log('   Flask URL:', `${FLASK_API_URL}/verify-face`);
            console.log('   Image buffer size:', imageBuffer.length, 'bytes');

            const formData = new FormData();
            formData.append('image', imageBuffer, {
                filename: 'verification.jpg',
                contentType: 'image/jpeg'
            });

            const response = await axios.post(
                `${FLASK_API_URL}/verify-face`,
                formData, {
                    headers: {
                        ...formData.getHeaders()
                    },
                    timeout: 10000 // 10 seconds timeout
                }
            );

            console.log('✅ [FlaskApiService.verifyFace] Flask API Response Success!');
            console.log('   Response data:', JSON.stringify(response.data, null, 2));

            return response.data;
        } catch (error) {
            console.error('❌ [FlaskApiService.verifyFace] Flask API Error!');
            console.error('   Error message:', error.message);
            console.error('   Error response:', error.response ? JSON.stringify(error.response.data, null, 2) : 'No response data');
            console.error('   Error status:', error.response?.status);

            if (error.response?.data?.error) {
                throw new ResponseError(400, error.response.data.error);
            }

            throw new ResponseError(500, 'Failed to verify face with Flask API');
        }
    }
}

export default new FlaskApiService();