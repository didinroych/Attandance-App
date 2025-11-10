import UserManagementService from "../services/User-management.service.js";
import { ResponseError } from "../error/response-error.js";

/**
 * GET /admin/users
 * Get list of users (students or teachers) with pagination
 * Query params: role, page, limit, sortBy, sortOrder
 */
const getUserListController = async(req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can view user lists");
        }

        const request = {
            role: req.query.role,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 10,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'desc'
        };

        const result = await UserManagementService.getUserList(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * POST /admin/users/bulk
 * Bulk create users (students or teachers) from JSON array
 * Body: { users: Array }
 */
const bulkCreateUsersController = async(req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can bulk create users");
        }

        const result = await UserManagementService.bulkCreateUsers(req.body);

        res.status(201).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * GET /admin/users/search
 * Search users by name, studentId, or teacherId
 * Query params: query, role (optional), page, limit
 */
const searchUsersController = async(req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can search users");
        }

        const request = {
            query: req.query.query,
            role: req.query.role,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20
        };

        const result = await UserManagementService.searchUsers(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * PATCH /admin/users/:userId
 * Update user and their profile
 * Body: { username?, email?, isActive?, fullName?, phone?, address?, classId?, etc }
 */
const updateUserController = async(req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can update users");
        }

        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            throw new ResponseError(400, "Invalid user ID");
        }

        const request = {
            userId,
            ...req.body
        };

        const result = await UserManagementService.updateUser(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * DELETE /admin/users/:userId
 * Delete user (soft delete by default)
 * Query: softDelete=true (default) or softDelete=false for hard delete
 */
const deleteUserController = async(req, res, next) => {
    try {
        // Check if user is admin
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can delete users");
        }

        const userId = parseInt(req.params.userId);

        if (isNaN(userId)) {
            throw new ResponseError(400, "Invalid user ID");
        }

        const softDelete = req.query.softDelete !== 'false'; // default true

        const request = {
            userId,
            softDelete
        };

        const result = await UserManagementService.deleteUser(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};
export default {
    getUserListController,
    bulkCreateUsersController,
    searchUsersController,
    updateUserController,
    deleteUserController
};