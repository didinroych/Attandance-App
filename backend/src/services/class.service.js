import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { createClassValidation, deleteClassValidation, getClassListValidation, updateClassValidation } from "../validations/class.validation.js";
import { validate } from "../validations/validation.js";

/**
 * Get list of classes with pagination and search
 * @param {Object} request - { page, limit, search, sortBy, sortOrder }
 * @returns {Promise<Object>}
 */
const getClassList = async (request) => {
    const validated = validate(getClassListValidation, request);

    const { page = 1, limit = 20, search, sortBy = 'name', sortOrder = 'asc' } = validated;
    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = {};
    if (search && search.trim().length > 0) {
        whereClause.name = {
            contains: search
        };
    }

    // Get total count
    const totalCount = await prismaClient.class.count({
        where: whereClause
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Fetch classes with counts and related data
    const classes = await prismaClient.class.findMany({
        where: whereClause,
        include: {
            schoolLevel: {
                select: {
                    name: true
                }
            },
            academicPeriod: {
                select: {
                    name: true,
                    startDate: true,
                    endDate: true
                }
            },
            homeroomTeacher: {
                select: {
                    email: true,
                    teacher: {
                        select: {
                            fullName: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    students: true,
                    classSchedules: true
                }
            }
        },
        orderBy: {
            [sortBy]: sortOrder
        },
        skip: skip,
        take: limit
    });

    // Format response
    const formattedClasses = classes.map(cls => ({
        id: cls.id,
        name: cls.name,
        gradeLevel: cls.gradeLevel,
        schoolLevel: cls.schoolLevel.name,
        academicPeriod: cls.academicPeriod.name,
        homeroomTeacher: cls.homeroomTeacher?.teacher?.fullName || null,
        studentCount: cls._count.students,
        scheduleCount: cls._count.classSchedules,
        createdAt: cls.createdAt
    }));

    return {
        classes: formattedClasses,
        pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalCount: totalCount,
            limit: limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    };
};

/**
 * Get single class by ID
 * @param {number} classId
 * @returns {Promise<Object>}
 */
const getClassById = async (classId) => {
    const cls = await prismaClient.class.findUnique({
        where: { id: classId },
        include: {
            schoolLevel: {
                select: {
                    name: true
                }
            },
            academicPeriod: {
                select: {
                    name: true,
                    startDate: true,
                    endDate: true
                }
            },
            homeroomTeacher: {
                select: {
                    email: true,
                    teacher: {
                        select: {
                            fullName: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    students: true,
                    classSchedules: true
                }
            },
            students: {
                select: {
                    id: true,
                    fullName: true,
                    studentId: true
                },
                take: 10
            },
            classSchedules: {
                include: {
                    subject: {
                        select: {
                            name: true
                        }
                    },
                    teacher: {
                        select: {
                            fullName: true
                        }
                    }
                },
                take: 10
            }
        }
    });

    if (!cls) {
        throw new ResponseError(404, "Class not found");
    }

    return {
        id: cls.id,
        name: cls.name,
        gradeLevel: cls.gradeLevel,
        schoolLevel: cls.schoolLevel.name,
        academicPeriod: {
            name: cls.academicPeriod.name,
            startDate: cls.academicPeriod.startDate,
            endDate: cls.academicPeriod.endDate
        },
        homeroomTeacher: cls.homeroomTeacher ? {
            fullName: cls.homeroomTeacher.teacher?.fullName,
            email: cls.homeroomTeacher.email
        } : null,
        studentCount: cls._count.students,
        scheduleCount: cls._count.classSchedules,
        students: cls.students,
        schedules: cls.classSchedules.map(schedule => ({
            id: schedule.id,
            subject: schedule.subject.name,
            teacher: schedule.teacher?.fullName,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime
        })),
        createdAt: cls.createdAt
    };
};

/**
 * Create new class
 * @param {Object} request - { name, schoolLevelId, gradeLevel, academicPeriodId, homeroomTeacherId? }
 * @returns {Promise<Object>}
 */
const createClass = async (request) => {
    const validated = validate(createClassValidation, request);

    // Check if class name already exists in the same academic period
    const existingClass = await prismaClient.class.findFirst({
        where: {
            name: validated.name,
            academicPeriodId: validated.academicPeriodId
        }
    });

    if (existingClass) {
        throw new ResponseError(400, "Class with this name already exists in this academic period");
    }

    // Verify school level exists
    const schoolLevel = await prismaClient.schoolLevel.findUnique({
        where: { id: validated.schoolLevelId }
    });

    if (!schoolLevel) {
        throw new ResponseError(404, "School level not found");
    }

    // Verify academic period exists
    const academicPeriod = await prismaClient.academicPeriod.findUnique({
        where: { id: validated.academicPeriodId }
    });

    if (!academicPeriod) {
        throw new ResponseError(404, "Academic period not found");
    }

    // Verify homeroom teacher exists if provided
    if (validated.homeroomTeacherId) {
        const teacher = await prismaClient.user.findFirst({
            where: {
                id: validated.homeroomTeacherId,
                role: "teacher"
            }
        });

        if (!teacher) {
            throw new ResponseError(404, "Teacher not found");
        }
    }

    // Create class
    const cls = await prismaClient.class.create({
        data: {
            name: validated.name,
            schoolLevelId: validated.schoolLevelId,
            gradeLevel: validated.gradeLevel,
            academicPeriodId: validated.academicPeriodId,
            homeroomTeacherId: validated.homeroomTeacherId || null
        },
        include: {
            schoolLevel: {
                select: {
                    name: true
                }
            },
            academicPeriod: {
                select: {
                    name: true
                }
            },
            homeroomTeacher: {
                select: {
                    email: true,
                    teacher: {
                        select: {
                            fullName: true
                        }
                    }
                }
            }
        }
    });

    return {
        message: "Class created successfully",
        class: {
            id: cls.id,
            name: cls.name,
            gradeLevel: cls.gradeLevel,
            schoolLevel: cls.schoolLevel.name,
            academicPeriod: cls.academicPeriod.name,
            homeroomTeacher: cls.homeroomTeacher?.teacher?.fullName || null,
            createdAt: cls.createdAt
        }
    };
};

/**
 * Update class
 * @param {Object} request - { classId, name?, schoolLevelId?, gradeLevel?, academicPeriodId?, homeroomTeacherId? }
 * @returns {Promise<Object>}
 */
const updateClass = async (request) => {
    const validated = validate(updateClassValidation, request);
    const { classId, ...updateData } = validated;

    // Check if class exists
    const existingClass = await prismaClient.class.findUnique({
        where: { id: classId }
    });

    if (!existingClass) {
        throw new ResponseError(404, "Class not found");
    }

    // Check if new name already exists in the academic period (excluding current class)
    if (updateData.name || updateData.academicPeriodId) {
        const nameToCheck = updateData.name || existingClass.name;
        const periodToCheck = updateData.academicPeriodId || existingClass.academicPeriodId;

        const nameExists = await prismaClient.class.findFirst({
            where: {
                name: nameToCheck,
                academicPeriodId: periodToCheck,
                NOT: { id: classId }
            }
        });

        if (nameExists) {
            throw new ResponseError(400, "Class with this name already exists in this academic period");
        }
    }

    // Verify school level if provided
    if (updateData.schoolLevelId) {
        const schoolLevel = await prismaClient.schoolLevel.findUnique({
            where: { id: updateData.schoolLevelId }
        });

        if (!schoolLevel) {
            throw new ResponseError(404, "School level not found");
        }
    }

    // Verify academic period if provided
    if (updateData.academicPeriodId) {
        const academicPeriod = await prismaClient.academicPeriod.findUnique({
            where: { id: updateData.academicPeriodId }
        });

        if (!academicPeriod) {
            throw new ResponseError(404, "Academic period not found");
        }
    }

    // Verify homeroom teacher if provided
    if (updateData.homeroomTeacherId) {
        const teacher = await prismaClient.user.findFirst({
            where: {
                id: updateData.homeroomTeacherId,
                role: "teacher"
            }
        });

        if (!teacher) {
            throw new ResponseError(404, "Teacher not found");
        }
    }

    // Prepare update data
    const dataToUpdate = {};
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.schoolLevelId !== undefined) dataToUpdate.schoolLevelId = updateData.schoolLevelId;
    if (updateData.gradeLevel !== undefined) dataToUpdate.gradeLevel = updateData.gradeLevel;
    if (updateData.academicPeriodId !== undefined) dataToUpdate.academicPeriodId = updateData.academicPeriodId;
    if (updateData.homeroomTeacherId !== undefined) dataToUpdate.homeroomTeacherId = updateData.homeroomTeacherId || null;

    // Update class
    const updatedClass = await prismaClient.class.update({
        where: { id: classId },
        data: dataToUpdate,
        include: {
            schoolLevel: {
                select: {
                    name: true
                }
            },
            academicPeriod: {
                select: {
                    name: true
                }
            },
            homeroomTeacher: {
                select: {
                    email: true,
                    teacher: {
                        select: {
                            fullName: true
                        }
                    }
                }
            }
        }
    });

    return {
        message: "Class updated successfully",
        class: {
            id: updatedClass.id,
            name: updatedClass.name,
            gradeLevel: updatedClass.gradeLevel,
            schoolLevel: updatedClass.schoolLevel.name,
            academicPeriod: updatedClass.academicPeriod.name,
            homeroomTeacher: updatedClass.homeroomTeacher?.teacher?.fullName || null,
            createdAt: updatedClass.createdAt
        }
    };
};

/**
 * Delete class (hard delete)
 * @param {Object} request - { classId, force }
 * @returns {Promise<Object>}
 */
const deleteClass = async (request) => {
    const validated = validate(deleteClassValidation, request);
    const { classId, force = false } = validated;

    // Check if class exists
    const existingClass = await prismaClient.class.findUnique({
        where: { id: classId },
        include: {
            _count: {
                select: {
                    students: true,
                    classSchedules: true
                }
            }
        }
    });

    if (!existingClass) {
        throw new ResponseError(404, "Class not found");
    }

    // Check if class has dependencies
    const totalDependencies = existingClass._count.students + existingClass._count.classSchedules;

    if (totalDependencies > 0 && !force) {
        throw new ResponseError(400,
            `Cannot delete class. It has ${existingClass._count.students} student(s) and ${existingClass._count.classSchedules} schedule(s). ` +
            `Use force=true query parameter to force delete.`
        );
    }

    // Delete class (will cascade delete related records if force=true)
    await prismaClient.class.delete({
        where: { id: classId }
    });

    return {
        message: force ?
            `Class deleted successfully (${existingClass._count.students} student(s) and ${existingClass._count.classSchedules} schedule(s) also deleted)` :
            "Class deleted successfully",
        classId: existingClass.id,
        className: existingClass.name,
        deletedStudents: force ? existingClass._count.students : 0,
        deletedSchedules: force ? existingClass._count.classSchedules : 0
    };
};

export default {
    getClassList,
    getClassById,
    createClass,
    updateClass,
    deleteClass
};
