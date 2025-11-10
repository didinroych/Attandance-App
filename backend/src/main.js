import { web } from "./application/web.js";
import { logger } from "./application/logging.js";
import SessionScheduler from './jobs/sessions.jobs.js';

const PORT = process.env.PORT || 3000;
const ENV = process.env.NODE_ENV || "development";
const sessionScheduler = new SessionScheduler();

web.listen(PORT, () => {
    logger.info(`🚀 App running in ${ENV} mode on port ${PORT}`);

    // Start session scheduler for automated state transitions
    sessionScheduler.start();
    logger.info('📅 Session scheduler started - sessions will auto-complete at 23:59 and finalize after 3 days');
});