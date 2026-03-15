import mongoose from "mongoose";
import Chat from "../models/Chat.js";

/**
 * Create a New Chat
 * POST /api/chat/create
 */
export const createChat = async (req, res) => {
    try {
        const userId = req.user._id;

        const chat = await Chat.create({ userId, name: "New Chat", messages: [] });

        return res.status(201).json({ success: true, message: "Chat Created", chat });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Get All Chats for Authenticated User
 * GET /api/chat/all
 */
export const getChats = async (req, res) => {
    try {
        const userId = req.user._id;

        // Exclude messages array — not needed for a chat list view
        const chats = await Chat.find({ userId })
            .select("-messages")
            .sort({ updatedAt: -1 });

        return res.status(200).json({ success: true, chats });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Delete a Chat
 * DELETE /api/chat/delete
 */
export const deleteChat = async (req, res) => {
    try {
        const userId = req.user._id;
        const { chatId } = req.body;

        if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
            return res.status(400).json({ success: false, message: "Valid Chat ID Is Required" });
        }

        const result = await Chat.deleteOne({ _id: chatId, userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: "Chat Not Found Or Not Authorized" });
        }

        return res.status(200).json({ success: true, message: "Chat Deleted" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
