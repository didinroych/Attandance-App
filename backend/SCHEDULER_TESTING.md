# Session Scheduler Testing Guide

This guide explains how to test the automated session scheduler without waiting for cron jobs to run.

## Scheduler Overview

The session scheduler runs two automated jobs:

1. **Complete Ongoing Sessions** - Runs at 23:59 daily
   - Changes `ongoing` sessions → `completed`
   - Sets `endedAt` timestamp

2. **Finalize Old Sessions** - Runs at 00:15 daily
   - Changes `completed` sessions (3+ days old) → `finalized`
   - Locks sessions from further modifications

## Manual Testing Endpoints

### 1. Complete Ongoing Sessions

Manually trigger the completion of all ongoing sessions (simulates the 23:59 cron job).

**Endpoint:**
```
POST /api/admin/scheduler/complete-ongoing
```

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_AUTH_TOKEN",
  "Content-Type": "application/json"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully completed ongoing sessions",
  "data": {
    "sessionsCompleted": 5,
    "timestamp": "2025-11-10T05:30:00.000Z"
  }
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:4000/api/admin/scheduler/complete-ongoing \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

### 2. Finalize Old Completed Sessions

Manually trigger finalization of completed sessions older than 3 days (simulates the 00:15 cron job).

**Endpoint:**
```
POST /api/admin/scheduler/finalize-old
```

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_AUTH_TOKEN",
  "Content-Type": "application/json"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully finalized completed sessions older than 3 days",
  "data": {
    "sessionsFinalized": 12,
    "cutoffDate": "2025-11-07T05:30:00.000Z",
    "timestamp": "2025-11-10T05:30:00.000Z"
  }
}
```

**Example with curl:**
```bash
curl -X POST http://localhost:4000/api/admin/scheduler/finalize-old \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Testing Workflow

### Scenario 1: Test Complete Ongoing → Completed

1. **Create test sessions with `ongoing` status**
   ```sql
   -- Via your API or directly in database
   UPDATE attendance_sessions
   SET status = 'ongoing', started_at = NOW()
   WHERE id IN (1, 2, 3);
   ```

2. **Trigger manual completion**
   ```bash
   POST /api/admin/scheduler/complete-ongoing
   ```

3. **Verify sessions are now `completed`**
   ```sql
   SELECT id, status, started_at, ended_at
   FROM attendance_sessions
   WHERE id IN (1, 2, 3);
   ```

### Scenario 2: Test Completed → Finalized (3+ days)

1. **Create test sessions with old completion dates**
   ```sql
   -- Set some sessions as completed 4 days ago
   UPDATE attendance_sessions
   SET status = 'completed',
       ended_at = DATE_SUB(NOW(), INTERVAL 4 DAY)
   WHERE id IN (10, 11, 12);
   ```

2. **Trigger manual finalization**
   ```bash
   POST /api/admin/scheduler/finalize-old
   ```

3. **Verify sessions are now `finalized`**
   ```sql
   SELECT id, status, ended_at
   FROM attendance_sessions
   WHERE id IN (10, 11, 12);
   ```

---

## Session Status Flow

```
scheduled → ongoing → completed → finalized
                  ↓
              cancelled
```

### Status Meanings:
- **`scheduled`** - Session planned but not started
- **`ongoing`** - Currently active, students can mark attendance
- **`completed`** - Session ended, attendance locked (teachers can still edit for 3 days)
- **`finalized`** - Archived, fully locked (no edits allowed)
- **`cancelled`** - Session was cancelled

---

## Important Notes

1. **Authentication Required**: These endpoints are protected by `authMiddleware` and require admin access.

2. **Only affects eligible sessions**:
   - Complete endpoint: Only sessions with `status='ongoing'` AND `startedAt IS NOT NULL`
   - Finalize endpoint: Only sessions with `status='completed'` AND `endedAt <= 3 days ago`

3. **Safe to run multiple times**: Running the same endpoint multiple times won't cause issues - it only affects eligible sessions.

4. **Production Consideration**: Consider adding additional authorization checks or removing these endpoints in production if not needed.

---

## Monitoring

Check server logs to see scheduler activity:

```
[Session Scheduler] Starting: Complete ongoing sessions - 2025-11-10T05:30:00.000Z
[Session Scheduler] Completed 5 ongoing sessions
```

```
[Session Scheduler] Starting: Finalize old completed sessions - 2025-11-10T05:30:00.000Z
[Session Scheduler] Finalized 12 completed sessions (older than 3 days)
```

---

## Automated Schedule

When the server is running, these jobs run automatically:

- **23:59 daily** (Asia/Jakarta) - Complete ongoing sessions
- **00:15 daily** (Asia/Jakarta) - Finalize old completed sessions

No manual intervention needed in production!
