import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { validate } from "../validations/validation.js";
import {
    markAttendanceSchema,
    studentCheckInSchema,
    exportAttendanceReportSchema,
    getAttendanceSummarySchema
} from "../validations/attendance.validation.js";
import {
    calculateAttendancePercentage,
    determineAttendanceStatus,
    validateSessionActive
} from "../helpers/attendance.helper.js";
import { getUserClassSessions } from "../validation/class-session-validation.js";

const markAttendance = async(request) => {
    const validated = validate(markAttendanceSchema, request);
    const { sessionId, attendances, profileId } = validated;

    // Validate session and ownership
    const session = await prismaClient.attendanceSession.findUnique({
        where: { id: sessionId },
        include: {
            classSchedule: {
                select: {
                    class: { select: { name: true } },
                    subject: { select: { name: true } }
                }
            }
        }
    });


    if (!session) {
        throw new ResponseError(404, "Session not found");
    }

    if (session.status === 'finalized') {
        throw new ResponseError(403, "This session already finalized, can't be edit!! Please contact admin");
    }

    if (session.createdBy !== profileId) {
        throw new ResponseError(403, "Unauthorized to mark attendance for this session");
    }

    // Validate session is modifiable
    validateSessionActive(session);

    // Update attendances in transaction
    const result = await prismaClient.$transaction(
        attendances.map(att =>
            prismaClient.attendance.update({
                where: {
                    id: att.attendanceId,
                    attendanceSessionId: sessionId
                },
                data: {
                    status: att.status,
                    checkInTime: att.status !== 'absent' ? new Date() : null,
                    attendanceMethod: 'manual',
                    markedBy: profileId,
                    notes: att.notes || null,
                    updatedAt: new Date()
                }
            })
        )
    );

    return {
        message: "Attendance marked successfully",
        sessionId: sessionId,
        updated: result.length,
        className: session.classSchedule.class.name,
        subject: session.classSchedule.subject.name
    };
};
//Ini Belum bener, nanti ubah ke facedetection+geo map
const studentCheckIn = async(request) => {
    /**
     * Student self check-in
     * Student marks their own attendance (via face recognition or manual)
     */
    const validated = validate(studentCheckInSchema, request);
    const { sessionId, studentId, method, faceConfidence } = validated;

    // Get session and check if ongoing
    const session = await prismaClient.attendanceSession.findUnique({
        where: { id: sessionId },
        include: {
            classSchedule: {
                select: {
                    startTime: true,
                    endTime: true,
                    class: { select: { name: true } },
                    subject: { select: { name: true } }
                }
            }
        }
    });

    if (!session) {
        throw new ResponseError(404, "Session not found");
    }

    if (session.status !== 'ongoing') {
        throw new ResponseError(400, "Session is not active for check-in");
    }

    // Get student's attendance record
    const attendance = await prismaClient.attendance.findFirst({
        where: {
            attendanceSessionId: sessionId,
            studentId: studentId
        },
        include: {
            student: {
                select: { fullName: true, studentId: true }
            }
        }
    });

    if (!attendance) {
        throw new ResponseError(404, "Attendance record not found for this session");
    }

    // Check if already checked in
    if (attendance.status !== 'absent') {
        throw new ResponseError(400, "Already checked in for this session");
    }

    // Determine status based on check-in time
    const now = new Date();
    const scheduleStartTime = session.classSchedule.startTime;
    const status = determineAttendanceStatus(now, session.date, scheduleStartTime);

    // Update attendance
    const updated = await prismaClient.attendance.update({
        where: { id: attendance.id },
        data: {
            status: status,
            checkInTime: now,
            attendanceMethod: method || 'face_recognition',
            faceConfidence: faceConfidence || null,
            updatedAt: now
        }
    });

    return {
        message: status === 'late' ?
            "Checked in successfully (marked as late)" : "Checked in successfully",
        attendance: {
            id: updated.id,
            studentName: attendance.student.fullName,
            studentNumber: attendance.student.studentId,
            status: updated.status,
            checkInTime: updated.checkInTime,
            method: updated.attendanceMethod,
            className: session.classSchedule.class.name,
            subject: session.classSchedule.subject.name
        }
    };
};



