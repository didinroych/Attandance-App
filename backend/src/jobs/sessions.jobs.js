import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


class SessionScheduler {
    constructor() {
        this.jobs = [];
    }
    scheduleCompleteOngoingSessions() {
        const job = cron.schedule('59 23 * * *', async() => {
            try {
                console.log('[Session Scheduler] Starting: Complete ongoing sessions - ' + new Date().toISOString());

                const result = await prisma.attendanceSession.updateMany({
                    where: {
                        status: 'ongoing',

                        startedAt: {
                            not: null
                        }
                    },
                    data: {
                        status: 'completed',
                        endedAt: new Date()
                    }
                });

                console.log(`[Session Scheduler] Completed ${result.count} ongoing sessions`);
            } catch (error) {
                console.error('[Session Scheduler] Error completing ongoing sessions:', error);
            }
        }, {
            timezone: "Asia/Jakarta" // Adjust to your timezone
        });

        this.jobs.push(job);
        console.log('[Session Scheduler] Scheduled: Complete ongoing sessions at 23:59 daily');
    }

    scheduleFinalizeOldSessions() {
        const job = cron.schedule('15 0 * * *', async() => {
            try {
                console.log('[Session Scheduler] Starting: Finalize old completed sessions - ' + new Date().toISOString());

                // Calculate the date 3 days ago
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                threeDaysAgo.setHours(23, 59, 59, 999); // End of that day

                const result = await prisma.attendanceSession.updateMany({
                    where: {
                        status: 'completed',
                        // Session completed 3+ days ago
                        endedAt: {
                            lte: threeDaysAgo
                        }
                    },
                    data: {
                        status: 'finalized'
                    }
                });

                console.log(`[Session Scheduler] Finalized ${result.count} completed sessions (older than 3 days)`);
            } catch (error) {
                console.error('[Session Scheduler] Error finalizing completed sessions:', error);
            }
        }, {
            timezone: "Asia/Jakarta" // Adjust to your timezone
        });

        this.jobs.push(job);
        console.log('[Session Scheduler] Scheduled: Finalize completed sessions at 00:15 daily');
    }

    start() {
        this.scheduleCompleteOngoingSessions();
        this.scheduleFinalizeOldSessions();

        console.log('[Session Scheduler] All jobs started successfully');
    }

    stop() {
        this.jobs.forEach(job => job.stop());
        console.log('[Session Scheduler] All jobs stopped');
    }

    async manualCompleteOngoing() {
        console.log('[Session Scheduler] Manual trigger: Complete ongoing sessions');

        const result = await prisma.attendanceSession.updateMany({
            where: {
                status: 'ongoing',
                startedAt: {
                    not: null
                }
            },
            data: {
                status: 'completed',
                endedAt: new Date()
            }
        });

        console.log(`Completed ${result.count} ongoing sessions`);
        return result;
    }

    async manualFinalizeOld() {
        console.log('[Session Scheduler] Manual trigger: Finalize old completed sessions');

        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        threeDaysAgo.setHours(23, 59, 59, 999);

        const result = await prisma.attendanceSession.updateMany({
            where: {
                status: 'completed',
                endedAt: {
                    lte: threeDaysAgo
                }
            },
            data: {
                status: 'finalized'
            }
        });

        console.log(`Finalized ${result.count} completed sessions`);
        return result;
    }
}

export default SessionScheduler;