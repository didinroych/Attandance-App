import userService from "../service/user-service.js";

const updateRoleUser = async(req, res, next) => {
    try {
        const currentUserRole = req.user.role;
        if (currentUserRole !== "admin") {
            return res.status(403).json({
                error: "Acces denied"
            });
        }

        const userId = parseInt(req.params.id);
        const { newRole } = req.body;
        const adminId = req.user.id;

        const request = {
            id: userId,
            newRole: newRole
        };

        const result = await userService.updateRoleUser(request);

        res.status(200).json({
            data: result,
            message: `user role updated ${newRole} succesfully!`
        })

    } catch (e) {
        next(e);
    }
}

export default {
    updateRoleUser
}