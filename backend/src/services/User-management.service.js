import { ResponseError } from "../error/response-error.js";
import { validate } from "../validations/validation.js";
import bcrypt from "bcrypt";
import { prismaClient } from "../application/database.js";
import {
    bulkCreateUsersValidation,
    deleteUserValidation,
    getUserListValidation,
    searchUsersValidation,
    updateUserValidation
} from "../validations/User-management validation.js";

/**
 * Get list of users (teachers or students) with pagination
 * @param {Object} request - { role, page, limit, sortBy, sortOrder }
 * @returns {Promise<Object>}
 */
const getUserList = async(request) => {
    const validated = validate(getUserListValidation, request);

    const { role, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = validated;

    // Validate role
    if (!['student', 'teacher'].includes(role)) {
        throw new ResponseError(400, "Role must be either 'student' or 'teacher'");
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause = {
        role: role,
        isActive: true
    };

    // Get total count for pagination
    const totalCount = await prismaClient.user.count({
        where: whereClause
    });

    const totalPages = Math.ceil(totalCount / limit);

    // Determine which related table to include
    const include = role === 'student' ? {
        student: {
            select: {
                id: true,
                studentId: true,
                fullName: true,
                classId: true,
                phone: true,
                address: true,
                dateOfBirth: true,
                parentPhone: true,
                enrollmentDate: true,
                class: {
                    select: {
                        id: true,
                        name: true,
                        gradeLevel: true
                    }
                }
            }
        }
    } : {
        teacher: {
            select: {
                id: true,
                teacherId: true,
                fullName: true,
                phone: true,
                address: true,
                hireDate: true
            }
        }
    };

    // Build orderBy clause
    const orderBy = {};
    if (sortBy === 'name') {
        // Sort by name in related table
        orderBy[role] = {
            fullName: sortOrder
        };
    } else {
        orderBy[sortBy] = sortOrder;
    }

    // Fetch users with pagination
    const users = await prismaClient.user.findMany({
        where: whereClause,
        include: include,
        orderBy: orderBy,
        skip: skip,
        take: limit
    });

    // Format response
    const formattedUsers = users.map(user => {
        const profileData = role === 'student' ? user.student : user.teacher;

        return {
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            profile: profileData || null
        };
    });

    return {
        users: formattedUsers,
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
 * Bulk create users (students or teachers) from JSON array
 * @param {Object} request - { users: Array }
 * @returns {Promise<Object>}
 */
const bulkCreateUsers = async(request) => {
    const validated = validate(bulkCreateUsersValidation, request);
    const { users } = validated;

    if (!Array.isArray(users) || users.length === 0) {
        throw new ResponseError(400, "Users array is required and must not be empty");
    }

    if (users.length > 100) {
        throw new ResponseError(400, "Cannot create more than 100 users at once");
    }

    const results = {
        success: [],
        failed: []
    };

    // Process each user
    for (let i = 0; i < users.length; i++) {
        const userData = users[i];

        try {
            // Validate required fields
            if (!userData.username || !userData.email || !userData.password || !userData.role) {
                throw new Error("Missing required fields: username, email, password, role");
            }

            if (!['student', 'teacher'].includes(userData.role)) {
                throw new Error("Role must be either 'student' or 'teacher'");
            }

            // Check if username or email already exists
            const existingUser = await prismaClient.user.findFirst({
                where: {
                    OR: [
                        { username: userData.username },
                        { email: userData.email }
                    ]
                }
            });

            if (existingUser) {
                throw new Error("Username or email already exists");
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            // Create user in transaction with profile data
            const createdUser = await prismaClient.$transaction(async(tx) => {
                // Create user
                const newUser = await tx.user.create({
                    data: {
                        username: userData.username,
                        email: userData.email,
                        password: hashedPassword,
                        role: userData.role,
                        isActive: true
                    },
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true
                    }
                });

                let profileData = null;

                // Create profile based on role
                if (userData.role === 'student') {
                    // Validate student-specific fields
                    if (!userData.studentId || !userData.fullName || !userData.classId) {
                        throw new Error("Missing required student fields: studentId, fullName, classId");
                    }

                    // Check if studentId already exists
                    const existingStudentId = await tx.student.findFirst({
                        where: { studentId: userData.studentId }
                    });

                    if (existingStudentId) {
                        throw new Error(`Student ID ${userData.studentId} already exists`);
                    }

                    // Verify class exists
                    const classExists = await tx.class.findUnique({
                        where: { id: userData.classId }
                    });

                    if (!classExists) {
                        throw new Error(`Class with ID ${userData.classId} does not exist`);
                    }

                    profileData = await tx.student.create({
                        data: {
                            userId: newUser.id,
                            studentId: userData.studentId,
                            fullName: userData.fullName,
                            classId: userData.classId,
                            phone: userData.phone || null,
                            address: userData.address || null,
                            dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
                            parentPhone: userData.parentPhone || null,
                            enrollmentDate: userData.enrollmentDate ? new Date(userData.enrollmentDate) : new Date()
                        },
                        select: {
                            id: true,
                            studentId: true,
                            fullName: true,
                            classId: true
                        }
                    });
                } else if (userData.role === 'teacher') {
                    // Validate teacher-specific fields
                    if (!userData.teacherId || !userData.fullName) {
                        throw new Error("Missing required teacher fields: teacherId, fullName");
                    }

                    // Check if teacherId already exists
                    const existingTeacherId = await tx.teacher.findFirst({
                        where: { teacherId: userData.teacherId }
                    });

                    if (existingTeacherId) {
                        throw new Error(`Teacher ID ${userData.teacherId} already exists`);
                    }

                    profileData = await tx.teacher.create({
                        data: {
                            userId: newUser.id,
                            teacherId: userData.teacherId,
                            fullName: userData.fullName,
                            phone: userData.phone || null,
                            address: userData.address || null,
                            hireDate: userData.hireDate ? new Date(userData.hireDate) : null
                        },
                        select: {
                            id: true,
                            teacherId: true,
                            fullName: true
                        }
                    });
                }

                return {
                    user: newUser,
                    profile: profileData
                };
            });

            results.success.push({
                index: i,
                username: userData.username,
                email: userData.email,
                role: userData.role,
                userId: createdUser.user.id,
                profileId: createdUser.profile.id
            });

        } catch (error) {
            results.failed.push({
                index: i,
                username: userData.username || 'N/A',
                email: userData.email || 'N/A',
                error: error.message
            });
        }
    }

    return {
        message: `Bulk user creation completed. ${results.success.length} succeeded, ${results.failed.length} failed.`,
        totalProcessed: users.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
        results: results
    };
};

/**
 * Search users by name, studentId, or teacherId
 * @param {Object} request - { query, role?, page, limit }
 * @returns {Promise<Object>}
 */
const searchUsers = async(request) => {
    const validated = validate(searchUsersValidation, request);

    const { query, role, page = 1, limit = 20 } = validated;

    if (!query || query.trim().length === 0) {
        throw new ResponseError(400, "Search query is required");
    }

    const skip = (page - 1) * limit;
    const searchTerm = `%${query}%`;

    let results = [];
    let totalCount = 0;

    // Search based on role
    if (!role || role === 'student') {
        // Search students
        const students = await prismaClient.student.findMany({
            where: {
                AND: [{
                        user: {
                            isActive: true
                        }
                    },
                    {
                        OR: [{
                                fullName: {
                                    contains: query,
                                }
                            },
                            {
                                studentId: {
                                    contains: query,
                                }
                            },
                            {
                                user: {
                                    username: {
                                        contains: query,
                                    }
                                }
                            },
                            {
                                user: {
                                    email: {
                                        contains: query,
                                    }
                                }
                            }
                        ]
                    }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                        isActive: true,
                        createdAt: true
                    }
                },
                class: {
                    select: {
                        id: true,
                        name: true,
                        gradeLevel: true
                    }
                }
            },
            skip: role === 'student' ? skip : 0,
            take: role === 'student' ? limit : undefined
        });

        const formattedStudents = students.map(student => ({
            userId: student.user.id,
            username: student.user.username,
            email: student.user.email,
            role: 'student',
            isActive: student.user.isActive,
            createdAt: student.user.createdAt,
            profile: {
                id: student.id,
                studentId: student.studentId,
                fullName: student.fullName,
                classId: student.classId,
                phone: student.phone,
                address: student.address,
                dateOfBirth: student.dateOfBirth,
                parentPhone: student.parentPhone,
                enrollmentDate: student.enrollmentDate,
                class: student.class
            }
        }));

        if (role === 'student') {
            results = formattedStudents;
            totalCount = await prismaClient.student.count({
                where: {
                    AND: [{
                            user: {
                                isActive: true
                            }
                        },
                        {
                            OR: [{
                                    fullName: {
                                        contains: query,
                                    }
                                },
                                {
                                    studentId: {
                                        contains: query,
                                    }
                                },
                                {
                                    user: {
                                        username: {
                                            contains: query,
                                        }
                                    }
                                },
                                {
                                    user: {
                                        email: {
                                            contains: query,
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            });
        } else {
            results.push(...formattedStudents);
        }
    }

    if (!role || role === 'teacher') {
        // Search teachers
        const teachers = await prismaClient.teacher.findMany({
            where: {
                AND: [{
                        user: {
                            isActive: true
                        }
                    },
                    {
                        OR: [{
                                fullName: {
                                    contains: query,
                                }
                            },
                            {
                                teacherId: {
                                    contains: query,
                                }
                            },
                            {
                                user: {
                                    username: {
                                        contains: query,
                                    }
                                }
                            },
                            {
                                user: {
                                    email: {
                                        contains: query,
                                    }
                                }
                            }
                        ]
                    }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        role: true,
                        isActive: true,
                        createdAt: true
                    }
                }
            },
            skip: role === 'teacher' ? skip : 0,
            take: role === 'teacher' ? limit : undefined
        });

        const formattedTeachers = teachers.map(teacher => ({
            userId: teacher.user.id,
            username: teacher.user.username,
            email: teacher.user.email,
            role: 'teacher',
            isActive: teacher.user.isActive,
            createdAt: teacher.user.createdAt,
            profile: {
                id: teacher.id,
                teacherId: teacher.teacherId,
                fullName: teacher.fullName,
                phone: teacher.phone,
                address: teacher.address,
                hireDate: teacher.hireDate
            }
        }));

        if (role === 'teacher') {
            results = formattedTeachers;
            totalCount = await prismaClient.teacher.count({
                where: {
                    AND: [{
                            user: {
                                isActive: true
                            }
                        },
                        {
                            OR: [{
                                    fullName: {
                                        contains: query,
                                    }
                                },
                                {
                                    teacherId: {
                                        contains: query,
                                    }
                                },
                                {
                                    user: {
                                        username: {
                                            contains: query,
                                        }
                                    }
                                },
                                {
                                    user: {
                                        email: {
                                            contains: query,
                                        }
                                    }
                                }
                            ]
                        }
                    ]
                }
            });
        } else {
            results.push(...formattedTeachers);
        }
    }

    // If no role specified, combine and paginate results
    if (!role) {
        totalCount = results.length;
        results = results.slice(skip, skip + limit);
    }

    const totalPages = Math.ceil(totalCount / limit);

    return {
        query: query,
        role: role || 'all',
        results: results,
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
 * Update user and their profile (student or teacher)
 * @param {Object} request - { userId, ...updateData }
 * @returns {Promise<Object>}
 */
const updateUser = async(request) => {
    const validated = validate(updateUserValidation, request);
    const { userId, ...updateData } = validated;

    // Check if user exists and get their role
    const existingUser = await prismaClient.user.findUnique({
        where: { id: userId },
        include: {
            student: true,
            teacher: true
        }
    });

    if (!existingUser) {
        throw new ResponseError(404, "User not found");
    }

    // Separate user table updates from profile updates
    const userUpdates = {};
    const profileUpdates = {};

    // User table fields
    if (updateData.username !== undefined) {
        // Check if username is taken by another user
        const usernameExists = await prismaClient.user.findFirst({
            where: {
                username: updateData.username,
                NOT: { id: userId }
            }
        });
        if (usernameExists) {
            throw new ResponseError(400, "Username already exists");
        }
        userUpdates.username = updateData.username;
    }

    if (updateData.email !== undefined) {
        // Check if email is taken by another user
        const emailExists = await prismaClient.user.findFirst({
            where: {
                email: updateData.email,
                NOT: { id: userId }
            }
        });
        if (emailExists) {
            throw new ResponseError(400, "Email already exists");
        }
        userUpdates.email = updateData.email;
    }

    if (updateData.isActive !== undefined) {
        userUpdates.isActive = updateData.isActive;
    }

    // Profile fields
    if (updateData.fullName !== undefined) profileUpdates.fullName = updateData.fullName;
    if (updateData.phone !== undefined) profileUpdates.phone = updateData.phone;
    if (updateData.address !== undefined) profileUpdates.address = updateData.address;

    // Role-specific profile fields
    if (existingUser.role === 'student') {
        if (updateData.classId !== undefined) {
            // Verify class exists
            const classExists = await prismaClient.class.findUnique({
                where: { id: updateData.classId }
            });
            if (!classExists) {
                throw new ResponseError(400, "Class not found");
            }
            profileUpdates.classId = updateData.classId;
        }
        if (updateData.dateOfBirth !== undefined) {
            profileUpdates.dateOfBirth = updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : null;
        }
        if (updateData.parentPhone !== undefined) profileUpdates.parentPhone = updateData.parentPhone;
    } else if (existingUser.role === 'teacher') {
        if (updateData.hireDate !== undefined) {
            profileUpdates.hireDate = updateData.hireDate ? new Date(updateData.hireDate) : null;
        }
    }

    // Update in transaction
    const result = await prismaClient.$transaction(async(tx) => {
        let updatedUser = existingUser;
        if (Object.keys(userUpdates).length > 0) {
            updatedUser = await tx.user.update({
                where: { id: userId },
                data: userUpdates
            });
        }

        // // Update profile if there are changes
        // let updatedProfile = null;
        // if (Object.keys(profileUpdates).length > 0) {
        //     if (existingUser.role === 'student') {
        //         updatedProfile = await tx.student.update({
        //             where: { userId: userId },
        //             data: profileUpdates,
        //             include: {
        //                 class: {
        //                     select: {
        //                         id: true,
        //                         name: true,
        //                         gradeLevel: true
        //                     }
        //                 }
        //             }
        //         });
        //     } else if (existingUser.role === 'teacher') {
        //         updatedProfile = await tx.teacher.update({
        //             where: { userId: userId },
        //             data: profileUpdates
        //         });
        //     }
        // }

        // Update or create profile if there are changes
        let updatedProfile = null;
        if (Object.keys(profileUpdates).length > 0) {
            if (existingUser.role === 'student') {
                // Upsert student profile
                updatedProfile = await tx.student.upsert({
                    where: { userId: userId },
                    update: profileUpdates,
                    create: {
                        userId: userId,
                        studentId: updateData.studentId || `STD${userId}`, // Generate if not provided
                        fullName: profileUpdates.fullName || existingUser.username,
                        classId: profileUpdates.classId || 1, // Default class
                        ...profileUpdates
                    },
                    include: {
                        class: {
                            select: {
                                id: true,
                                name: true,
                                gradeLevel: true
                            }
                        }
                    }
                });
            } else if (existingUser.role === 'teacher') {
                // Upsert teacher profile
                updatedProfile = await tx.teacher.upsert({
                    where: { userId: userId },
                    update: profileUpdates,
                    create: {
                        userId: userId,
                        teacherId: updateData.teacherId || `TCH${userId}`, // Generate if not provided
                        fullName: profileUpdates.fullName || existingUser.username,
                        ...profileUpdates
                    }
                });
            }
        }

        return {
            user: updatedUser,
            profile: updatedProfile || (existingUser.student || existingUser.teacher)
        };
    });

    return {
        message: "User updated successfully",
        userId: result.user.id,
        username: result.user.username,
        email: result.user.email,
        role: result.user.role,
        isActive: result.user.isActive,
        profile: result.profile
    };
};

/**
 * Delete user and their profile
 * @param {Object} request - { userId, softDelete }
 * @returns {Promise<Object>}
 */
const deleteUser = async(request) => {
    const validated = validate(deleteUserValidation, request);
    const { userId, softDelete = true } = validated;

    // Check if user exists
    const existingUser = await prismaClient.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            isActive: true
        }
    });

    if (!existingUser) {
        throw new ResponseError(404, "User not found");
    }

    if (softDelete) {
        // Soft delete - just set isActive to false
        const updatedUser = await prismaClient.user.update({
            where: { id: userId },
            data: { isActive: false }
        });

        return {
            message: "User deactivated successfully",
            userId: updatedUser.id,
            username: updatedUser.username,
            deletionType: "soft"
        };
    } else {
        // Hard delete - actually delete from database
        // Prisma will cascade delete the profile (student/teacher) due to onDelete: Cascade
        await prismaClient.user.delete({
            where: { id: userId }
        });

        return {
            message: "User permanently deleted",
            userId: existingUser.id,
            username: existingUser.username,
            deletionType: "hard"
        };
    }
};


export default {
    getUserList,
    bulkCreateUsers,
    searchUsers,
    updateUser,
    deleteUser
};