const getAttendanceSummary = async(request) => {
    const validated = validate(getAttendanceSummarySchema, request);
    const { profileId, role } = validated;

    if (role === 'student') {
        return await getStudentSummary(profileId);
    } else if (role === 'teacher') {
        return await getTeacherSummary(profileId);
    } else {
        throw new ResponseError(403, "Role not supported");
    }
};

// ✅ Student: group by classSchedule
const getStudentSummary = async(userId) => {
    const student = await prismaClient.student.findUnique({
        where: { id: userId },
        select: {
            id: true,
            fullName: true,
            studentId: true,
            class: {
                select: {
                    id: true,
                    name: true,
                    gradeLevel: true,
                    academicPeriod: {
                        select: {
                            name: true,
                            startDate: true,
                            endDate: true
                        }
                    }
                }
            }
        }
    });

    if (!student) {
        throw new ResponseError(404, "Student not found");
    }

    // Ambil semua attendance dengan detail classSchedule
    const attendances = await prismaClient.attendance.findMany({
        where: {
            studentId: student.id
        },
        include: {
            attendanceSession: {
                select: {
                    id: true,
                    date: true,
                    classSchedule: {
                        select: {
                            id: true,
                            subject: {
                                select: {
                                    id: true,
                                    name: true,
                                    code: true
                                }
                            },
                            teacher: {
                                select: {
                                    fullName: true
                                }
                            },
                            dayOfWeek: true,
                            startTime: true,
                            endTime: true,
                            room: true
                        }
                    }
                }
            }
        },
        orderBy: {
            attendanceSession: {
                date: 'desc'
            }
        }
    });

    // Summary keseluruhan
    const summary = {
        total: attendances.length,
        present: attendances.filter(a => a.status === 'present').length,
        absent: attendances.filter(a => a.status === 'absent').length,
        late: attendances.filter(a => a.status === 'late').length,
        excused: attendances.filter(a => a.status === 'excused').length,
        attendanceRate: calculateAttendancePercentage(attendances)
    };

    // ✅ Group by classSchedule
    const bySchedule = {};
    attendances.forEach(att => {
        const schedule = att.attendanceSession.classSchedule;
        const scheduleKey = `schedule_${schedule.id}`;

        if (!bySchedule[scheduleKey]) {
            bySchedule[scheduleKey] = {
                scheduleId: schedule.id,
                subject: {
                    id: schedule.subject.id,
                    name: schedule.subject.name,
                    code: schedule.subject.code
                },
                teacher: schedule.teacher.fullName,
                dayOfWeek: schedule.dayOfWeek,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                room: schedule.room,
                attendance: {
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    total: 0
                },
                sessions: []
            };
        }

        bySchedule[scheduleKey].attendance[att.status]++;
        bySchedule[scheduleKey].attendance.total++;

        // Add session detail
        bySchedule[scheduleKey].sessions.push({
            date: att.attendanceSession.date,
            status: att.status,
            checkInTime: att.checkInTime
        });
    });

    // Convert to array dan calculate attendance rate per schedule
    const scheduleArray = Object.values(bySchedule).map(schedule => ({
        ...schedule,
        attendance: {
            ...schedule.attendance,
            attendanceRate: calculateAttendancePercentage(
                schedule.sessions.map(s => ({ status: s.status }))
            )
        },
        sessions: schedule.sessions.sort((a, b) => b.date - a.date) // newest first
    }));

    return {
        student: {
            name: student.fullName,
            studentNumber: student.studentId,
            class: student.class.name,
            gradeLevel: student.class.gradeLevel
        },
        academicPeriod: student.class.academicPeriod,
        summary,
        bySchedule: scheduleArray
    };
};

