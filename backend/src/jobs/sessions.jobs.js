//Ini nanti ubah jadi jobs -- 

/**
 * End/complete a session
 * Shortcut for updateSessionStatus with status='completed'
 */
const endSession = async(request) => {
    const validated = validate(endSessionSchema, request);

    return await updateSessionStatus({
        sessionId: validated.sessionId,
        status: 'completed',
        profileId: validated.profileId
    });
};

/**
 * Cancel a session
 */
const cancelSession = async(request) => {
    const validated = validate(endSessionSchema, request);

    return await updateSessionStatus({
        sessionId: validated.sessionId,
        status: 'cancelled',
        profileId: validated.profileId
    });
};