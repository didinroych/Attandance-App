-- AlterTable
ALTER TABLE `attendance_sessions` MODIFY `status` ENUM('scheduled', 'ongoing', 'completed', 'finalized', 'cancelled') NOT NULL DEFAULT 'scheduled';
