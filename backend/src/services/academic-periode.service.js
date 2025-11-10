import { prismaClient } from "../application/database.js"
import { ResponseError } from "../error/response-error.js";
import { validate } from "../validations/validation.js";
import {
    getAcademicPeriodListValidation,
    createAcademicPeriodValidation,
    updateAcademicPeriodValidation,
    deleteAcademicPeriodValidation
} from "../validations/academic-periode.validation.js";

export const getAcademicPeriod = async() => {
    const academicPeriod = await prismaClient.academicPeriod.findMany({
        select: {
            id: true,
            name: true,
            isActive: true
        }
    })
    return academicPeriod
}

/**
 * Get list of academic periods with pagination and search
 * @param {Object} request - { page, limit, search, isActive, sortBy, sortOrder }
 * @returns {Promise<Object>}
 */
const getAcademicPeriodList = async(request) => {
    const validated = validate(getAcademicPeriodListValidation, request);

    const { page = 1, limit = 20, search, isActive, sortBy = 'startDate', sortOrder = 'desc' } = validated;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause = {};

    if (search && search.trim().length > 0) {
        whereClause.name = {
            contains: search
        };
    }

    if (isActive !== undefined) {
        whereClause.isActive = isActive;
    }

    // Get total count
    const totalCount = await prismaClient.academicPeriod.count({
        where: whereClause
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Fetch academic periods with counts
    const academicPeriods = await prismaClient.academicPeriod.findMany({
        where: whereClause,
        include: {
            _count: {
                select: {
                    classes: true,
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
    const formattedPeriods = academicPeriods.map(period => ({
        id: period.id,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        isActive: period.isActive,
        createdAt: period.createdAt,
        classCount: period._count.classes,
        scheduleCount: period._count.classSchedules
    }));

    return {
        academicPeriods: formattedPeriods,
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
 * Get single academic period by ID with details
 * @param {number} academicPeriodId
 * @returns {Promise<Object>}
 */
const getAcademicPeriodById = async(academicPeriodId) => {
    const academicPeriod = await prismaClient.academicPeriod.findUnique({
        where: { id: academicPeriodId },
        include: {
            _count: {
                select: {
                    classes: true,
                    classSchedules: true
                }
            },
            classes: {
                include: {
                    schoolLevel: {
                        select: {
                            name: true
                        }
                    }
                },
                take: 10,
                orderBy: {
                    name: 'asc'
                }
            }
        }
    });

    if (!academicPeriod) {
        throw new ResponseError(404, "Academic period not found");
    }

    return {
        id: academicPeriod.id,
        name: academicPeriod.name,
        startDate: academicPeriod.startDate,
        endDate: academicPeriod.endDate,
        isActive: academicPeriod.isActive,
        createdAt: academicPeriod.createdAt,
        classCount: academicPeriod._count.classes,
        scheduleCount: academicPeriod._count.classSchedules,
        classes: academicPeriod.classes.map(cls => ({
            id: cls.id,
            name: cls.name,
            gradeLevel: cls.gradeLevel,
            schoolLevel: cls.schoolLevel.name
        }))
    };
};

/**
 * Create new academic period
 * @param {Object} request - { name, startDate, endDate, isActive? }
 * @returns {Promise<Object>}
 */
const createAcademicPeriod = async(request) => {
    const validated = validate(createAcademicPeriodValidation, request);

    // Check if name already exists
    const existingName = await prismaClient.academicPeriod.findFirst({
        where: {
            name: validated.name
        }
    });

    if (existingName) {
        throw new ResponseError(400, "Academic period with this name already exists");
    }

    // Check for date overlap with existing periods
    const overlappingPeriod = await prismaClient.academicPeriod.findFirst({
        where: {
            OR: [{
                    AND: [
                        { startDate: { lte: validated.startDate } },
                        { endDate: { gte: validated.startDate } }
                    ]
                },
                {
                    AND: [
                        { startDate: { lte: validated.endDate } },
                        { endDate: { gte: validated.endDate } }
                    ]
                },
                {
                    AND: [
                        { startDate: { gte: validated.startDate } },
                        { endDate: { lte: validated.endDate } }
                    ]
                }
            ]
        }
    });

    if (overlappingPeriod) {
        throw new ResponseError(400,
            `Date range overlaps with existing period: "${overlappingPeriod.name}" ` +
            `(${overlappingPeriod.startDate.toISOString().split('T')[0]} to ${overlappingPeriod.endDate.toISOString().split('T')[0]})`
        );
    }

    // If setting this period as active, deactivate others first
    let academicPeriod;
    if (validated.isActive) {
        academicPeriod = await prismaClient.$transaction(async(tx) => {
            // Deactivate all other periods
            await tx.academicPeriod.updateMany({
                where: { isActive: true },
                data: { isActive: false }
            });

            // Create the new active period
            return await tx.academicPeriod.create({
                data: {
                    name: validated.name,
                    startDate: new Date(validated.startDate),
                    endDate: new Date(validated.endDate),
                    isActive: true
                }
            });
        });
    } else {
        // Create inactive period
        academicPeriod = await prismaClient.academicPeriod.create({
            data: {
                name: validated.name,
                startDate: new Date(validated.startDate),
                endDate: new Date(validated.endDate),
                isActive: false
            }
        });
    }

    return {
        message: "Academic period created successfully",
        academicPeriod: {
            id: academicPeriod.id,
            name: academicPeriod.name,
            startDate: academicPeriod.startDate,
            endDate: academicPeriod.endDate,
            isActive: academicPeriod.isActive,
            createdAt: academicPeriod.createdAt
        }
    };
};

/**
 * Update academic period
 * @param {Object} request - { academicPeriodId, name?, startDate?, endDate?, isActive? }
 * @returns {Promise<Object>}
 */
const updateAcademicPeriod = async(request) => {
    const validated = validate(updateAcademicPeriodValidation, request);
    const { academicPeriodId, ...updateData } = validated;

    // Check if academic period exists
    const existingPeriod = await prismaClient.academicPeriod.findUnique({
        where: { id: academicPeriodId }
    });

    if (!existingPeriod) {
        throw new ResponseError(404, "Academic period not found");
    }

    // Check if new name already exists (excluding current period)
    if (updateData.name) {
        const nameExists = await prismaClient.academicPeriod.findFirst({
            where: {
                name: updateData.name,
                NOT: { id: academicPeriodId }
            }
        });

        if (nameExists) {
            throw new ResponseError(400, "Academic period with this name already exists");
        }
    }

    // Prepare dates for overlap check
    const startDate = updateData.startDate ? new Date(updateData.startDate) : existingPeriod.startDate;
    const endDate = updateData.endDate ? new Date(updateData.endDate) : existingPeriod.endDate;

    // Check for date overlap if dates are being updated
    if (updateData.startDate || updateData.endDate) {
        const overlappingPeriod = await prismaClient.academicPeriod.findFirst({
            where: {
                NOT: { id: academicPeriodId },
                OR: [{
                        AND: [
                            { startDate: { lte: startDate } },
                            { endDate: { gte: startDate } }
                        ]
                    },
                    {
                        AND: [
                            { startDate: { lte: endDate } },
                            { endDate: { gte: endDate } }
                        ]
                    },
                    {
                        AND: [
                            { startDate: { gte: startDate } },
                            { endDate: { lte: endDate } }
                        ]
                    }
                ]
            }
        });

        if (overlappingPeriod) {
            throw new ResponseError(400,
                `Date range overlaps with existing period: "${overlappingPeriod.name}"`
            );
        }
    }

    // Prepare update data
    const dataToUpdate = {};
    if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
    if (updateData.startDate !== undefined) dataToUpdate.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined) dataToUpdate.endDate = new Date(updateData.endDate);

    // Handle isActive update
    let updatedPeriod;
    if (updateData.isActive !== undefined) {
        if (updateData.isActive) {
            // Setting this period as active - deactivate others first
            updatedPeriod = await prismaClient.$transaction(async(tx) => {
                // Deactivate all other periods
                await tx.academicPeriod.updateMany({
                    where: {
                        isActive: true,
                        NOT: { id: academicPeriodId }
                    },
                    data: { isActive: false }
                });

                // Update this period
                return await tx.academicPeriod.update({
                    where: { id: academicPeriodId },
                    data: {
                        ...dataToUpdate,
                        isActive: true
                    }
                });
            });
        } else {
            // Setting as inactive
            dataToUpdate.isActive = false;
            updatedPeriod = await prismaClient.academicPeriod.update({
                where: { id: academicPeriodId },
                data: dataToUpdate
            });
        }
    } else {
        // No isActive change
        updatedPeriod = await prismaClient.academicPeriod.update({
            where: { id: academicPeriodId },
            data: dataToUpdate
        });
    }

    return {
        message: "Academic period updated successfully",
        academicPeriod: {
            id: updatedPeriod.id,
            name: updatedPeriod.name,
            startDate: updatedPeriod.startDate,
            endDate: updatedPeriod.endDate,
            isActive: updatedPeriod.isActive,
            createdAt: updatedPeriod.createdAt
        }
    };
};

/**
 * Delete academic period
 * @param {Object} request - { academicPeriodId, force }
 * @returns {Promise<Object>}
 */
const deleteAcademicPeriod = async(request) => {
    const validated = validate(deleteAcademicPeriodValidation, request);
    const { academicPeriodId, force = false } = validated;

    // Check if academic period exists
    const existingPeriod = await prismaClient.academicPeriod.findUnique({
        where: { id: academicPeriodId },
        include: {
            _count: {
                select: {
                    classes: true,
                    classSchedules: true
                }
            }
        }
    });

    if (!existingPeriod) {
        throw new ResponseError(404, "Academic period not found");
    }

    // Check if period is being used
    const totalUsage = existingPeriod._count.classes + existingPeriod._count.classSchedules;

    if (totalUsage > 0 && !force) {
        throw new ResponseError(400,
            `Cannot delete academic period. It is being used by ${existingPeriod._count.classes} class(es) ` +
            `and ${existingPeriod._count.classSchedules} schedule(s). ` +
            `Use force=true query parameter to force delete.`
        );
    }

    // Delete academic period (will cascade delete related records)
    await prismaClient.academicPeriod.delete({
        where: { id: academicPeriodId }
    });

    return {
        message: force ?
            `Academic period deleted successfully (${existingPeriod._count.classes} classes and ${existingPeriod._count.classSchedules} schedules also deleted)` : "Academic period deleted successfully",
        academicPeriodId: existingPeriod.id,
        academicPeriodName: existingPeriod.name,
        deletedClasses: force ? existingPeriod._count.classes : 0,
        deletedSchedules: force ? existingPeriod._count.classSchedules : 0
    };
};

export default {
    getAcademicPeriod,
    getAcademicPeriodList,
    getAcademicPeriodById,
    createAcademicPeriod,
    updateAcademicPeriod,
    deleteAcademicPeriod
}