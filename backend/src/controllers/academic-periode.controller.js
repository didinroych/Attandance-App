import { ResponseError } from "../error/response-error.js";
import academicPeriodeService from "../services/academic-periode.service.js";

const getAcademicPeriodCon = async(req, res, next) => {
    try {
        const result = await academicPeriodeService.getAcademicPeriod();
        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
}

/**
 * GET /admin/academic-periods
 * Get list of academic periods with pagination
 * Query: page, limit, search, isActive, sortBy, sortOrder
 */
const getAcademicPeriodListController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can view academic periods");
        }

        const request = {
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 20,
            search: req.query.search,
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            sortBy: req.query.sortBy || 'startDate',
            sortOrder: req.query.sortOrder || 'desc'
        };

        const result = await academicPeriodeService.getAcademicPeriodList(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * GET /admin/academic-periods/:id
 * Get single academic period by ID with details
 */
const getAcademicPeriodByIdController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can view academic period details");
        }

        const academicPeriodId = parseInt(req.params.id);

        if (isNaN(academicPeriodId)) {
            throw new ResponseError(400, "Invalid academic period ID");
        }

        const result = await academicPeriodeService.getAcademicPeriodById(academicPeriodId);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * POST /admin/academic-periods
 * Create new academic period
 * Body: { name, startDate, endDate, isActive? }
 */
const createAcademicPeriodController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can create academic periods");
        }

        const result = await academicPeriodeService.createAcademicPeriod(req.body);

        res.status(201).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * PATCH /admin/academic-periods/:id
 * Update academic period
 * Body: { name?, startDate?, endDate?, isActive? }
 */
const updateAcademicPeriodController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can update academic periods");
        }

        const academicPeriodId = parseInt(req.params.id);

        if (isNaN(academicPeriodId)) {
            throw new ResponseError(400, "Invalid academic period ID");
        }

        const request = {
            academicPeriodId,
            ...req.body
        };

        const result = await academicPeriodeService.updateAcademicPeriod(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

/**
 * DELETE /admin/academic-periods/:id
 * Delete academic period
 * Query: force=true to force delete even if used
 */
const deleteAcademicPeriodController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can delete academic periods");
        }

        const academicPeriodId = parseInt(req.params.id);

        if (isNaN(academicPeriodId)) {
            throw new ResponseError(400, "Invalid academic period ID");
        }

        const force = req.query.force === 'true';

        const request = {
            academicPeriodId,
            force
        };

        const result = await academicPeriodeService.deleteAcademicPeriod(request);

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

export default {
    getAcademicPeriodCon,
    getAcademicPeriodListController,
    getAcademicPeriodByIdController,
    createAcademicPeriodController,
    updateAcademicPeriodController,
    deleteAcademicPeriodController
}