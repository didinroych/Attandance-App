import classService from "../services/class.service.js";
import { ResponseError } from "../error/response-error.js";

/**
 * GET /admin/classes
 * Get list of classes with pagination
 * Query: page, limit, search, sortBy, sortOrder
 */
const getClassListController = async (req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can view classes");
        }

        const request = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20,
            search: req.query.search,
            sortBy: req.query.sortBy || 'name',
            sortOrder: req.query.sortOrder || 'asc'
        };

        const result = await classService.getClassList(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * GET /admin/classes/:id
 * Get single class by ID with details
 */
const getClassByIdController = async (req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can view class details");
        }

        const classId = parseInt(req.params.id);

        if (isNaN(classId)) {
            throw new ResponseError(400, "Invalid class ID");
        }

        const result = await classService.getClassById(classId);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * POST /admin/classes
 * Create new class
 * Body: { name, schoolLevelId, gradeLevel, academicPeriodId, homeroomTeacherId? }
 */
const createClassController = async (req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can create classes");
        }

        const result = await classService.createClass(req.body);

        res.status(201).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * PATCH /admin/classes/:id
 * Update class
 * Body: { name?, schoolLevelId?, gradeLevel?, academicPeriodId?, homeroomTeacherId? }
 */
const updateClassController = async (req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can update classes");
        }

        const classId = parseInt(req.params.id);

        if (isNaN(classId)) {
            throw new ResponseError(400, "Invalid class ID");
        }

        const request = {
            classId,
            ...req.body
        };

        const result = await classService.updateClass(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * DELETE /admin/classes/:id
 * Delete class
 * Query: force=true to force delete even if has students or schedules
 */
const deleteClassController = async (req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can delete classes");
        }

        const classId = parseInt(req.params.id);

        if (isNaN(classId)) {
            throw new ResponseError(400, "Invalid class ID");
        }

        const force = req.query.force === 'true';

        const request = {
            classId,
            force
        };

        const result = await classService.deleteClass(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

export default {
    getClassListController,
    getClassByIdController,
    createClassController,
    updateClassController,
    deleteClassController
};
