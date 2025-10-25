export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const getOTPExpiry = (minutes = 10) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};

export const isOTPExpired = (expiresAt) => {
    return new Date() > new Date(expiresAt);
};