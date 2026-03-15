import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import bcrypt from "bcryptjs";

/**
 * Generate JWT — throws if JWT_SECRET is not set
 */
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET Is Not Defined In Environment Variables");
    }
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

/**
 * Register User
 * POST /api/auth/register
 */
export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "All Fields Are Required" });
    }

    if (password.length < 6) {
        return res.status(400).json({ success: false, message: "Password Must Be At Least 6 Characters" });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(409).json({ success: false, message: "User Already Exists" });
        }

        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);

        return res.status(201).json({ success: true, token });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Login User
 * POST /api/auth/login
 */
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Email And Password Are Required" });
    }

    try {
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: "Invalid Email Or Password" });
        }

        const token = generateToken(user._id);
        return res.status(200).json({ success: true, token });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get Authenticated User
 * GET /api/auth/me
 */
export const getUser = async (req, res) => {
    try {
        const { _id, name, email } = req.user;
        return res.status(200).json({ success: true, user: { _id, name, email } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get All Published Images
 * GET /api/chat/published-images?page=1&limit=20
 */
export const getPublishedImages = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const skip = (page - 1) * limit;

        const publishedImages = await Chat.aggregate([
            // Only process chats that have at least one published image
            {
                $match: {
                    "messages.isImage": true,
                    "messages.isPublished": true,
                }
            },
            // Flatten messages array
            { $unwind: "$messages" },
            // Filter to only published image messages
            {
                $match: {
                    "messages.isImage": true,
                    "messages.isPublished": true,
                }
            },
            // Join with User collection to get userName
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                }
            },
            // Flatten the user array from lookup
            { $unwind: { path: "$user", preserveNullAndEmpty: false } },
            // Sort newest first inside the pipeline
            { $sort: { "messages.timestamp": -1 } },
            // Pagination
            { $skip: skip },
            { $limit: limit },
            // Shape the final output
            {
                $project: {
                    _id: 0,
                    imageUrl: "$messages.content",
                    timestamp: "$messages.timestamp",
                    userName: "$user.name",
                }
            },
        ]);

        return res.status(200).json({ success: true, page, limit, images: publishedImages });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
