import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protect Middleware — verifies JWT and attaches safe user to req.user
 */
export const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Not authorized, no token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(401).json({ success: false, message: "Not authorized, user not found" });
        }

        req.user = user;
        next();
    } catch (error) {
        const message =
            error.name === "TokenExpiredError"
                ? "Not authorized, token expired"
                : "Not authorized, token invalid";

        return res.status(401).json({ success: false, message });
    }
};
