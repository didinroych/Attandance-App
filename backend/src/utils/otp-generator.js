/**
 * Generate a random 6-digit OTP code
 * @returns {string} 6-digit OTP code
 */
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Get OTP expiry date
 * @param {number} minutes - Minutes until expiration (default: 10)
 * @returns {Date} Expiry date
 */
export const getOTPExpiry = (minutes = 10) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};

/**
 * Check if OTP is expired
 * @param {Date} expiresAt - Expiry date
 * @returns {boolean} True if expired
 */
export const isOTPExpired = (expiresAt) => {
    return new Date() > new Date(expiresAt);
};