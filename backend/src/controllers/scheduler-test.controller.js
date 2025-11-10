import SessionScheduler from '../jobs/sessions.jobs.js';

const schedulerInstance = new SessionScheduler();

/**
 * Manual trigger to complete ongoing sessions
 * For testing without waiting for 23:59 cron
 */
const manualCompleteOngoingController = async (req, res, next) => {
    try {
        const result = await schedulerInstance.manualCompleteOngoing();

        res.status(200).json({
            success: true,
            message: 'Successfully completed ongoing sessions',
            data: {
                sessionsCompleted: result.count,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Manual trigger to finalize old completed sessions
 * For testing without waiting for 3 days + daily cron
 */
const manualFinalizeOldController = async (req, res, next) => {
    try {
        const result = await schedulerInstance.manualFinalizeOld();

        res.status(200).json({
            success: true,
            message: 'Successfully finalized completed sessions older than 3 days',
            data: {
                sessionsFinalized: result.count,
                cutoffDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        next(error);
    }
};

export default {
    manualCompleteOngoingController,
    manualFinalizeOldController
};
