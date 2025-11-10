import { ResponseError } from "../error/response-error.js";
import dashboardAdminService from "../services/dashboard-admin.service.js";

const getDashboardStatisticsController = async(req, res, next) => {
    try {
        if (req.user.role !== "admin") {
            throw new ResponseError(403, "Only admins can view dashboard statistics");
        }
        const result = await dashboardAdminService.getStatisticDashboard()

        res.status(200).json({
            data: result
        });
    } catch (e) {
        next(e);
    }
};

export default {
    getDashboardStatisticsController
};