// ✅ Teacher: group by classSchedule
const getTeacherSummary = async(userId) => {
    const teacher = await prismaClient.teacher.findUnique({
        where: { id: userId },
        select: {
            id: true,
            fullName: true,
            teacherId: true
        }
    });

    if (!teacher) {
        throw new ResponseError(404, "Teacher not found");
    }

    // Ambil semua sessions dengan detail classSchedule
    const sessions = await prismaClient.attendanceSession.findMany({
        where: {
            createdBy: teacher.id
        },
        include: {
            classSchedule: {
                select: {
                    id: true,
                    class: {
                        select: {
                            id: true,
                            name: true,
                            gradeLevel: true
                        }
                    },
                    subject: {
                        select: {
                            id: true,
                            name: true,
                            code: true
                        }
                    },
                    dayOfWeek: true,
                    startTime: true,
                    endTime: true,
                    room: true
                }
            },
            attendances: {
                select: {
                    status: true,
                    studentId: true
                }
            }
        },
        orderBy: {
            date: 'desc'
        }
    });

    // Summary keseluruhan
    const allAttendances = sessions.flatMap(s => s.attendances);
    const summary = {
        totalSessions: sessions.length,
        totalAttendances: allAttendances.length,
        present: allAttendances.filter(a => a.status === 'present').length,
        absent: allAttendances.filter(a => a.status === 'absent').length,
        late: allAttendances.filter(a => a.status === 'late').length,
        excused: allAttendances.filter(a => a.status === 'excused').length,
        attendanceRate: calculateAttendancePercentage(allAttendances)
    };

    // ✅ Group by classSchedule
    const bySchedule = {};
    sessions.forEach(session => {
        const schedule = session.classSchedule;
        const scheduleKey = `schedule_${schedule.id}`;

        if (!bySchedule[scheduleKey]) {
            bySchedule[scheduleKey] = {
                scheduleId: schedule.id,
                class: {
                    id: schedule.class.id,
                        name: schedule.class.name,
                        gradeLevel: schedule.class.gradeLevel
                },
                subject: {
                    id: schedule.subject.id,
                    name: schedule.subject.name,
                    code: schedule.subject.code
                },
                dayOfWeek: schedule.dayOfWeek,
                startTime: schedule.startTime,
                endTime: schedule.endTime,
                room: schedule.room,
                attendance: {
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    total: 0
                },
                totalSessions: 0,
                sessionDates: []
            };
        }

        bySchedule[scheduleKey].totalSessions++;
        bySchedule[scheduleKey].sessionDates.push(session.date);

        session.attendances.forEach(att => {
            bySchedule[scheduleKey].attendance[att.status]++;
            bySchedule[scheduleKey].attendance.total++;
        });
    });

    // Convert to array dan calculate attendance rate per schedule
    const scheduleArray = Object.values(bySchedule).map(schedule => ({
        ...schedule,
        attendance: {
            ...schedule.attendance,
            attendanceRate: calculateAttendancePercentage(
                Array(schedule.attendance.total).fill(null).map((_, i) => {
                    if (i < schedule.attendance.present) return { status: 'present' };
                    if (i < schedule.attendance.present + schedule.attendance.late) return { status: 'late' };
                    if (i < schedule.attendance.present + schedule.attendance.late + schedule.attendance.excused) return { status: 'excused' };
                    return { status: 'absent' };
                })
            )
        },
        sessionDates: schedule.sessionDates.sort((a, b) => b - a) // newest first
    }));

    // Get date range
    const allDates = sessions.map(s => s.date).filter(d => d);
    const dateRange = allDates.length > 0 ? {
        earliest: new Date(Math.min(...allDates.map(d => d.getTime()))),
        latest: new Date(Math.max(...allDates.map(d => d.getTime())))
    } : null;

    return {
        teacher: {
            name: teacher.fullName,
            teacherId: teacher.teacherId
        },
        period: dateRange,
        summary,
        bySchedule: scheduleArray
    };
};

