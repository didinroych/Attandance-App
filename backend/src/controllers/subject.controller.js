import subjectService from "../services/subject.service.js";
import { ResponseError } from "../error/response-error.js";

/**
 * GET /admin/subjects
 * Get list of subjects with pagination
 * Query: page, limit, search, sortBy, sortOrder
 */
const getSubjectListController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can view subjects");
        }

        const request = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20,
            search: req.query.search,
            sortBy: req.query.sortBy || 'name',
            sortOrder: req.query.sortOrder || 'asc'
        };

        const result = await subjectService.getSubjectList(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * GET /admin/subjects/:id
 * Get single subject by ID with details
 */
const getSubjectByIdController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can view subject details");
        }

        const subjectId = parseInt(req.params.id);

        if (isNaN(subjectId)) {
            throw new ResponseError(400, "Invalid subject ID");
        }

        const result = await subjectService.getSubjectById(subjectId);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * POST /admin/subjects
 * Create new subject
 * Body: { name, code?, description? }
 */
const createSubjectController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can create subjects");
        }

        const result = await subjectService.createSubject(req.body);

        res.status(201).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * PATCH /admin/subjects/:id
 * Update subject
 * Body: { name?, code?, description? }
 */
const updateSubjectController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can update subjects");
        }

        const subjectId = parseInt(req.params.id);

        if (isNaN(subjectId)) {
            throw new ResponseError(400, "Invalid subject ID");
        }

        const request = {
            subjectId,
            ...req.body
        };

        const result = await subjectService.updateSubject(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * DELETE /admin/subjects/:id
 * Delete subject
 * Query: force=true to force delete even if used in schedules
 */
const deleteSubjectController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can delete subjects");
        }

        const subjectId = parseInt(req.params.id);

        if (isNaN(subjectId)) {
            throw new ResponseError(400, "Invalid subject ID");
        }

        const force = req.query.force === 'true';

        const request = {
            subjectId,
            force
        };

        const result = await subjectService.deleteSubject(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

export default {
    getSubjectListController,
    getSubjectByIdController,
    createSubjectController,
    updateSubjectController,
    deleteSubjectController
};