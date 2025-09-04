import jwt from "jsonwebtoken";

export const authMiddleware = async(req, res, next) => {
    const authHeader = req.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            errors: "Unauthorized"
        });
    }
    const token = authHeader.substring(7);

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, user) => {
        console.log(err)
        if (err) {
            return res.status(403).json({
                errors: "Invalid or expired access token"
            });
        }
        req.user = user;
        next();
    });
}