const exportAttendanceReport = async(request) => {
    /**
     * Export attendance report
     * Generate detailed attendance report for export
     */
    const validated = validate(exportAttendanceReportSchema, request);
    const { classId, startDate, endDate, format } = validated;

    // Get class info
    const classData = await prismaClient.class.findUnique({
        where: { id: classId },
        include: {
            schoolLevel: { select: { name: true } },
            students: {
                select: {
                    id: true,
                    fullName: true,
                    studentId: true
                },
                orderBy: {
                    fullName: 'asc'
                }
            }
        }
    });

    if (!classData) {
        throw new ResponseError(404, "Class not found");
    }

    // Get all sessions in date range
    const sessions = await prismaClient.attendanceSession.findMany({
        where: {
            classSchedule: {
                classId: classId
            },
            date: {
                gte: new Date(startDate),
                lte: new Date(endDate)
            }
        },
        include: {
            classSchedule: {
                select: {
                    subject: { select: { name: true, code: true } }
                }
            },
            attendances: {
                select: {
                    studentId: true,
                    status: true,
                    checkInTime: true
                }
            }
        },
        orderBy: {
            date: 'asc'
        }
    });

    // Build report data
    const reportData = {
        class: {
            name: classData.name,
                gradeLevel: classData.gradeLevel,
                schoolLevel: classData.schoolLevel.name
        },
        period: {
            startDate: startDate,
            endDate: endDate
        },
        students: classData.students.map(student => {
            // Get student's attendances
            const studentAttendances = sessions.map(session => {
                const att = session.attendances.find(a => a.studentId === student.id);
                return {
                    date: session.date,
                    subject: session.classSchedule.subject.name,
                    status: att ? att.status : 'absent',
                    checkInTime: att ? att.checkInTime : null
                };
            });

            // Calculate summary
            const summary = {
                total: studentAttendances.length,
                present: studentAttendances.filter(a => a.status === 'present').length,
                absent: studentAttendances.filter(a => a.status === 'absent').length,
                late: studentAttendances.filter(a => a.status === 'late').length,
                excused: studentAttendances.filter(a => a.status === 'excused').length
            };
            summary.attendanceRate = calculateAttendancePercentage(
                studentAttendances.map(a => ({ status: a.status }))
            );

            return {
                id: student.id,
                name: student.fullName,
                studentNumber: student.studentId,
                attendances: studentAttendances,
                summary: summary
            };
        }),
        totalSessions: sessions.length,
        format: format || 'json'
    };

    return reportData;
};

const getAttendanceAnalytics = async(filters) => {
    /**
     * Get attendance analytics
     * Detailed analytics and trends
     */
    const { classId, startDate, endDate, groupBy } = filters;

    const dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
    };

    const attendances = await prismaClient.attendance.findMany({
        where: {
            attendanceSession: {
                classSchedule: {
                    classId: classId
                },
                date: dateFilter
            }
        },
        include: {
            attendanceSession: {
                select: {
                    date: true,
                    classSchedule: {
                        select: {
                            subject: { select: { name: true } },
                            dayOfWeek: true
                        }
                    }
                }
            }
        }
    });

    // Overall statistics
    const overall = {
        total: attendances.length,
        present: attendances.filter(a => a.status === 'present').length,
        absent: attendances.filter(a => a.status === 'absent').length,
        late: attendances.filter(a => a.status === 'late').length,
        excused: attendances.filter(a => a.status === 'excused').length,
        attendanceRate: calculateAttendancePercentage(attendances)
    };

    // Trends over time
    const trends = {};
    if (groupBy === 'day' || groupBy === 'week') {
        attendances.forEach(att => {
            const dateKey = att.attendanceSession.date.toISOString().split('T')[0];
            if (!trends[dateKey]) {
                trends[dateKey] = { present: 0, absent: 0, late: 0, excused: 0 };
            }
            trends[dateKey][att.status]++;
        });
    }

    // By subject
    const bySubject = attendances.reduce((acc, att) => {
        const subject = att.attendanceSession.classSchedule.subject.name;
        if (!acc[subject]) {
            acc[subject] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }
        acc[subject][att.status]++;
        acc[subject].total++;
        return acc;
    }, {});

    // By day of week
    const byDayOfWeek = attendances.reduce((acc, att) => {
        const day = att.attendanceSession.classSchedule.dayOfWeek;
        if (!acc[day]) {
            acc[day] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }
        acc[day][att.status]++;
        acc[day].total++;
        return acc;
    }, {});

    return {
        overall,
        trends,
        bySubject,
        byDayOfWeek,
        period: { startDate, endDate }
    };
};

export default {
    markAttendance,
    studentCheckIn,
    getAttendanceSummary,
    exportAttendanceReport,
    getAttendanceAnalytics
};