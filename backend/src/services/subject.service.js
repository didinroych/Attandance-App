import { prismaClient } from "../application/database.js";
import { ResponseError } from "../error/response-error.js";
import { createSubjectValidation, deleteSubjectValidation, getSubjectListValidation, updateSubjectValidation } from "../validations/subject.validation.js";
import { validate } from "../validations/validation.js";

/**
 * Get list of subjects with pagination and search
 * @param {Object} request - { page, limit, search, sortBy, sortOrder }
 * @returns {Promise<Object>}
 */
const getSubjectList = async(request) => {
    const validated = validate(getSubjectListValidation, request);

    const { page = 1, limit = 20, search, sortBy = 'name', sortOrder = 'asc' } = validated;
    const skip = (page - 1) * limit;

    // Build where clause for search
    const whereClause = {};
    if (search && search.trim().length > 0) {
        whereClause.OR = [{
                name: {
                    contains: search
                }
            },
            {
                code: {
                    contains: search
                }
            }
        ];
    }

    // Get total count
    const totalCount = await prismaClient.subject.count({
        where: whereClause
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Fetch subjects with schedule count
    const subjects = await prismaClient.subject.findMany({
        where: whereClause,
        include: {
            _count: {
                select: {
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
    const formattedSubjects = subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        createdAt: subject.createdAt,
        scheduleCount: subject._count.classSchedules
    }));

    return {
        subjects: formattedSubjects,
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
 * Get single subject by ID
 * @param {number} subjectId
 * @returns {Promise<Object>}
 */
const getSubjectById = async(subjectId) => {
    const subject = await prismaClient.subject.findUnique({
        where: { id: subjectId },
        include: {
            _count: {
                select: {
                    classSchedules: true
                }
            },
            classSchedules: {
                include: {
                    class: {
                        select: {
                            name: true,
                            gradeLevel: true
                        }
                    },
                    teacher: {
                        select: {
                            fullName: true
                        }
                    }
                },
                take: 10 // Limit to 10 most recent schedules
            }
        }
    });

    if (!subject) {
        throw new ResponseError(404, "Subject not found");
    }
    return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        description: subject.description,
        createdAt: subject.createdAt,
        scheduleCount: subject._count.classSchedules,
        schedules: subject.classSchedules.map(schedule => ({
            id: schedule.id,
            className: schedule.class.name,
            gradeLevel: schedule.class.gradeLevel,
            teacherName: schedule.teacher.fullName,
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime
        }))
    };
};

/**
 * Create new subject
 * @param {Object} request - { name, code?, description? }
 * @returns {Promise<Object>}
 */
const createSubject = async(request) => {
    const validated = validate(createSubjectValidation, request);

    // Check if subject name already exists
    const existingName = await prismaClient.subject.findFirst({
        where: {
            name: validated.name
        }
    });

    if (existingName) {
        throw new ResponseError(400, "Subject with this name already exists");
    }

    // Check if code is provided and if it already exists
    if (validated.code) {
        const existingCode = await prismaClient.subject.findFirst({
            where: {
                code: validated.code
            }
        });

        if (existingCode) {
            throw new ResponseError(400, "Subject with this code already exists");
        }
    }

    // Create subject
    const subject = await prismaClient.subject.create({
        data: {
            name: validated.name,
            code: validated.code || null,
            description: validated.description || null
        }
    });

    return {
        message: "Subject created successfully",
        subject: {
            id: subject.id,
            name: subject.name,
            code: subject.code,
            description: subject.description,
            createdAt: subject.createdAt
        }
    };
};

/**
 * Update subject
 * @param {Object} request - { subjectId, name?, code?, description? }
 * @returns {Promise<Object>}
 */
const updateSubject = async(request) => {
    const validated = validate(updateSubjectValidation, request);
    const { subjectId, ...updateData } = validated;

    // Check if subject exists
    const existingSubject = await prismaClient.subject.findUnique({
        where: { id: subjectId }
    });

    if (!existingSubject) {
        throw new ResponseError(404, "Subject not found");
    }

    // Check if new name already exists (excluding current subject)
    if (updateData.name) {
        const nameExists = await prismaClient.subject.findFirst({
            where: {
                name: updateData.name,
                NOT: { id: subjectId }
            }
        });

        if (nameExists) {
            throw new ResponseError(400, "Subject with this name already exists");
        }
    }

    // Check if new code already exists (excluding current subject)
    if (updateData.code) {
        const codeExists = await prismaClient.subject.findFirst({
            where: {
                code: updateData.code,
                NOT: { id: subjectId }
            }
        });

        if (codeExists) {
            throw new ResponseError(400, "Subject with this code already exists");
        }
    }

    // Prepare update data
    const dataToUpdate = {};
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.code !== undefined) dataToUpdate.code = updateData.code || null;
    if (updateData.description !== undefined) dataToUpdate.description = updateData.description || null;

    // Update subject
    const updatedSubject = await prismaClient.subject.update({
        where: { id: subjectId },
        data: dataToUpdate
    });

    return {
        message: "Subject updated successfully",
        subject: {
            id: updatedSubject.id,
            name: updatedSubject.name,
            code: updatedSubject.code,
            description: updatedSubject.description,
            createdAt: updatedSubject.createdAt
        }
    };
};

/**
 * Delete subject (hard delete)
 * @param {Object} request - { subjectId, force }
 * @returns {Promise<Object>}
 */
const deleteSubject = async(request) => {
    const validated = validate(deleteSubjectValidation, request);
    const { subjectId, force = false } = validated;

    // Check if subject exists
    const existingSubject = await prismaClient.subject.findUnique({
        where: { id: subjectId },
        include: {
            _count: {
                select: {
                    classSchedules: true
                }
            }
        }
    });

    if (!existingSubject) {
        throw new ResponseError(404, "Subject not found");
    }

    // Check if subject is being used in schedules
    if (existingSubject._count.classSchedules > 0 && !force) {
        throw new ResponseError(400,
            `Cannot delete subject. It is being used in ${existingSubject._count.classSchedules} class schedule(s). ` +
            `Use force=true query parameter to force delete.`
        );
    }

    // Delete subject (will cascade delete related schedules if force=true)
    await prismaClient.subject.delete({
        where: { id: subjectId }
    });

    return {
        message: force ?
            `Subject deleted successfully (${existingSubject._count.classSchedules} related schedules also deleted)` : "Subject deleted successfully",
        subjectId: existingSubject.id,
        subjectName: existingSubject.name,
        deletedSchedules: force ? existingSubject._count.classSchedules : 0
    };
};

export default {
    getSubjectList,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
};